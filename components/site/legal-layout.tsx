import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Link } from "@/i18n/navigation"

export function LegalLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const t = useTranslations("legal")

  return (
    <div className="mx-auto max-w-[100rem] px-5 pt-32 pb-24 md:px-10 md:pt-44 md:pb-36">
      <div className="grid grid-cols-12 gap-x-2 md:gap-x-6">
        <div className="col-span-12 lg:col-span-8">
          <h1 className="text-[clamp(2.1rem,3.8vw,4rem)] leading-[1.12] font-semibold tracking-[-0.01em]">
            {title}
          </h1>
          <div className="mt-14 space-y-12">{children}</div>
          <Link
            href="/"
            className="mt-16 inline-block underline underline-offset-4"
          >
            {t("back")}
          </Link>
        </div>
      </div>
    </div>
  )
}

export function LegalRows({
  heading,
  rows,
}: {
  heading: string
  rows: { label: string; value: string | null }[]
}) {
  const t = useTranslations("legal")

  return (
    <section>
      <h2 className="text-2xl font-semibold">{heading}</h2>
      <dl className="mt-4 divide-y divide-border border-y border-border">
        {rows.map(({ label, value }) => (
          <div key={label} className="grid gap-1 py-3 sm:grid-cols-2 sm:gap-6">
            <dt className="font-semibold">{label}</dt>
            <dd>
              {value ?? (
                <span className="bg-muted px-2 py-0.5 text-base">
                  {t("pending")}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
