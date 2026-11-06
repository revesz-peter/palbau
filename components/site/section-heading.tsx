import { Reveal } from "./reveal"

export function SectionHeading({
  id,
  number,
  title,
}: {
  id: string
  number: string
  title: string
}) {
  return (
    <Reveal className="border-t-2 border-current/30 pt-4 md:pt-5">
      <p className="text-lg font-medium tabular-nums">{number}</p>
      <h2
        id={id}
        className="mt-2 max-w-[22ch] text-[clamp(1.7rem,9.6vw,2.1rem)] leading-[1.12] font-semibold tracking-[-0.01em] text-balance md:mt-3 md:text-[clamp(2.1rem,3.8vw,4rem)]"
      >
        {title}
      </h2>
    </Reveal>
  )
}
