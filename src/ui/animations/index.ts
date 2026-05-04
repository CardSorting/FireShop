'use client';

import { Variants, type Transition } from 'framer-motion';

/**
 * [LAYER: UI]
 * Centralized animation engine for the DreamBeesArt storefront.
 * All motion variants and spring configs are defined here to ensure
 * visual consistency and prevent animation drift across components.
 */

// ─── Shared Spring Config ──────────────────────────────────────────
export const SPRING_CONFIG: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

export const SPRING_GENTLE: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
  mass: 1,
};

// ─── Page Transitions ──────────────────────────────────────────────
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

// ─── Element Variants ──────────────────────────────────────────────
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

// ─── Overlay Variants (Drawers, Modals) ────────────────────────────
export const DRAWER_VARIANTS: Variants = {
  initial: { x: '100%' },
  animate: { 
    x: 0,
    transition: { ...SPRING_CONFIG }
  },
  exit: { 
    x: '100%',
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
  }
};

export const MODAL_VARIANTS: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { ...SPRING_CONFIG }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

export const BACKDROP_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

// ─── Interactive Card Variants ─────────────────────────────────────
export const CARD_HOVER_VARIANTS: Variants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { ...SPRING_CONFIG }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

// ─── Accordion / Expand Variants ───────────────────────────────────
export const ACCORDION_VARIANTS: Variants = {
  collapsed: { 
    height: 0, 
    opacity: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
  }
};
