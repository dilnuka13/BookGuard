"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * Fast, fluid page transition.
 * Avoids blocking AnimatePresence `mode="wait"` and heavy `filter: blur`
 * which cause noticeable lag and frame drops during mobile tab switching.
 * Content mounts immediately and smoothly settles in 120ms.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.12,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}

