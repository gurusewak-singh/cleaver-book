'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// Define the animation variants
const variants = {
  hidden: { opacity: 0, x: 0, y: 20 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 0, y: -20 },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence
      mode="wait" // This is crucial. It waits for the exit animation to finish before starting the enter animation.
      initial={false} // Prevents animation on initial page load
    >
      <motion.div
        key={pathname} // The key is the path. When it changes, AnimatePresence triggers the animations.
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
        transition={{ type: 'linear', duration: 0.25 }} // A quick, clean transition
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}