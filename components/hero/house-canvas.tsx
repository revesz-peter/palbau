"use client"

import { Environment, Lightformer } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import type { MotionValue } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"
import { NeutralToneMapping } from "three"

import {
  applyPose,
  applyProgress,
  buildHouse,
  poseAt,
  SHOTS,
  showShell,
  SKY_START,
} from "./house-model"

type Shot = (typeof SHOTS)[string]

const MAX_FRAME_SECONDS = 1 / 30
const SETTLE_RATE = 3.5
const SETTLED = 0.0004
/** Phones: this many slow frames in a row drops the canvas to one pixel density. */
const SLOW_FRAME_SECONDS = 1 / 30
const SLOW_FRAMES = 8

function HouseScene({
  progress,
  shot,
  compact,
  onFirstFrame,
}: {
  progress: MotionValue<number>
  shot: Shot | null
  compact: boolean
  onFirstFrame: () => void
}) {
  const house = useMemo(() => buildHouse({ lite: compact }), [compact])
  const slowFrames = useRef(0)
  const animating = useRef(false)
  const invalidate = useThree((state) => state.invalidate)
  const current = useRef(shot ? shot.progress : progress.get())
  const announced = useRef(false)

  useEffect(() => () => house.dispose(), [house])
  useEffect(
    () => progress.on("change", () => invalidate()),
    [progress, invalidate]
  )

  useFrame((state, delta) => {
    // Only frames in a running animation say anything about speed: the first
    // one after a pause reports the whole pause as its delta.
    if (compact && !shot && animating.current && state.viewport.dpr > 1) {
      slowFrames.current =
        delta > SLOW_FRAME_SECONDS ? slowFrames.current + 1 : 0
      if (slowFrames.current >= SLOW_FRAMES) state.setDpr(1)
    }

    const target = shot ? shot.progress : progress.get()
    const gap = target - current.current
    const step = 1 - Math.exp(-Math.min(delta, MAX_FRAME_SECONDS) * SETTLE_RATE)
    current.current =
      Math.abs(gap) < SETTLED ? target : current.current + gap * step
    animating.current = current.current !== target
    if (animating.current) state.invalidate()

    applyProgress(house, state.scene, current.current)
    if (shot?.shell) showShell(house)
    applyPose(
      state.camera,
      shot ? shot.pose : poseAt(current.current, compact),
      compact
    )

    if (!announced.current) {
      announced.current = true
      // The first frame only sets up the scene. Reveal after the next one.
      state.invalidate()
      requestAnimationFrame(() => requestAnimationFrame(onFirstFrame))
    }
  })

  return (
    <>
      <color attach="background" args={[SKY_START.clone()]} />
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#f7f4ee"
          scale={[60, 60, 1]}
          position={[0, 30, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          color="#f7f3ec"
          scale={[40, 16, 1]}
          position={[-30, 10, 26]}
          rotation={[0, Math.PI / 4, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.5}
          color="#cfd9e0"
          scale={[50, 20, 1]}
          position={[30, 8, -10]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      </Environment>
      <primitive object={house.root} />
    </>
  )
}

export default function HouseCanvas({
  progress,
  shot,
  compact = false,
  onReady,
}: {
  progress: MotionValue<number>
  shot: string | null
  compact?: boolean
  onReady: () => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = useState(true)

  useEffect(() => {
    if (!container.current) return
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting)
    )
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])

  return (
    // Pointer events pass through, so that a swipe on the canvas scrolls the page.
    <div ref={container} className="pointer-events-none absolute inset-0">
      <Canvas
        shadows="percentage"
        dpr={compact && !shot ? [1, 1.5] : [1, 2]}
        frameloop={onScreen ? "demand" : "never"}
        camera={{ fov: 20, near: 10, far: 400, position: [50, 40, 60] }}
        gl={{
          alpha: false,
          antialias: true,
          stencil: false,
          preserveDrawingBuffer: shot !== null,
          toneMapping: NeutralToneMapping,
        }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true
        }}
      >
        <HouseScene
          progress={progress}
          shot={shot ? (SHOTS[shot] ?? null) : null}
          compact={compact}
          onFirstFrame={onReady}
        />
      </Canvas>
    </div>
  )
}
