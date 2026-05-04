'use client';

import { Variants } from 'framer-motion';

/**
 * [LAYER: UI]
 * Standardized animation variants for the DreamBeesArt storefront.
 */

export const PAGE_TRANSITION_VARIANTS: Variants = {
  initial: { 
    opacity: 0, 
    y: 20, 
    scale: 0.98,
    filter: 'blur(10px)'
  },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.98,
    filter: 'blur(10px)',
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export const FADE_IN_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

export const SLIDE_UP_VARIANTS: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export const STAGGER_CONTAINER_VARIANTS: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};
