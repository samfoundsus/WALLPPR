import { GeneratorContext, GeneratedLayer } from "./types"
import { createPRNG } from "./prng"
import { pointsToSmoothPath, Point } from "./spline"
import { safeNum } from "./sanitize"
import { samplePalette } from "./colors"

/**
 * Premium Organic Full-Canvas Stripes Engine (Stripes 2.1)
 *
 * Generates balanced, full-canvas flowing ribbon compositions with controlled organic variation:
 * - Full-Canvas Distribution:
 *   Distributes 4 to 7 substantial stripes across a meaningful, balanced portion of the canvas
 *   viewport (70%–92% coverage) rather than collapsing into a narrow central bundle.
 * - Clear Negative Space Channels:
 *   Maintains consistent breathing room between adjacent ribbons so bands never collide or merge.
 * - Distinct from Waves:
 *   Focuses on long, continuous ribbons with broad smooth trajectories, low-frequency curvature,
 *   and graphic architectural flow (no rapid rhythmic sinusoidal ripples).
 * - True Perpendicular Normal Extrusion:
 *   Constructs top and bottom ribbon curves using true normal vectors along the centerline trajectory,
 *   preserving balanced ribbon thickness around sweeping bends and dynamic diagonal angles.
 * - 4 Rich Composition Archetypes:
 *   1. Full-Span Diagonal Strata (sweeps at dynamic editorial angles across projected canvas bounds)
 *   2. Flowing Transverse Strata (balanced horizontal/vertical flow with gentle harmonic bends)
 *   3. Sweeping Majestic Arc Ribbons (concentric sweeping curves radiating from an off-canvas focal point)
 *   4. Architectural S-Curve Flow (luxurious cubic inflection bands spanning the canvas)
 *
 * Parameter Mappings:
 * - Layer Count: Controls number of stripe bands (4 to 7).
 * - Height / Amplitude: Controls stripe thickness / width and curvature amplitude.
 * - Spacing / Frequency: Controls canvas span coverage and spacing between bands.
 * - Smoothness: Controls curve softness and Catmull-Rom spline tension.
 */
export function generateStripes(ctx: GeneratorContext): GeneratedLayer[] {
  const { width: w, height: h, config, paletteColors } = ctx
  const { layerCount, height: heightParam, spacing: spacingParam, smoothness } = config.parameters
  const { seed } = config.advanced

  const prng = createPRNG(seed)
  const minDim = Math.min(w, h)

  // 1. Layer Count controls number of stripe bands (4 to 7)
  const count = Math.max(4, Math.min(7, Math.round(3.5 + layerCount * 0.35)))

  // 2. Select Composition Archetype
  // 0: Full-Span Diagonal Strata
  // 1: Flowing Transverse Strata
  // 2: Sweeping Majestic Arc Ribbons
  // 3: Architectural S-Curve Flow
  const archetype = prng.int(0, 3)

  const steps = 32
  const tension = Math.max(55, Math.min(92, 58 + smoothness * 0.34))
  const heightFactor = 0.45 + (heightParam / 100) * 0.65
  const spacingFactor = 0.4 + (spacingParam / 100) * 0.6

  const layers: GeneratedLayer[] = []

  if (archetype === 0) {
    // === ARCHETYPE 0: FULL-SPAN DIAGONAL STRATA ===
    const angleSign = prng.bool(0.5) ? 1 : -1
    const baseAngle = prng.range(28, 56) * (Math.PI / 180) * angleSign
    const dirX = Math.cos(baseAngle)
    const dirY = Math.sin(baseAngle)
    const normX = -dirY
    const normY = dirX

    const corners = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: 0, y: h },
      { x: w, y: h },
    ]
    const projections = corners.map((c) => c.x * normX + c.y * normY)
    const minProj = Math.min(...projections)
    const maxProj = Math.max(...projections)
    const projSpan = maxProj - minProj

    const coverage = 0.7 + spacingFactor * 0.22
    const startProj = minProj + projSpan * (0.5 - coverage * 0.5)
    const endProj = minProj + projSpan * (0.5 + coverage * 0.5)
    const totalDist = endProj - startProj

    const baseWidth = (totalDist / count) * 0.42 * heightFactor
    const diagLength = Math.hypot(w, h) * 1.6
    const midProj = (minProj + maxProj) / 2

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1)
      const fillColor = samplePalette(paletteColors, t, { lightToDark: true })
      const posJitter = prng.range(-0.03, 0.03) * (totalDist / count)
      const cProj = startProj + t * totalDist + posJitter
      const halfW = baseWidth * prng.range(0.86, 1.18) * 0.5

      const ribbonAmp = minDim * 0.08 * heightFactor * prng.range(0.85, 1.15)
      const phase = prng.range(0, Math.PI * 2)

      const centerLine: Point[] = []
      for (let s = 0; s <= steps; s++) {
        const u = s / steps
        const dOffset = (u - 0.5) * diagLength
        const originX = w / 2 + normX * (cProj - midProj)
        const originY = h / 2 + normY * (cProj - midProj)
        const lx = originX + dirX * dOffset
        const ly = originY + dirY * dOffset

        const bend = Math.sin(u * Math.PI * 0.95 + phase) * ribbonAmp
        const cx = lx + normX * bend
        const cy = ly + normY * bend
        centerLine.push({ x: cx, y: cy })
      }

      const topPts: Point[] = []
      const botPts: Point[] = []
      for (let s = 0; s <= steps; s++) {
        const u = s / steps
        const pt = centerLine[s]
        let tx = 0
        let ty = 0
        if (s === 0) {
          tx = centerLine[1].x - centerLine[0].x
          ty = centerLine[1].y - centerLine[0].y
        } else if (s === steps) {
          tx = centerLine[steps].x - centerLine[steps - 1].x
          ty = centerLine[steps].y - centerLine[steps - 1].y
        } else {
          tx = centerLine[s + 1].x - centerLine[s - 1].x
          ty = centerLine[s + 1].y - centerLine[s - 1].y
        }
        const tLen = Math.hypot(tx, ty) || 1
        const nx = -ty / tLen
        const ny = tx / tLen

        const wMod = 1.0 + Math.sin(u * Math.PI + i * 0.5) * 0.1
        const hw = halfW * wMod

        topPts.push({ x: safeNum(pt.x + nx * hw, pt.x), y: safeNum(pt.y + ny * hw, pt.y) })
        botPts.push({ x: safeNum(pt.x - nx * hw, pt.x), y: safeNum(pt.y - ny * hw, pt.y) })
      }

      const ribbonPolygon: Point[] = [...topPts, ...botPts.reverse()]
      const d = pointsToSmoothPath(ribbonPolygon, tension, true)
      layers.push({
        id: `stripes-ribbon-${i}`,
        d,
        fill: fillColor,
        opacity: safeNum(0.88 + t * 0.12, 1),
      })
    }
  } else if (archetype === 1) {
    // === ARCHETYPE 1: FLOWING TRANSVERSE STRATA ===
    const coverage = 0.72 + spacingFactor * 0.2
    const startMargin = h * (0.5 - coverage * 0.5)
    const endMargin = h * (0.5 + coverage * 0.5)
    const span = endMargin - startMargin
    const baseWidth = (span / count) * 0.44 * heightFactor

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1)
      const fillColor = samplePalette(paletteColors, t, { lightToDark: true })

      const basePos = startMargin + t * span + prng.range(-0.03, 0.03) * (span / count)
      const halfW = baseWidth * prng.range(0.86, 1.18) * 0.5

      const amp = h * 0.07 * heightFactor * prng.range(0.85, 1.15)
      const phase = prng.range(0, Math.PI * 2)
      const tilt = prng.range(-0.06, 0.06) * h

      const centerLine: Point[] = []
      for (let s = 0; s <= steps; s++) {
        const u = s / steps
        const lx = -w * 0.15 + u * (w * 1.3)
        const bend = Math.sin(u * Math.PI * 0.9 + phase) * amp + (u - 0.5) * tilt
        const ly = basePos + bend
        centerLine.push({ x: lx, y: ly })
      }

      const topPts: Point[] = []
      const botPts: Point[] = []
      for (let s = 0; s <= steps; s++) {
        const u = s / steps
        const pt = centerLine[s]
        let tx = 0
        let ty = 0
        if (s === 0) {
          tx = centerLine[1].x - centerLine[0].x
          ty = centerLine[1].y - centerLine[0].y
        } else if (s === steps) {
          tx = centerLine[steps].x - centerLine[steps - 1].x
          ty = centerLine[steps].y - centerLine[steps - 1].y
        } else {
          tx = centerLine[s + 1].x - centerLine[s - 1].x
          ty = centerLine[s + 1].y - centerLine[s - 1].y
        }
        const tLen = Math.hypot(tx, ty) || 1
        const nx = -ty / tLen
        const ny = tx / tLen

        const wMod = 1.0 + Math.sin(u * Math.PI + i * 0.5) * 0.1
        const hw = halfW * wMod

        topPts.push({ x: safeNum(pt.x + nx * hw, pt.x), y: safeNum(pt.y + ny * hw, pt.y) })
        botPts.push({ x: safeNum(pt.x - nx * hw, pt.x), y: safeNum(pt.y - ny * hw, pt.y) })
      }

      const ribbonPolygon: Point[] = [...topPts, ...botPts.reverse()]
      const d = pointsToSmoothPath(ribbonPolygon, tension, true)
      layers.push({
        id: `stripes-ribbon-${i}`,
        d,
        fill: fillColor,
        opacity: safeNum(0.88 + t * 0.12, 1),
      })
    }
  } else if (archetype === 2) {
    // === ARCHETYPE 2: SWEEPING MAJESTIC ARC STRATA ===
    const cornerX = prng.bool(0.5) ? -w * 0.35 : w * 1.35
    const cornerY = prng.bool(0.5) ? -h * 0.25 : h * 1.25

    const corners = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: 0, y: h },
      { x: w, y: h },
    ]
    const dists = corners.map((c) => Math.hypot(c.x - cornerX, c.y - cornerY))
    const minR = Math.min(...dists) * 0.95
    const maxR = Math.max(...dists) * 1.05
    const rSpan = maxR - minR

    const coverage = 0.7 + spacingFactor * 0.22
    const startR = minR + rSpan * (0.5 - coverage * 0.5)
    const endR = minR + rSpan * (0.5 + coverage * 0.5)
    const baseWidth = ((endR - startR) / count) * 0.44 * heightFactor

    const angles = corners.map((c) => Math.atan2(c.y - cornerY, c.x - cornerX))
    const minAngle = Math.min(...angles) - 0.25
    const maxAngle = Math.max(...angles) + 0.25

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1)
      const fillColor = samplePalette(paletteColors, t, { lightToDark: true })

      const baseR = startR + t * (endR - startR) + prng.range(-0.03, 0.03) * (rSpan / count)
      const halfW = baseWidth * prng.range(0.86, 1.18) * 0.5

      const rAmp = minDim * 0.04 * heightFactor * prng.range(0.8, 1.2)
      const phase = prng.range(0, Math.PI * 2)

      const centerLine: Point[] = []
      for (let s = 0; s <= steps; s++) {
        const u = s / steps
        const ang = minAngle + u * (maxAngle - minAngle)
        const r = baseR + Math.sin(u * Math.PI * 1.1 + phase) * rAmp
        const cx = cornerX + Math.cos(ang) * r
        const cy = cornerY + Math.sin(ang) * r
        centerLine.push({ x: cx, y: cy })
      }

      const topPts: Point[] = []
      const botPts: Point[] = []
      for (let s = 0; s <= steps; s++) {
        const u = s / steps
        const pt = centerLine[s]
        let tx = 0
        let ty = 0
        if (s === 0) {
          tx = centerLine[1].x - centerLine[0].x
          ty = centerLine[1].y - centerLine[0].y
        } else if (s === steps) {
          tx = centerLine[steps].x - centerLine[steps - 1].x
          ty = centerLine[steps].y - centerLine[steps - 1].y
        } else {
          tx = centerLine[s + 1].x - centerLine[s - 1].x
          ty = centerLine[s + 1].y - centerLine[s - 1].y
        }
        const tLen = Math.hypot(tx, ty) || 1
        const nx = -ty / tLen
        const ny = tx / tLen

        const wMod = 1.0 + Math.sin(u * Math.PI + i * 0.5) * 0.1
        const hw = halfW * wMod

        topPts.push({ x: safeNum(pt.x + nx * hw, pt.x), y: safeNum(pt.y + ny * hw, pt.y) })
        botPts.push({ x: safeNum(pt.x - nx * hw, pt.x), y: safeNum(pt.y - ny * hw, pt.y) })
      }

      const ribbonPolygon: Point[] = [...topPts, ...botPts.reverse()]
      const d = pointsToSmoothPath(ribbonPolygon, tension, true)
      layers.push({
        id: `stripes-ribbon-${i}`,
        d,
        fill: fillColor,
        opacity: safeNum(0.88 + t * 0.12, 1),
      })
    }
  } else {
    // === ARCHETYPE 3: ARCHITECTURAL S-CURVE FLOW ===
    const coverage = 0.72 + spacingFactor * 0.2
    const startMargin = h * (0.5 - coverage * 0.5)
    const endMargin = h * (0.5 + coverage * 0.5)
    const span = endMargin - startMargin
    const baseWidth = (span / count) * 0.44 * heightFactor
    const direction = prng.bool(0.5) ? 1 : -1

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1)
      const fillColor = samplePalette(paletteColors, t, { lightToDark: true })

      const basePos = startMargin + t * span + prng.range(-0.03, 0.03) * (span / count)
      const halfW = baseWidth * prng.range(0.86, 1.18) * 0.5

      const sAmp = h * 0.1 * heightFactor * prng.range(0.85, 1.15) * direction

      const centerLine: Point[] = []
      for (let s = 0; s <= steps; s++) {
        const u = s / steps
        const lx = -w * 0.15 + u * (w * 1.3)
        const sOffset = Math.pow(u - 0.5, 3) * 4 * sAmp
        const ly = basePos + sOffset
        centerLine.push({ x: lx, y: ly })
      }

      const topPts: Point[] = []
      const botPts: Point[] = []
      for (let s = 0; s <= steps; s++) {
        const u = s / steps
        const pt = centerLine[s]
        let tx = 0
        let ty = 0
        if (s === 0) {
          tx = centerLine[1].x - centerLine[0].x
          ty = centerLine[1].y - centerLine[0].y
        } else if (s === steps) {
          tx = centerLine[steps].x - centerLine[steps - 1].x
          ty = centerLine[steps].y - centerLine[steps - 1].y
        } else {
          tx = centerLine[s + 1].x - centerLine[s - 1].x
          ty = centerLine[s + 1].y - centerLine[s - 1].y
        }
        const tLen = Math.hypot(tx, ty) || 1
        const nx = -ty / tLen
        const ny = tx / tLen

        const wMod = 1.0 + Math.sin(u * Math.PI + i * 0.5) * 0.1
        const hw = halfW * wMod

        topPts.push({ x: safeNum(pt.x + nx * hw, pt.x), y: safeNum(pt.y + ny * hw, pt.y) })
        botPts.push({ x: safeNum(pt.x - nx * hw, pt.x), y: safeNum(pt.y - ny * hw, pt.y) })
      }

      const ribbonPolygon: Point[] = [...topPts, ...botPts.reverse()]
      const d = pointsToSmoothPath(ribbonPolygon, tension, true)
      layers.push({
        id: `stripes-ribbon-${i}`,
        d,
        fill: fillColor,
        opacity: safeNum(0.88 + t * 0.12, 1),
      })
    }
  }

  return layers
}
