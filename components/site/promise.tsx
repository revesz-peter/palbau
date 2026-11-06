import { useTranslations } from "next-intl"

import { PromiseCards } from "./promise-cards"
import { Reveal } from "./reveal"
import { SectionHeading } from "./section-heading"

const ITEMS = [
  "scope",
  "price",
  "time",
  "payment",
  "defects",
  "inspection",
] as const

export function WrittenPromise() {
  const t = useTranslations("promise")

  return (
    <section
      id="irasban"
      aria-labelledby="promise-title"
      className="mx-auto max-w-[100rem] px-5 pb-14 md:px-10 md:pb-32"
    >
      <SectionHeading
        id="promise-title"
        number={t("number")}
        title={t("title")}
      />
      <div className="mt-6 grid grid-cols-12 gap-x-2 gap-y-6 md:mt-14 md:gap-x-6">
        <div className="col-span-12 lg:sticky lg:top-32 lg:col-span-4 lg:self-start">
          <Reveal>
            <p className="max-w-[44ch] text-xl leading-normal text-pretty">
              {t("intro")}
            </p>
          </Reveal>
        </div>
        <div className="col-span-12 lg:col-span-8">
          <PromiseCards
            label={t("cardsLabel")}
            previous={t("previous")}
            next={t("next")}
            items={ITEMS.map((key) => ({
              key,
              question: t(`items.${key}.question`),
              answer: t(`items.${key}.answer`),
            }))}
          />
        </div>
      </div>
    </section>
  )
}
