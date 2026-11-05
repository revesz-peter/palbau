"use client"

import { useLocale, useTranslations } from "next-intl"

import { Link, usePathname } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import { cn } from "@/lib/utils"

export function LanguageSwitcher() {
  const t = useTranslations("nav")
  const active = useLocale()
  const pathname = usePathname()

  return (
    <nav aria-label={t("language")} className="flex text-base md:gap-3">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === active ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 min-w-9 items-center justify-center underline-offset-4 md:min-w-0",
            locale === active ? "font-bold" : "underline"
          )}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </nav>
  )
}
