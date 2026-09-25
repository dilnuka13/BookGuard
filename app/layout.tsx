import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { PwaRegistrar } from "@/components/pwa/pwa-registrar";
import { AppSplashScreen } from "@/components/pwa/app-splash-screen";
import { LiquidGlassInit } from "@/components/theme/liquid-glass-init";
import "@/app/globals.css";

// Inline sync script to prevent flash of liquid glass intensity before hydration
const glassInitScript = `(function(){try{var v=localStorage.getItem("bookguard_glass_intensity");if(v!==null){var n=parseInt(v,10);if(!isNaN(n)&&n>=0&&n<=100){var l=(n/100).toFixed(2);var d=((n/100)*0.92).toFixed(2);var b=Math.round(8+((100-n)/100)*20)+"px";document.documentElement.style.setProperty("--liquid-glass-alpha-light",l);document.documentElement.style.setProperty("--liquid-glass-alpha-dark",d);document.documentElement.style.setProperty("--liquid-glass-blur",b);}}}catch(e){}})();`;

export const metadata: Metadata = {
  applicationName: "BookGuard",
  title: {
    default: "BookGuard — Know your shelf before you buy",
    template: "%s | BookGuard",
  },
  description:
    "BookGuard helps you scan books, manage your personal library, and avoid buying duplicate books.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BookGuard",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0B111D" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: glassInitScript }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background font-sans antialiased selection:bg-primary/20 selection:text-primary"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <LiquidGlassInit />
            <AppSplashScreen />
            <PwaRegistrar />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
