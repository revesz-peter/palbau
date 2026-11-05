// Renders the hero posters and section images from the real 3D scene, so the
// poster matches the canvas pixel for pixel. Run `pnpm dev` first, then:
//   pnpm render:stills              all stills
//   pnpm render:stills hero-plan    one still
import { rmSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const OUT = fileURLToPath(new URL("../public/images/", import.meta.url))
const ALL = [
  "hero-plan",
  "hero-finished",
  "hero-compact",
  "hero-plan-phone",
  "detail-gable",
  "detail-shell",
]
// Stills of the phone layout are taken at a phone's size.
const PHONE = { viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 }
const DESKTOP = {
  viewport: { width: 2400, height: 1600 },
  deviceScaleFactor: 1,
}
const shots = process.argv.length > 2 ? process.argv.slice(2) : ALL

const browser = await chromium.launch({
  channel: "chrome",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
})

for (const shot of shots) {
  const page = await browser.newPage({
    ...(shot.endsWith("-phone") ? PHONE : DESKTOP),
    reducedMotion: "no-preference",
  })
  page.on("pageerror", (error) => console.error("page error:", error.message))
  await page.goto(`${BASE}/?shot=${shot}`, { waitUntil: "load" })
  await page.addStyleTag({
    content:
      "header,[data-hero-ui],nextjs-portal{display:none!important}[data-hero-canvas]{transition:none!important}",
  })
  await page.waitForSelector("[data-hero-canvas][data-ready]", {
    timeout: 120_000,
  })
  await page.waitForTimeout(1500)
  await page.locator("[data-hero-canvas]").screenshot({
    path: `${OUT}${shot}.jpg`,
    type: "jpeg",
    quality: 92,
  })
  await page.close()
  console.log(`rendered ${shot}`)
}

await browser.close()

// next/image keeps optimised copies for hours, so it would keep serving the old
// stills under the same URL. The hero would then fade from an old poster.
for (const cache of [".next/cache/images", ".next/dev/cache/images"]) {
  rmSync(new URL(`../${cache}`, import.meta.url), {
    recursive: true,
    force: true,
  })
}
