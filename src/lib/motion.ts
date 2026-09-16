export const motionEase = {
  standard: [0.2, 0.7, 0.2, 1] as const,
  out: [0.22, 1, 0.36, 1] as const,
  in: [0.4, 0, 1, 1] as const,
}

export const motionDuration = {
  instant: 0.09,
  fast: 0.16,
  standard: 0.22,
  deliberate: 0.3,
} as const

export const motionTransition = {
  feedback: {
    duration: motionDuration.fast,
    ease: motionEase.standard,
  },
  enter: {
    duration: motionDuration.standard,
    ease: motionEase.out,
  },
  exit: {
    duration: motionDuration.fast,
    ease: motionEase.in,
  },
  layout: {
    type: 'spring' as const,
    stiffness: 480,
    damping: 40,
    mass: 0.72,
  },
  navigation: {
    type: 'spring' as const,
    stiffness: 520,
    damping: 42,
    mass: 0.68,
  },
} as const

export const reducedMotionTransition = { duration: 0.001 } as const
