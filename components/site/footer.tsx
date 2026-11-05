import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"

export function Footer() {
  const t = useTranslations("footer")
  const nav = useTranslations("nav")

  return (
    <footer className="bg-background">
      <div className="mx-auto flex max-w-[100rem] flex-col gap-6 px-5 py-10 text-base md:flex-row md:items-end md:justify-between md:px-10">
        <div>
          <p className="text-xl font-semibold">{nav("brand")}</p>
          <p className="mt-1">{t("role")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6">
          <Link
            href="/impresszum"
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            {t("imprint")}
          </Link>
          <Link
            href="/adatvedelem"
            className="inline-flex min-h-11 items-center underline underline-offset-4"
          >
            {t("privacy")}
          </Link>
          <p>
            {new Date().getFullYear()} {nav("brand")}. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  )
}
