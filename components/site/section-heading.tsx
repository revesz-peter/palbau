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
    <Reveal className="grid grid-cols-12 gap-x-2 border-t-2 border-current/30 pt-4 md:gap-x-6 md:pt-5">
      <p className="col-span-12 text-lg font-medium tabular-nums md:col-span-2">
        {number}
      </p>
      <h2
        id={id}
        className="col-span-12 mt-2 max-w-[22ch] text-[clamp(1.7rem,9.6vw,2.1rem)] leading-[1.12] font-semibold tracking-[-0.01em] text-balance md:col-span-10 md:mt-0 md:text-[clamp(2.1rem,3.8vw,4rem)]"
      >
        {title}
      </h2>
    </Reveal>
  )
}
