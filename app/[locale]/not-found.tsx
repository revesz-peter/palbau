import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"

export default function NotFound() {
  const t = useTranslations("notFound")

  return (
    <div className="mx-auto flex min-h-[70svh] max-w-[100rem] flex-col justify-center px-5 pt-32 pb-24 md:px-10">
      <h1 className="max-w-[20ch] text-[clamp(2.1rem,3.8vw,4rem)] leading-[1.12] font-semibold tracking-[-0.01em]">
        {t("title")}
      </h1>
      <p className="mt-6 max-w-[46ch] text-lg">{t("body")}</p>
      <Link href="/" className="mt-8 underline underline-offset-4">
        {t("back")}
      </Link>
    </div>
  )
}
