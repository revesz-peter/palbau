import Link from "next/link"

// Requests that never reach a locale, such as a mistyped file path.
export default function NotFound() {
  return (
    <html lang="hu">
      <body style={{ fontFamily: "sans-serif", padding: "4rem 2rem" }}>
        <h1>Az oldal nem található.</h1>
        <p>
          <Link href="/">Vissza a kezdőlapra</Link>
        </p>
      </body>
    </html>
  )
}
