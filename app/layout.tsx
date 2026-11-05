import type { ReactNode } from "react"

// The real root layout, with <html>, is app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
