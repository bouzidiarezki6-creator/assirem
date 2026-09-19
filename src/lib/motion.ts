/** Shared motion tokens — prefer transform/opacity only */
export const motion = {
  micro: 0.14,
  standard: 0.24,
  complex: 0.38,
  ease: [0.22, 1, 0.36, 1] as const,
} as const

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: {
    duration: motion.standard,
    ease: motion.ease,
  },
} as const
