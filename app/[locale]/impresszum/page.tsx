import type { Metadata } from "next"
import { useTranslations } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { use } from "react"

import { LegalLayout, LegalRows } from "@/components/site/legal-layout"
import { pageAlternates } from "@/i18n/alternates"
import type { Locale } from "@/i18n/routing"
import { site } from "@/lib/site"

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "meta" })
  return {
    title: t("imprintTitle"),
    alternates: pageAlternates("/impresszum", locale),
  }
}

export default function ImprintPage({ params }: Props) {
  setRequestLocale(use(params).locale)
  const t = useTranslations("legal.imprint")

  return (
    <LegalLayout title={t("title")}>
      <LegalRows
        heading={t("operator")}
        rows={[
          { label: t("companyName"), value: site.company.name },
          { label: t("seat"), value: site.company.seat },
          { label: t("taxNumber"), value: site.company.taxNumber },
          {
            label: t("registrationNumber"),
            value: site.company.registrationNumber,
          },
        ]}
      />
      <LegalRows
        heading={t("contactHeading")}
        rows={[
          { label: t("email"), value: site.email },
          { label: t("phone"), value: site.phone },
        ]}
      />
      <section>
        <h2 className="text-2xl font-semibold">{t("hostingHeading")}</h2>
        <p className="mt-4 max-w-[62ch] text-lg text-pretty">{t("hosting")}</p>
      </section>
    </LegalLayout>
  )
}
