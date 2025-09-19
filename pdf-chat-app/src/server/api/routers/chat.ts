import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env.mjs";
import { VoyageAIClient } from "voyageai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

const voyage = new VoyageAIClient({
  apiKey: env.VOYAGE_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
  environment: env.PINECONE_ENVIRONMENT,
});

const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);

export const chatRouter = createTRPCRouter({
  sendMessage: publicProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      const { message } = input;

      // 1. Generate embedding for the user's query
      const { embeddings } = await voyage.embed({
        input: [message],
        model: env.VOYAGE_EMBEDDING_MODEL,
      });
      const queryEmbedding = embeddings[0];

      // 2. Query Pinecone
      const index = pinecone.index(env.PINECONE_INDEX);
      const queryResult = await index.query({
        vector: queryEmbedding,
        topK: 10,
        includeMetadata: true,
      });

      // 3. Rerank the results
      const documents = queryResult.matches.map((match) => match.metadata?.text as string);
      const rerankResult = await voyage.rerank({
        query: message,
        documents,
        model: "rerank-lite-1",
        topK: 3,
      });

      // 4. Generate a response with Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const context = rerankResult.results.map((result) => documents[result.index]).join("\n\n");
      const prompt = `Context:\n${context}\n\nQuestion:\n${message}\n\nAnswer:`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const topResult = rerankResult.results[0];
      const pageNumber = topResult ? queryResult.matches[topResult.index]?.metadata?.pageNumber as number : null;

      return {
        response: text,
        pageNumber,
      };
    }),
});
