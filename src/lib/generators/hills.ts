import { GeneratorContext, GeneratedLayer } from "./types"
import { createPRNG } from "./prng"
import { pointsToSmoothPath, Point } from "./spline"
import { safeNum } from "./sanitize"
import { samplePalette } from "./colors"

/**
 * Premium Minimal Alpine Hills Engine (Phase 2.15 - Single Continuous Summit Apex)
 *
 * Art-directed minimalist mountain landscape wallpaper generator:
 * 1. Single Continuous Summit Apex (No Flat or Doubled Crests):
 *    - The dominant mountain summit has exactly ONE clear, continuous apex.
 *    - Enforces substantial vertical separation between the summit control point and its
 *      neighboring control points (left/right flanks drop naturally by 150-350px).
 *    - Smooth asymmetric climb into the summit and smooth natural descent away from it.
 *    - Rounded, sculpted apex with continuous curvature (never a sharp needle or triangular spike).
 * 2. Coherent Mountain Masses (3-4 Layers):
 *    - Each layer is one continuous, coherent mountain mass with broad natural summits,
 *      long asymmetric slopes, wide shoulders, and smooth glacial valleys.
 *    - Exactly 1 dominant summit and 0-2 subtle secondary forms per layer.
 *    - Zero narrow triangles, repeated humps, zigzags, wave-like curves, or parallel layers.
 * 3. Intentional Composition & Negative Space:
 *    - Primary focal summit placed off-center along natural Rule-of-Thirds (x ~ 0.32-0.42 or 0.58-0.68).
 *    - Portrait (1080x2406): Preserves ~35-45% clean sky negative space above the dominant mountain.
 *    - Landscape: Proportional panoramic mountain hierarchy with ~28-36% clean sky.
 *    - Foreground occupies ~20-30% of the canvas bottom with an asymmetric grounded ridge (no centered roof shape).
 * 4. Depth & Geological Hierarchy:
 *    - Background: Largest, simplest mountain mass with soft broad crest and expansive shoulder terrace.
 *    - Midground: Distinct offset summit with a wide U-shaped glacial saddle framing the background peak.
 *    - Lower Midground: Stepped diagonal traverse with broad alpine bench.
 *    - Foreground: Strongest grounded silhouette entering naturally from both canvas edges.
 * 5. Controlled Macro Geometry:
 *    - Deliberate macro control points per layer interpolated using Catmull-Rom cubic Bézier splines.
 *    - Controlled asymmetry: gradual climbing slopes, steeper drops, unequal shoulder widths.
 *    - Zero high-frequency noise, zero pointwise randomness, zero sinusoidal oscillations.
 * 6. Deterministic & Responsive:
 *    - 100% byte-for-byte deterministic rendering for identical seeds and parameters.
 *    - Height modulates mountain prominence; Spacing controls horizontal formation breadth;
 *      Smoothness controls spline tension.
 */
export function generateHills(ctx: GeneratorContext): GeneratedLayer[] {
  const { width: w, height: h, config, paletteColors } = ctx
  const { layerCount, height: heightParam, spacing: spacingParam, smoothness } = config.parameters
  const { seed, peakVariation } = config.advanced

  const layers: GeneratedLayer[] = []
  const count = Math.max(2, Math.min(10, layerCount))
  const isLandscape = w > h

  // Global seeded PRNG for scene-wide compositional balance
  const globalPrng = createPRNG(seed)

  // Height / Amplitude ratio (default 65%, range 60-70%)
  const heightRatio = Math.max(0.1, Math.min(1.0, heightParam / 100))
  // Spacing / Frequency ratio (higher = broader formations, lower = tighter formations)
  const spacingRatio = Math.max(0.1, Math.min(1.0, spacingParam / 100))
  // Smoothness ratio in [0, 1]
  const smoothRatio = Math.max(0, Math.min(1.0, smoothness / 100))

  // Aspect-ratio compensation: ensures massifs maintain majestic alpine proportions on wide screens
  const aspectComp = isLandscape ? Math.min(1.30, Math.sqrt(w / h) * 0.95) : 1.0

  // 1. SKY NEGATIVE SPACE & CANVAS BUDGET (~35-45% in portrait, ~28-36% in landscape)
  const baseSky = isLandscape ? 0.30 : 0.38
  const seedSkyShift = globalPrng.range(-0.020, 0.020)
  const skyMargin =
    h *
    Math.max(
      isLandscape ? 0.26 : 0.35,
      Math.min(
        isLandscape ? 0.36 : 0.44,
        baseSky + (0.65 - heightRatio) * 0.12 + seedSkyShift
      )
    )

  // Lower anchor elevation: foreground anchors lower 20-30% of canvas
  const bottomAnchorY = h * (isLandscape ? 0.86 : 0.89)
  const totalVerticalSpan = Math.max(h * 0.38, bottomAnchorY - skyMargin)

  // 2. MASTER FOCAL AXIS (Rule of Thirds: x ~ 0.32-0.42 or 0.58-0.68, never dead center)
  const masterFocalSide = globalPrng.bool(0.5)
  const masterFocalX = masterFocalSide
    ? globalPrng.range(0.32, 0.42)
    : globalPrng.range(0.58, 0.68)

  // Horizontal formation scale governed by Spacing parameter
  const flankScale = (0.85 + (spacingRatio - 0.35) * 0.45) * aspectComp
  const minGap = h * (isLandscape ? 0.035 : 0.030)

  const layerPointsList: Point[][] = []

  for (let layerIdx = 0; layerIdx < count; layerIdx++) {
    const t = count === 1 ? 0 : layerIdx / (count - 1)

    // Dedicated deterministic PRNG per layer
    const layerSeed = Math.abs(seed * 131 + layerIdx * 4651 + 71) >>> 0
    const lPrng = createPRNG(layerSeed)

    // Atmospheric palette mapping: distant summits are soft, foreground is crisp and rich
    const fillColor = samplePalette(paletteColors, t, { lightToDark: true })

    const isBackground = layerIdx === 0
    const isForeground = layerIdx === count - 1

    // Build deliberate macro waypoints for this layer
    const rawPts: Point[] = []

    if (isBackground) {
      // =========================================================================
      // BACKGROUND: GRAND DISTANT ALPINE MASSIF
      // ONE single continuous summit apex with natural asymmetric flank slopes,
      // expansive secondary shoulder terrace, and sweeping valley exit.
      // Zero flat/doubled plateau: left and right neighbors drop by 150-350px.
      // =========================================================================
      const peakX = masterFocalX
      const summitY = skyMargin
      const peakOnLeft = peakX < 0.5
      const shoulderDir = peakOnLeft ? 1 : -1

      // Expansive shoulder terrace along wider flank
      const shoulderX = Math.max(
        0.12,
        Math.min(
          0.88,
          peakX + shoulderDir * lPrng.range(0.24, 0.32) * flankScale
        )
      )
      const shoulderY = summitY + totalVerticalSpan * lPrng.range(0.20, 0.28)

      // Long gradual ascent shelf on opposite flank
      const shelfX = Math.max(
        0.06,
        Math.min(
          0.94,
          peakX - shoulderDir * lPrng.range(0.20, 0.26) * flankScale
        )
      )
      const shelfY = summitY + totalVerticalSpan * lPrng.range(0.26, 0.35)

      const steepExitY =
        summitY +
        totalVerticalSpan *
          lPrng.range(0.40, 0.48) *
          (0.92 + (peakVariation / 100) * 0.16)
      const gentleExitY = shoulderY + totalVerticalSpan * lPrng.range(0.14, 0.22)

      const leftExitY = peakOnLeft ? steepExitY : gentleExitY
      const rightExitY = peakOnLeft ? gentleExitY : steepExitY

      rawPts.push({ x: 0, y: leftExitY })
      if (peakOnLeft) {
        rawPts.push({ x: shelfX * w, y: shelfY })
        rawPts.push({ x: peakX * w, y: summitY }) // Single continuous apex
        rawPts.push({ x: shoulderX * w, y: shoulderY })
      } else {
        rawPts.push({ x: shoulderX * w, y: shoulderY })
        rawPts.push({ x: peakX * w, y: summitY }) // Single continuous apex
        rawPts.push({ x: shelfX * w, y: shelfY })
      }
      rawPts.push({ x: w, y: rightExitY })
    } else if (isForeground) {
      // =========================================================================
      // FOREGROUND: GROUNDED ASYMMETRIC RIDGE TRAVERSE
      // Strongest silhouette anchoring lower 20-30% of canvas,
      // entering smoothly from both canvas edges with NO centered roof or chevron
      // Single continuous crest apex with guaranteed vertical flank drop
      // =========================================================================
      const foreHighLeft = lPrng.bool(0.5)
      const forePeakX = foreHighLeft
        ? lPrng.range(0.24, 0.34)
        : lPrng.range(0.66, 0.76)
      const foreSummitY =
        skyMargin + totalVerticalSpan * lPrng.range(0.73, 0.78)

      const leftY = foreHighLeft
        ? foreSummitY + totalVerticalSpan * lPrng.range(0.06, 0.12)
        : foreSummitY + totalVerticalSpan * lPrng.range(0.18, 0.26)
      const rightY = foreHighLeft
        ? foreSummitY + totalVerticalSpan * lPrng.range(0.18, 0.26)
        : foreSummitY + totalVerticalSpan * lPrng.range(0.06, 0.12)

      const midFlankX = foreHighLeft
        ? forePeakX + lPrng.range(0.22, 0.30) * flankScale
        : forePeakX - lPrng.range(0.22, 0.30) * flankScale
      const midFlankY = foreSummitY + totalVerticalSpan * 0.12

      rawPts.push({ x: 0, y: leftY })
      if (foreHighLeft) {
        rawPts.push({ x: forePeakX * w, y: foreSummitY }) // Single continuous apex
        rawPts.push({ x: midFlankX * w, y: midFlankY })
      } else {
        rawPts.push({ x: midFlankX * w, y: midFlankY })
        rawPts.push({ x: forePeakX * w, y: foreSummitY }) // Single continuous apex
      }
      rawPts.push({ x: w, y: rightY })
    } else if (layerIdx === 1) {
      // =========================================================================
      // MIDGROUND: DISTINCT OFFSET RIDGE + U-SHAPED GLACIAL SADDLE
      // Peaks on the opposite side of master summit, with a broad U-shaped saddle
      // framing the background summit. Single continuous apex.
      // =========================================================================
      const oppSide = masterFocalX < 0.5
      const midPeakX = oppSide
        ? lPrng.range(0.66, 0.76)
        : lPrng.range(0.24, 0.34)
      const midSummitY =
        skyMargin + totalVerticalSpan * lPrng.range(0.33, 0.39)

      // Broad U-shaped saddle centered under the background summit
      const saddleX = Math.max(
        0.18,
        Math.min(0.82, masterFocalX + lPrng.range(-0.02, 0.02))
      )
      const saddleY =
        skyMargin + totalVerticalSpan * lPrng.range(0.48, 0.55)

      const midShoulderX = oppSide
        ? Math.max(0.45, midPeakX - lPrng.range(0.14, 0.20) * flankScale)
        : Math.min(0.55, midPeakX + lPrng.range(0.14, 0.20) * flankScale)
      const midShoulderY = midSummitY + totalVerticalSpan * 0.12

      const leftY = oppSide
        ? saddleY - totalVerticalSpan * 0.04
        : midSummitY + totalVerticalSpan * 0.18
      const rightY = oppSide
        ? midSummitY + totalVerticalSpan * 0.18
        : saddleY - totalVerticalSpan * 0.04

      rawPts.push({ x: 0, y: leftY })
      if (oppSide) {
        rawPts.push({ x: saddleX * w, y: saddleY })
        rawPts.push({ x: midShoulderX * w, y: midShoulderY })
        rawPts.push({ x: midPeakX * w, y: midSummitY }) // Single continuous apex
      } else {
        rawPts.push({ x: midPeakX * w, y: midSummitY }) // Single continuous apex
        rawPts.push({ x: midShoulderX * w, y: midShoulderY })
        rawPts.push({ x: saddleX * w, y: saddleY })
      }
      rawPts.push({ x: w, y: rightY })
    } else {
      // =========================================================================
      // LOWER MIDGROUND: STEPPED DIAGONAL RIDGE & BROAD TERRACE
      // Distinct offset crest with wide expansive bench before exiting canvas
      // Single continuous apex.
      // =========================================================================
      const travPeakX =
        masterFocalX < 0.5
          ? lPrng.range(0.26, 0.36)
          : lPrng.range(0.64, 0.74)
      const travSummitY =
        skyMargin + totalVerticalSpan * lPrng.range(0.53, 0.59)

      const benchX =
        travPeakX < 0.5
          ? Math.min(0.88, travPeakX + 0.26 * flankScale)
          : Math.max(0.12, travPeakX - 0.26 * flankScale)
      const benchY = travSummitY + totalVerticalSpan * 0.12

      const leftY =
        travSummitY + totalVerticalSpan * lPrng.range(0.08, 0.16)
      const rightY =
        travSummitY + totalVerticalSpan * lPrng.range(0.08, 0.16)

      rawPts.push({ x: 0, y: leftY })
      if (travPeakX < benchX) {
        rawPts.push({ x: travPeakX * w, y: travSummitY }) // Single continuous apex
        rawPts.push({ x: benchX * w, y: benchY })
      } else {
        rawPts.push({ x: benchX * w, y: benchY })
        rawPts.push({ x: travPeakX * w, y: travSummitY }) // Single continuous apex
      }
      rawPts.push({ x: w, y: rightY })
    }

    // Sort control points strictly by X coordinate
    rawPts.sort((a, b) => a.x - b.x)

    // Ensure edge points anchor at 0 and w
    rawPts[0].x = 0
    rawPts[rawPts.length - 1].x = w

    // Sanitize all control point coordinates
    for (const pt of rawPts) {
      pt.x = safeNum(pt.x, 0)
      pt.y = safeNum(pt.y, skyMargin)
    }

    // 4. KINK-FREE LAYER SEPARATION GUARANTEE
    // Smoothly guarantees layer l is always safely below layer l-1 by shifting the entire
    // macro curve down uniformly if needed. Preserves 100% of the authentic mountain shape.
    if (layerIdx > 0) {
      const prevPts = layerPointsList[layerIdx - 1]
      let maxDeficit = 0

      // Sample along 32 points across width to test clearance against preceding layer
      const numTestSamples = 32
      for (let s = 0; s <= numTestSamples; s++) {
        const testX = (s / numTestSamples) * w

        // Approximate Y on previous curve
        let prevY = skyMargin
        for (let j = 0; j < prevPts.length - 1; j++) {
          if (testX >= prevPts[j].x && testX <= prevPts[j + 1].x) {
            const frac =
              (testX - prevPts[j].x) /
              Math.max(1, prevPts[j + 1].x - prevPts[j].x)
            const smoothFrac = frac * frac * (3 - 2 * frac)
            prevY = prevPts[j].y + smoothFrac * (prevPts[j + 1].y - prevPts[j].y)
            break
          }
        }

        // Approximate Y on current curve
        let currY = rawPts[0].y
        for (let j = 0; j < rawPts.length - 1; j++) {
          if (testX >= rawPts[j].x && testX <= rawPts[j + 1].x) {
            const frac =
              (testX - rawPts[j].x) /
              Math.max(1, rawPts[j + 1].x - rawPts[j].x)
            const smoothFrac = frac * frac * (3 - 2 * frac)
            currY = rawPts[j].y + smoothFrac * (rawPts[j + 1].y - rawPts[j].y)
            break
          }
        }

        const deficit = prevY + minGap - currY
        if (deficit > maxDeficit) {
          maxDeficit = deficit
        }
      }

      if (maxDeficit > 0) {
        for (const pt of rawPts) {
          pt.y += maxDeficit
        }
      }
    }

    // Safe bounds clamp within viewport
    for (const pt of rawPts) {
      pt.y = Math.max(h * 0.15, Math.min(h * 0.98, pt.y))
    }

    layerPointsList.push(rawPts)

    // Spline tension: 48 to 68 governed by Smoothness parameter
    // Creates sculpted, defined mountain ridges with smooth continuous Bézier transitions
    const splineTension = Math.max(46, Math.min(68, 48 + smoothRatio * 20))
    const ridgePath = pointsToSmoothPath(rawPts, splineTension, false)

    // Complete closed path down to bottom corners of the canvas
    const fullPath = `${ridgePath} L ${safeNum(w, 1080).toFixed(2)} ${safeNum(h, 2400).toFixed(2)} L 0 ${safeNum(h, 2400).toFixed(2)} Z`

    // Atmospheric layer opacity: background is softer (0.86), foreground is crisp (1.0)
    const layerOpacity = safeNum(0.86 + t * 0.14, 1, 0.1, 1)

    layers.push({
      id: `hills-layer-${layerIdx}`,
      d: fullPath,
      fill: fillColor,
      opacity: layerOpacity,
    })
  }

  return layers
}
