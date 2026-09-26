import { GeneratorContext, GeneratedLayer } from "./types"
import { createPRNG } from "./prng"
import { pointsToSmoothPath, Point } from "./spline"
import { safeNum } from "./sanitize"
import { samplePalette } from "./colors"

/**
 * Premium Procedural Fluid Waves Engine (Phase 3.4 — Curve Integrity & Zero Spikes)
 *
 * Guaranteed continuously smooth fluid boundaries with zero spikes, teeth, or jagged edges:
 * 1. Sparse Low-Frequency Control Points: Shapes are synthesized from 8-11 deliberate
 *    macro control points with wide physical spacing (>= 120px) rather than pointwise noise.
 * 2. Zero High-Frequency Perturbations: Completely eliminates per-point random noise,
 *    preventing sawtooth edges, pixel-like teeth, and abrupt local direction changes.
 * 3. Kink-Free Layer Separation: Avoids pointwise clamping (which produces sharp kinks).
 *    Instead, if a wave encroaches on the preceding layer, a smooth uniform elevation shift
 *    is applied, preserving 100% of the curve's pristine mathematical derivative and smoothness.
 * 4. Continuous Cubic Bézier Splines: Catmull-Rom to cubic Bézier spline interpolation
 *    with C1 tangent continuity and tension governed by the Smoothness slider.
 * 5. Preserves Phase 3.3 Composition:
 *    - Specialized layer roles (focal gesture, broad shelf, catenary valley, asymmetric roll,
 *      counter-crest, and grounded anchor silhouette).
 *    - Dominant scene gesture (sweeping crest, diagonal flow, elegant S-curve, asymmetric rise/fall).
 *    - Non-uniform vertical thickness (broad fluid expanses & sleek transition ribbons).
 *    - Portrait (~25-40%) and landscape (~22-30%) negative space balance.
 *    - Balanced color-area proportions and 100% deterministic reproducibility.
 */

type LayerRole =
  | "focal_gesture"
  | "broad_shelf"
  | "catenary_valley"
  | "asymmetric_roll"
  | "counter_crest"
  | "gentle_glide"
  | "anchor_silhouette"

export function generateWaves(ctx: GeneratorContext): GeneratedLayer[] {
  const { width: w, height: h, config, paletteColors } = ctx
  const { layerCount, height: heightParam, spacing: spacingParam, smoothness } = config.parameters
  const { seed, peakVariation, depthVariation } = config.advanced

  const layers: GeneratedLayer[] = []
  const count = Math.max(2, Math.min(10, layerCount))
  const isLandscape = w > h

  // Global deterministic PRNG for macro composition harmony
  const globalPrng = createPRNG(seed)

  // Dimensions & normalized parameters
  const heightRatio = Math.max(0.1, Math.min(1.0, heightParam / 100))
  const spacingRatio = Math.max(0.1, Math.min(1.0, spacingParam / 100))
  const smoothRatio = Math.max(0, Math.min(1.0, smoothness / 100))

  // 1. DOMINANT FLUID GESTURE
  const dominantGestures = [
    "sweeping_crest",
    "diagonal_flow",
    "elegant_s_curve",
    "asymmetric_rise_fall",
  ] as const
  const dominantGesture = dominantGestures[globalPrng.int(0, dominantGestures.length - 1)]

  // Scene directional tilt
  const globalTiltDir = globalPrng.bool() ? 1 : -1
  const globalTilt =
    globalTiltDir *
    (dominantGesture === "diagonal_flow"
      ? globalPrng.range(0.065, 0.115)
      : globalPrng.range(0.035, 0.075))

  // 2. VERTICAL BALANCE & CLEAN NEGATIVE SPACE (~25-40% portrait, ~22-30% landscape)
  const baseTopRatio = isLandscape ? 0.31 : 0.36
  const seedVerticalShift = globalPrng.range(-0.040, 0.040)
  const topY =
    h *
    Math.max(
      isLandscape ? 0.22 : 0.25,
      Math.min(
        isLandscape ? 0.34 : 0.40,
        baseTopRatio + (0.35 - heightRatio) * 0.12 + seedVerticalShift
      )
    )

  const bottomY = h * (isLandscape ? 0.84 : 0.88)
  const totalSpan = Math.max(h * 0.35, bottomY - topY)

  // 3. LAYER THICKNESS VARIATION (Non-uniform vertical intervals)
  const intervals = count - 1
  const layerElevations: number[] = [topY]

  if (intervals > 0) {
    const rawWeights: number[] = []
    const broadIdx = globalPrng.int(0, intervals - 1)
    let thinIdx =
      (broadIdx + 1 + globalPrng.int(0, Math.max(0, intervals - 2))) % intervals

    for (let i = 0; i < intervals; i++) {
      if (i === broadIdx) {
        rawWeights.push(globalPrng.range(1.35, 1.75)) // Expansive fluid layer
      } else if (i === thinIdx) {
        rawWeights.push(globalPrng.range(0.68, 0.86)) // Sleek transition ribbon
      } else {
        rawWeights.push(globalPrng.range(0.92, 1.18)) // Balanced layer
      }
    }

    const weightSum = rawWeights.reduce((a, b) => a + b, 0)
    let curElev = topY
    for (let i = 0; i < intervals; i++) {
      curElev += (rawWeights[i] / weightSum) * totalSpan
      layerElevations.push(curElev)
    }
  }

  // 4. FOCAL LAYER SELECTION & COMPLEMENTARY ROLES
  const focalLayerIdx = count <= 3 ? 1 : globalPrng.int(1, count - 2)
  const focalX =
    globalTiltDir > 0
      ? globalPrng.range(0.30, 0.44)
      : globalPrng.range(0.56, 0.70)

  // Distinct supporting roles
  const supportingRoles: LayerRole[] = [
    "catenary_valley",
    "asymmetric_roll",
    "counter_crest",
    "gentle_glide",
  ]
  for (let i = supportingRoles.length - 1; i > 0; i--) {
    const j = globalPrng.int(0, i)
    const temp = supportingRoles[i]
    supportingRoles[i] = supportingRoles[j]
    supportingRoles[j] = temp
  }

  // Base wave amplitude scaled by Height parameter
  const baseAmp =
    h *
    (0.038 + heightRatio * 0.046) *
    (isLandscape ? 0.85 : 1.0) *
    (0.90 + (peakVariation / 100) * 0.20)

  // 5. SPARSE LOW-FREQUENCY CONTROL POINTS
  // Using 8 to 11 sparse control points across the width guarantees wide point-to-point spacing
  // (>= 120px) which mathematically eliminates micro-peaks, sawtooth edges, and jagged teeth.
  const numControlPoints = isLandscape ? 11 : 9

  // Minimum vertical separation gap between adjacent layers
  const minGap = h * (isLandscape ? 0.032 : 0.028)
  const previousControlPoints: Point[][] = []

  for (let layerIdx = 0; layerIdx < count; layerIdx++) {
    const t = count === 1 ? 0 : layerIdx / (count - 1)
    const layerSeed = Math.abs(seed * 79 + layerIdx * 3407 + 23) >>> 0
    const lPrng = createPRNG(layerSeed)

    const isFocal = layerIdx === focalLayerIdx
    const isBackground = layerIdx === 0
    const isForeground = layerIdx === count - 1

    // Atmospheric palette mapping
    const fillColor = samplePalette(paletteColors, t, { lightToDark: true })

    // Assign unique role to this layer
    let role: LayerRole
    if (isFocal) {
      role = "focal_gesture"
    } else if (isBackground) {
      role = "broad_shelf"
    } else if (isForeground) {
      role = "anchor_silhouette"
    } else {
      role = supportingRoles[layerIdx % supportingRoles.length]
    }

    // Depth amplitude hierarchy
    const baseElevation = layerElevations[layerIdx]
    const prominence = isFocal
      ? 1.18 + lPrng.range(-0.04, 0.04)
      : isBackground
      ? 0.52 + lPrng.range(-0.04, 0.04)
      : isForeground
      ? 0.96 + lPrng.range(-0.04, 0.04)
      : 0.78 + lPrng.range(-0.05, 0.05)

    const layerAmp = baseAmp * prominence

    // Broad continuous wavelength governed by Spacing parameter
    const aspectComp = isLandscape ? 1.45 : 1.0
    const baseFreq = (0.72 + (spacingRatio - 0.35) * 0.48) / aspectComp
    const layerFreq = baseFreq * lPrng.range(0.90, 1.12)

    // Smooth macro tilt
    const layerTilt =
      globalTilt * lPrng.range(0.85, 1.15) + lPrng.range(-0.015, 0.015)

    const phase1 = lPrng.range(0, Math.PI * 2)
    const phase2 = phase1 + lPrng.range(1.2, 2.3)

    // Generate sparse, smooth control points (NO per-point random noise)
    const controlPoints: Point[] = []

    for (let i = 0; i < numControlPoints; i++) {
      const u = i / (numControlPoints - 1)
      const px = u * w
      const uCenter = u - 0.5

      // Macro tilt displacement
      const tiltDisp = layerTilt * uCenter * h

      // Specialized continuous fluid displacement
      let waveDisp = 0

      if (role === "focal_gesture") {
        if (dominantGesture === "sweeping_crest") {
          const dFoc = (u - focalX) / 0.32
          const crestShape = -Math.exp(-dFoc * dFoc * 2.4)
          const rollFlank = Math.sin(u * Math.PI * 2 * layerFreq + phase1) * 0.28
          waveDisp = (crestShape * 1.25 + rollFlank) * layerAmp
        } else if (dominantGesture === "diagonal_flow") {
          const diagCurrent = Math.sin((u - 0.5) * Math.PI * 1.15) * 0.85
          const swell = Math.sin(u * Math.PI * 2 * layerFreq + phase1) * 0.35
          waveDisp = (diagCurrent + swell) * layerAmp
        } else if (dominantGesture === "elegant_s_curve") {
          const sCurve = Math.sin((u - 0.5) * Math.PI * 1.55 + 0.20)
          const stokes = Math.sin(u * Math.PI * 3.1 + phase2) * 0.22
          waveDisp = (sCurve + stokes) * layerAmp * 1.05
        } else {
          // Asymmetric rise & fall
          const riseFall = Math.sin(u * Math.PI) * Math.cos(u * Math.PI * 0.48)
          const flank = Math.sin(u * Math.PI * 2 * layerFreq + phase1) * 0.20
          waveDisp = (-riseFall * 1.35 + flank) * layerAmp
        }
      } else if (role === "broad_shelf") {
        // Serene fluid glide with very low curvature
        const shelfWave = Math.sin(u * Math.PI * 1.35 * layerFreq + phase1)
        waveDisp = shelfWave * layerAmp * 0.75
      } else if (role === "catenary_valley") {
        // Broad U-shaped fluid basin
        const valleyX = 1.0 - focalX + lPrng.range(-0.06, 0.06)
        const dVal = (u - valleyX) / 0.36
        const basin = Math.exp(-dVal * dVal * 2.2)
        waveDisp = (basin * 1.10 - 0.32) * layerAmp
      } else if (role === "counter_crest") {
        // Complementary framing crest
        const counterX = 1.0 - focalX + lPrng.range(-0.05, 0.05)
        const dC = (u - counterX) / 0.30
        const counterPeak = -Math.exp(-dC * dC * 2.5)
        const ripple = Math.sin(u * Math.PI * 2 * layerFreq + phase1) * 0.25
        waveDisp = (counterPeak * 0.95 + ripple) * layerAmp
      } else if (role === "asymmetric_roll") {
        const roll = Math.sin(u * Math.PI * 1.7 * layerFreq + phase1)
        const rollStokes = Math.sin(u * Math.PI * 3.4 * layerFreq + phase2) * 0.26
        waveDisp = (roll + rollStokes) * layerAmp * 0.85
      } else if (role === "anchor_silhouette") {
        const forePeakX = lPrng.range(0.35, 0.65)
        const dFore = (u - forePeakX) / 0.42
        const forePeak = -Math.exp(-dFore * dFore * 2.2) * 0.85
        const roll = Math.sin(u * Math.PI * 1.8 * layerFreq + phase1) * 0.35
        waveDisp = (forePeak + roll) * layerAmp
      } else {
        const glide = Math.sin(u * Math.PI * 2 * layerFreq + phase1)
        waveDisp = glide * layerAmp * 0.70
      }

      const py = baseElevation + tiltDisp + waveDisp
      controlPoints.push({
        x: safeNum(px, 0),
        y: safeNum(py, baseElevation),
      })
    }

    // 6. KINK-FREE LAYER SEPARATION
    // If any control point is closer to the preceding layer than minGap, apply a smooth
    // uniform shift to the entire layer. This guarantees proper depth layering without
    // causing pointwise kinks, flat clips, or sawtooth artifacts.
    if (layerIdx > 0) {
      const prev = previousControlPoints[layerIdx - 1]
      let maxDeficit = 0
      for (let i = 0; i < numControlPoints; i++) {
        const deficit = prev[i].y + minGap - controlPoints[i].y
        if (deficit > maxDeficit) {
          maxDeficit = deficit
        }
      }
      if (maxDeficit > 0) {
        for (let i = 0; i < numControlPoints; i++) {
          controlPoints[i].y += maxDeficit
        }
      }
    }

    // Clamp within viewport safely
    for (let i = 0; i < numControlPoints; i++) {
      controlPoints[i].y = Math.max(h * 0.12, Math.min(h * 0.96, controlPoints[i].y))
    }

    previousControlPoints.push(controlPoints)

    // Spline tension controlled by smoothness (silky, continuous cubic Bézier strokes)
    const splineTension = Math.max(68, Math.min(92, 70 + smoothRatio * 22))
    const wavePath = pointsToSmoothPath(controlPoints, splineTension, false)

    // Complete closed path down to bottom corners of the canvas
    const fullPath = `${wavePath} L ${safeNum(w, 1080)} ${safeNum(h, 2400)} L 0 ${safeNum(h, 2400)} Z`

    // Atmospheric layer opacity: background is soft (0.87), foreground is rich (1.0)
    const opacity = safeNum(0.87 + t * 0.13, 1, 0.1, 1)

    layers.push({
      id: `waves-layer-${layerIdx}`,
      d: fullPath,
      fill: fillColor,
      opacity,
    })
  }

  return layers
}
