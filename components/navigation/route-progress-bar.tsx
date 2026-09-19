"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function RouteProgressBar() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = React.useState(false);

  React.useEffect(() => {
    // Whenever pathname completes changing, hide the progress bar
    setIsNavigating(false);
  }, [pathname]);

  React.useEffect(() => {
    // Listen for touch or click on any internal links to trigger immediate bar
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        !target.href.includes("#") &&
        target.target !== "_blank"
      ) {
        const nextUrl = new URL(target.href);
        if (nextUrl.pathname !== window.location.pathname) {
          setIsNavigating(true);
        }
      }
    };

    window.addEventListener("click", handleClick, { capture: true });
    return () => window.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 0.8, opacity: 1 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{
            scaleX: { duration: 0.35, ease: "easeOut" },
            opacity: { duration: 0.15 },
          }}
          style={{ originX: 0 }}
          className="fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
}
