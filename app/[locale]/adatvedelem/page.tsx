import type { Metadata } from "next"
import { useTranslations } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { LegalLayout, LegalRows } from "@/components/site/legal-layout"
import { pageAlternates } from "@/i18n/alternates"
import type { Locale } from "@/i18n/routing"
import { site } from "@/lib/site"

type Props = { params: Promise<{ locale: Locale }> }

const SECTIONS = [
  "data",
  "purpose",
  "retention",
  "processors",
  "cookies",
  "rights",
] as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })
  return {
    title: t("privacyTitle"),
    alternates: pageAlternates("/adatvedelem", locale),
  }
}

export default function PrivacyPage({ params }: Props) {
  setRequestLocale(use(params).locale)
  const t = useTranslations("legal.privacy")
  const imprint = useTranslations("legal.imprint")

  return (
    <LegalLayout title={t("title")}>
      <p className="max-w-[50ch] text-xl leading-normal text-pretty">
        {t("intro")}
      </p>
      <LegalRows
        heading={t("controllerHeading")}
        rows={[
          { label: imprint("companyName"), value: site.company.name },
          { label: imprint("seat"), value: site.company.seat },
          { label: imprint("email"), value: site.email },
        ]}
      />
      {SECTIONS.map((key) => (
        <section key={key}>
          <h2 className="text-2xl font-semibold">
            {t(`sections.${key}.title`)}
          </h2>
          <p className="mt-3 max-w-[62ch] text-lg text-pretty">
            {t(`sections.${key}.body`)}
          </p>
        </section>
      ))}
    </LegalLayout>
  )
}
