"use client"

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion"
import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"
import { getImageProps } from "next/image"
import { useRef, useState, useSyncExternalStore } from "react"

import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { EASE } from "@/lib/motion"
import { cn } from "@/lib/utils"

import { PHASES, SCENE_QUERY, STAGE_QUERY } from "./phases"

const HouseCanvas = dynamic(() => import("./house-canvas"), { ssr: false })

const STILL = { width: 2400, height: 1600, quality: 85 }
const STAGE_SIZES = "max(100vw, 150svh)"
const FINISHED = "/images/hero-finished.jpg"
const PLAN = "/images/hero-plan.jpg"
const COMPACT = "/images/hero-compact.jpg"
const PLAN_PHONE = "/images/hero-plan-phone.jpg"
const PLAN_PHONE_SIZE = { width: 860, height: 1864 }
const INTRO_END = 0.09

/** "3d" pins the whole hero. "scene" pins only the house, under the text. */
type Mode = "pending" | "3d" | "scene" | "static" | "lowpower"

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl2"))
  } catch {
    return false
  }
}

function isLowPower() {
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  return (
    nav.connection?.saveData === true ||
    (nav.hardwareConcurrency ?? 8) < 4 ||
    (nav.deviceMemory ?? 8) < 4 ||
    !supportsWebGL()
  )
}

let lowPower: boolean | null = null

function getMode(): Mode {
  const stage = window.matchMedia(STAGE_QUERY).matches
  if (!stage && !window.matchMedia(SCENE_QUERY).matches) return "static"
  lowPower ??= isLowPower()
  if (lowPower) return "lowpower"
  return stage ? "3d" : "scene"
}

function subscribeToStage(onChange: () => void) {
  const queries = [STAGE_QUERY, SCENE_QUERY].map((q) => window.matchMedia(q))
  queries.forEach((query) => query.addEventListener("change", onChange))
  return () =>
    queries.forEach((query) => query.removeEventListener("change", onChange))
}

function getDevShot() {
  if (process.env.NODE_ENV !== "development") return null
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("shot")
}

/**
 * Shows what the canvas will show when it takes over, so that it does not jump.
 * Without a canvas (`animated` false) the finished house stands in for it.
 */
function Poster({ alt, animated }: { alt: string; animated: boolean }) {
  const common = { alt, sizes: STAGE_SIZES, ...STILL }
  const stage = getImageProps({
    ...common,
    src: animated ? PLAN : FINISHED,
  }).props
  const phone = getImageProps({
    ...common,
    ...PLAN_PHONE_SIZE,
    src: PLAN_PHONE,
    sizes: "100vw",
  }).props
  // The fallback only shows outside the pinned layouts, at the page's width.
  const compact = getImageProps({
    ...common,
    src: COMPACT,
    sizes: "100vw",
  }).props
  return (
    <picture>
      <source
        media={STAGE_QUERY}
        srcSet={stage.srcSet}
        sizes={stage.sizes}
        width={stage.width}
        height={stage.height}
      />
      {animated ? (
        <source
          media={SCENE_QUERY}
          srcSet={phone.srcSet}
          sizes={phone.sizes}
          width={phone.width}
          height={phone.height}
        />
      ) : null}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img
        {...compact}
        fetchPriority="high"
        loading="eager"
        className="absolute inset-0 size-full object-cover"
      />
    </picture>
  )
}

export function Hero() {
  const t = useTranslations("hero")
  const track = useRef<HTMLDivElement>(null)
  const mode = useSyncExternalStore<Mode>(
    subscribeToStage,
    getMode,
    () => "pending"
  )
  const [canvasReady, setCanvasReady] = useState(false)
  const [phase, setPhase] = useState(0)

  // Text sits above the track on phones, so progress starts when the house pins.
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  })
  // Function transforms stay on the JS scroll value. The range form runs on a
  // native ViewTimeline that is already part-way through at scroll position 0.
  const introOpacity = useTransform(scrollYProgress, (value) =>
    Math.max(0, 1 - value / INTRO_END)
  )
  const introY = useTransform(
    scrollYProgress,
    (value) => -24 * Math.min(1, value / INTRO_END)
  )
  const barScale = useTransform(scrollYProgress, (value) => value)

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    let next = 0
    PHASES.forEach(({ start }, index) => {
      if (value >= start) next = index
    })
    setPhase(next)
  })

  const pinsAll = mode === "3d"
  const immersive = pinsAll || mode === "scene"
  const animated = mode !== "lowpower" && mode !== "static"
  const sceneClasses = mode !== "lowpower"

  return (
    <section id="hero" aria-labelledby="hero-title" className="relative">
      {/* Zero height on the stage: the text floats over the pinned house. */}
      <div className="relative z-10 pt-24 stage:sticky stage:top-0 stage:h-0 stage:pt-0">
        <motion.div
          data-hero-ui
          style={pinsAll ? { opacity: introOpacity, y: introY } : undefined}
          className="relative mx-auto w-full max-w-[100rem] px-5 pb-8 md:px-10 stage:absolute stage:inset-x-0 stage:top-0 stage:pt-[clamp(6.5rem,17svh,11rem)] stage:pb-0"
        >
          <h1
            id="hero-title"
            className="max-w-[13ch] text-[clamp(2.6rem,4.9vw,5.75rem)] leading-[1.08] font-semibold tracking-[-0.015em] text-balance"
          >
            {t("title")}
          </h1>
          <p className="mt-5 max-w-[34ch] text-xl leading-normal text-pretty">
            {t("lead")}
          </p>
          <Link
            href={{ pathname: "/", hash: "kapcsolat" }}
            className={buttonVariants({
              size: "lg",
              className: "mt-7 h-14 px-7 text-lg",
            })}
          >
            {t("cta")}
          </Link>
          {immersive ? <p className="mt-4 text-base">{t("hint")}</p> : null}
        </motion.div>
      </div>

      <div
        ref={track}
        className={cn(
          "relative",
          mode === "lowpower"
            ? "stage:h-svh"
            : "stage:h-[360svh] scene:h-[280svh]"
        )}
      >
        <div
          className={cn(
            "flex flex-col stage:sticky stage:top-0 stage:block stage:h-svh stage:overflow-hidden",
            sceneClasses &&
              "scene:sticky scene:top-0 scene:h-svh scene:overflow-hidden scene:pt-16 md:scene:pt-[4.5rem]"
          )}
        >
          <div
            className={cn(
              "relative aspect-[16/11] w-full stage:absolute stage:top-1/2 stage:left-1/2 stage:aspect-[3/2] stage:w-[max(100vw,150svh)] stage:-translate-x-1/2 stage:-translate-y-1/2",
              sceneClasses && "scene:aspect-auto scene:min-h-0 scene:flex-1"
            )}
          >
            <Poster alt={t("alt")} animated={animated} />
            {immersive ? (
              <div
                data-ready={canvasReady || undefined}
                data-hero-canvas
                className="absolute inset-0 opacity-0 transition-opacity duration-500 data-ready:opacity-100"
              >
                <HouseCanvas
                  progress={scrollYProgress}
                  shot={getDevShot()}
                  compact={mode === "scene"}
                  onReady={() => setCanvasReady(true)}
                />
              </div>
            ) : null}
            {/* Blends the top of the picture into the page below the header. */}
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-background to-transparent stage:hidden",
                sceneClasses && "scene:hidden"
              )}
            />
          </div>

          {immersive ? (
            <motion.div
              data-hero-ui
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.4, ease: EASE }}
              className="mx-auto w-full max-w-[100rem] px-5 pt-3 pb-5 md:px-10 stage:absolute stage:inset-x-0 stage:bottom-0 stage:z-10 stage:px-10 stage:pt-0 stage:pb-7"
            >
              <div className="relative h-0.5 bg-foreground/25">
                <motion.div
                  style={{ scaleX: barScale }}
                  className="absolute inset-0 origin-left bg-foreground"
                />
              </div>
              {/* Phones show only the current step, at a size that can be read. */}
              <ol className="mt-3 grid min-h-24 grid-cols-1 stage:min-h-0 stage:grid-cols-4 stage:gap-6">
                {PHASES.map(({ key }, index) => (
                  <li
                    key={key}
                    aria-current={index === phase ? "step" : undefined}
                    className={cn(index !== phase && "hidden stage:block")}
                  >
                    <p
                      className={cn(
                        "text-xl stage:text-base",
                        index === phase && "font-bold"
                      )}
                    >
                      <span className="mr-2 tabular-nums">{index + 1}.</span>
                      {t(`phases.${key}.name`)}
                    </p>
                    <p
                      className={cn(
                        "text-lg leading-snug text-pretty transition-opacity duration-500 stage:text-base",
                        index === phase ? "opacity-100" : "opacity-0"
                      )}
                    >
                      {t(`phases.${key}.text`)}
                    </p>
                  </li>
                ))}
              </ol>
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
