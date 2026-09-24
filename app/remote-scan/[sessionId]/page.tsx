import { Metadata, Viewport } from "next";
import { PhoneScannerView } from "@/components/remote-scan/phone-scanner-view";

export const metadata: Metadata = {
  title: "BookGuard Remote Scanner",
  description: "Wireless phone barcode scanner for BookGuard",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface RemoteScanPageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function RemoteScanPage({
  params,
  searchParams,
}: RemoteScanPageProps) {
  const { sessionId } = await params;
  const { token = "" } = await searchParams;

  return (
    <main className="min-h-screen bg-background">
      <PhoneScannerView sessionId={sessionId} token={token} />
    </main>
  );
}
