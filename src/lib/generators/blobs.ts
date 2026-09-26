import { GeneratorContext, GeneratedLayer } from "./types"
import { createPRNG } from "./prng"
import { pointsToSmoothPath, Point } from "./spline"
import { safeNum } from "./sanitize"
import { samplePalette } from "./colors"

/**
 * Premium Minimal Blobs Engine (Phase 5 - Composition & Depth Refinement)
 *
 * Generates editorial-grade abstract organic wallpaper compositions:
 * 1. Intentional 2D Spatial Distribution (No Vertical Chains/Columns):
 *    - Uses 4 distinct compositional archetypes:
 *      • Corner Anchor & Diagonal Satellites
 *      • Asymmetric Triadic Balance
 *      • Lateral Edge Mass & Floating Field
 *      • Off-Center Organic Constellation
 *    - Blobs are naturally distributed across X and Y with intentional negative space (~35-55%).
 * 2. Visual Hierarchy & Depth:
 *    - Background blobs (layer 0) are grand, dominant anchors (often partially overshooting edges),
 *      rendered with softer/lighter atmospheric tones.
 *    - Foreground blobs (layer count - 1) are compact, punchy accents providing focal contrast.
 *    - Midground forms bridge the depth with varied eccentricities and complementary scales.
 * 3. Asymmetric Organic Contours:
 *    - Multi-frequency organic lobes (3 to 6 lobes) and directional bean/pebble bulges.
 *    - Varied aspect ratios (0.65 to 1.55) and free rotations (0 to 2π).
 *    - Zero circles, capsules, or identical repeated silhouettes.
 * 4. Responsive & Deterministic:
 *    - Proportional layout and radius scaling for portrait, landscape, and square viewports.
 *    - 100% byte-for-byte deterministic rendering for identical seeds and parameters.
 */
export function generateBlobs(ctx: GeneratorContext): GeneratedLayer[] {
  const { width: w, height: h, config, paletteColors } = ctx
  const { layerCount, height: heightParam, spacing: spacingParam, smoothness } = config.parameters
  const { seed, peakVariation, depthVariation, pathComplexity } = config.advanced

  const layers: GeneratedLayer[] = []
  const count = Math.max(2, Math.min(10, layerCount))

  const prng = createPRNG(seed)
  const minDim = Math.min(w, h)

  // Overall blob scale governed by height parameter (from 16% to 52% of canvas min dimension)
  const baseBlobRadius = minDim * (0.16 + (heightParam / 100) * 0.36)

  // Spacing parameter controls spatial dispersion vs intimate clustering
  const spread = 0.25 + (spacingParam / 100) * 0.65

  // Smoothness ratio in [0, 1]
  const smoothRatio = Math.max(0, Math.min(1, smoothness / 100))

  interface BlobDef {
    cx: number
    cy: number
    rx: number
    ry: number
    rotation: number
    numLobes: number
    asymmetry: number
  }

  // 1. SELECT COMPOSITION ARCHETYPE
  // 0: Corner Anchor & Diagonal Satellites
  // 1: Asymmetric Triadic Balance
  // 2: Lateral Edge Mass & Floating Field
  // 3: Off-Center Organic Constellation
  const archetype = prng.int(0, 3)

  interface CenterCandidate {
    cx: number
    cy: number
    scale: number
  }

  const centers: CenterCandidate[] = []

  switch (archetype) {
    case 0: {
      // Corner Anchor & Diagonal Satellites
      const corner = prng.int(0, 3)
      // 0: Bottom-Left -> Top-Right, 1: Bottom-Right -> Top-Left
      // 2: Top-Left -> Bottom-Right, 3: Top-Right -> Bottom-Left
      const startX = corner === 0 || corner === 2 ? 0.16 : 0.84
      const startY = corner === 0 || corner === 1 ? 0.84 : 0.16
      const endX = 1 - startX
      const endY = 1 - startY

      // Grand background anchor
      centers.push({
        cx: (startX + prng.range(-0.05, 0.05)) * w,
        cy: (startY + prng.range(-0.05, 0.05)) * h,
        scale: 1.35 + prng.range(-0.08, 0.12),
      })

      // Supporting shapes along an asymmetric diagonal trajectory
      for (let i = 1; i < count; i++) {
        const t = i / (count - 0.4)
        const midX = startX + (endX - startX) * (t * spread)
        const midY = startY + (endY - startY) * (t * spread)
        const perpX = -(endY - startY) * prng.range(-0.25, 0.25) * spread
        const perpY = (endX - startX) * prng.range(-0.25, 0.25) * spread
        centers.push({
          cx: Math.max(w * 0.08, Math.min(w * 0.92, (midX + perpX) * w)),
          cy: Math.max(h * 0.08, Math.min(h * 0.92, (midY + perpY) * h)),
          scale: Math.max(0.48, 1.15 - t * 0.55 + prng.range(-0.08, 0.08)),
        })
      }
      break
    }

    case 1: {
      // Asymmetric Triadic Balance
      const flipX = prng.bool(0.5)
      const flipY = prng.bool(0.5)
      const basePoints = [
        { x: flipX ? 0.72 : 0.28, y: flipY ? 0.70 : 0.30, scale: 1.30 },
        { x: flipX ? 0.28 : 0.72, y: flipY ? 0.40 : 0.60, scale: 0.95 },
        { x: flipX ? 0.62 : 0.38, y: flipY ? 0.22 : 0.78, scale: 0.80 },
        { x: flipX ? 0.38 : 0.62, y: flipY ? 0.85 : 0.15, scale: 0.60 },
        { x: 0.50, y: 0.50, scale: 0.50 },
        { x: flipX ? 0.80 : 0.20, y: 0.50, scale: 0.55 },
      ]

      for (let i = 0; i < count; i++) {
        const bp = basePoints[i % basePoints.length]
        const jx = prng.range(-0.08, 0.08) * spread
        const jy = prng.range(-0.08, 0.08) * spread
        centers.push({
          cx: Math.max(w * 0.08, Math.min(w * 0.92, (bp.x + jx) * w)),
          cy: Math.max(h * 0.08, Math.min(h * 0.92, (bp.y + jy) * h)),
          scale: bp.scale + prng.range(-0.06, 0.06),
        })
      }
      break
    }

    case 2: {
      // Lateral Edge Mass & Floating Field
      const onLeft = prng.bool(0.5)
      const edgeX = onLeft ? 0.10 : 0.90
      const edgeY = prng.range(0.38, 0.62)

      centers.push({
        cx: (edgeX + prng.range(-0.04, 0.04)) * w,
        cy: (edgeY + prng.range(-0.06, 0.06)) * h,
        scale: 1.45 + prng.range(-0.08, 0.12),
      })

      const fieldX = onLeft ? 0.68 : 0.32
      const fieldSlots = [
        { y: 0.25, s: 0.95 },
        { y: 0.72, s: 0.85 },
        { y: 0.48, s: 0.60 },
        { y: 0.88, s: 0.55 },
        { y: 0.12, s: 0.50 },
      ]

      for (let i = 1; i < count; i++) {
        const slot = fieldSlots[(i - 1) % fieldSlots.length]
        const jx = prng.range(-0.10, 0.10) * spread
        const jy = prng.range(-0.06, 0.06) * spread
        centers.push({
          cx: Math.max(w * 0.08, Math.min(w * 0.92, (fieldX + jx) * w)),
          cy: Math.max(h * 0.08, Math.min(h * 0.92, (slot.y + jy) * h)),
          scale: slot.s + prng.range(-0.06, 0.06),
        })
      }
      break
    }

    case 3:
    default: {
      // Off-Center Organic Constellation
      const clusterX = prng.range(0.35, 0.65)
      const clusterY = prng.range(0.40, 0.60)

      centers.push({
        cx: (clusterX + prng.range(-0.08, 0.08)) * w,
        cy: (clusterY + prng.range(-0.08, 0.08)) * h,
        scale: 1.35,
      })

      for (let i = 1; i < count; i++) {
        const angle = (i / (count - 1)) * Math.PI * 2 + prng.range(-0.35, 0.35)
        const dist = (0.20 + (i / count) * 0.25) * spread
        const cx = Math.max(
          w * 0.08,
          Math.min(w * 0.92, (clusterX + Math.cos(angle) * dist) * w)
        )
        const cy = Math.max(
          h * 0.08,
          Math.min(
            h * 0.92,
            (clusterY + Math.sin(angle) * dist * (h / w)) * h
          )
        )
        centers.push({
          cx,
          cy,
          scale: Math.max(0.48, 1.10 - (i / count) * 0.55),
        })
      }
      break
    }
  }

  // 2. CONSTRUCT INDIVIDUAL ORGANIC BLOB DEFINITIONS
  const blobDefs: BlobDef[] = []

  for (let i = 0; i < count; i++) {
    const blobSeed = Math.abs(seed * 67 + i * 2903 + 53) >>> 0
    const blobPrng = createPRNG(blobSeed)

    const center = centers[i]

    // Scale variation: depth-ordered hierarchy modulated by peakVariation
    const blobSize =
      baseBlobRadius *
      center.scale *
      (0.92 + blobPrng.range(0, 0.16) * (1 + (peakVariation / 100) * 0.25))

    // Non-circular aspect ratio (eccentricity): beans, pebbles, and organic masses
    const aspect = blobPrng.range(0.68, 1.48)
    const rx = blobSize * (aspect >= 1 ? aspect : 1)
    const ry = blobSize * (aspect < 1 ? 1 / aspect : 1)

    // Free rotation angle
    const rotation = blobPrng.range(0, Math.PI * 2)

    blobDefs.push({
      cx: center.cx,
      cy: center.cy,
      rx,
      ry,
      rotation,
      numLobes: blobPrng.int(3, 6),
      asymmetry: 0.16 + (peakVariation / 100) * 0.32,
    })
  }

  // 3. GENERATE SMOOTH ASYMMETRIC ORGANIC PERIMETERS
  for (let layerIdx = 0; layerIdx < count; layerIdx++) {
    const t = count === 1 ? 0 : layerIdx / (count - 1)
    const def = blobDefs[layerIdx]

    const layerSeed = Math.abs(seed * 41 + layerIdx * 3571 + 19) >>> 0
    const layerPrng = createPRNG(layerSeed)

    // Palette ordering: background is softer, foreground is crisp and rich
    const fillColor = samplePalette(paletteColors, t, { lightToDark: true })

    // Number of control vertices around the perimeter (8 to 18)
    const vertexCount = Math.max(
      8,
      Math.round(8 + def.numLobes * 2 + (pathComplexity / 100) * 4)
    )

    // Generate irregular asymmetric radii around the perimeter
    const radiusMultipliers: number[] = []
    const bulgeAngle = layerPrng.range(0, Math.PI * 2)

    for (let v = 0; v < vertexCount; v++) {
      const angle = (v / vertexCount) * Math.PI * 2

      // Asymmetric directional bulge (water droplet / organic bean shape)
      const directionalBulge =
        Math.cos(angle - bulgeAngle) * def.asymmetry * 0.60

      // Multi-frequency organic lobes
      const lobeWave1 =
        Math.sin(angle * def.numLobes + layerPrng.range(0, 2)) *
        def.asymmetry *
        0.38
      const lobeWave2 =
        Math.cos(angle * 2 + layerPrng.range(0, 2)) *
        def.asymmetry *
        0.28

      // Gentle organic micro-fluctuation (dampened by smoothness)
      const microJitter =
        layerPrng.range(-1, 1) *
        0.12 *
        (1 - smoothRatio * 0.70) *
        def.asymmetry

      const radiusFactor =
        1.0 + directionalBulge + lobeWave1 + lobeWave2 + microJitter
      radiusMultipliers.push(Math.max(0.42, radiusFactor))
    }

    // Build perimeter points with rotation and elliptical scaling
    const points: Point[] = []
    for (let v = 0; v < vertexCount; v++) {
      const baseAngle = (v / vertexCount) * Math.PI * 2
      const angleJitter =
        layerPrng.range(-0.06, 0.06) * (1 - smoothRatio * 0.50)
      const angle = baseAngle + angleJitter

      const r = radiusMultipliers[v]
      const rawX = Math.cos(angle) * def.rx * r
      const rawY = Math.sin(angle) * def.ry * r

      // Apply 2D rotation matrix
      const rotX =
        rawX * Math.cos(def.rotation) - rawY * Math.sin(def.rotation)
      const rotY =
        rawX * Math.sin(def.rotation) + rawY * Math.cos(def.rotation)

      const px = def.cx + rotX
      const py = def.cy + rotY

      points.push({
        x: safeNum(px, def.cx),
        y: safeNum(py, def.cy),
      })
    }

    // Spline tension controlled by smoothness: 50 to 95 for silky smooth organic contours
    const splineTension = Math.max(
      48,
      Math.min(95, 50 + smoothness * 0.45)
    )
    const blobPath = pointsToSmoothPath(points, splineTension, true)

    // Atmospheric layer opacity: background is softer (0.82), foreground is solid (1.0)
    const opacity = safeNum(0.82 + t * 0.18, 1, 0.1, 1)

    layers.push({
      id: `blobs-layer-${layerIdx}`,
      d: blobPath,
      fill: fillColor,
      opacity,
    })
  }

  return layers
}
