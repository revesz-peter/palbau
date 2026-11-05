import { getPathname } from "./navigation"
import { routing, type Locale } from "./routing"

type Href = Parameters<typeof getPathname>[0]["href"]

export function pageAlternates(href: Href, locale: Locale) {
  return {
    canonical: getPathname({ href, locale }),
    languages: Object.fromEntries(
      routing.locales.map((item) => [item, getPathname({ href, locale: item })])
    ),
  }
}
