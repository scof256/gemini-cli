import { createUploadthing, type FileRouter } from "uploadthing/next";
import { env } from "~/env.mjs";
import pdf from "pdf-parse";
import { VoyageAIClient } from "voyageai";
import { Pinecone } from "@pinecone-database/pinecone";

const f = createUploadthing();

const voyage = new VoyageAIClient({
  apiKey: env.VOYAGE_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
  environment: env.PINECONE_ENVIRONMENT,
});

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader: f({ pdf: { maxFileSize: "16MB" } })
    // Set permissions and file types for this FileRoute
    .onUploadComplete(async ({ metadata, file }) => {
      const response = await fetch(file.url);
      const buffer = await response.arrayBuffer();
      const data = await pdf(buffer);

      const pages = data.text.split(/(?=----- Page \d+ -----)/g);
      const chunks = pages.flatMap((page, pageIndex) => {
        const pageChunks = page.match(/[\s\S]{1,1000}/g) || [];
        return pageChunks.map(chunk => ({ chunk, pageIndex: pageIndex + 1 }));
      });

      // Generate embeddings
      const { embeddings } = await voyage.embed({
        input: chunks.map(c => c.chunk),
        model: "voyage-2",
      });

      // Store embeddings in Pinecone
      const index = pinecone.index(env.PINECONE_INDEX);

      const vectors = embeddings.map((embedding, i) => ({
        id: `${file.key}-${i}`,
        values: embedding,
        metadata: {
          text: chunks[i]?.chunk,
          pageNumber: chunks[i]?.pageIndex,
        },
      }));

      await index.upsert(vectors);

      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: "jules" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
