"use client";

import { useState } from "react";
import UploadButtonComponent from "~/components/UploadButton";
import { api } from "~/trpc/react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function Home() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleUploadComplete = (url: string) => {
    setPdfUrl(url);
  };

  const sendMessage = api.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "ai", content: data.response }]);
      if (data.pageNumber) {
        setPageNumber(data.pageNumber);
      }
    },
  });

  const handleSend = () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { role: "user", content: input }]);
      sendMessage.mutate({ message: input });
      setInput("");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-yellow text-black">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
        {/* PDF Viewer */}
        <div className="w-full h-full bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-2xl font-bold mb-4">Upload PDF</h2>
          <UploadButtonComponent onUploadComplete={handleUploadComplete} />
          <div className="w-full h-96 bg-gray-200 rounded-md mt-4 overflow-y-auto">
            {pdfUrl && (
              <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={pageNumber} />
              </Document>
            )}
          </div>
          {numPages && (
            <p>
              Page {pageNumber} of {numPages}
            </p>
          )}
        </div>

        {/* Chat */}
        <div className="w-full h-full bg-white rounded-lg shadow-lg p-4 flex flex-col">
          <h2 className="text-2xl font-bold mb-4">Chat</h2>
          <div className="flex-grow bg-gray-200 rounded-md mb-4 p-4 space-y-4 overflow-y-auto">
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`px-4 py-2 rounded-lg ${message.role === "user" ? "bg-black text-white" : "bg-gray-300"}`}>
                  {message.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              className="flex-grow border border-gray-300 rounded-l-md p-2"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="bg-black text-white px-4 py-2 rounded-r-md" onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
