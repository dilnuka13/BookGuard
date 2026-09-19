"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const SmartBookScanner = dynamic(
  () => import("@/components/scanner/smart-book-scanner").then((mod) => mod.SmartBookScanner),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-[calc(100vh-140px)] min-h-[460px] max-h-[780px] rounded-3xl overflow-hidden border border-border bg-card/50 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-semibold text-foreground">Preparing Smart Scanner...</p>
        <p className="text-xs text-muted-foreground mt-1">Loading camera and barcode recognition engine</p>
      </div>
    ),
  }
);

export function ScannerClientWrapper({ userId }: { userId: string }) {
  return <SmartBookScanner userId={userId} />;
}
