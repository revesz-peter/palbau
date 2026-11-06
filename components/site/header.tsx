"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { Link, usePathname } from "@/i18n/navigation"
import { site } from "@/lib/site"
import { cn } from "@/lib/utils"

import { LanguageSwitcher } from "./language-switcher"

const SECTIONS = [
  ["approach", "generalkivitelezes"],
  ["promise", "irasban"],
  ["contact", "kapcsolat"],
] as const

export function Header() {
  const t = useTranslations("nav")
  const isHome = usePathname() === "/"
  const [heroVisible, setHeroVisible] = useState(true)
  const overHero = isHome && heroVisible

  useEffect(() => {
    const hero = document.getElementById("hero")
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" }
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [isHome])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-colors duration-500",
        overHero
          ? "border-transparent bg-background stage:bg-transparent"
          : "border-border bg-background"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gap-2 px-5 min-[420px]:gap-4 md:h-[4.5rem] md:px-10">
        <Link
          href="/"
          aria-label={t("home")}
          className="inline-flex min-h-11 items-center text-lg font-semibold whitespace-nowrap min-[420px]:text-xl md:text-2xl"
        >
          {t("brand")}
        </Link>
        <div className="flex items-center gap-1 min-[420px]:gap-2 md:gap-7">
          <nav className="hidden xl:block">
            <ul className="flex gap-7 text-base">
              {SECTIONS.map(([key, hash]) => (
                <li key={key}>
                  <Link
                    href={{ pathname: "/", hash }}
                    className="whitespace-nowrap underline-offset-4 hover:underline"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {site.phone ? (
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="hidden text-lg font-semibold whitespace-nowrap md:block"
            >
              {site.phone}
            </a>
          ) : null}
          <LanguageSwitcher />
          <Link
            href={{ pathname: "/", hash: "kapcsolat" }}
            className={buttonVariants({
              className: "h-11 px-3 whitespace-nowrap md:px-4",
            })}
          >
            <span className="min-[420px]:hidden">{t("ctaShort")}</span>
            <span className="hidden min-[420px]:inline">{t("cta")}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
