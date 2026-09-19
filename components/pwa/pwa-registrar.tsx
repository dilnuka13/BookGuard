"use client";

import * as React from "react";
import { RefreshCw, Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaRegistrar() {
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [installPromptEvent, setInstallPromptEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [isIos, setIsIos] = React.useState(false);
  const [showIosInstructions, setShowIosInstructions] = React.useState(false);

  React.useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Check for service worker updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    setUpdateAvailable(true);
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn("Service worker registration failed:", err);
          });
      });
    }

    // 2. Catch PWA Install Prompt (Chrome / Android / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      // Check if user dismissed recently
      const dismissed = localStorage.getItem("bookguard_install_dismissed");
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 3. Detect iOS Safari
    if (typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
      const isStandalone = ("standalone" in window.navigator) && (window.navigator as unknown as { standalone: boolean }).standalone;
      if (isAppleDevice && !isStandalone) {
        setIsIos(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPromptEvent) {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      if (choice.outcome === "accepted") {
        setShowInstallPrompt(false);
        setInstallPromptEvent(null);
      }
    } else if (isIos) {
      setShowIosInstructions(true);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("bookguard_install_dismissed", "true");
  };

  return (
    <>
      {/* 1. Update Available Banner */}
      {updateAvailable && (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-sm z-50 rounded-2xl bg-card border border-primary/40 p-4 shadow-2xl animate-scale-in flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-foreground">Update Available</h4>
            <p className="text-[11px] text-muted-foreground">
              A newer version of BookGuard is ready.
            </p>
          </div>
          <Button
            size="sm"
            variant="brandGradient"
            onClick={() => window.location.reload()}
            className="h-8 text-xs gap-1.5 shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </Button>
        </div>
      )}

      {/* 2. Unobtrusive Install Prompt Pill */}
      {showInstallPrompt && (
        <div className="fixed top-3 right-4 z-40 hidden sm:flex items-center gap-2 rounded-full bg-card/95 border border-border px-3.5 py-1.5 shadow-lg backdrop-blur-md animate-fade-in text-xs">
          <span className="font-semibold text-foreground">Get BookGuard App</span>
          <Button
            size="sm"
            variant="brandGradient"
            onClick={handleInstallClick}
            className="h-7 text-xs px-2.5 rounded-full gap-1"
          >
            <Download className="h-3 w-3" />
            <span>Install</span>
          </Button>
          <button
            type="button"
            onClick={handleDismissInstall}
            className="text-muted-foreground hover:text-foreground p-1"
            aria-label="Dismiss install banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 3. iOS Install Instructions Modal */}
      {showIosInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-scale-in text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
              <Share className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Install on iPhone / iPad</h3>
            <div className="text-xs text-muted-foreground space-y-2 text-left bg-muted/30 p-3.5 rounded-2xl">
              <p className="flex items-start gap-2">
                <span className="font-bold text-primary">1.</span>
                <span>Tap the <strong>Share</strong> button in your Safari toolbar.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-primary">2.</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-bold text-primary">3.</span>
                <span>Tap <strong>Add</strong> in the top-right corner.</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIosInstructions(false)}
              className="w-full rounded-xl"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
