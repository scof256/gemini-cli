"use client";

import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "~/app/api/uploadthing/core";

export default function UploadButtonComponent({
  onUploadComplete,
}: {
  onUploadComplete: (url: string) => void;
}) {
  return (
    <UploadButton<OurFileRouter>
      endpoint="pdfUploader"
      onClientUploadComplete={(res) => {
        if (res && res.length > 0 && res[0]) {
          onUploadComplete(res[0].url);
        }
      }}
      onUploadError={(error: Error) => {
        // Do something with the error.
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}
