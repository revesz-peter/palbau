import { HardHat, ShieldCheck, Truck } from "lucide-react"
import { useTranslations } from "next-intl"

import { BuildStages } from "./build-stages"
import { Reveal } from "./reveal"
import { SectionHeading } from "./section-heading"

const POINTS = [
  { key: "people", Icon: HardHat },
  { key: "materials", Icon: Truck },
  { key: "responsibility", Icon: ShieldCheck },
] as const

export function Approach() {
  const t = useTranslations("approach")

  return (
    <section
      id="generalkivitelezes"
      aria-labelledby="approach-title"
      className="mx-auto max-w-[100rem] px-5 py-14 md:px-10 md:py-32"
    >
      <SectionHeading
        id="approach-title"
        number={t("number")}
        title={t("title")}
      />
      <div className="mt-6 md:mt-14">
        <Reveal>
          <p className="max-w-[30ch] text-2xl leading-snug font-medium text-balance md:text-4xl md:leading-snug">
            {t("body")}
          </p>
        </Reveal>

        <dl className="mt-8 grid gap-3 md:mt-12 md:grid-cols-3 md:gap-6">
          {POINTS.map(({ key, Icon }, index) => (
            <Reveal key={key} delay={index * 0.12}>
              <div className="flex h-full items-start gap-4 border border-border bg-card p-4 transition-transform duration-500 hover:-translate-y-1 md:block md:p-7">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary md:size-14">
                  <Icon aria-hidden className="size-6 md:size-7" />
                </span>
                <div className="md:mt-6">
                  <dt className="text-xl font-semibold md:text-2xl">
                    {t(`points.${key}.title`)}
                  </dt>
                  <dd className="mt-1 text-lg leading-snug text-pretty md:mt-2">
                    {t(`points.${key}.text`)}
                  </dd>
                </div>
              </div>
            </Reveal>
          ))}
        </dl>

        <div className="mt-10 md:mt-16">
          <BuildStages
            title={t("termsTitle")}
            note={t("termsNote")}
            caption={t("caption")}
            stages={{
              structural: {
                title: t("terms.structural.title"),
                text: t("terms.structural.text"),
                imageAlt: t("terms.structural.imageAlt"),
              },
              turnkey: {
                title: t("terms.turnkey.title"),
                text: t("terms.turnkey.text"),
                imageAlt: t("terms.turnkey.imageAlt"),
              },
            }}
          />
        </div>
      </div>
    </section>
  )
}
