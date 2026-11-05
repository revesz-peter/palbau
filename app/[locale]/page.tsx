import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"

import { Hero } from "@/components/hero/hero"
import { Approach } from "@/components/site/approach"
import { Contact } from "@/components/site/contact"
import { WrittenPromise } from "@/components/site/promise"
import { pageAlternates } from "@/i18n/alternates"
import type { Locale } from "@/i18n/routing"

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return { alternates: pageAlternates("/", locale) }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <>
      <Hero />
      <Approach />
      <WrittenPromise />
      <Contact />
    </>
  )
}
