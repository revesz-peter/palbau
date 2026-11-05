import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["hu", "en"],
  defaultLocale: "hu",
  localePrefix: "as-needed",
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/impresszum": { hu: "/impresszum", en: "/legal-notice" },
    "/adatvedelem": { hu: "/adatvedelem", en: "/privacy" },
  },
})

export type Locale = (typeof routing.locales)[number]
