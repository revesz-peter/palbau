// Facts about the business. A null value is not published: the page either
// hides the item or, on the legal pages, marks it as still to be filled in.
export const site = {
  showroomAddress: null as string | null,
  phone: null as string | null,
  email: null as string | null,
  company: {
    name: null as string | null,
    seat: null as string | null,
    taxNumber: null as string | null,
    registrationNumber: null as string | null,
  },
}

export function getCalUrl() {
  const link = process.env.NEXT_PUBLIC_CAL_LINK?.trim()
  if (!link) return null
  return link.startsWith("http") ? link : `https://cal.com/${link}`
}

export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return "http://localhost:3000"
}
