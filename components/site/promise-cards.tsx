"use client"

import {
  motion,
  type MotionValue,
  useScroll,
  useTransform,
} from "framer-motion"
import {
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Coins,
  Eye,
  Wrench,
} from "lucide-react"
import { type CSSProperties, useRef, useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Item = { key: string; question: string; answer: string }

const ICONS: Record<string, typeof Eye> = {
  scope: ClipboardList,
  price: Banknote,
  time: CalendarDays,
  payment: Coins,
  defects: Wrench,
  inspection: Eye,
}

const TONES = ["bg-card", "bg-secondary"]

/** How much a card shrinks for each card lying on top of it. */
const SHRINK_PER_CARD = 0.028

/**
 * One list, two layouts. Phones swipe through it sideways, one card at a time.
 * Large screens pin each card a little lower than the last, so they pile up.
 */
export function PromiseCards({
  label,
  previous,
  next,
  items,
}: {
  label: string
  previous: string
  next: string
  items: Item[]
}) {
  const list = useRef<HTMLOListElement>(null)
  const [current, setCurrent] = useState(0)
  const { scrollYProgress } = useScroll({
    target: list,
    offset: ["start 25%", "end end"],
  })

  const cardLeft = (index: number) => {
    const element = list.current
    const card = element?.children[index] as HTMLElement | undefined
    if (!element || !card) return 0
    return card.offsetLeft - parseFloat(getComputedStyle(element).paddingLeft)
  }

  const goTo = (index: number) => {
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    list.current?.scrollTo({
      left: cardLeft(index),
      behavior: quiet ? "auto" : "smooth",
    })
  }

  const onScroll = () => {
    const element = list.current
    if (!element) return
    let nearest = 0
    let distance = Infinity
    items.forEach((_, index) => {
      const gap = Math.abs(cardLeft(index) - element.scrollLeft)
      if (gap < distance) {
        distance = gap
        nearest = index
      }
    })
    setCurrent(nearest)
  }

  return (
    <>
      <ol
        ref={list}
        tabIndex={0}
        aria-label={label}
        onScroll={onScroll}
        className="relative -mx-5 flex snap-x snap-mandatory scroll-px-5 [scrollbar-width:none] gap-3 overflow-x-auto px-5 md:-mx-10 md:scroll-px-10 md:px-10 lg:mx-0 lg:block lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <Card
            key={item.key}
            item={item}
            index={index}
            total={items.length}
            progress={scrollYProgress}
          />
        ))}
      </ol>

      <div className="mt-4 flex items-center gap-3 lg:hidden">
        <div aria-hidden className="flex flex-1 gap-1.5">
          {items.map((item, index) => (
            <span
              key={item.key}
              className={cn(
                "h-1 flex-1 transition-colors duration-300",
                index <= current ? "bg-foreground" : "bg-foreground/20"
              )}
            />
          ))}
        </div>
        <p className="text-base tabular-nums">
          {current + 1} / {items.length}
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label={previous}
            disabled={current === 0}
            onClick={() => goTo(current - 1)}
            className={buttonVariants({
              variant: "secondary",
              className: "size-12 p-0",
            })}
          >
            <ChevronLeft aria-hidden className="size-6" />
          </button>
          <button
            type="button"
            aria-label={next}
            disabled={current === items.length - 1}
            onClick={() => goTo(current + 1)}
            className={buttonVariants({ className: "size-12 p-0" })}
          >
            <ChevronRight aria-hidden className="size-6" />
          </button>
        </div>
      </div>
    </>
  )
}

function Card({
  item,
  index,
  total,
  progress,
}: {
  item: Item
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const Icon = ICONS[item.key]
  const stackScale = useTransform(
    progress,
    [index / total, 1],
    [1, 1 - (total - 1 - index) * SHRINK_PER_CARD]
  )

  return (
    <motion.li
      style={
        {
          "--card-index": index,
          "--stack-scale": stackScale,
        } as unknown as CSSProperties
      }
      className="flex w-[84%] max-w-md shrink-0 snap-start lg:sticky lg:top-[calc(7rem+var(--card-index)*1.5rem)] lg:mb-8 lg:w-auto lg:max-w-none lg:origin-top lg:last:mb-0 lg:motion-safe:scale-(--stack-scale)"
    >
      <article
        className={cn(
          "flex w-full flex-col border border-border p-5 lg:min-h-80 lg:p-9 lg:shadow-[0_-14px_40px_-22px_oklch(0.22_0.012_70/35%)]",
          TONES[index % TONES.length]
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="flex size-12 items-center justify-center rounded-full bg-background lg:size-14">
            <Icon aria-hidden className="size-6 lg:size-7" />
          </span>
        </div>
        <h3 className="mt-6 text-2xl leading-tight font-semibold text-balance lg:mt-auto lg:text-4xl">
          {item.question}
        </h3>
        <p className="mt-3 text-lg leading-snug text-pretty lg:max-w-[46ch] lg:text-xl lg:leading-snug">
          {item.answer}
        </p>
      </article>
    </motion.li>
  )
}
