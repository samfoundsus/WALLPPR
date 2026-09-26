import { GeneratorContext, GeneratedLayer } from "./types"
import { createPRNG } from "./prng"
import { pointsToSmoothPath, Point } from "./spline"
import { safeNum } from "./sanitize"
import { samplePalette } from "./colors"

/**
 * Convex polygon clipping against a weighted power bisector (Laguerre Voronoi / Power Diagram)
 * Clips a polygon against the half-plane containing pA relative to the power bisector of (pA, rA) and (pB, rB).
 */
function clipPolygonWithWeightedBisector(
  poly: Point[],
  pA: Point,
  rA: number,
  pB: Point,
  rB: number
): Point[] {
  const dx = pB.x - pA.x
  const dy = pB.y - pA.y
  const distSq = dx * dx + dy * dy
  if (distSq < 1e-6) return poly

  // Shift along pA->pB vector based on cell growth size (weight) difference
  const weightShift = (rA * rA - rB * rB) / (2 * distSq)
  const mx = (pA.x + pB.x) / 2 + dx * weightShift
  const my = (pA.y + pB.y) / 2 + dy * weightShift

  const nx = dx
  const ny = dy

  function isInside(p: Point): boolean {
    return (p.x - mx) * nx + (p.y - my) * ny <= 0
  }

  function intersection(p1: Point, p2: Point): Point {
    const ex = p2.x - p1.x
    const ey = p2.y - p1.y
    const denom = ex * nx + ey * ny
    if (Math.abs(denom) < 1e-9) return p1
    const numer = (mx - p1.x) * nx + (my - p1.y) * ny
    const t = Math.max(0, Math.min(1, numer / denom))
    return { x: p1.x + t * ex, y: p1.y + t * ey }
  }

  const out: Point[] = []
  if (poly.length === 0) return out

  let s = poly[poly.length - 1]
  for (const e of poly) {
    if (isInside(e)) {
      if (!isInside(s)) {
        out.push(intersection(s, e))
      }
      out.push(e)
    } else if (isInside(s)) {
      out.push(intersection(s, e))
    }
    s = e
  }
  return out
}

/**
 * Clean polygon by removing collinear or near-duplicate consecutive vertices
 */
function cleanPolygon(poly: Point[]): Point[] {
  const res: Point[] = []
  for (let i = 0; i < poly.length; i++) {
    const curr = poly[i]
    if (
      res.length === 0 ||
      Math.hypot(curr.x - res[res.length - 1].x, curr.y - res[res.length - 1].y) > 1.5
    ) {
      res.push(curr)
    }
  }
  if (
    res.length > 2 &&
    Math.hypot(res[0].x - res[res.length - 1].x, res[0].y - res[res.length - 1].y) < 1.5
  ) {
    res.pop()
  }
  return res
}

/**
 * Calculate polygon area and geometric centroid
 */
function getPolygonCentroid(poly: Point[]): { cx: number; cy: number; area: number } {
  let area = 0
  let cx = 0
  let cy = 0
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const cross = poly[i].x * poly[j].y - poly[j].x * poly[i].y
    area += cross
    cx += (poly[i].x + poly[j].x) * cross
    cy += (poly[i].y + poly[j].y) * cross
  }
  area = area * 0.5
  if (Math.abs(area) < 1e-6) {
    let sx = 0
    let sy = 0
    for (const p of poly) {
      sx += p.x
      sy += p.y
    }
    return { cx: sx / n, cy: sy / n, area: 0 }
  }
  return { cx: cx / (6 * area), cy: cy / (6 * area), area: Math.abs(area) }
}

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
 * Living Amoeba-Like Biological Cell Membrane Generator (Cells 2.2)
 *
 * Distinct Amoeboid Visual Target:
 * - Living Amoebic Tissue Network:
 *   Continuous sheet of deformable living cells with irregular local bulges, shallow
 *   indentations, soft pseudopodial protrusions, and uneven curvature.
 * - Multi-Scale Membrane Deformation:
 *   Generates smooth deformation fields combining:
 *   1. Low frequency: macro amoebic expansion / indentation and cellular pressure shifts
 *   2. Medium frequency: irregular lobes, pseudopodia, and asymmetric bends
 *   3. High frequency: subtle, fluid organic membrane undulations (never sharp or jagged)
 * - Single Shared Curved Boundary Representation:
 *   Shared boundaries are generated once and traversed in forward direction by one cell and
 *   reverse direction by its neighbor. 100% mathematically watertight network with zero cracks,
 *   gaps, overlaps, or mismatched borders.
 * - Organic Asymmetric 3-Way Junctions:
 *   Converts rigid geometric intersection points into softly rounded organic Y-junctions
 *   where living cells press against one another.
 * - Natural Multi-Scale Morphology:
 *   ~15% small compressed interstitial cells, ~60% medium cells, ~25% large mature cells.
 *   Elongated, wide, compressed, and irregularly lobed silhouettes.
 * - Clean, Elegant Membrane Separators:
 *   Thin 1.8px membrane separator lines in a slightly deeper palette tone with subtle cytoplasmic
 *   tonal variation across the active color palette.
 *
 * Parameter Mappings:
 * - Layer Count: Controls cell density (18 to 35 visible cells).
 * - Height / Amplitude: Controls strength of membrane deformation and lobe prominence.
 * - Spacing / Frequency: Controls average cell size, distribution jitter, and boundary frequency.
 * - Smoothness: Controls softness and fluidity of membrane curves (Higher = softer, fluid amoeba;
 *   Lower = more pronounced, uneven biological contours, never straight polygons).
 */
export function generateCells(ctx: GeneratorContext): GeneratedLayer[] {
  const { width: w, height: h, config, paletteColors } = ctx
  const { layerCount, height: heightParam, spacing: spacingParam, smoothness } = config.parameters
  const { seed } = config.advanced

  const prng = createPRNG(seed)
  const minDim = Math.min(w, h)
  const scale = minDim / 1080

  // 1. Cellular density governed by Layer Count (18 to 35 cells)
  const numCells = Math.max(18, Math.min(35, Math.round(16 + layerCount * 2.1)))

  // 2. Multi-scale biological seed distribution
  const aspect = h / w
  const cols = Math.max(3, Math.round(Math.sqrt(numCells / aspect)))
  const rows = Math.max(4, Math.round(cols * aspect))

  const seeds: { pos: Point; radius: number; amoebaBias: number; lobePhase: number }[] = []
  const pad = 0.14
  const cellW = (w * (1 + 2 * pad)) / cols
  const cellH = (h * (1 + 2 * pad)) / rows
  const baseR = Math.min(cellW, cellH) * 0.52

  // Spacing parameter modulates distribution jitter & average cell spacing
  const jitterFactor = 0.28 + (spacingParam / 100) * 0.36

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const baseX = -w * pad + (c + 0.5) * cellW
      const baseY = -h * pad + (r + 0.5) * cellH
      const jx = prng.range(-jitterFactor, jitterFactor) * cellW
      const jy = prng.range(-jitterFactor, jitterFactor) * cellH

      // Biological growth size distribution: ~15% small, ~60% medium, ~25% large
      const randVal = prng.next()
      let rScale = 1.0
      if (randVal < 0.25) {
        rScale = prng.range(1.3, 1.65) // Large mature amoeba
      } else if (randVal < 0.85) {
        rScale = prng.range(0.88, 1.2) // Medium cell
      } else {
        rScale = prng.range(0.6, 0.8) // Small compressed cell
      }

      seeds.push({
        pos: { x: baseX + jx, y: baseY + jy },
        radius: baseR * rScale,
        amoebaBias: prng.range(-1, 1),
        lobePhase: prng.range(0, Math.PI * 2),
      })
    }
  }

  // Deterministic shuffle
  for (let i = seeds.length - 1; i > 0; i--) {
    const j = prng.int(0, i)
    const tmp = seeds[i]
    seeds[i] = seeds[j]
    seeds[j] = tmp
  }
  const activeSeeds = seeds.slice(0, numCells)

  // Outer canvas bounding box (padded so edge cells cleanly bleed off-screen)
  const boundPad = 80
  const box: Point[] = [
    { x: -boundPad, y: -boundPad },
    { x: w + boundPad, y: -boundPad },
    { x: w + boundPad, y: h + boundPad },
    { x: -boundPad, y: h + boundPad },
  ]

  // 3. Compute weighted Voronoi partition (Power Diagram)
  const rawPolys: {
    id: number
    seed: Point
    radius: number
    amoebaBias: number
    lobePhase: number
    poly: Point[]
    cx: number
    cy: number
    area: number
  }[] = []

  for (let i = 0; i < activeSeeds.length; i++) {
    let poly = box.slice()
    for (let j = 0; j < activeSeeds.length; j++) {
      if (i === j) continue
      poly = clipPolygonWithWeightedBisector(
        poly,
        activeSeeds[i].pos,
        activeSeeds[i].radius,
        activeSeeds[j].pos,
        activeSeeds[j].radius
      )
    }
    poly = cleanPolygon(poly)
    if (poly.length >= 3) {
      const { cx, cy, area } = getPolygonCentroid(poly)
      if (area > 150) {
        rawPolys.push({
          id: i,
          seed: activeSeeds[i].pos,
          radius: activeSeeds[i].radius,
          amoebaBias: activeSeeds[i].amoebaBias,
          lobePhase: activeSeeds[i].lobePhase,
          poly,
          cx,
          cy,
          area,
        })
      }
    }
  }

  // 4. Snap raw intersection vertices to unique junctions
  const rawJunctions: Point[] = []
  function getRawJunctionId(p: Point): number {
    for (let i = 0; i < rawJunctions.length; i++) {
      if (Math.hypot(rawJunctions[i].x - p.x, rawJunctions[i].y - p.y) < 2.5) {
        return i
      }
    }
    rawJunctions.push({ x: p.x, y: p.y })
    return rawJunctions.length - 1
  }

  const cellJunctions = rawPolys.map((c) => c.poly.map(getRawJunctionId))

  function isBoundaryPoint(p: Point): boolean {
    return (
      p.x <= -boundPad + 2 ||
      p.x >= w + boundPad - 2 ||
      p.y <= -boundPad + 2 ||
      p.y >= h + boundPad - 2
    )
  }

  // 5. Organic junction relaxation: transforms rigid geometric vertices into rounded organic Y-junctions
  const juncNoiseX = createNoise2D(seed + 1007)
  const juncNoiseY = createNoise2D(seed + 2011)
  const juncAmp = minDim * 0.018 * (heightParam / 100)

  const junctions: Point[] = rawJunctions.map((jp) => {
    if (isBoundaryPoint(jp)) return jp
    const jx = juncNoiseX(jp.x * 0.002, jp.y * 0.002) * juncAmp
    const jy = juncNoiseY(jp.x * 0.002, jp.y * 0.002) * juncAmp
    return { x: jp.x + jx, y: jp.y + jy }
  })

  // Map each unique edge to the cells sharing it
  const edgeCells = new Map<string, number[]>()
  for (let cIdx = 0; cIdx < rawPolys.length; cIdx++) {
    const juncs = cellJunctions[cIdx]
    const n = juncs.length
    for (let i = 0; i < n; i++) {
      const u = juncs[i]
      const v = juncs[(i + 1) % n]
      if (u === v) continue
      const key = u < v ? `${u}_${v}` : `${v}_${u}`
      const list = edgeCells.get(key) || []
      if (!list.includes(cIdx)) list.push(cIdx)
      edgeCells.set(key, list)
    }
  }

  // Multi-scale deformation noise fields
  // 1. Low frequency: macro amoebic bulge / indent
  const macroNoise = createNoise2D(seed + 3019)
  // 2. Medium frequency: irregular lobes and asymmetric bends
  const mesoNoise = createNoise2D(seed + 5023)
  // 3. High frequency: subtle fine membrane undulation
  const microNoise = createNoise2D(seed + 7027)

  // Height controls overall deformation amplitude:
  const deformAmp = (heightParam / 100) * minDim * 0.075
  const freqBase = 0.0016 * (1 + (1 - spacingParam / 100) * 0.4)

  // Smoothness parameter controls softness of deformation:
  // Higher smoothness -> softer, wider amoeba curves
  // Lower smoothness -> more pronounced, uneven lobes and indentations
  const smoothFactor = smoothness / 100
  const mesoWeight = 0.45 + (1 - smoothFactor) * 0.35
  const microWeight = 0.12 + (1 - smoothFactor) * 0.18

  const edgeCurves = new Map<string, Point[]>()

  // 6. Pre-generate ONE shared amoeba-like membrane curve for each unique edge
  for (const [key, cellsSharing] of edgeCells.entries()) {
    const [uStr, vStr] = key.split("_")
    const u = parseInt(uStr, 10)
    const v = parseInt(vStr, 10)
    const jA = junctions[u]
    const jB = junctions[v]

    const dx = jB.x - jA.x
    const dy = jB.y - jA.y
    const len = Math.hypot(dx, dy)

    // Keep outer bounding box boundaries straight for clean canvas bleeding
    if (isBoundaryPoint(jA) && isBoundaryPoint(jB)) {
      edgeCurves.set(key, [jA, jB])
      continue
    }

    // Normal perpendicular vector to the edge (from u to v)
    const nx = -dy / (len || 1)
    const ny = dx / (len || 1)

    // Biological pressure differential & asymmetric amoeba bias
    let pressureShift = 0
    let lobeBias = 0
    if (cellsSharing.length >= 2) {
      const cA = rawPolys[cellsSharing[0]]
      const cB = rawPolys[cellsSharing[1]]
      const toBx = cB.cx - cA.cx
      const toBy = cB.cy - cA.cy
      const dot = nx * toBx + ny * toBy
      const dir = dot >= 0 ? 1 : -1

      // Surface tension + individual amoebic pseudopodia bias
      const rDiff = (cA.radius - cB.radius) / (cA.radius + cB.radius || 1)
      pressureShift = dir * rDiff * len * 0.22
      lobeBias = dir * (cA.amoebaBias - cB.amoebaBias) * 0.15 * len
    } else if (cellsSharing.length === 1) {
      const cA = rawPolys[cellsSharing[0]]
      lobeBias = cA.amoebaBias * 0.12 * len
    }

    // Determine number of subdivision points based on edge length
    // Gives between 5 and 10 internal points for fluid organic curvature
    const numSub = Math.max(5, Math.min(10, Math.round(len / 28)))

    const edgePoints: Point[] = [jA]

    for (let step = 1; step < numSub; step++) {
      const t = step / numSub

      // Base un-deformed coordinate along segment
      const baseX = jA.x + dx * t
      const baseY = jA.y + dy * t

      // Smooth envelope that pins to 0 at both endpoints so junctions stay tightly joined
      const envelope = Math.sin(t * Math.PI)

      // Multi-scale displacement:
      // Scale 1: Low frequency macro bulge/indent
      const macroDisp = macroNoise(baseX * freqBase, baseY * freqBase) * deformAmp

      // Scale 2: Medium frequency asymmetric lobes and bends
      const mesoWave = Math.sin(t * Math.PI * 2 + (pressureShift > 0 ? 0.4 : -0.4)) * lobeBias
      const mesoDisp =
        (mesoNoise(baseX * freqBase * 2.2, baseY * freqBase * 2.2) * deformAmp + mesoWave) *
        mesoWeight

      // Scale 3: High frequency subtle membrane undulation
      const microDisp =
        microNoise(baseX * freqBase * 4.5, baseY * freqBase * 4.5) * deformAmp * microWeight

      const totalNormalDisp = (pressureShift + macroDisp + mesoDisp + microDisp) * envelope

      // Small tangential slide creates natural compressed / elongated necks along the membrane
      const tangentialDisp =
        macroNoise(baseX * freqBase + 100, baseY * freqBase + 100) *
        (deformAmp * 0.25) *
        envelope

      const px = baseX + nx * totalNormalDisp + (dx / len) * tangentialDisp
      const py = baseY + ny * totalNormalDisp + (dy / len) * tangentialDisp

      edgePoints.push({ x: px, y: py })
    }

    edgePoints.push(jB)
    edgeCurves.set(key, edgePoints)
  }

  // 7. Assemble each cell from its shared curved membrane segments
  const tension = Math.max(60, Math.min(92, 62 + smoothness * 0.3))

  const areas = rawPolys.map((c) => c.area).sort((a, b) => a - b)
  const minArea = areas[0] || 1
  const maxArea = areas[areas.length - 1] || 1

  const layers: GeneratedLayer[] = []
  for (let cIdx = 0; cIdx < rawPolys.length; cIdx++) {
    const cell = rawPolys[cIdx]
    const juncs = cellJunctions[cIdx]
    const n = juncs.length

    const cellBoundaryPts: Point[] = []
    for (let i = 0; i < n; i++) {
      const u = juncs[i]
      const v = juncs[(i + 1) % n]
      if (u === v) continue

      const key = u < v ? `${u}_${v}` : `${v}_${u}`
      const curve = edgeCurves.get(key) || [junctions[u], junctions[v]]

      if (u < v) {
        // Forward: add all except last point (next edge begins with that point)
        for (let k = 0; k < curve.length - 1; k++) {
          cellBoundaryPts.push(curve[k])
        }
      } else {
        // Reverse: add in reverse order from end down to 1
        for (let k = curve.length - 1; k > 0; k--) {
          cellBoundaryPts.push(curve[k])
        }
      }
    }

    const d = pointsToSmoothPath(cellBoundaryPts, tension, true)

    // Subtle biological cytoplasmic tonal variation across active palette
    const areaT = (cell.area - minArea) / (maxArea - minArea || 1)
    const spatialT = safeNum((cell.cx / w) * 0.5 + (cell.cy / h) * 0.5, 0.5)
    const colorT = safeNum(
      0.15 + ((spatialT * 0.6 + areaT * 0.35 + (cIdx % 5) * 0.07) % 0.72),
      0.5
    )

    const fillColor = samplePalette(paletteColors, colorT, { darkToLight: true })
    // Thin, organic membrane separator (subtly darker tone)
    const strokeColor = samplePalette(paletteColors, Math.max(0.04, colorT * 0.4), {
      darkToLight: true,
    })
    const strokeWidth = safeNum(1.8 * scale, 1.6)

    layers.push({
      id: `cells-chamber-${cIdx}`,
      d,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      opacity: 0.96,
    })
  }

  return layers
}
