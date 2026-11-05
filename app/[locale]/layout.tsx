import { MotionConfig } from "framer-motion"
import type { Metadata } from "next"
import { Atkinson_Hyperlegible_Next } from "next/font/google"
import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server"
import type { ReactNode } from "react"

import "../globals.css"
import { Footer } from "@/components/site/footer"
import { Header } from "@/components/site/header"
import { routing } from "@/i18n/routing"
import { getSiteUrl } from "@/lib/site"
import { cn } from "@/lib/utils"

// Designed for low-vision readers. latin-ext carries the Hungarian ő and ű.
const font = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--font-atkinson",
})

type Props = { children: ReactNode; params: Promise<{ locale: string }> }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: "meta" })

  return {
    metadataBase: new URL(getSiteUrl()),
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: locale === "hu" ? "hu_HU" : "en_GB",
      type: "website",
      images: [{ url: "/images/hero-finished.jpg", width: 2400, height: 1600 }],
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const t = await getTranslations("nav")
  const messages = await getMessages()
  const clientMessages = {
    nav: messages.nav,
    hero: messages.hero,
    contact: messages.contact,
  }

  return (
    <html lang={locale} className={cn("antialiased", font.variable)}>
      <body>
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;clip-path:none!important;transform:none!important}`}</style>
        </noscript>
        <NextIntlClientProvider messages={clientMessages}>
          <MotionConfig reducedMotion="user">
            <a
              href="#tartalom"
              className="fixed top-3 left-3 z-50 -translate-y-20 bg-primary px-4 py-2 text-primary-foreground focus:translate-y-0"
            >
              {t("skip")}
            </a>
            <Header />
            <main id="tartalom">{children}</main>
            <Footer />
          </MotionConfig>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
