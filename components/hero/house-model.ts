import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

/** Same OKLCH values as the tokens in app/globals.css, so model and page match. */
function oklch(l: number, c: number, h: number) {
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return new THREE.Color().setRGB(
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
    THREE.LinearSRGBColorSpace
  )
}

export const SKY_START = oklch(0.972, 0.012, 85) // --beige
const SKY_DAY = oklch(0.915, 0.028, 82)
const INK = oklch(0.22, 0.012, 70) // --ink
const WARM_LIGHT = oklch(0.9, 0.08, 82)

const SLAB_TOP = 0.3
const UP = new THREE.Vector3(0, 1, 0)
const clipBoard = new THREE.Plane(UP, 0)
const clipSlab = new THREE.Plane(UP, -SLAB_TOP)

function material(
  color: THREE.Color,
  roughness: number,
  metalness = 0,
  clip?: THREE.Plane
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    clippingPlanes: clip ? [clip] : null,
    clipShadows: Boolean(clip),
  })
}

type BoxSpec = {
  size: [number, number, number]
  at: [number, number, number]
  tilt?: number
}

function boxGeometry({ size, at, tilt = 0 }: BoxSpec) {
  const geometry = new THREE.BoxGeometry(...size).toNonIndexed()
  if (tilt) geometry.rotateX(tilt)
  geometry.translate(...at)
  return geometry
}

const boxes = (specs: BoxSpec[]) => mergeGeometries(specs.map(boxGeometry))

type Point = [number, number]

/** A wall drawn in its own plane, with openings, as a solid slab. */
function wallGeometry(outline: Point[], holes: Point[][], depth: number) {
  const toPath = <T extends THREE.Path>(path: T, points: Point[]) => {
    points.forEach(([x, y], i) =>
      i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)
    )
    path.closePath()
    return path
  }
  const shape = toPath(new THREE.Shape(), outline)
  holes.forEach((hole) => shape.holes.push(toPath(new THREE.Path(), hole)))
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
}

const rect = (x0: number, y0: number, x1: number, y1: number): Point[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
]

function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material) {
  const object = new THREE.Mesh(geometry, mat)
  object.castShadow = true
  object.receiveShadow = true
  return object
}

/** Seeded, so that the canvas and the rendered posters always match. */
function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A rough planting mass. `radiusAt` gives its width from 0 (base) to 1 (top). */
function foliageGeometry(
  height: number,
  radius: number,
  seed: number,
  radiusAt: (t: number) => number,
  lite: boolean
) {
  const random = seededRandom(seed)
  const waves = Array.from({ length: 16 }, (_, i) => {
    const frequency = i < 4 ? 14 : 62
    return {
      x: (random() - 0.5) * frequency,
      y: (random() - 0.5) * frequency,
      z: (random() - 0.5) * frequency,
      phase: random() * Math.PI * 2,
    }
  })
  const segments = lite ? (height > 3 ? 28 : 20) : height > 3 ? 64 : 48
  const geometry = new THREE.SphereGeometry(1, segments, segments)
  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 3)
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const t = (y + 1) / 2
    const noise = waves.reduce(
      (sum, w) => sum + Math.sin(w.x * x + w.y * y + w.z * z + w.phase),
      0
    )
    const clump = 1 + 0.018 * noise + 0.03 * (random() - 0.5)
    const r = radius * radiusAt(t) * clump
    position.setXYZ(i, x * r, t * height, z * r)
    // Lighter leaf tips over deep shade, and darker towards the base.
    const shade = (0.84 + 0.06 * noise + 0.16 * random()) * (0.76 + 0.32 * t)
    colors.set([shade, shade, shade], i * 3)
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

const thujaProfile = (t: number) => Math.min(1, 7 * t + 0.55) * (1 - t) ** 0.8
const shrubProfile = (t: number) => Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2))

function gravelTexture(lite: boolean) {
  const size = lite ? 512 : 1024
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")!
  context.fillStyle = "#e6dfd0"
  context.fillRect(0, 0, size, size)
  const random = seededRandom(7)
  const stones = ["#f6f1e6", "#d8cfbd", "#c4baa6", "#ece5d7", "#b5aa95"]
  for (let i = 0; i < (lite ? 6500 : 26000); i++) {
    context.fillStyle = stones[Math.floor(random() * stones.length)]
    context.beginPath()
    context.ellipse(
      random() * size,
      random() * size,
      1.5 + random() * 3.5,
      1.5 + random() * 2.5,
      random() * Math.PI,
      0,
      Math.PI * 2
    )
    context.fill()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

type PartKind = "rise" | "drop" | "fade" | "grow"

type Part = {
  object: THREE.Object3D
  kind: PartKind
  start: number
  end: number
  /** rise: how far it travels up. fade/drop: final opacity is in `opacity`. */
  travel: number
  materials: THREE.MeshStandardMaterial[]
  opacity: number
}

const easeOut = (t: number) => 1 - (1 - t) ** 3
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const window01 = (p: number, start: number, end: number) =>
  clamp01((p - start) / (end - start))
const smooth = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export type House = ReturnType<typeof buildHouse>

/* Plan of the villa. Two tall wings rise towards a lower, tiled centre. */
const X0 = -10 // Outer wall of the living wing.
const X1 = -3.7 // Living wing meets the centre.
const X2 = 3.7 // Centre meets the bedroom wing.
const X3 = 10 // Outer wall of the bedroom wing.
const ZB = -4.5 // Back of the house.
const ZF = 3.5 // Terrace front.
const ZR = 5.5 // The bedroom wing stands forward of the terrace front.
const WALL = 0.3
const EAVE = 3.1 // Wall height at the low side of each wing and the centre.
const PEAK = 6.3 // Wall height where the wings meet the centre.
const RIDGE = 4.85 // Ridge of the tiled centre roof.
const HEAD = 2.9 // Top of the glazing.

/** `lite` trades detail you cannot see on a phone for a faster scene. */
export function buildHouse({ lite = false }: { lite?: boolean } = {}) {
  const root = new THREE.Group()
  const parts: Part[] = []
  const ghostSources: THREE.BufferGeometry[] = []
  /** Everything that is not there yet on a shell (szerkezetkész) house. */
  const finishParts: Part[] = []

  const plaster = material(oklch(0.99, 0.001, 95), 0.92, 0, clipSlab)
  const interior = material(oklch(0.96, 0.006, 90), 0.8, 0, clipSlab)
  const concrete = material(oklch(0.84, 0.006, 85), 0.9, 0, clipBoard)
  const deckBase = material(oklch(0.74, 0.008, 80), 0.9, 0, clipBoard)
  const stone = material(oklch(0.84, 0.014, 80), 0.68, 0, clipBoard)
  const coping = material(oklch(0.97, 0.004, 90), 0.6, 0, clipBoard)
  const oakFloor = material(oklch(0.8, 0.05, 78), 0.55, 0, clipSlab)
  const oak = material(oklch(0.68, 0.075, 68), 0.6, 0, clipSlab)
  const fabric = material(oklch(0.86, 0.014, 80), 0.95, 0, clipSlab)
  const accent = material(oklch(0.84, 0.15, 92), 0.7, 0, clipSlab)
  const frame = material(oklch(0.97, 0.003, 90), 0.42, 0.1, clipSlab)
  const dark = material(oklch(0.34, 0.006, 60), 0.5, 0.2, clipSlab)
  const metalRoof = () => material(oklch(0.46, 0.005, 250), 0.68, 0.05)
  const tile = () => material(oklch(0.36, 0.022, 45), 0.72)

  const addRise = (
    object: THREE.Object3D,
    start: number,
    end: number,
    travel: number
  ) => {
    root.add(object)
    parts.push({
      object,
      kind: "rise",
      start,
      end,
      travel,
      materials: [],
      opacity: 1,
    })
  }

  const addDrop = (
    geometry: THREE.BufferGeometry,
    mat: THREE.MeshStandardMaterial,
    start: number,
    end: number
  ) => {
    mat.transparent = true
    const group = new THREE.Group()
    group.add(mesh(geometry, mat))
    root.add(group)
    parts.push({
      object: group,
      kind: "drop",
      start,
      end,
      travel: 5,
      materials: [mat],
      opacity: 1,
    })
  }

  const addGrow = (
    object: THREE.Object3D,
    x: number,
    z: number,
    start: number
  ) => {
    object.position.set(x, 0, z)
    root.add(object)
    parts.push({
      object,
      kind: "grow",
      start,
      end: start + 0.1,
      travel: 0,
      materials: [],
      opacity: 1,
    })
  }

  /* The sky. Painted first, it fades in behind the house as the light comes. */
  const skyMaterial = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uGround: { value: SKY_START },
      uSky: { value: SKY_DAY },
      uMix: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 1.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uGround;
      uniform vec3 uSky;
      uniform float uMix;
      varying vec2 vUv;
      void main() {
        float sky = smoothstep(0.3, 0.86, vUv.y) * uMix;
        gl_FragColor = vec4(mix(uGround, uSky, sky), 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMaterial)
  sky.frustumCulled = false
  sky.renderOrder = -1000
  root.add(sky)

  /* Model board. Always present: the drawing lies on it at the start. */
  const BOARD = { width: 27.5, depth: 23, z: 4 }
  const board = mesh(
    new THREE.BoxGeometry(BOARD.width, 0.5, BOARD.depth),
    material(oklch(0.95, 0.014, 85), 0.95)
  )
  board.position.set(0, -0.25, BOARD.z)
  root.add(board)

  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.ShadowMaterial({ color: INK, opacity: 0.1 })
  )
  shadowCatcher.rotation.x = -Math.PI / 2
  shadowCatcher.position.y = -0.5
  shadowCatcher.receiveShadow = true
  root.add(shadowCatcher)

  /* Phase 1: foundation, terrace and the pool basin. */
  const slabs = boxes([
    {
      size: [X3 - X0 + 0.4, SLAB_TOP, ZF - ZB + 0.4],
      at: [(X0 + X3) / 2, SLAB_TOP / 2, (ZF + ZB) / 2],
    },
    {
      size: [X3 - X2 + 0.2, SLAB_TOP, ZR - ZF],
      at: [(X2 + X3) / 2 + 0.1, SLAB_TOP / 2, (ZR + ZF) / 2 + 0.2],
    },
  ])
  addRise(mesh(slabs, concrete), 0.03, 0.15, SLAB_TOP)
  ghostSources.push(slabs)

  const DECK = { x0: -10.4, x1: X2, z0: ZF + 0.2, z1: 12.2, top: 0.2 }
  const POOL = { x0: -8.8, x1: 0.2, z0: 8.3, z1: 11.2 }
  const deck = boxGeometry({
    size: [DECK.x1 - DECK.x0, DECK.top - 0.03, DECK.z1 - DECK.z0],
    at: [
      (DECK.x0 + DECK.x1) / 2,
      (DECK.top - 0.03) / 2,
      (DECK.z0 + DECK.z1) / 2,
    ],
  })
  addRise(mesh(deck, deckBase), 0.08, 0.17, DECK.top)
  ghostSources.push(deck)

  const PAVER = 1.2
  const paverSpecs: BoxSpec[] = []
  for (let x = DECK.x0 + PAVER / 2; x < DECK.x1; x += PAVER) {
    for (let z = DECK.z0 + PAVER / 2; z < DECK.z1; z += PAVER) {
      const inPool =
        x > POOL.x0 - 0.4 &&
        x < POOL.x1 + 0.4 &&
        z > POOL.z0 - 0.4 &&
        z < POOL.z1 + 0.4
      if (inPool) continue
      const width = Math.min(PAVER, DECK.x1 - x + PAVER / 2) - 0.018
      const depth = Math.min(PAVER, DECK.z1 - z + PAVER / 2) - 0.018
      paverSpecs.push({
        size: [width, 0.03, depth],
        at: [
          x - (PAVER - 0.018 - width) / 2,
          DECK.top - 0.015,
          z - (PAVER - 0.018 - depth) / 2,
        ],
      })
    }
  }
  const pavingStart = parts.length
  addRise(mesh(boxes(paverSpecs), stone), 0.11, 0.2, DECK.top)

  const POOL_W = POOL.x1 - POOL.x0
  const POOL_D = POOL.z1 - POOL.z0
  const POOL_CX = (POOL.x0 + POOL.x1) / 2
  const POOL_CZ = (POOL.z0 + POOL.z1) / 2
  const copingGeometry = boxes([
    {
      size: [POOL_W + 0.8, 0.05, 0.4],
      at: [POOL_CX, DECK.top + 0.015, POOL.z0 - 0.2],
    },
    {
      size: [POOL_W + 0.8, 0.05, 0.4],
      at: [POOL_CX, DECK.top + 0.015, POOL.z1 + 0.2],
    },
    {
      size: [0.4, 0.05, POOL_D],
      at: [POOL.x0 - 0.2, DECK.top + 0.015, POOL_CZ],
    },
    {
      size: [0.4, 0.05, POOL_D],
      at: [POOL.x1 + 0.2, DECK.top + 0.015, POOL_CZ],
    },
  ])
  addRise(mesh(copingGeometry, coping), 0.12, 0.2, DECK.top)
  ghostSources.push(copingGeometry)

  const basin = new THREE.Mesh(
    boxGeometry({
      size: [POOL_W, 0.02, POOL_D],
      at: [POOL_CX, DECK.top - 0.015, POOL_CZ],
    }),
    material(oklch(0.72, 0.05, 215), 0.7, 0, clipBoard)
  )
  addRise(basin, 0.12, 0.2, DECK.top)
  finishParts.push(...parts.slice(pavingStart))

  /* Phase 2: walls. They emerge from the slab, clipped at its top. */
  type Transform = { x?: number; z?: number; alongZ?: boolean }
  const addWall = (
    geometry: THREE.BufferGeometry,
    { x = 0, z = 0, alongZ = false }: Transform,
    start: number,
    height: number
  ) => {
    // A wall along z is drawn with its own x as world z, its depth towards -x.
    if (alongZ) geometry.rotateY(-Math.PI / 2)
    geometry.translate(x, 0, z)
    ghostSources.push(geometry)
    addRise(mesh(geometry, plaster), start, start + 0.12, height)
  }

  const S = SLAB_TOP + 0.04
  const livingProfile: Point[] = [
    [X0, SLAB_TOP],
    [X1, SLAB_TOP],
    [X1, PEAK],
    [X0, EAVE],
  ]
  const bedroomProfile: Point[] = [
    [X2, SLAB_TOP],
    [X3, SLAB_TOP],
    [X3, EAVE],
    [X2, PEAK],
  ]
  const OPENINGS = {
    living: [-9.2, -4.5],
    kitchen: [-3.25, -0.2],
    dining: [0.2, 2.15],
    entry: [2.5, 3.3],
    bedroomA: [4.6, 6.7],
    bedroomB: [7.1, 9.2],
  } as const
  const SIDE_WINDOWS = [-2.8, -0.2, 2.4] // Centres along the east wall.
  const SIDE_WIDTH = 1.5
  const BACK_WINDOWS = [-2.6, 1] // Left edges in the back of the centre.

  // Living wing: back, outer, inner, then the terrace front.
  addWall(wallGeometry(livingProfile, [], WALL), { z: ZB }, 0.2, PEAK)
  addWall(
    wallGeometry(rect(ZB, SLAB_TOP, ZF, EAVE), [], WALL),
    { x: X0 + WALL, alongZ: true },
    0.22,
    EAVE
  )
  addWall(
    wallGeometry(rect(ZB, SLAB_TOP, ZF, PEAK), [], WALL),
    { x: X1, alongZ: true },
    0.24,
    PEAK
  )
  addWall(
    wallGeometry(
      livingProfile,
      [rect(OPENINGS.living[0], S, OPENINGS.living[1], HEAD)],
      WALL
    ),
    { z: ZF - WALL },
    0.27,
    PEAK
  )

  // Bedroom wing.
  addWall(wallGeometry(bedroomProfile, [], WALL), { z: ZB }, 0.29, PEAK)
  addWall(
    wallGeometry(rect(ZB, SLAB_TOP, ZR, PEAK), [], WALL),
    { x: X2 + WALL, alongZ: true },
    0.3,
    PEAK
  )
  addWall(
    wallGeometry(
      rect(ZB, SLAB_TOP, ZR, EAVE),
      SIDE_WINDOWS.map((z) =>
        rect(z - SIDE_WIDTH / 2, S, z + SIDE_WIDTH / 2, HEAD)
      ),
      WALL
    ),
    { x: X3, alongZ: true },
    0.32,
    EAVE
  )
  addWall(
    wallGeometry(
      bedroomProfile,
      [
        rect(OPENINGS.bedroomA[0], S, OPENINGS.bedroomA[1], HEAD),
        rect(OPENINGS.bedroomB[0], S, OPENINGS.bedroomB[1], HEAD),
      ],
      WALL
    ),
    { z: ZR - WALL },
    0.35,
    PEAK
  )

  // Centre: back with two windows, terrace front mostly sliding glass.
  addWall(
    wallGeometry(
      rect(X1, SLAB_TOP, X2, EAVE),
      BACK_WINDOWS.map((x) => rect(x, 1, x + 1.6, 2.5)),
      WALL
    ),
    { z: ZB },
    0.36,
    EAVE
  )
  addWall(
    wallGeometry(
      rect(X1, SLAB_TOP, X2, EAVE),
      [
        rect(OPENINGS.kitchen[0], S, OPENINGS.kitchen[1], HEAD),
        rect(OPENINGS.dining[0], S, OPENINGS.dining[1], HEAD),
        rect(OPENINGS.entry[0], S, OPENINGS.entry[1], HEAD),
      ],
      WALL
    ),
    { z: ZF - WALL },
    0.38,
    EAVE
  )

  // Interior, seen later through the glass.
  const interiorStart = parts.length
  const floorY = SLAB_TOP + 0.015
  addRise(
    mesh(
      boxes([
        {
          size: [X3 - X0 - 0.2, 0.03, ZF - ZB - 0.2],
          at: [(X0 + X3) / 2, floorY, (ZF + ZB) / 2],
        },
        {
          size: [X3 - X2 - 0.2, 0.03, ZR - ZF],
          at: [(X2 + X3) / 2, floorY, (ZR + ZF) / 2],
        },
      ]),
      oakFloor
    ),
    0.2,
    0.26,
    0.05
  )
  addRise(
    mesh(
      boxes([
        // Partition behind the kitchen and bedroom, kitchen run, island.
        { size: [X2 - X1, 2.8, 0.15], at: [0, 1.7, -2] },
        { size: [X3 - X2, 2.8, 0.15], at: [(X2 + X3) / 2, 1.7, 0.4] },
        { size: [5.2, 2.2, 0.62], at: [-0.5, 1.4, -1.6] },
        { size: [2.7, 0.92, 0.95], at: [-1.7, 0.76, 0.6] },
        // Sofa in the living wing.
        { size: [3.2, 0.42, 1], at: [-7, 0.51, 0.6] },
        { size: [3.2, 0.5, 0.25], at: [-7, 0.92, 0.2] },
        // Bed in the bedroom wing.
        { size: [2, 0.5, 2.2], at: [7, 0.55, 2.3] },
      ]),
      interior
    ),
    0.3,
    0.42,
    3.2
  )
  addRise(
    mesh(
      boxes([
        { size: [2.8, 0.04, 1.05], at: [-1.7, 1.24, 0.6] },
        { size: [1.4, 0.05, 0.8], at: [-7, 0.67, 2.1] },
        { size: [2.2, 1.4, 0.1], at: [7, 1, 1.15] },
      ]),
      oak
    ),
    0.34,
    0.44,
    2
  )
  addRise(
    mesh(
      boxes([
        { size: [1, 0.22, 1], at: [-5.1, 0.45, 1.5] },
        { size: [3.8, 0.012, 2.8], at: [-7, floorY + 0.02, 1.6] },
      ]),
      fabric
    ),
    0.36,
    0.44,
    1
  )
  // The yellow chair of the dining room, and vertical blinds beside it.
  addRise(
    mesh(
      boxes([
        { size: [0.55, 0.08, 0.55], at: [0.7, 0.78, 1.8] },
        { size: [0.55, 0.6, 0.07], at: [0.7, 1.08, 1.53] },
        { size: [0.1, 0.42, 0.1], at: [0.7, 0.54, 1.8] },
      ]),
      accent
    ),
    0.38,
    0.46,
    1.4
  )
  const blindSpecs: BoxSpec[] = []
  for (let x = 1.4; x < OPENINGS.dining[1]; x += 0.11) {
    blindSpecs.push({
      size: [0.08, HEAD - S, 0.012],
      at: [x, (HEAD + S) / 2, ZF - WALL - 0.08],
      tilt: 0,
    })
  }
  addRise(mesh(boxes(blindSpecs), fabric), 0.4, 0.48, 3)
  // Pendants above the island.
  addRise(
    mesh(
      boxes(
        [-2.5, -1.7, -0.9].flatMap((x): BoxSpec[] => [
          { size: [0.02, 1.2, 0.02], at: [x, 2.65, 0.6] },
          { size: [0.2, 0.16, 0.2], at: [x, 2.05, 0.6] },
        ])
      ),
      dark
    ),
    0.42,
    0.5,
    3
  )

  finishParts.push(...parts.slice(interiorStart))

  /* Phase 3: roof. Rafters first, then each wing, then the tiled centre. */
  const wingRoof = (
    from: number,
    to: number,
    zBack: number,
    zFront: number
  ) => {
    // Runs from the peak at `from` down to the eave at `to`.
    const run = to - from
    const fall = EAVE - PEAK
    const length = Math.hypot(run, fall)
    const outward = Math.sign(run)
    // Local +x runs towards world +x, and local +y stays on the roof's top.
    const angle = Math.atan(fall / run)
    const depth = zFront - zBack + 0.3
    const overhang = { low: 0.4, high: 0.06 }
    const panelLength = length + overhang.low + overhang.high
    const slide = (overhang.low - overhang.high) / 2
    const place = (geometry: THREE.BufferGeometry) => {
      geometry.rotateZ(angle)
      geometry.translate(
        (from + to) / 2 + outward * slide * Math.cos(angle),
        (PEAK + EAVE) / 2 - slide * Math.abs(Math.sin(angle)) + 0.08,
        (zBack + zFront) / 2
      )
      return geometry
    }
    const seams: BoxSpec[] = []
    for (let z = -depth / 2 + 0.15; z < depth / 2; z += 0.6) {
      seams.push({ size: [panelLength - 0.3, 0.03, 0.035], at: [0, 0.085, z] })
    }
    const roof = place(
      boxes([
        { size: [panelLength, 0.14, depth], at: [0, 0, 0] },
        // The dark edge that outlines the white wall in the reference.
        { size: [panelLength, 0.3, 0.05], at: [0, -0.06, depth / 2 + 0.01] },
        { size: [panelLength, 0.3, 0.05], at: [0, -0.06, -depth / 2 - 0.01] },
        // Ridge cap along the peak.
        {
          size: [0.22, 0.2, depth + 0.1],
          at: [-outward * (panelLength / 2 - 0.08), 0.02, 0],
        },
        ...seams,
      ])
    )
    const rafters: BoxSpec[] = []
    for (let z = -depth / 2 + 0.3; z < depth / 2; z += 0.9) {
      rafters.push({ size: [length - 0.4, 0.14, 0.09], at: [0, -0.11, z] })
    }
    return { roof, rafters: place(boxes(rafters)) }
  }
  const living = wingRoof(X1, X0, ZB, ZF)
  const bedroom = wingRoof(X2, X3, ZB, ZR)

  const CENTRE_W = X2 - X1 - 0.04
  const RUN = (ZF - ZB) / 2
  const RISE = RIDGE - EAVE
  const PITCH = Math.atan2(RISE, RUN)
  const RIDGE_Z = (ZF + ZB) / 2
  const OVERHANG = 0.85
  const SLOPE_LENGTH = Math.hypot(RUN, RISE) + OVERHANG
  // The slope's middle, measured along the roof from the ridge.
  const slopeCentre = (side: 1 | -1) => {
    const half = SLOPE_LENGTH / 2
    return {
      y: RIDGE - half * Math.sin(PITCH),
      z: RIDGE_Z + side * half * Math.cos(PITCH),
    }
  }
  const slope = (side: 1 | -1) => {
    const specs: BoxSpec[] = [
      { size: [CENTRE_W, 0.1, SLOPE_LENGTH], at: [0, 0, 0] },
    ]
    const COURSE = 0.33
    const TILE = 0.3
    let row = 0
    for (
      let z = -SLOPE_LENGTH / 2 + COURSE / 2;
      z < SLOPE_LENGTH / 2;
      z += COURSE
    ) {
      if (lite) {
        // One strip per course: the joints between tiles are too fine to see.
        specs.push({
          size: [CENTRE_W, 0.05, COURSE + 0.03],
          at: [0, 0.075, z],
          tilt: side * 0.045,
        })
        row++
        continue
      }
      const offset = row % 2 === 0 ? 0 : TILE / 2
      for (
        let x = -CENTRE_W / 2 + TILE / 2 - offset;
        x < CENTRE_W / 2;
        x += TILE
      ) {
        const left = Math.max(x - TILE / 2, -CENTRE_W / 2)
        const right = Math.min(x + TILE / 2 - 0.005, CENTRE_W / 2)
        if (right <= left) continue
        specs.push({
          size: [right - left, 0.05, COURSE + 0.03],
          at: [(left + right) / 2, 0.075, z],
          tilt: side * 0.045,
        })
      }
      row++
    }
    const geometry = boxes(specs)
    geometry.rotateX(side * PITCH)
    const centre = slopeCentre(side)
    geometry.translate((X1 + X2) / 2, centre.y + 0.1, centre.z)
    return geometry
  }
  const rafterSpecs: BoxSpec[] = []
  for (let x = X1 + 0.5; x < X2; x += 0.9) {
    for (const side of [1, -1] as const) {
      const centre = slopeCentre(side)
      rafterSpecs.push({
        size: [0.1, 0.15, SLOPE_LENGTH - 0.5],
        at: [x, centre.y, centre.z],
        tilt: side * PITCH,
      })
    }
  }
  addDrop(
    mergeGeometries([boxes(rafterSpecs), living.rafters, bedroom.rafters]),
    material(oklch(0.72, 0.07, 72), 0.75),
    0.5,
    0.6
  )
  addDrop(living.roof, metalRoof(), 0.56, 0.64)
  addDrop(bedroom.roof, metalRoof(), 0.6, 0.68)
  addDrop(slope(-1), tile(), 0.63, 0.7)
  addDrop(slope(1), tile(), 0.67, 0.75)

  const front = slopeCentre(1)
  const eaveY = front.y - (SLOPE_LENGTH / 2) * Math.sin(PITCH) + 0.08
  const eaveZ = front.z + (SLOPE_LENGTH / 2) * Math.cos(PITCH)
  const eaveGeometry = boxes([
    // Fascia and gutter along the front eave, with the downpipe at its end.
    { size: [CENTRE_W, 0.3, 0.1], at: [0, eaveY - 0.08, eaveZ] },
    { size: [CENTRE_W, 0.12, 0.16], at: [0, eaveY - 0.16, eaveZ + 0.11] },
    { size: [0.09, eaveY - 0.25, 0.09], at: [3.5, eaveY / 2, ZF + 0.08] },
  ])
  eaveGeometry.translate((X1 + X2) / 2, 0, 0)
  addDrop(eaveGeometry, material(oklch(0.34, 0.006, 60), 0.5, 0.2), 0.7, 0.76)
  ghostSources.push(
    boxGeometry({
      size: [CENTRE_W, 0.1, SLOPE_LENGTH],
      at: [(X1 + X2) / 2, slopeCentre(1).y + 0.1, slopeCentre(1).z],
      tilt: PITCH,
    }),
    boxGeometry({
      size: [CENTRE_W, 0.1, SLOPE_LENGTH],
      at: [(X1 + X2) / 2, slopeCentre(-1).y + 0.1, slopeCentre(-1).z],
      tilt: -PITCH,
    })
  )

  /* Phase 4: frames, glass, light, then the garden. */
  const frameSpecs: BoxSpec[] = []
  const glassSpecs: BoxSpec[] = []
  const BAR = 0.06
  const REVEAL = 0.16
  const glazeAlongX = (
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    z: number,
    panels: number
  ) => {
    const width = x1 - x0
    const midX = (x0 + x1) / 2
    const midY = (y0 + y1) / 2
    frameSpecs.push(
      { size: [width, BAR, 0.09], at: [midX, y0 + BAR / 2, z] },
      { size: [width, BAR, 0.09], at: [midX, y1 - BAR / 2, z] }
    )
    for (let i = 0; i <= panels; i++) {
      const x = Math.min(
        x1 - BAR / 2,
        Math.max(x0 + BAR / 2, x0 + (width * i) / panels)
      )
      frameSpecs.push({ size: [BAR, y1 - y0, 0.09], at: [x, midY, z] })
    }
    glassSpecs.push({ size: [width, y1 - y0, 0.015], at: [midX, midY, z] })
  }
  const glazeAlongZ = (
    z0: number,
    z1: number,
    y0: number,
    y1: number,
    x: number
  ) => {
    const depth = z1 - z0
    const midZ = (z0 + z1) / 2
    const midY = (y0 + y1) / 2
    frameSpecs.push(
      { size: [0.09, BAR, depth], at: [x, y0 + BAR / 2, midZ] },
      { size: [0.09, BAR, depth], at: [x, y1 - BAR / 2, midZ] },
      { size: [0.09, y1 - y0, BAR], at: [x, midY, z0 + BAR / 2] },
      { size: [0.09, y1 - y0, BAR], at: [x, midY, z1 - BAR / 2] }
    )
    glassSpecs.push({ size: [0.015, y1 - y0, depth], at: [x, midY, midZ] })
  }
  const FRONT_Z = ZF - REVEAL
  glazeAlongX(...OPENINGS.living, S, HEAD, FRONT_Z, 3)
  glazeAlongX(...OPENINGS.kitchen, S, HEAD, FRONT_Z, 2)
  glazeAlongX(...OPENINGS.dining, S, HEAD, FRONT_Z, 2)
  glazeAlongX(...OPENINGS.entry, S, HEAD, FRONT_Z, 1)
  glazeAlongX(...OPENINGS.bedroomA, S, HEAD, ZR - REVEAL, 2)
  glazeAlongX(...OPENINGS.bedroomB, S, HEAD, ZR - REVEAL, 2)
  SIDE_WINDOWS.forEach((z) =>
    glazeAlongZ(z - SIDE_WIDTH / 2, z + SIDE_WIDTH / 2, S, HEAD, X3 - REVEAL)
  )
  BACK_WINDOWS.forEach((x) => glazeAlongX(x, x + 1.6, 1, 2.5, ZB + REVEAL, 1))
  const frames = boxes(frameSpecs)
  const framesStart = parts.length
  addRise(mesh(frames, frame), 0.75, 0.84, 3.2)
  finishParts.push(...parts.slice(framesStart))
  ghostSources.push(frames)

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: oklch(0.82, 0.03, 230),
    metalness: 0.6,
    roughness: 0.05,
    transparent: true,
    opacity: 0,
    envMapIntensity: 1.5,
    depthWrite: false,
  })
  const glass = new THREE.Mesh(boxes(glassSpecs), glassMaterial)
  glass.renderOrder = 2
  root.add(glass)
  parts.push({
    object: new THREE.Group(),
    kind: "fade",
    start: 0.8,
    end: 0.92,
    travel: 0,
    materials: [glassMaterial],
    opacity: 0.16,
  })

  // Pale gravel over the board, and the water in the pool.
  const gravelMap = gravelTexture(lite)
  gravelMap.repeat.set(7, 6)
  const gravelMaterial = new THREE.MeshStandardMaterial({
    map: gravelMap,
    roughness: 1,
    transparent: true,
    opacity: 0,
  })
  const gravel = new THREE.Mesh(
    new THREE.PlaneGeometry(BOARD.width, BOARD.depth),
    gravelMaterial
  )
  gravel.rotation.x = -Math.PI / 2
  gravel.position.set(0, 0.004, BOARD.z)
  gravel.receiveShadow = true
  root.add(gravel)
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: oklch(0.74, 0.07, 215),
    roughness: 0.3,
    metalness: 0.1,
    envMapIntensity: 1.6,
    transparent: true,
    opacity: 0,
  })
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(POOL_W, POOL_D),
    waterMaterial
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(POOL_CX, DECK.top + 0.01, POOL_CZ)
  water.receiveShadow = true
  root.add(water)
  parts.push(
    {
      object: new THREE.Group(),
      kind: "fade",
      start: 0.78,
      end: 0.88,
      travel: 0,
      materials: [gravelMaterial],
      opacity: 1,
    },
    {
      object: new THREE.Group(),
      kind: "fade",
      start: 0.82,
      end: 0.92,
      travel: 0,
      materials: [waterMaterial],
      opacity: 1,
    }
  )

  // White loungers beside the pool.
  const loungerMaterial = material(oklch(0.97, 0.003, 90), 0.7)
  const lounger = () => {
    const seat = boxGeometry({ size: [0.7, 0.1, 1.5], at: [0, 0.42, 0.25] })
    const back = boxGeometry({
      size: [0.7, 0.1, 0.8],
      at: [0, 0.6, -0.8],
      tilt: 0.55,
    })
    return mesh(mergeGeometries([seat, back]), loungerMaterial)
  }
  ;[1.3, 2.5].forEach((x, i) => addGrow(lounger(), x, 9.6, 0.86 + i * 0.01))

  // Slender thujas and low shrubs, as in the reference garden.
  const foliage = (l: number, c: number, h: number) => {
    const leaf = material(oklch(l, c, h), 0.95)
    leaf.vertexColors = true
    return leaf
  }
  const thujaMaterial = foliage(0.5, 0.085, 140)
  const thujaLight = foliage(0.55, 0.09, 132)
  const shrubMaterial = foliage(0.6, 0.075, 128)
  const shrubWarm = foliage(0.46, 0.05, 30)
  const olive = foliage(0.64, 0.05, 130)
  const addThuja = (
    x: number,
    z: number,
    height: number,
    seed: number,
    start: number
  ) => {
    const plant = mesh(
      foliageGeometry(height, height * 0.17, seed, thujaProfile, lite),
      seed % 2 === 0 ? thujaMaterial : thujaLight
    )
    addGrow(plant, x, z, start)
  }
  const addShrub = (
    x: number,
    z: number,
    size: number,
    seed: number,
    mat: THREE.MeshStandardMaterial,
    start: number
  ) => {
    const plant = mesh(
      foliageGeometry(size, size * 0.72, seed, shrubProfile, lite),
      mat
    )
    addGrow(plant, x, z, start)
  }
  // A dark hedge line behind the house, so that the white walls stand out.
  ;[-11.6, -9.9, -8.2, -6.5, -4.8, 5.2, 6.9, 8.6, 10.3, 12].forEach((x, i) =>
    addThuja(x, -6.3, 7.4 - (i % 3) * 0.7, 30 + i, 0.84 + (i % 4) * 0.01)
  )
  addThuja(-12.3, 1.8, 5.2, 4, 0.85)
  addThuja(-12.4, 8.4, 3.8, 6, 0.87)
  addThuja(12.6, 3.4, 4.8, 7, 0.87)
  addThuja(12.8, 8.6, 3.6, 9, 0.88)
  addShrub(5.1, 8.5, 1.05, 11, shrubMaterial, 0.87)
  addShrub(6.5, 8.1, 0.7, 12, shrubWarm, 0.88)
  addShrub(8.6, 7.6, 0.9, 14, shrubMaterial, 0.89)
  addShrub(10.3, 8.4, 0.7, 15, shrubWarm, 0.89)
  addShrub(7.2, 12.6, 1, 17, shrubMaterial, 0.9)
  addShrub(-3.6, 13.6, 0.8, 18, shrubMaterial, 0.9)
  addShrub(-7.6, 13.9, 0.6, 19, shrubWarm, 0.9)

  const oliveTree = new THREE.Group()
  const oliveTrunk = mesh(
    new THREE.CylinderGeometry(0.05, 0.08, 1.2, 8),
    material(oklch(0.48, 0.02, 60), 0.9)
  )
  oliveTrunk.position.y = 0.6
  const oliveCrown = mesh(
    foliageGeometry(1.5, 0.95, 21, shrubProfile, lite),
    olive
  )
  oliveCrown.position.y = 1
  oliveTree.add(oliveTrunk, oliveCrown)
  addGrow(oliveTree, 11.2, 11.8, 0.88)

  /* The drawing: every edge of the finished house, plus dimension lines. */
  const edges: THREE.BufferGeometry[] = ghostSources.map(
    (geometry) => new THREE.EdgesGeometry(geometry, 25)
  )
  const tick = 0.35
  const dimension = (points: number[]) => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    )
    return geometry
  }
  edges.push(
    dimension(
      [
        // Along the front of the site.
        [X0, 14, X3, 14],
        [X0, 14 - tick, X0, 14 + tick],
        [X1, 14 - tick, X1, 14 + tick],
        [X2, 14 - tick, X2, 14 + tick],
        [X3, 14 - tick, X3, 14 + tick],
        // Along the side of the site.
        [12.3, ZB, 12.3, ZR],
        [12.3 - tick, ZB, 12.3 + tick, ZB],
        [12.3 - tick, ZF, 12.3 + tick, ZF],
        [12.3 - tick, ZR, 12.3 + tick, ZR],
      ].flatMap(([x0, z0, x1, z1]) => [x0, 0.01, z0, x1, 0.01, z1])
    )
  )
  const ghostMaterial = new THREE.LineBasicMaterial({
    color: INK,
    transparent: true,
    opacity: 0.62,
  })
  const ghost = new THREE.LineSegments(mergeGeometries(edges), ghostMaterial)
  root.add(ghost)

  /* Bright morning sun, low and from the left of the terrace. */
  const sun = new THREE.DirectionalLight(oklch(0.995, 0.006, 85), LIGHT.sun[0])
  sun.position.set(-14, 26, 34)
  sun.castShadow = true
  sun.shadow.mapSize.setScalar(lite ? 1024 : 2048)
  sun.shadow.camera.left = -30
  sun.shadow.camera.right = 30
  sun.shadow.camera.top = 26
  sun.shadow.camera.bottom = -26
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 110
  sun.shadow.radius = 4
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.03
  root.add(sun, sun.target)

  const hemisphere = new THREE.HemisphereLight(
    oklch(0.98, 0.006, 85),
    oklch(0.93, 0.003, 85),
    LIGHT.sky[0]
  )
  root.add(hemisphere)

  const interiorLights = (
    [
      [-1.5, 2.6, 0.5, 11],
      [-7, 3, 0.5, 10],
      [7, 3, 2.5, 8],
    ] as const
  )
    .slice(0, lite ? 1 : undefined)
    .map(([x, y, z, power]) => {
      const light = new THREE.PointLight(WARM_LIGHT, 0, 10, 1.6)
      light.position.set(x, y, z)
      light.userData.power = power
      root.add(light)
      return light
    })

  const warmSurfaces = [interior, oakFloor, fabric]
  warmSurfaces.forEach((surface) => {
    surface.emissive = WARM_LIGHT.clone()
    surface.emissiveIntensity = 0
  })

  return {
    root,
    parts,
    finishParts,
    ghostMaterial,
    skyMaterial,
    // On phones the house sits directly under the header, on the page's beige.
    hasSky: !lite,
    sun,
    hemisphere,
    interiorLights,
    warmSurfaces,
    dispose() {
      root.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.LineSegments
        ) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          materials.forEach((item) => item.dispose())
        }
      })
      gravelMap.dispose()
      sun.shadow.map?.dispose()
    },
  }
}

/** Light levels as [before the windows go in, finished house]. */
const LIGHT = {
  sun: [2.5, 3],
  sky: [1.2, 1.3],
  environment: [0.85, 0.95],
} as const

export function applyProgress(house: House, scene: THREE.Scene, p: number) {
  for (const part of house.parts) {
    const t = easeOut(window01(p, part.start, part.end))
    switch (part.kind) {
      case "rise":
        part.object.visible = t > 0
        part.object.position.y = -part.travel * (1 - t)
        break
      case "drop":
        part.object.visible = t > 0
        part.object.position.y = part.travel * (1 - t)
        part.materials.forEach((item) => {
          item.opacity = t
          item.transparent = t < 1
          item.depthWrite = t > 0.5
        })
        break
      case "fade":
        part.materials.forEach((item) => {
          item.opacity = part.opacity * t
        })
        break
      case "grow":
        part.object.visible = t > 0
        part.object.scale.setScalar(Math.max(t, 0.001))
        break
    }
  }

  house.ghostMaterial.opacity = 0.62 * (1 - smooth(window01(p, 0.55, 0.86)))
  house.ghostMaterial.visible = house.ghostMaterial.opacity > 0.001

  // The day brightens and the sky warms as the house is finished.
  const day = smooth(window01(p, 0.72, 1))
  house.skyMaterial.uniforms.uMix.value = house.hasSky ? day : 0
  house.sun.intensity = lerp(...LIGHT.sun, day)
  house.hemisphere.intensity = lerp(...LIGHT.sky, day)
  scene.environmentIntensity = lerp(...LIGHT.environment, day)
  house.interiorLights.forEach((light) => {
    light.intensity = (light.userData.power as number) * day
  })
  house.warmSurfaces.forEach((surface) => {
    surface.emissiveIntensity = 0.3 * day
  })
}

/** Strips the house back to a shell. Only the stills use this. */
export function showShell(house: House) {
  house.finishParts.forEach((part) => {
    part.object.visible = false
  })
  house.ghostMaterial.visible = false
}

export type CameraPose = {
  azimuth: number
  elevation: number
  distance: number
  target: [number, number, number]
  /** Lens shift in a 1500 x 1000 frame. Negative moves the subject right. */
  shiftX: number
  shiftY: number
}

const POSE_START: CameraPose = {
  azimuth: 56,
  elevation: 30,
  distance: 116,
  target: [0, 1, 4],
  shiftX: -275,
  shiftY: 0,
}

const POSE_END: CameraPose = {
  azimuth: 12,
  elevation: 7,
  distance: 60,
  target: [0, 2.3, 4],
  shiftX: 0,
  shiftY: -15,
}

/** Phones: nothing to clear for text, and the house seen from higher up. */
const POSE_START_COMPACT: CameraPose = {
  azimuth: 50,
  elevation: 34,
  distance: 118,
  target: [0, 0.6, 4],
  shiftX: 0,
  shiftY: 0,
}

const POSE_END_COMPACT: CameraPose = {
  azimuth: 16,
  elevation: 15,
  distance: 91,
  target: [0.5, 2.2, 4.4],
  shiftX: 0,
  shiftY: 0,
}

/** The poses above fit this canvas shape. Narrower ones move the camera back. */
const COMPACT_ASPECT = 0.8

export function poseAt(p: number, compact = false): CameraPose {
  const start = compact ? POSE_START_COMPACT : POSE_START
  const end = compact ? POSE_END_COMPACT : POSE_END
  const t = smooth(p)
  const shift = smooth(window01(p, 0, 0.3))
  return {
    azimuth: lerp(start.azimuth, end.azimuth, t),
    elevation: lerp(start.elevation, end.elevation, t),
    distance: lerp(start.distance, end.distance, t),
    target: [
      lerp(start.target[0], end.target[0], t),
      lerp(start.target[1], end.target[1], t),
      lerp(start.target[2], end.target[2], t),
    ],
    shiftX: lerp(start.shiftX, end.shiftX, shift),
    shiftY: lerp(start.shiftY, end.shiftY, shift),
  }
}

export function applyPose(
  camera: THREE.Camera,
  pose: CameraPose,
  compact = false
) {
  if (!(camera instanceof THREE.PerspectiveCamera)) return
  const distance = compact
    ? pose.distance * Math.max(1, COMPACT_ASPECT / camera.aspect)
    : pose.distance
  const azimuth = (pose.azimuth * Math.PI) / 180
  const elevation = (pose.elevation * Math.PI) / 180
  const [x, y, z] = pose.target
  camera.position.set(
    x + distance * Math.sin(azimuth) * Math.cos(elevation),
    y + distance * Math.sin(elevation),
    z + distance * Math.cos(azimuth) * Math.cos(elevation)
  )
  camera.lookAt(x, y, z)
  // A view offset also fixes the camera's shape, here to the stage's 3:2. Phone
  // canvases have their own shape and need no offset, so they leave it alone.
  if (!compact) {
    camera.setViewOffset(1500, 1000, pose.shiftX, pose.shiftY, 1500, 1000)
  }
}

const DETAIL_POSE: CameraPose = {
  azimuth: 20,
  elevation: 4,
  distance: 31,
  target: [0.6, 2.9, 2],
  shiftX: 0,
  shiftY: 0,
}

/** Stills rendered by scripts/render-stills.mjs. Development only. */
export const SHOTS: Record<
  string,
  { progress: number; pose: CameraPose; shell?: boolean }
> = {
  "hero-plan": { progress: 0, pose: poseAt(0) },
  "hero-finished": { progress: 1, pose: poseAt(1) },
  "hero-plan-phone": { progress: 0, pose: poseAt(0, true) },
  "hero-compact": {
    progress: 1,
    pose: {
      azimuth: 12,
      elevation: 8,
      distance: 45,
      target: [0.2, 3.2, 4.5],
      shiftX: 0,
      shiftY: 0,
    },
  },
  "detail-gable": { progress: 1, pose: DETAIL_POSE },
  // Same camera as detail-gable: the two are swapped in the same frame.
  "detail-shell": { progress: 0.765, shell: true, pose: DETAIL_POSE },
}
