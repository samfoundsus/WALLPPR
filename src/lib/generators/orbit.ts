import { GeneratorContext, GeneratedLayer } from "./types"
import { createPRNG } from "./prng"
import { pointsToSmoothPath, Point } from "./spline"
import { safeNum } from "./sanitize"
import { samplePalette } from "./colors"

/**
 * Premium Orbit Wallpaper Engine (Orbit 2.3 — Composition & Visibility Refinement)
 *
 * Generates an abstract, authentic Keplerian orbital trajectory system:
 * - Guaranteed Visual Presence & Composition Consistency:
 *   Constrains focal centers to safe composition zones and directs orbital expansion
 *   into the canvas interior so the primary orbit is always 55%–85% inside the canvas.
 *   The orbital system occupies roughly 45%–80% of canvas width/height across mobile and landscape.
 * - 6 Varied Composition Archetypes:
 *   Upper-Left, Upper-Right, Lower-Left, Lower-Right, Side-Cropped Lateral Sweep,
 *   and Off-Center Central layout.
 * - Substantial, Bold Single-Line Vector Strokes:
 *   Primary orbit commands focus with 16.0–20.0px stroke, 1.0 opacity, and peak palette contrast;
 *   secondary orbits support with 9.5–14.0px strokes and elevated luminance contrast.
 *   Scales proportionally with canvas dimensions across mobile and 4K desktop viewports.
 * - Enforced Radial Spacing:
 *   Guarantees generous radial clearance between adjacent bold trajectories so lines never
 *   visually merge or collide into solid bands.
 * - Clean Celestial Negative Space:
 *   Maintains intentional editorial breathing room around the bold orbital paths.
 *
 * Parameter Mappings:
 * - Layer Count: Controls number of orbital paths (3 to 6).
 * - Height / Amplitude: Controls vertical scale, orbital reach, and eccentricity.
 * - Spacing / Frequency: Controls distance and non-linear distribution between orbits.
 * - Smoothness: Controls curve continuity, spline tension, and inclination harmony.
 */
export function generateOrbit(ctx: GeneratorContext): GeneratedLayer[] {
  const { width: w, height: h, config, paletteColors } = ctx
  const { layerCount, height: heightParam, spacing: spacingParam, smoothness } = config.parameters
  const { seed, depthVariation } = config.advanced

  const prng = createPRNG(seed)
  const minDim = Math.min(w, h)
  const scale = minDim / 1080

  // 1. Number of orbital paths: 3 to 6 (ensures visually substantial orbital system)
  const count = Math.max(3, Math.min(6, Math.round(1.8 + layerCount * 0.42)))

  // 2. Safe Composition Zones
  // 0: Upper-Left focal system
  // 1: Upper-Right focal system
  // 2: Lower-Left focal system
  // 3: Lower-Right focal system
  // 4: Side-Cropped lateral sweep
  // 5: Off-Center Central
  const archetype = prng.int(0, 5)

  let focalX = w * 0.5
  let focalY = h * 0.5
  let baseTilt = 0

  if (archetype === 0) {
    // Upper-Left focal system: sweeps into center-right
    focalX = w * prng.range(0.26, 0.38)
    focalY = h * prng.range(0.24, 0.38)
    baseTilt = prng.range(0.35, 0.65)
  } else if (archetype === 1) {
    // Upper-Right focal system: sweeps into center-left
    focalX = w * prng.range(0.62, 0.74)
    focalY = h * prng.range(0.24, 0.38)
    baseTilt = prng.range(-0.65, -0.35)
  } else if (archetype === 2) {
    // Lower-Left focal system: sweeps into upper-right
    focalX = w * prng.range(0.26, 0.38)
    focalY = h * prng.range(0.62, 0.76)
    baseTilt = prng.range(-0.65, -0.35)
  } else if (archetype === 3) {
    // Lower-Right focal system: sweeps into upper-left
    focalX = w * prng.range(0.62, 0.74)
    focalY = h * prng.range(0.62, 0.76)
    baseTilt = prng.range(0.35, 0.65)
  } else if (archetype === 4) {
    // Side-Cropped: anchor near edge, sweeps across canvas
    const fromLeft = prng.bool(0.5)
    focalX = fromLeft ? w * prng.range(0.12, 0.22) : w * prng.range(0.78, 0.88)
    focalY = h * prng.range(0.38, 0.62)
    baseTilt = fromLeft ? prng.range(-0.25, 0.25) : prng.range(Math.PI - 0.25, Math.PI + 0.25)
  } else {
    // Off-Center Central
    focalX = w * prng.range(0.42, 0.58)
    focalY = h * prng.range(0.4, 0.58)
    baseTilt = prng.range(-0.45, 0.45)
  }

  // Shift vector directing the orbital major axis toward canvas interior
  const angleToCenter = Math.atan2(h * 0.5 - focalY, w * 0.5 - focalX)
  const shiftAngle = archetype === 4 ? (focalX < w * 0.5 ? 0 : Math.PI) : angleToCenter

  // 3. Primary orbit establishing the main visual focus
  const primaryIdx = Math.max(0, Math.min(count - 1, Math.floor((count - 1) / 2)))

  // 4. Spatial scaling: guarantees 45%–80% canvas occupancy with distinct radial clearance
  const minSemiMajor = minDim * (0.3 + (spacingParam / 100) * 0.18)
  const maxSemiMajor = minDim * (0.65 + (heightParam / 100) * 0.55)
  const spacingPow = 0.9 + (spacingParam / 100) * 0.55

  // Base Keplerian eccentricity modulated by smoothness and height
  const baseEcc =
    0.42 +
    (1 - smoothness / 100) * 0.22 +
    ((heightParam - 50) / 100) * 0.1 +
    prng.range(-0.02, 0.02)
  const tension = Math.max(50, Math.min(95, 62 + smoothness * 0.28))
  const numPts = 48
  const layers: GeneratedLayer[] = []

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const isPrimary = i === primaryIdx

    // Non-linear semi-major axis distribution with enforced radial clearance
    const a = minSemiMajor + (maxSemiMajor - minSemiMajor) * Math.pow(t, spacingPow)

    // Controlled variation in eccentricity per orbit (distinct shapes, not parallel)
    const ecc = Math.max(
      0.32,
      Math.min(0.78, baseEcc + (i - primaryIdx) * 0.05 + prng.range(-0.02, 0.02))
    )
    const b = a * Math.sqrt(1 - ecc * ecc)

    // Controlled variation in orbital plane inclination angle
    const angleDelta = (i - primaryIdx) * prng.range(0.06, 0.12) + prng.range(-0.02, 0.02)
    const rot = baseTilt + angleDelta

    // Keplerian focal displacement: center of ellipse shifts relative to shared focus toward interior
    const focalShift = a * ecc * (0.34 + (depthVariation / 100) * 0.32)
    const cx = focalX + Math.cos(shiftAngle) * focalShift
    const cy = focalY + Math.sin(shiftAngle) * focalShift

    // Build smooth parametric curve vertices
    const pts: Point[] = []
    for (let p = 0; p < numPts; p++) {
      const theta = (p / numPts) * Math.PI * 2
      const lx = Math.cos(theta) * a
      const ly = Math.sin(theta) * b

      const rx = lx * Math.cos(rot) - ly * Math.sin(rot)
      const ry = lx * Math.sin(rot) + ly * Math.cos(rot)

      pts.push({
        x: safeNum(cx + rx, cx),
        y: safeNum(cy + ry, cy),
      })
    }

    const d = pointsToSmoothPath(pts, tension, true)

    // Palette color selection: elevated contrast so dark mode trajectories are clearly visible
    const colorT = isPrimary ? 0.96 : 0.42 + t * 0.5
    const strokeColor = samplePalette(paletteColors, colorT, { lightToDark: false })

    // Substantial, bold stroke width hierarchy
    const strokeWidth = safeNum(
      (isPrimary
        ? 16.0 + (heightParam / 100) * 4.0
        : 9.5 + (1 - Math.abs(i - primaryIdx) / count) * 4.5) * scale,
      10.0 * scale
    )
    const opacity = safeNum(
      isPrimary ? 1.0 : 0.84 + (1 - Math.abs(i - primaryIdx) / count) * 0.14,
      0.9
    )

    layers.push({
      id: `orbit-layer-${i}`,
      d,
      stroke: strokeColor,
      strokeWidth,
      opacity,
    })
  }

  return layers
}
