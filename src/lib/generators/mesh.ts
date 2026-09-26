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
 * Premium 3D Topographic Wireframe Mesh Engine
 *
 * Translates the exact organic design language and scalar elevation field of the
 * refined Contour generator into a continuous, physical 3D wireframe mesh:
 *
 * - Unified Topographic Field:
 *   Employs the same multi-scale elevation field as Contour: broad geological formations,
 *   ridged mountain crests, river valleys, and natural domain curl warping.
 * - Continuous Connected 3D Wireframe:
 *   A unified rectangular grid covering the entire canvas. Every vertex shares physical
 *   connectivity with its row and column neighbors—no floating fragments, no broken scribbles.
 * - Natural Cartographic Density Variation:
 *   Lines cluster organically along steep alpine slopes and separate spaciously across
 *   gentle plateaus and valley corridors.
 * - Wire Styling:
 *   Crisp, moderately thick wire lines (2.0px - 3.4px) with subtle depth modulation and
 *   clean anti-aliased Catmull-Rom curves.
 * - Diverse Landforms:
 *   Alpine massifs, winding canyons, asymmetric summit basins, and folded structural plateaus.
 *   No dominant horizontal wave flow, no central bullseye or hourglass.
 *
 * Parameter Mappings:
 * - Layer Count: Controls mesh grid resolution (density of row and column subdivision).
 * - Height / Amplitude: Controls vertical elevation relief and depth of 3D terrain deformation.
 * - Spacing / Frequency: Controls horizontal scale and breadth of major terrain formations.
 * - Smoothness: Controls deformation softness, ridge curvature, and spline tension.
 */
export function generateMesh(ctx: GeneratorContext): GeneratedLayer[] {
  const { width: w, height: h, config, paletteColors } = ctx
  const { layerCount, height: heightParam, spacing: spacingParam, smoothness } = config.parameters
  const { seed } = config.advanced

  const prng = createPRNG(seed)
  const isLandscape = w > h
  const minDim = Math.min(w, h)
  const scale = minDim / 1080

  // 1. Grid resolution: clean, breathable quad cells governed by layerCount
  const baseRows = Math.max(16, Math.min(42, Math.round(13 + layerCount * 2.8)))
  const baseCols = Math.max(12, Math.min(30, Math.round(baseRows * (isLandscape ? 1.4 : 0.65))))

  const cellW = w / (baseCols - 1)
  const cellH = h / (baseRows - 1)

  // 2. Parameter derivations matching the Contour terrain character
  const freq = 0.45 + (1 - spacingParam / 100) * 0.55
  const tension = Math.max(45, Math.min(85, 52 + smoothness * 0.33))
  const smoothDamping = 1 - (smoothness / 100) * 0.75
  const reliefStrength = 0.8 + (heightParam / 100) * 1.4

  // Bold 3D elevation displacement
  const maxDispY = cellH * (1.3 + (heightParam / 100) * 3.2)
  const maxDispX = cellW * (0.16 + (heightParam / 100) * 0.38)

  // Extra padding rows/cols to guarantee seamless full-canvas coverage
  const extraRowsTop = 2
  const extraRowsBottom = Math.ceil(maxDispY / cellH) + 2
  const extraCols = 2

  const totalRows = baseRows + extraRowsTop + extraRowsBottom
  const totalCols = baseCols + extraCols * 2

  // 3. Multi-scale procedural noise fields (exact Contour seed offsets)
  const nMacro = createNoise2D(seed)
  const nRidge = createNoise2D(seed + 1013)
  const nWarpX = createNoise2D(seed + 2027)
  const nWarpY = createNoise2D(seed + 3041)
  const nDetail = createNoise2D(seed + 4057)

  // 4. Intentional Topographic Composition Archetypes (Exact Contour Landforms)
  // 0: Alpine Massif & Ridge Line (major diagonal ridge system with off-axis spurs)
  // 1: Sinuous River Canyon & Escarpments (winding valley with stepped flanking terraces)
  // 2: Dual Summit Basin (two distinct peaks on opposing flanks with saddle and central pass)
  // 3: Folded Geological Plateau (terraced monoclines and asymmetric escarpments)
  const archetype = prng.int(0, 3)
  const warpStrength = 0.12 * (1 - (smoothness / 100) * 0.3)

  // Seeded landmark anchors for balanced asymmetric distribution
  const p1x = 0.3 + prng.range(-0.1, 0.1)
  const p1y = 0.35 + prng.range(-0.1, 0.1)
  const p2x = 0.7 + prng.range(-0.1, 0.1)
  const p2y = 0.65 + prng.range(-0.1, 0.1)

  // Continuous elevation sampler directly corresponding to Contour's heightfield
  function getElevation(u: number, v: number): { z: number; lat: number } {
    const clampedU = Math.max(0, Math.min(1, u))
    const clampedV = Math.max(0, Math.min(1, v))

    // Domain curl warping: gives natural geological flow
    const warpX = nWarpX(clampedU * 1.5 * freq, clampedV * 1.5 * freq) * warpStrength
    const warpY = nWarpY(clampedU * 1.5 * freq, clampedV * 1.5 * freq) * warpStrength
    const wu = clampedU + warpX
    const wv = clampedV + warpY

    let macroZ = 0
    if (archetype === 0) {
      // Alpine Massif & Ridge Line
      const ridgeLine = Math.abs(wu * 0.65 + wv * 0.45 - 0.55)
      const crest = Math.max(0, 1.4 - ridgeLine * 2.8)
      const d1 = Math.hypot((wu - p1x) / 0.35, (wv - p1y) / 0.35)
      const peak = Math.max(0, 1.3 - d1 * 1.5)
      macroZ = crest * 0.7 + peak * 0.6
    } else if (archetype === 1) {
      // Sinuous River Canyon & Escarpments
      const valley = 0.5 + Math.sin(wv * Math.PI * 1.7) * 0.2
      const dValley = Math.abs(wu - valley)
      const slopes = Math.pow(dValley * 2.1, 1.25)
      const shelves = Math.sin(dValley * Math.PI * 3.5) * 0.2
      macroZ = slopes + shelves
    } else if (archetype === 2) {
      // Dual Summit Basin
      const dA = Math.hypot((wu - p1x) / 0.38, (wv - p1y) / 0.38)
      const dB = Math.hypot((wu - p2x) / 0.42, (wv - p2y) / 0.42)
      const peakA = Math.max(0, 1.4 - dA * 1.6)
      const peakB = Math.max(0, 1.3 - dB * 1.5)
      macroZ = Math.max(peakA, peakB) + Math.min(peakA, peakB) * 0.4
    } else {
      // Folded Geological Plateau
      const diag = wu * 0.7 + wv * 0.4
      const folds = Math.sin(diag * Math.PI * 2.0) * 0.5 + 0.5
      const dCenter = Math.hypot((wu - 0.5) / 0.45, (wv - 0.5) / 0.45)
      macroZ = folds * 0.7 + Math.max(0, 1.2 - dCenter) * 0.5
    }

    // Multi-scale procedural noise
    const zMacro = nMacro(wu * 1.4 * freq, wv * 1.4 * freq) * 0.55
    const rawRidge = nRidge(wu * 2.5 * freq, wv * 2.5 * freq)
    const zRidge = (1.0 - Math.abs(rawRidge)) * 0.35
    const zDetail = nDetail(wu * 4.8 * freq, wv * 4.8 * freq) * 0.12 * smoothDamping

    const rawZ = (macroZ * 0.85 + zMacro + zRidge + zDetail) * reliefStrength
    const lat = warpX * 4.0 + rawRidge * 0.35

    return { z: Math.max(0, rawZ), lat }
  }

  // 5. Build continuous 2D mesh grid
  const grid: { pt: Point; z: number; tV: number }[][] = []

  for (let r = 0; r < totalRows; r++) {
    const row: { pt: Point; z: number; tV: number }[] = []
    const gridR = r - extraRowsTop
    const tV = gridR / (baseRows - 1)

    // Subtle perspective depth: foreground cells slightly more spacious
    const clampedTV = Math.max(0, Math.min(1, tV))
    const perspY = Math.pow(clampedTV, 1.05)
    const baseY = tV < 0 ? tV * h : tV > 1 ? h + (tV - 1) * h : perspY * h

    for (let c = 0; c < totalCols; c++) {
      const gridC = c - extraCols
      const tU = gridC / (baseCols - 1)
      const baseX = tU * w

      const { z, lat } = getElevation(tU, tV)

      // Depth scaling: slightly enhanced in foreground
      const depthScale = 0.85 + clampedTV * 0.28
      const dispY = -z * maxDispY * depthScale
      const dispX = lat * maxDispX * depthScale

      row.push({
        pt: {
          x: safeNum(baseX + dispX, baseX),
          y: safeNum(baseY + dispY, baseY),
        },
        z,
        tV: clampedTV,
      })
    }
    grid.push(row)
  }

  // 6. Generate SVG layers with crisp, moderately thick wireframe styling
  const layers: GeneratedLayer[] = []
  let layerIdx = 0

  // Horizontal Grid Lines (Rows)
  for (let r = 0; r < totalRows; r++) {
    const pts = grid[r].map((g) => g.pt)
    const avgZ = grid[r].reduce((acc, g) => acc + g.z, 0) / totalCols
    const maxZ = Math.max(...grid[r].map((g) => g.z))
    const rowTV = grid[r][0].tV
    const pathD = pointsToSmoothPath(pts, tension, false)

    const elevMetric = Math.min(1, Math.max(0, (avgZ * 0.35 + maxZ * 0.65) / 1.7))
    const colorT = 0.25 + elevMetric * 0.75
    const strokeColor = samplePalette(paletteColors, colorT, { lightToDark: false })

    // Moderately thick, crisp wireframe strokes (2.0px - 3.4px)
    const baseWidth = (2.0 + rowTV * 0.6) * scale
    const strokeWidth = safeNum(baseWidth + elevMetric * 0.8 * scale, 2.2 * scale)
    const opacity = safeNum(0.68 + rowTV * 0.16 + elevMetric * 0.16, 0.85, 0.45, 1.0)

    layers.push({
      id: `mesh-row-${layerIdx++}`,
      d: pathD,
      stroke: strokeColor,
      strokeWidth,
      opacity,
    })
  }

  // Vertical Grid Lines (Columns)
  for (let c = 0; c < totalCols; c++) {
    const pts: Point[] = []
    let sumZ = 0
    let maxZ = 0
    for (let r = 0; r < totalRows; r++) {
      pts.push(grid[r][c].pt)
      sumZ += grid[r][c].z
      if (grid[r][c].z > maxZ) maxZ = grid[r][c].z
    }
    const avgZ = sumZ / totalRows
    const pathD = pointsToSmoothPath(pts, tension, false)

    const elevMetric = Math.min(1, Math.max(0, (avgZ * 0.35 + maxZ * 0.65) / 1.7))
    const colorT = 0.25 + elevMetric * 0.75
    const strokeColor = samplePalette(paletteColors, colorT, { lightToDark: false })

    const strokeWidth = safeNum((1.9 + elevMetric * 0.75) * scale, 2.0 * scale)
    const opacity = safeNum(0.62 + elevMetric * 0.26, 0.8, 0.4, 1.0)

    layers.push({
      id: `mesh-col-${layerIdx++}`,
      d: pathD,
      stroke: strokeColor,
      strokeWidth,
      opacity,
    })
  }

  return layers
}
