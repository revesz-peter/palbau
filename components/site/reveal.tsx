"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

import { EASE } from "@/lib/motion"

const VIEWPORT = { once: true, margin: "-12% 0px" }

/** Text fades in and settles. CSS keeps it visible without JS or with reduced motion. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      data-reveal
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

const IMAGE_VARIANTS = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  shown: { clipPath: "inset(0% 0 0 0)" },
}

/**
 * Images are uncovered from the bottom up, the way the house goes up. The outer
 * element is watched and the inner one clipped: a zero-area clip on the watched
 * element can stop the reveal from ever firing.
 */
export function RevealImage({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={VIEWPORT}
    >
      <motion.div
        data-reveal
        className="absolute inset-0 bg-muted"
        variants={IMAGE_VARIANTS}
        transition={{ duration: 1.6, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
