'use client';

import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { PAGE_TRANSITION_VARIANTS } from './index';

interface PageTransitionProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

/**
 * [LAYER: UI]
 * A wrapper component for cinematic page transitions.
 * Uses the centralized PAGE_TRANSITION_VARIANTS.
 */
export function PageTransition({ children, ...props }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={PAGE_TRANSITION_VARIANTS}
        className="w-full min-h-screen"
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
