import { GeneratorContext, GeneratedLayer } from "./types"
import { createPRNG } from "./prng"
import { safeNum } from "./sanitize"
import { samplePalette } from "./colors"

/**
 * Premium Minimal Arcs Engine (Phase 4 - Reference-Grade Oversized Arcs)
 *
 * Generates oversized, monumental geometric arc wallpapers inspired by classic
 * Swiss/Bauhaus minimalist posters:
 * 1. Oversized Geometry & Canvas Overscan:
 *    - The arc structure is intentionally scaled so its outer radius is larger than
 *      the visible canvas area (spanning 60-120% of canvas dimensions).
 *    - Bands enter and exit through canvas edges and corners, with only a portion
 *      of the full circular structure visible within the viewport.
 *    - Leaves generous, serene negative space in the region opposite the arc mass.
 * 2. 8 Controlled Compositional Archetypes (governed deterministically by seed):
 *    - 0: Bottom-left corner arc (sweeping up and right across the frame)
 *    - 1: Bottom-right corner arc (sweeping up and left across the frame)
 *    - 2: Top-left corner arc (hanging vault curving down and right)
 *    - 3: Top-right corner arc (hanging vault curving down and left)
 *    - 4: Left-edge vertical arc (monumental semi-circular portal from left edge)
 *    - 5: Right-edge vertical arc (monumental semi-circular portal from right edge)
 *    - 6: Large diagonal crescent (broad sweeping ribbon cutting diagonally)
 *    - 7: Bottom/side horizontal gateway (grand ascending arch rising from horizon)
 * 3. Cohesive Nested Bands:
 *    - 4 to 6 concentric bands sharing the EXACT same geometric center of curvature.
 *    - Strictly consistent radial spacing and uniform band thickness across all bands.
 *    - Identical angular span with aligned flush terminations extending off-canvas.
 * 4. Clean SVG Geometry & Responsive Quality:
 *    - True mathematical circular curvature (rX = rY) with zero distortion.
 *    - Proportional scaling across portrait, landscape, and square viewports.
 *    - 100% byte-for-byte deterministic rendering for identical seeds and parameters.
 */
export function generateArcs(ctx: GeneratorContext): GeneratedLayer[] {
  const { width: w, height: h, config, paletteColors } = ctx
  const { layerCount, height: heightParam, spacing: spacingParam, smoothness } = config.parameters
  const { seed } = config.advanced

  const layers: GeneratedLayer[] = []
  // Clamped layer count: approximately 4-6 bands (default 5, supports 3-8)
  const count = Math.max(3, Math.min(8, layerCount))
  const isLandscape = w > h

  const prng = createPRNG(seed)

  // 1. COMPOSITIONAL ARCHETYPE SELECTION
  // The seed deterministically picks one of the 8 signature composition archetypes
  const archetype = prng.int(0, 7)

  let anchorX = 0
  let anchorY = 0
  let baseStartAngle = 0
  let baseSweep = 0

  switch (archetype) {
    case 0: // Bottom-Left Corner Arc
      anchorX = w * prng.range(-0.08, 0.04)
      anchorY = h * prng.range(0.96, 1.08)
      baseStartAngle = -Math.PI * prng.range(0.53, 0.57)
      baseSweep = Math.PI * prng.range(0.56, 0.66)
      break

    case 1: // Bottom-Right Corner Arc
      anchorX = w * prng.range(0.96, 1.08)
      anchorY = h * prng.range(0.96, 1.08)
      baseStartAngle = Math.PI * prng.range(0.93, 0.97)
      baseSweep = Math.PI * prng.range(0.56, 0.66)
      break

    case 2: // Top-Left Corner Arc (Hanging Vault)
      anchorX = w * prng.range(-0.08, 0.04)
      anchorY = h * prng.range(-0.08, 0.04)
      baseStartAngle = -Math.PI * prng.range(0.06, 0.10)
      baseSweep = Math.PI * prng.range(0.56, 0.66)
      break

    case 3: // Top-Right Corner Arc (Hanging Vault)
      anchorX = w * prng.range(0.96, 1.08)
      anchorY = h * prng.range(-0.08, 0.04)
      baseStartAngle = Math.PI * prng.range(0.40, 0.44)
      baseSweep = Math.PI * prng.range(0.56, 0.66)
      break

    case 4: // Left-Edge Vertical Arc (Monumental Portal)
      anchorX = w * prng.range(-0.14, -0.02)
      anchorY = h * prng.range(0.42, 0.58)
      baseStartAngle = -Math.PI * prng.range(0.52, 0.55)
      baseSweep = Math.PI * prng.range(1.02, 1.10)
      break

    case 5: // Right-Edge Vertical Arc (Monumental Portal)
      anchorX = w * prng.range(1.02, 1.14)
      anchorY = h * prng.range(0.42, 0.58)
      baseStartAngle = Math.PI * prng.range(0.45, 0.48)
      baseSweep = Math.PI * prng.range(1.02, 1.10)
      break

    case 6: // Large Diagonal Crescent
      {
        const fromLeft = prng.bool(0.5)
        anchorX = fromLeft
          ? -w * prng.range(0.20, 0.35)
          : w * prng.range(1.20, 1.35)
        anchorY = h * prng.range(0.38, 0.62)
        baseStartAngle = fromLeft ? -Math.PI * 0.40 : Math.PI * 0.60
        baseSweep = Math.PI * prng.range(0.72, 0.85)
      }
      break

    case 7: // Bottom/Side Horizontal Gateway
    default:
      anchorX = w * prng.range(0.46, 0.54)
      anchorY = h * prng.range(1.02, 1.12)
      baseStartAngle = -Math.PI * prng.range(1.02, 1.06)
      baseSweep = Math.PI * prng.range(1.04, 1.12)
      break
  }

  // Smoothness modifies opening angle / sweep breadth (clean, large angular sweep)
  const sweepMod = 0.85 + (smoothness / 100) * 0.30
  const finalSweep = Math.max(
    Math.PI * 0.45,
    Math.min(Math.PI * 1.35, baseSweep * sweepMod)
  )

  // 2. OVERSIZED GEOMETRY & CANVAS OVERSCAN
  // Scale ratio based on Height parameter (default 45%, range 20% to 100%)
  const scaleRatio = 0.55 + (heightParam / 100) * 0.50
  const baseDim = isLandscape ? Math.max(w * 0.70, h * 1.10) : h * 0.85
  const maxRadius = baseDim * scaleRatio * prng.range(0.96, 1.04)

  // 3. NESTED BANDS: CONSISTENT RADIAL SPACING & UNIFORM THICKNESS
  // Spacing parameter governs gap ratio vs band thickness
  const spacingRatio = 0.20 + (spacingParam / 100) * 0.50
  const totalRadialSpan = maxRadius * (0.35 + (1 - spacingRatio * 0.45) * 0.26)
  const bandStep = totalRadialSpan / count
  const bandThickness = Math.max(18, bandStep * (1 - spacingRatio * 0.50))

  for (let layerIdx = 0; layerIdx < count; layerIdx++) {
    // Normalization t: 0 (outermost arc) to 1 (innermost arc)
    const t = count === 1 ? 0 : layerIdx / (count - 1)

    // Atmospheric palette mapping across bands with clear tonal separation
    const fillColor = samplePalette(paletteColors, t, { lightToDark: true })

    // Concentric radial boundaries: all bands share the exact same geometric center
    const rOuter = maxRadius - layerIdx * bandStep
    const rInner = Math.max(16, rOuter - bandThickness)

    // All bands share the exact same angular start and sweep for clean flush alignment
    const startAngle = baseStartAngle
    const endAngle = startAngle + finalSweep

    // Calculate outer arc endpoints
    const x1 = anchorX + Math.cos(startAngle) * rOuter
    const y1 = anchorY + Math.sin(startAngle) * rOuter
    const x2 = anchorX + Math.cos(endAngle) * rOuter
    const y2 = anchorY + Math.sin(endAngle) * rOuter

    // Calculate inner arc endpoints
    const x3 = anchorX + Math.cos(endAngle) * rInner
    const y3 = anchorY + Math.sin(endAngle) * rInner
    const x4 = anchorX + Math.cos(startAngle) * rInner
    const y4 = anchorY + Math.sin(startAngle) * rInner

    const largeArcFlag = finalSweep > Math.PI ? 1 : 0

    // Construct mathematically precise closed SVG annular sector path:
    // M (x1, y1) -> Outer Arc to (x2, y2) -> Line to (x3, y3) -> Inner Arc to (x4, y4) -> Close Z
    const pathD = [
      `M ${safeNum(x1, anchorX).toFixed(2)} ${safeNum(y1, anchorY).toFixed(2)}`,
      `A ${safeNum(rOuter, 100).toFixed(2)} ${safeNum(rOuter, 100).toFixed(2)} 0 ${largeArcFlag} 1 ${safeNum(x2, anchorX).toFixed(2)} ${safeNum(y2, anchorY).toFixed(2)}`,
      `L ${safeNum(x3, anchorX).toFixed(2)} ${safeNum(y3, anchorY).toFixed(2)}`,
      `A ${safeNum(rInner, 50).toFixed(2)} ${safeNum(rInner, 50).toFixed(2)} 0 ${largeArcFlag} 0 ${safeNum(x4, anchorX).toFixed(2)} ${safeNum(y4, anchorY).toFixed(2)}`,
      `Z`,
    ].join(" ")

    const opacity = safeNum(0.85 + t * 0.15, 1, 0.1, 1)

    layers.push({
      id: `arcs-layer-${layerIdx}`,
      d: pathD,
      fill: fillColor,
      opacity,
    })
  }

  return layers
}
