// Shared by the hero UI and the 3D model. Free of three.js so that the hero's
// text and poster never pull the 3D bundle.

/** Keep in sync with the `stage` custom variant in app/globals.css. */
export const STAGE_QUERY =
  "(min-width: 1024px) and (min-aspect-ratio: 5/4) and (prefers-reduced-motion: no-preference)"

/**
 * Phones and upright tablets: the text scrolls away, then the house pins and
 * builds. Too short a screen (a phone on its side) keeps the still image.
 * Keep in sync with the `scene` custom variant in app/globals.css.
 */
export const SCENE_QUERY =
  "((max-width: 1023.98px) or (max-aspect-ratio: 5/4)) and (min-height: 500px) and (prefers-reduced-motion: no-preference)"

export const PHASES = [
  { key: "foundation", start: 0 },
  { key: "walls", start: 0.2 },
  { key: "roof", start: 0.5 },
  { key: "light", start: 0.74 },
] as const
