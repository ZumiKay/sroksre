"use client";

import { Button } from "@nextui-org/react";

export default function TestUi() {
  const downloadPdf = async () => {
    try {
      const response = await fetch("/api/testui", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoice.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };
  return (
    <div className="h-screen w-screen flex flex-col items-center">
      <h3 className="text-5xl font-bold w-full h-fit text-center">
        Tesing Function
      </h3>
      <Button onClick={() => downloadPdf()}> Download Pdf </Button>
    </div>
  );
}
