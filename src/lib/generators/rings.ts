import { GeneratorContext, GeneratedLayer } from "./types"
import { createPRNG } from "./prng"
import { safeNum } from "./sanitize"
import { samplePalette } from "./colors"

/**
 * Premium Minimal Rings Engine (Phase 6 - Curated Procedural Radial Compositions)
 *
 * Transforms Rings from a simple centered bullseye into high-end abstract radial wallpaper art:
 * 1. 8 Controlled Composition Archetypes (Governed Deterministically by Seed):
 *    - 0: Centered Radial (calm, meditative, spacious central balance)
 *    - 1: Off-Center Left (asymmetric modern balance with open right field)
 *    - 2: Off-Center Right (asymmetric modern balance with open left field)
 *    - 3: Upper-Left / Upper-Right (celestial lunar/solar placement)
 *    - 4: Lower-Left / Lower-Right (grounded terrestrial radial presence)
 *    - 5: Large Side-Entering Rings (monumental circular segments entering lateral edge)
 *    - 6: Huge Partially Off-Canvas Composition (curved architectural sweeps crossing canvas)
 *    - 7: Diagonal Radial Sweep (corner-anchored concentric waves traversing the frame)
 * 2. Visual Hierarchy & Controlled Variation:
 *    - Non-linear radial spacing gives breathing room and photographic depth.
 *    - Controlled sinusoidal thickness variation creates rich visual rhythm without noisy clutter.
 * 3. Responsive Scaling & Clean SVG Geometry:
 *    - Adapts proportionally to portrait, landscape, and square viewports.
 *    - Mathematically pristine 2-circle annular SVG paths with zero clipping glitches.
 *    - 100% byte-for-byte deterministic rendering for identical seeds and parameters.
 */
export function generateRings(ctx: GeneratorContext): GeneratedLayer[] {
  const { width: w, height: h, config, paletteColors } = ctx
  const { layerCount, height: heightParam, spacing: spacingParam, smoothness } = config.parameters
  const { seed, depthVariation } = config.advanced

  const layers: GeneratedLayer[] = []
  const count = Math.max(2, Math.min(10, layerCount))

  const prng = createPRNG(seed)
  const minDim = Math.min(w, h)
  const maxDim = Math.max(w, h)
  const isLandscape = w > h

  // 1. SELECT COMPOSITION ARCHETYPE
  // 8 seed-determined composition types
  const archetype = prng.int(0, 7)

  let anchorX = w * 0.5
  let anchorY = h * 0.5
  let baseRadius = minDim * 0.45

  switch (archetype) {
    case 0: // Centered Radial
      anchorX = w * 0.5
      anchorY = h * 0.5
      baseRadius = minDim * 0.46
      break

    case 1: // Off-Center Left
      anchorX = w * prng.range(0.28, 0.36)
      anchorY = h * prng.range(0.44, 0.56)
      baseRadius = minDim * 0.48
      break

    case 2: // Off-Center Right
      anchorX = w * prng.range(0.64, 0.72)
      anchorY = h * prng.range(0.44, 0.56)
      baseRadius = minDim * 0.48
      break

    case 3: { // Upper-Left / Upper-Right (Celestial)
      const isLeft = prng.bool(0.5)
      anchorX = isLeft
        ? w * prng.range(0.24, 0.32)
        : w * prng.range(0.68, 0.76)
      anchorY = h * prng.range(0.22, 0.30)
      baseRadius = minDim * 0.45
      break
    }

    case 4: { // Lower-Left / Lower-Right (Grounded)
      const isLeft = prng.bool(0.5)
      anchorX = isLeft
        ? w * prng.range(0.24, 0.32)
        : w * prng.range(0.68, 0.76)
      anchorY = h * prng.range(0.70, 0.78)
      baseRadius = minDim * 0.45
      break
    }

    case 5: { // Large Side-Entering Rings
      const isLeft = prng.bool(0.5)
      anchorX = isLeft
        ? w * prng.range(-0.04, 0.04)
        : w * prng.range(0.96, 1.04)
      anchorY = h * prng.range(0.40, 0.60)
      baseRadius = minDim * (isLandscape ? 0.70 : 0.82)
      break
    }

    case 6: { // Huge Partially Off-Canvas Radial Composition
      const isLeft = prng.bool(0.5)
      const isTop = prng.bool(0.5)
      anchorX = isLeft
        ? -w * prng.range(0.10, 0.20)
        : w * prng.range(1.10, 1.20)
      anchorY = isTop
        ? -h * prng.range(0.06, 0.12)
        : h * prng.range(1.06, 1.12)
      baseRadius = maxDim * 0.95
      break
    }

    case 7:
    default: { // Diagonal Radial Sweep
      const isBL = prng.bool(0.5)
      anchorX = isBL
        ? w * prng.range(0.04, 0.12)
        : w * prng.range(0.88, 0.96)
      anchorY = isBL
        ? h * prng.range(0.88, 0.96)
        : h * prng.range(0.04, 0.12)
      baseRadius = maxDim * 0.88
      break
    }
  }

  // Max outer ring radius governed by Height parameter
  const maxRadius =
    baseRadius * (0.60 + (heightParam / 100) * 0.50)

  // Spacing parameter controls the total span and gap ratio
  const spacingRatio = 0.25 + (spacingParam / 100) * 0.65
  const minInnerRadius = Math.max(16, minDim * 0.04)
  const totalRadialSpan =
    maxRadius * (0.38 + (1 - spacingRatio * 0.45) * 0.32)

  // Subtle organic eccentric drift per layer along depthVariation vector
  const driftAngle = prng.range(0, Math.PI * 2)
  const maxDrift = minDim * 0.05 * (depthVariation / 100)

  for (let layerIdx = 0; layerIdx < count; layerIdx++) {
    // Normalization t: 0 (outermost ring) to 1 (innermost ring)
    const t = count === 1 ? 0 : layerIdx / (count - 1)

    // Palette ordering: background is softer, foreground is crisp and rich
    const fillColor = samplePalette(paletteColors, t, { lightToDark: true })

    // Non-linear power progression for elegant breathing room between rings
    const progress = Math.pow(t, 0.88 + (1 - spacingRatio) * 0.28)
    const rOuter = maxRadius - progress * totalRadialSpan * 0.90

    // Controlled, smooth variation in band thickness: mix of bold anchors and refined tracks
    const baseThickness =
      (totalRadialSpan / count) * (0.38 + (smoothness / 100) * 0.38)
    const thicknessScale = 0.84 + Math.sin(t * Math.PI) * 0.32
    const thickness = Math.max(
      minDim * 0.015,
      Math.min(rOuter - minInnerRadius * 0.5, baseThickness * thicknessScale)
    )
    const rInner = Math.max(minInnerRadius, rOuter - thickness)

    // Subtle eccentric offset along driftAngle gives depth while preserving concentric identity
    const layerDrift = Math.pow(t, 1.4) * maxDrift
    const cx = anchorX + Math.cos(driftAngle) * layerDrift
    const cy = anchorY + Math.sin(driftAngle) * layerDrift

    // Mathematically clean, standard 2-circle annular SVG path
    // Outer circle (clockwise) + Inner circle (counter-clockwise)
    const pathD = [
      `M ${safeNum(cx, 0).toFixed(2)} ${safeNum(cy - rOuter, 0).toFixed(2)}`,
      `A ${safeNum(rOuter, 50).toFixed(2)} ${safeNum(rOuter, 50).toFixed(2)} 0 1 1 ${safeNum(cx, 0).toFixed(2)} ${safeNum(cy + rOuter, 0).toFixed(2)}`,
      `A ${safeNum(rOuter, 50).toFixed(2)} ${safeNum(rOuter, 50).toFixed(2)} 0 1 1 ${safeNum(cx, 0).toFixed(2)} ${safeNum(cy - rOuter, 0).toFixed(2)}`,
      `Z`,
      `M ${safeNum(cx, 0).toFixed(2)} ${safeNum(cy - rInner, 0).toFixed(2)}`,
      `A ${safeNum(rInner, 25).toFixed(2)} ${safeNum(rInner, 25).toFixed(2)} 0 1 0 ${safeNum(cx, 0).toFixed(2)} ${safeNum(cy + rInner, 0).toFixed(2)}`,
      `A ${safeNum(rInner, 25).toFixed(2)} ${safeNum(rInner, 25).toFixed(2)} 0 1 0 ${safeNum(cx, 0).toFixed(2)} ${safeNum(cy - rInner, 0).toFixed(2)}`,
      `Z`,
    ].join(" ")

    const opacity = safeNum(0.85 + t * 0.15, 1, 0.1, 1)

    layers.push({
      id: `rings-layer-${layerIdx}`,
      d: pathD,
      fill: fillColor,
      opacity,
    })
  }

  return layers
}
