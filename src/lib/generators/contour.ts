import { GeneratorContext, GeneratedLayer } from "./types"
import { createPRNG } from "./prng"
import { pointsToSmoothPath, Point } from "./spline"
import { safeNum } from "./sanitize"
import { samplePalette } from "./colors"

/**
 * Continuous 2D Value Noise Generator with Smooth Hermite Interpolation
 */
function createNoise2D(seed: number) {
  const prng = createPRNG(seed)
  const size = 32
  const grid: number[][] = []
  for (let y = 0; y <= size; y++) {
    const row: number[] = []
    for (let x = 0; x <= size; x++) {
      row.push(prng.range(-1, 1))
    }
    grid.push(row)
  }

  function smoothStep(t: number): number {
    return t * t * (3 - 2 * t)
  }

  return function sampleNoise(nx: number, ny: number): number {
    const x = Math.abs(nx * (size - 1))
    const y = Math.abs(ny * (size - 1))

    const x0 = Math.floor(x) % (size - 1)
    const y0 = Math.floor(y) % (size - 1)
    const x1 = x0 + 1
    const y1 = y0 + 1

    const sx = smoothStep(x - Math.floor(x))
    const sy = smoothStep(y - Math.floor(y))

    const n00 = grid[y0][x0]
    const n10 = grid[y0][x1]
    const n01 = grid[y1][x0]
    const n11 = grid[y1][x1]

    const ix0 = n00 + sx * (n10 - n00)
    const ix1 = n01 + sx * (n11 - n01)

    return ix0 + sy * (ix1 - ix0)
  }
}

/**
 * Unique global edge identifier for Marching Squares graph topology
 */
function edgeId(type: "H" | "V", i: number, j: number): string {
  return `${type}:${i}:${j}`
}

/**
 * Calculate Euclidean polyline length for filtering noise specks
 */
function polylineLength(pts: Point[]): number {
  let len = 0
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  }
  return len
}

/**
 * Distance from point (px, py) to a quadratic Bezier curve spine
 */
function distToSpine(
  px: number,
  py: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { dist: number; t: number } {
  let minDist = Infinity
  let bestT = 0
  for (let s = 0; s <= 12; s++) {
    const t = s / 12
    const it = 1 - t
    const bx = it * it * x0 + 2 * it * t * x1 + t * t * x2
    const by = it * it * y0 + 2 * it * t * y1 + t * t * y2
    const d = Math.hypot(px - bx, py - by)
    if (d < minDist) {
      minDist = d
      bestT = t
    }
  }
  return { dist: minDist, t: bestT }
}

/**
 * Premium Topographic Map Contour Generator (Contour 2.3 — Final Polish)
 *
 * Visual Characteristics:
 * - Three-Scale Terrain Hierarchy:
 *   1-2 dominant primary macro formations (e.g. diagonal alpine crest spine, commanding monolith massif)
 *   + 3-5 secondary formations (branching lateral spurs, mountain passes, mesas, and valley basins)
 *   + subtle tertiary undulation for natural imperfection without high-frequency noise.
 * - Intentional Geological Composition:
 *   Structures formations along authentic geological spines and fault lines rather than random blobs.
 * - Slope-Responsive Cartographic Spacing:
 *   Steep mountain flanks compress contours into tight, crisp parallel lines, while gentle
 *   plateaus and valley corridors spread contours spaciously with generous negative space.
 * - Subtle Cartographic Line Hierarchy:
 *   Index contours (every 4th level or summit) are rendered with distinct crispness (1.85px)
 *   over intermediate contours (1.15px) with elevated luminance mapping.
 * - Isotropic Metric Scaling:
 *   Preserves uncompressed proportions across mobile portrait (1080x2406) and landscape displays.
 *
 * Parameter Mappings:
 * - Layer Count: Controls number of elevation/contour levels (7 to 20 levels).
 * - Height / Amplitude: Controls terrain relief steepness and level separation.
 * - Spacing / Frequency: Controls horizontal scale and size of major landforms.
 * - Smoothness: Controls contour curvature tension and softens angular transitions.
 */
export function generateContour(ctx: GeneratorContext): GeneratedLayer[] {
  const { width: w, height: h, config, paletteColors } = ctx
  const { layerCount, height: heightParam, spacing: spacingParam, smoothness } = config.parameters
  const { seed } = config.advanced

  const prng = createPRNG(seed)
  const minDim = Math.min(w, h)
  const scale = minDim / 1080

  // Aspect-corrected metric coordinate space: preserves true geometric shapes across portrait & landscape
  const normW = w / minDim
  const normH = h / minDim

  const gridStep = 0.026
  const nx = Math.max(28, Math.round(normW / gridStep))
  const ny = Math.max(28, Math.round(normH / gridStep))

  const freq = 0.28 + (1 - spacingParam / 100) * 0.36
  const tension = Math.max(50, Math.min(82, 54 + smoothness * 0.28))

  // Select Geological Composition Archetype
  // 0: Alpine Crest & Fault Valley
  // 1: Sinuous Canyon & Twin Massifs
  // 2: Dominant Monolith Massif with Radiating Ridge Spurs & Caldera
  // 3: Step-Terraced Plateau & Monocline Escarpment
  const archetype = prng.int(0, 3)
  const flip = prng.bool(0.5)

  // Procedural noise fields
  const nMacro = createNoise2D(seed)
  const nWarpX = createNoise2D(seed + 1013)
  const nWarpY = createNoise2D(seed + 2027)
  const nSecondary = createNoise2D(seed + 3041)
  const warpStrength = 0.075 * (1 - (smoothness / 100) * 0.3)

  // Archetype 0 params (Alpine Crest & Fault Valley)
  const r0Start = { x: (flip ? 0.85 : 0.15) * normW, y: prng.range(0.1, 0.32) * normH }
  const r0End = { x: (flip ? 0.15 : 0.85) * normW, y: prng.range(0.68, 0.92) * normH }
  const r0Ctrl = {
    x: (r0Start.x + r0End.x) * 0.5 + (flip ? -0.22 : 0.22) * normW,
    y: (r0Start.y + r0End.y) * 0.5 + prng.range(-0.15, 0.15) * normH,
  }
  const r0Width = prng.range(0.3, 0.42)
  const r0Amp = prng.range(1.5, 1.85)

  const r0BranchT = prng.range(0.4, 0.6)
  const itB = 1 - r0BranchT
  const r0SpurStart = {
    x:
      itB * itB * r0Start.x +
      2 * itB * r0BranchT * r0Ctrl.x +
      r0BranchT * r0BranchT * r0End.x,
    y:
      itB * itB * r0Start.y +
      2 * itB * r0BranchT * r0Ctrl.y +
      r0BranchT * r0BranchT * r0End.y,
  }
  const r0SpurEnd = {
    x: (flip ? 0.95 : 0.05) * normW,
    y: r0SpurStart.y + prng.range(0.15, 0.35) * normH,
  }
  const r0SpurCtrl = {
    x: (r0SpurStart.x + r0SpurEnd.x) * 0.5 + (flip ? 0.1 : -0.1) * normW,
    y: (r0SpurStart.y + r0SpurEnd.y) * 0.5,
  }

  const m0 = {
    cx: (flip ? 0.25 : 0.75) * normW,
    cy: prng.range(0.2, 0.42) * normH,
    rx: prng.range(0.36, 0.5),
    ry: prng.range(0.26, 0.38),
    amp: prng.range(1.2, 1.55),
    h: prng.range(0.08, 0.16),
    p: prng.range(0, Math.PI * 2),
  }
  const b0 = {
    cx: (flip ? 0.7 : 0.3) * normW,
    cy: prng.range(0.5, 0.72) * normH,
    rx: 0.36,
    ry: 0.26,
    amp: -0.65,
  }
  const s0Lower = {
    cx: prng.range(0.3, 0.7) * normW,
    cy: prng.range(0.78, 0.95) * normH,
    rx: 0.38,
    ry: 0.25,
    amp: 0.9,
  }

  // Archetype 1 params (Sinuous Canyon & Twin Massifs)
  const c1Canyon = {
    midX: 0.5 * normW,
    ampX: 0.24 * normW,
    width: 0.35,
  }
  const m1A = {
    cx: (flip ? 0.22 : 0.78) * normW,
    cy: 0.28 * normH,
    rx: 0.44,
    ry: 0.32,
    amp: 1.55,
    h: 0.12,
    p: 0.8,
  }
  const m1B = {
    cx: (flip ? 0.78 : 0.22) * normW,
    cy: 0.72 * normH,
    rx: 0.46,
    ry: 0.35,
    amp: 1.45,
    h: 0.1,
    p: 2.1,
  }
  const s1Mid = { cx: 0.5 * normW, cy: 0.5 * normH, rx: 0.28, ry: 0.2, amp: 0.8 }
  const b1A = {
    cx: (flip ? 0.75 : 0.25) * normW,
    cy: 0.22 * normH,
    rx: 0.3,
    ry: 0.22,
    amp: -0.55,
  }

  // Archetype 2 params (Monolith Massif with Radiating Ridge Spurs & Caldera)
  const m2Center = {
    cx: (flip ? 0.35 : 0.65) * normW,
    cy: prng.range(0.32, 0.45) * normH,
    rx: prng.range(0.48, 0.65),
    ry: prng.range(0.38, 0.52),
    amp: 1.8,
    h: 0.14,
    p: prng.range(0, Math.PI * 2),
  }
  const s2A = {
    x0: m2Center.cx,
    y0: m2Center.cy,
    x1: m2Center.cx + (flip ? 0.35 : -0.35) * normW,
    y1: m2Center.cy + 0.25 * normH,
    x2: (flip ? 0.85 : 0.15) * normW,
    y2: prng.range(0.7, 0.95) * normH,
    width: 0.32,
    amp: 1.25,
  }
  const s2B = {
    x0: m2Center.cx,
    y0: m2Center.cy,
    x1: m2Center.cx + (flip ? -0.25 : 0.25) * normW,
    y1: m2Center.cy - 0.2 * normH,
    x2: (flip ? 0.1 : 0.9) * normW,
    y2: 0.12 * normH,
    width: 0.28,
    amp: 1.05,
  }
  const cald2 = {
    cx: m2Center.cx + (flip ? 0.3 : -0.3) * normW,
    cy: m2Center.cy + 0.05 * normH,
    rx: 0.32,
    ry: 0.24,
    amp: -0.75,
  }
  const foot2 = {
    cx: (flip ? 0.3 : 0.7) * normW,
    cy: prng.range(0.75, 0.92) * normH,
    rx: 0.38,
    ry: 0.26,
    amp: 0.95,
  }

  // Archetype 3 params (Step-Terraced Plateau & Monocline Escarpment)
  const f3Angle = prng.range(-0.35, 0.35)
  const f3Cos = Math.cos(f3Angle)
  const f3Sin = Math.sin(f3Angle)
  const m3A = {
    cx: (flip ? 0.28 : 0.72) * normW,
    cy: 0.24 * normH,
    rx: 0.46,
    ry: 0.34,
    amp: 1.45,
    h: 0.12,
    p: 1.0,
  }
  const m3B = {
    cx: (flip ? 0.72 : 0.28) * normW,
    cy: 0.52 * normH,
    rx: 0.44,
    ry: 0.32,
    amp: 1.35,
    h: 0.1,
    p: 2.2,
  }
  const m3C = {
    cx: 0.45 * normW,
    cy: 0.8 * normH,
    rx: 0.42,
    ry: 0.3,
    amp: 1.25,
    h: 0.08,
    p: 0.5,
  }
  const b3Pass = { cx: 0.5 * normW, cy: 0.38 * normH, rx: 0.32, ry: 0.2, amp: -0.55 }

  const field: number[][] = []
  let minVal = Infinity
  let maxVal = -Infinity

  for (let j = 0; j <= ny; j++) {
    const row: number[] = []
    const v = (j / ny) * normH
    for (let i = 0; i <= nx; i++) {
      const u = (i / nx) * normW

      const wx = u + nWarpX(u * freq, v * freq) * warpStrength
      const wy = v + nWarpY(u * freq, v * freq) * warpStrength

      let macroZ = 0

      if (archetype === 0) {
        // Alpine Crest & Fault Valley
        const { dist: rDist, t: rT } = distToSpine(
          wx,
          wy,
          r0Start.x,
          r0Start.y,
          r0Ctrl.x,
          r0Ctrl.y,
          r0End.x,
          r0End.y
        )
        const spineProf =
          0.75 + 0.35 * Math.sin(rT * Math.PI) + 0.2 * Math.cos(rT * Math.PI * 2)
        const zRidge = r0Amp * spineProf * Math.exp(-Math.pow(rDist / r0Width, 2) * 2.1)

        const { dist: spurDist, t: spurT } = distToSpine(
          wx,
          wy,
          r0SpurStart.x,
          r0SpurStart.y,
          r0SpurCtrl.x,
          r0SpurCtrl.y,
          r0SpurEnd.x,
          r0SpurEnd.y
        )
        const zSpur = 1.1 * (1 - spurT * 0.4) * Math.exp(-Math.pow(spurDist / 0.28, 2) * 2.2)

        const mDx = wx - m0.cx
        const mDy = wy - m0.cy
        const mTh = Math.atan2(mDy, mDx)
        const mRad = 1 + m0.h * Math.cos(2 * mTh + m0.p)
        const zMassif =
          m0.amp *
          Math.exp(
            -(
              Math.pow(mDx / (m0.rx * mRad), 2) + Math.pow(mDy / (m0.ry * mRad), 2)
            ) * 1.7
          )

        const zBasin =
          b0.amp *
          Math.exp(
            -(
              Math.pow((wx - b0.cx) / b0.rx, 2) + Math.pow((wy - b0.cy) / b0.ry, 2)
            ) * 2.2
          )
        const zLower =
          s0Lower.amp *
          Math.exp(
            -(
              Math.pow((wx - s0Lower.cx) / s0Lower.rx, 2) +
              Math.pow((wy - s0Lower.cy) / s0Lower.ry, 2)
            ) * 1.8
          )

        macroZ = zRidge + zSpur + zMassif + zBasin + zLower
      } else if (archetype === 1) {
        // Sinuous Canyon & Twin Massifs
        const canyonCenter =
          c1Canyon.midX + Math.sin((wy / normH) * Math.PI * 1.8) * c1Canyon.ampX
        const dCanyon = Math.abs(wx - canyonCenter)
        const zCanyon = Math.min(1.4, Math.pow(dCanyon / c1Canyon.width, 1.45))

        const dA = Math.pow((wx - m1A.cx) / m1A.rx, 2) + Math.pow((wy - m1A.cy) / m1A.ry, 2)
        const dB = Math.pow((wx - m1B.cx) / m1B.rx, 2) + Math.pow((wy - m1B.cy) / m1B.ry, 2)
        const zMesas = m1A.amp * Math.exp(-dA * 1.65) + m1B.amp * Math.exp(-dB * 1.65)

        const zMid =
          s1Mid.amp *
          Math.exp(
            -(
              Math.pow((wx - s1Mid.cx) / s1Mid.rx, 2) +
              Math.pow((wy - s1Mid.cy) / s1Mid.ry, 2)
            ) * 2.0
          )
        const zBasin =
          b1A.amp *
          Math.exp(
            -(
              Math.pow((wx - b1A.cx) / b1A.rx, 2) +
              Math.pow((wy - b1A.cy) / b1A.ry, 2)
            ) * 2.2
          )

        macroZ = zCanyon * 0.65 + zMesas * 0.85 + zMid + zBasin
      } else if (archetype === 2) {
        // Monolith Massif with Radiating Ridge Spurs & Caldera
        const mDx = wx - m2Center.cx
        const mDy = wy - m2Center.cy
        const mTh = Math.atan2(mDy, mDx)
        const mRad = 1 + m2Center.h * Math.cos(2 * mTh + m2Center.p)
        const zM =
          m2Center.amp *
          Math.exp(
            -(
              Math.pow(mDx / (m2Center.rx * mRad), 2) +
              Math.pow(mDy / (m2Center.ry * mRad), 2)
            ) * 1.55
          )

        const { dist: sADist, t: sAT } = distToSpine(
          wx,
          wy,
          s2A.x0,
          s2A.y0,
          s2A.x1,
          s2A.y1,
          s2A.x2,
          s2A.y2
        )
        const zSpurA =
          s2A.amp * (1 - sAT * 0.35) * Math.exp(-Math.pow(sADist / s2A.width, 2) * 2.2)

        const { dist: sBDist, t: sBT } = distToSpine(
          wx,
          wy,
          s2B.x0,
          s2B.y0,
          s2B.x1,
          s2B.y1,
          s2B.x2,
          s2B.y2
        )
        const zSpurB =
          s2B.amp * (1 - sBT * 0.35) * Math.exp(-Math.pow(sBDist / s2B.width, 2) * 2.2)

        const zCald =
          cald2.amp *
          Math.exp(
            -(
              Math.pow((wx - cald2.cx) / cald2.rx, 2) +
              Math.pow((wy - cald2.cy) / cald2.ry, 2)
            ) * 2.2
          )
        const zFoot =
          foot2.amp *
          Math.exp(
            -(
              Math.pow((wx - foot2.cx) / foot2.rx, 2) +
              Math.pow((wy - foot2.cy) / foot2.ry, 2)
            ) * 1.8
          )

        macroZ = zM + zSpurA + zSpurB + zCald + zFoot
      } else {
        // Step-Terraced Plateau & Monocline Escarpment
        const diag = (wx * f3Cos + wy * f3Sin) / normW
        const fault = Math.sin(diag * Math.PI * 2.2) * 0.4 + (1 - diag * 0.3)

        const dA = Math.pow((wx - m3A.cx) / m3A.rx, 2) + Math.pow((wy - m3A.cy) / m3A.ry, 2)
        const dB = Math.pow((wx - m3B.cx) / m3B.rx, 2) + Math.pow((wy - m3B.cy) / m3B.ry, 2)
        const dC = Math.pow((wx - m3C.cx) / m3C.rx, 2) + Math.pow((wy - m3C.cy) / m3C.ry, 2)
        const zPeaks =
          m3A.amp * Math.exp(-dA * 1.6) +
          m3B.amp * Math.exp(-dB * 1.6) +
          m3C.amp * Math.exp(-dC * 1.6)
        const zPass =
          b3Pass.amp *
          Math.exp(
            -(
              Math.pow((wx - b3Pass.cx) / b3Pass.rx, 2) +
              Math.pow((wy - b3Pass.cy) / b3Pass.ry, 2)
            ) * 2.0
          )

        macroZ = fault * 0.45 + zPeaks * 0.75 + zPass
      }

      // Macro regional slope & gentle tertiary undulation
      const zMacro = nMacro(wx * freq * 0.85, wy * freq * 0.85) * 0.28
      const zSec = nSecondary(wx * freq * 1.6, wy * freq * 1.6) * 0.08

      const totalZ = macroZ + zMacro + zSec
      if (totalZ < minVal) minVal = totalZ
      if (totalZ > maxVal) maxVal = totalZ
      row.push(totalZ)
    }
    field.push(row)
  }

  // Normalize field to [0, 1] range
  const range = maxVal - minVal || 1
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      field[j][i] = (field[j][i] - minVal) / range
    }
  }

  // Number of elevation levels controlled by Layer Count (7 to 20 levels)
  const numLevels = Math.max(7, Math.min(20, Math.round(5 + layerCount * 1.4)))
  // Filter out tiny noise loops while preserving all real peaks, spurs, and saddles
  const minLength = minDim * 0.08
  const layers: GeneratedLayer[] = []

  for (let lvl = 1; lvl <= numLevels; lvl++) {
    const t = lvl / (numLevels + 1)
    const levelPower = 0.72 + (1 - heightParam / 100) * 0.55
    const level = 0.05 + Math.pow(t, levelPower) * 0.88

    // Cartographic index contours every 4th level or summit
    const isIndex = lvl % 4 === 0 || lvl === numLevels
    const colorT = 0.2 + Math.pow(t, 0.85) * 0.8
    const strokeColor = samplePalette(paletteColors, colorT, { lightToDark: false })
    const strokeWidth = safeNum((isIndex ? 1.85 : 1.15) * scale, 1.0)
    const opacity = safeNum(isIndex ? 0.95 : 0.72, 0.75)

    // Build Marching Squares segment graph
    const adj = new Map<string, string[]>()
    function addSegment(e1: string, e2: string) {
      if (!adj.has(e1)) adj.set(e1, [])
      if (!adj.has(e2)) adj.set(e2, [])
      adj.get(e1)!.push(e2)
      adj.get(e2)!.push(e1)
    }

    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const v0 = field[j][i]
        const v1 = field[j][i + 1]
        const v2 = field[j + 1][i + 1]
        const v3 = field[j + 1][i]

        const b0 = v0 >= level ? 1 : 0
        const b1 = v1 >= level ? 2 : 0
        const b2 = v2 >= level ? 4 : 0
        const b3 = v3 >= level ? 8 : 0
        const code = b0 | b1 | b2 | b3

        if (code === 0 || code === 15) continue

        const north = edgeId("H", i, j)
        const east = edgeId("V", i + 1, j)
        const south = edgeId("H", i, j + 1)
        const west = edgeId("V", i, j)

        switch (code) {
          case 1:
            addSegment(north, west)
            break
          case 2:
            addSegment(north, east)
            break
          case 3:
            addSegment(east, west)
            break
          case 4:
            addSegment(east, south)
            break
          case 5: {
            const avg = (v0 + v1 + v2 + v3) / 4
            if (avg >= level) {
              addSegment(north, east)
              addSegment(south, west)
            } else {
              addSegment(north, west)
              addSegment(east, south)
            }
            break
          }
          case 6:
            addSegment(north, south)
            break
          case 7:
            addSegment(south, west)
            break
          case 8:
            addSegment(south, west)
            break
          case 9:
            addSegment(north, south)
            break
          case 10: {
            const avg = (v0 + v1 + v2 + v3) / 4
            if (avg >= level) {
              addSegment(north, west)
              addSegment(east, south)
            } else {
              addSegment(north, east)
              addSegment(south, west)
            }
            break
          }
          case 11:
            addSegment(east, south)
            break
          case 12:
            addSegment(east, west)
            break
          case 13:
            addSegment(north, east)
            break
          case 14:
            addSegment(north, west)
            break
        }
      }
    }

    function getInterpolatedPoint(type: "H" | "V", i: number, j: number): Point {
      const dx = w / nx
      const dy = h / ny
      if (type === "H") {
        const v0 = field[j][i]
        const v1 = field[j][i + 1]
        const frac =
          Math.abs(v1 - v0) < 1e-6 ? 0.5 : Math.max(0, Math.min(1, (level - v0) / (v1 - v0)))
        return { x: safeNum((i + frac) * dx, 0), y: safeNum(j * dy, 0) }
      } else {
        const v0 = field[j][i]
        const v1 = field[j + 1][i]
        const frac =
          Math.abs(v1 - v0) < 1e-6 ? 0.5 : Math.max(0, Math.min(1, (level - v0) / (v1 - v0)))
        return { x: safeNum(i * dx, 0), y: safeNum((j + frac) * dy, 0) }
      }
    }

    const visitedEdges = new Set<string>()
    const pathStrings: string[] = []

    // Open paths terminating at canvas boundaries
    for (const [id, neighbors] of adj.entries()) {
      if (neighbors.length === 1 && !visitedEdges.has(id)) {
        const pathIds = [id]
        visitedEdges.add(id)
        let curr: string | undefined = neighbors[0]
        while (curr && !visitedEdges.has(curr)) {
          visitedEdges.add(curr)
          pathIds.push(curr)
          const nexts: string[] = adj.get(curr) ?? []
          curr = nexts.find((n: string) => !visitedEdges.has(n))
        }
        if (pathIds.length >= 3) {
          const pts = pathIds.map((e) => {
            const [type, iStr, jStr] = e.split(":")
            return getInterpolatedPoint(type as "H" | "V", parseInt(iStr), parseInt(jStr))
          })
          if (polylineLength(pts) >= minLength) {
            const d = pointsToSmoothPath(pts, tension, false)
            if (d) pathStrings.push(d)
          }
        }
      }
    }

    // Closed loop isolines around peaks and basins
    for (const [id, neighbors] of adj.entries()) {
      if (!visitedEdges.has(id)) {
        const pathIds = [id]
        visitedEdges.add(id)
        let curr: string | undefined = neighbors.find((n: string) => !visitedEdges.has(n))
        while (curr && !visitedEdges.has(curr)) {
          visitedEdges.add(curr)
          pathIds.push(curr)
          const nexts: string[] = adj.get(curr) ?? []
          curr = nexts.find((n: string) => !visitedEdges.has(n))
        }
        if (pathIds.length >= 6) {
          const pts = pathIds.map((e) => {
            const [type, iStr, jStr] = e.split(":")
            return getInterpolatedPoint(type as "H" | "V", parseInt(iStr), parseInt(jStr))
          })
          if (polylineLength(pts) >= minLength) {
            const d = pointsToSmoothPath(pts, tension, true)
            if (d) pathStrings.push(d)
          }
        }
      }
    }

    if (pathStrings.length > 0) {
      layers.push({
        id: `contour-level-${lvl}`,
        d: pathStrings.join(" "),
        stroke: strokeColor,
        strokeWidth,
        opacity,
      })
    }
  }

  return layers
}
