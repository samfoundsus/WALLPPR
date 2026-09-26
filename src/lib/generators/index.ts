import { WallpaperConfig } from "@/types/wallpaper"
import { GeneratedWallpaper, GeneratedLayer, GeneratorContext } from "./types"
import { sanitizeColor, safeNum } from "./sanitize"
import { generateHills } from "./hills"
import { generateWaves } from "./waves"
import { generateArcs } from "./arcs"
import { generateBlobs } from "./blobs"
import { generateRings } from "./rings"
import { generateMesh } from "./mesh"
import { generateContour } from "./contour"
import { generateOrbit } from "./orbit"
import { generateCells } from "./cells"
import { generateStripes } from "./stripes"

export * from "./types"
export * from "./sanitize"
export * from "./prng"
export * from "./colors"
export * from "./mesh"
export * from "./contour"
export * from "./orbit"
export * from "./cells"
export * from "./stripes"

/**
 * Procedural SVG Wallpaper Generator Engine
 * Generates mathematically sound, layered SVG compositions based on user config.
 */
export function generateWallpaper(config: WallpaperConfig): GeneratedWallpaper {
  const width = safeNum(config.dimensions.width, 1080, 100, 10000)
  const height = safeNum(config.dimensions.height, 2406, 100, 10000)

  const isDark = config.wallpaperMode === "dark"

  // Active palette background & layer colors (strictly sanitized)
  const rawBg = isDark
    ? config.activePalette.background.dark
    : config.activePalette.background.light
  const bgColor = sanitizeColor(rawBg, isDark ? "#090d16" : "#f8fafc")

  const rawColors = isDark
    ? config.activePalette.colors.dark
    : config.activePalette.colors.light

  const paletteColors = (Array.isArray(rawColors) && rawColors.length > 0
    ? rawColors
    : ["#3b82f6", "#6366f1", "#8b5cf6"]
  ).map((c) => sanitizeColor(c, "#3b82f6"))

  const ctx: GeneratorContext = {
    width,
    height,
    config,
    paletteColors,
    bgColor,
  }

  let layers: GeneratedLayer[] = []

  switch (config.style) {
    case "hills":
      layers = generateHills(ctx)
      break
    case "waves":
      layers = generateWaves(ctx)
      break
    case "arcs":
      layers = generateArcs(ctx)
      break
    case "blobs":
      layers = generateBlobs(ctx)
      break
    case "rings":
      layers = generateRings(ctx)
      break
    case "mesh":
      layers = generateMesh(ctx)
      break
    case "contour":
      layers = generateContour(ctx)
      break
    case "orbit":
      layers = generateOrbit(ctx)
      break
    case "cells":
      layers = generateCells(ctx)
      break
    case "stripes":
      layers = generateStripes(ctx)
      break
    default:
      layers = generateHills(ctx)
      break
  }

  return {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    backgroundColor: bgColor,
    layers,
  }
}

/**
 * Serialize GeneratedWallpaper to standalone SVG string
 */
export function serializeWallpaperToSvg(wallpaper: GeneratedWallpaper): string {
  const { width, height, viewBox, backgroundColor, layers } = wallpaper

  const layerElements = layers
    .map((layer) => {
      const fillAttr = layer.fill ? `fill="${layer.fill}"` : 'fill="none"'
      const strokeAttr = layer.stroke ? `stroke="${layer.stroke}"` : ""
      const strokeWidthAttr = layer.strokeWidth ? `stroke-width="${layer.strokeWidth}"` : ""
      const opacityAttr =
        typeof layer.opacity === "number" && layer.opacity < 1
          ? `opacity="${layer.opacity}"`
          : ""
      const transformAttr = layer.transform ? `transform="${layer.transform}"` : ""

      const attrs = [fillAttr, strokeAttr, strokeWidthAttr, opacityAttr, transformAttr]
        .filter(Boolean)
        .join(" ")

      return `    <path id="${layer.id}" d="${layer.d}" ${attrs} />`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${backgroundColor}" />
  <!-- Generated Procedural Layers -->
  <g id="wallpaper-artwork">
${layerElements}
  </g>
</svg>`
}
