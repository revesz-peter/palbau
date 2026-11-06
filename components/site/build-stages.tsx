"use client"

import { motion, useInView, useReducedMotion } from "framer-motion"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { EASE } from "@/lib/motion"
import { cn } from "@/lib/utils"

type Stage = { title: string; text: string; imageAlt: string }
type Key = "structural" | "turnkey"

const KEYS = ["structural", "turnkey"] as const
const AUTOPLAY_DELAY_MS = 1800
const IMAGE_SIZES = "(min-width: 1024px) 58vw, 100vw"

/**
 * Both stills share one camera, so the finished house grows out of the shell.
 * It plays once by itself to show that it can be switched, unless the visitor
 * got there first or prefers less motion.
 */
export function BuildStages({
  title,
  note,
  caption,
  stages,
}: {
  title: string
  note: string
  caption: string
  stages: Record<Key, Stage>
}) {
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root, { once: true, margin: "-25% 0px" })
  const reduced = useReducedMotion()
  const [active, setActive] = useState<Key>("structural")
  const touched = useRef(false)

  useEffect(() => {
    if (!inView || reduced) return
    const timer = setTimeout(() => {
      if (!touched.current) setActive("turnkey")
    }, AUTOPLAY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [inView, reduced])

  return (
    <motion.div
      ref={root}
      data-reveal
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 1.1, ease: EASE }}
      className="grid border border-border bg-card lg:grid-cols-12"
    >
      <figure className="lg:col-span-7">
        <div className="relative aspect-[3/2] overflow-hidden bg-muted">
          <Image
            src="/images/detail-shell.jpg"
            alt={active === "structural" ? stages.structural.imageAlt : ""}
            fill
            sizes={IMAGE_SIZES}
            quality={85}
            className="object-cover"
          />
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{
              clipPath:
                active === "turnkey" ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)",
            }}
            transition={{ duration: reduced ? 0 : 1.2, ease: EASE }}
          >
            <Image
              src="/images/detail-gable.jpg"
              alt={active === "turnkey" ? stages.turnkey.imageAlt : ""}
              fill
              sizes={IMAGE_SIZES}
              quality={85}
              className="object-cover"
            />
          </motion.div>
        </div>
        <figcaption className="px-5 pt-3 text-base lg:px-7 lg:pb-5">
          {caption}
        </figcaption>
      </figure>

      <div className="flex flex-col p-5 lg:col-span-5 lg:p-9">
        <h3 className="text-2xl leading-tight font-semibold text-balance md:text-3xl">
          {title}
        </h3>

        <div className="mt-5 grid grid-cols-2 gap-1 bg-secondary p-1">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={active === key}
              onClick={() => {
                touched.current = true
                setActive(key)
              }}
              className={cn(
                "min-h-12 cursor-pointer px-2 text-base font-semibold transition-colors duration-300 md:text-lg",
                active === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-background/60"
              )}
            >
              {stages[key].title}
            </button>
          ))}
        </div>

        {/* Reserves room for the longer text, so the card keeps its height. */}
        <div aria-live="polite" className="mt-5 grid">
          {KEYS.map((key) => (
            <p
              key={key}
              aria-hidden={active !== key}
              className={cn(
                "col-start-1 row-start-1 text-xl leading-snug text-pretty transition-opacity duration-500",
                active === key ? "opacity-100" : "invisible opacity-0"
              )}
            >
              {stages[key].text}
            </p>
          ))}
        </div>

        <p className="mt-5 border-t border-border pt-4 text-base text-pretty lg:mt-auto">
          {note}
        </p>
      </div>
    </motion.div>
  )
}
