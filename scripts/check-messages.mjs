// Fails the build when messages/*.json drift apart or break the copy rules.
import { readFileSync } from "node:fs"

const load = (locale) =>
  JSON.parse(
    readFileSync(new URL(`../messages/${locale}.json`, import.meta.url))
  )

function flatten(value, prefix = "", out = new Map()) {
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out)
    }
  } else {
    out.set(prefix, value)
  }
  return out
}

const hu = flatten(load("hu"))
const en = flatten(load("en"))
const problems = []

for (const key of hu.keys()) {
  if (!en.has(key)) problems.push(`missing in en.json: ${key}`)
}
for (const key of en.keys()) {
  if (!hu.has(key)) problems.push(`missing in hu.json: ${key}`)
}
for (const [locale, entries] of [
  ["hu", hu],
  ["en", en],
]) {
  for (const [key, text] of entries) {
    if (typeof text === "string" && /[–—]/.test(text)) {
      problems.push(`em/en dash in ${locale}.json: ${key}`)
    }
  }
}

if (problems.length > 0) {
  console.error(`Message check failed:\n  ${problems.join("\n  ")}`)
  process.exit(1)
}
console.log(`Messages OK: ${hu.size} keys in hu and en.`)
