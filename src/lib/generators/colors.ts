import { safeNum, sanitizeColor } from "./sanitize"

/**
 * Parse any valid hex or rgb color into [r, g, b] in [0, 255]
 */
export function parseColorToRgb(color: string): [number, number, number] {
  const sanitized = sanitizeColor(color, "#808080")

  // Hex format #rgb, #rgba, #rrggbb, #rrggbbaa
  if (sanitized.startsWith("#")) {
    let hex = sanitized.slice(1)
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("")
    }
    const r = parseInt(hex.slice(0, 2), 16) || 0
    const g = parseInt(hex.slice(2, 4), 16) || 0
    const b = parseInt(hex.slice(4, 6), 16) || 0
    return [r, g, b]
  }

  // RGB format rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = sanitized.match(/rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)/i)
  if (rgbMatch) {
    return [
      Math.min(255, parseInt(rgbMatch[1], 10) || 0),
      Math.min(255, parseInt(rgbMatch[2], 10) || 0),
      Math.min(255, parseInt(rgbMatch[3], 10) || 0),
    ]
  }

  return [128, 128, 128]
}

/**
 * Convert [r, g, b] to hex string #rrggbb
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clampR = Math.max(0, Math.min(255, Math.round(r)))
  const clampG = Math.max(0, Math.min(255, Math.round(g)))
  const clampB = Math.max(0, Math.min(255, Math.round(b)))
  return `#${clampR.toString(16).padStart(2, "0")}${clampG.toString(16).padStart(2, "0")}${clampB.toString(16).padStart(2, "0")}`
}

/**
 * Calculate perceived luminance of a color (0 to 255)
 * Standard Rec. 601 coefficients
 */
export function getLuminance(color: string): number {
  const [r, g, b] = parseColorToRgb(color)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Linearly interpolate between two colors
 */
export function interpolateRgb(colorA: string, colorB: string, factor: number): string {
  const f = Math.max(0, Math.min(1, factor))
  const [r1, g1, b1] = parseColorToRgb(colorA)
  const [r2, g2, b2] = parseColorToRgb(colorB)
  return rgbToHex(
    r1 + (r2 - r1) * f,
    g1 + (g2 - g1) * f,
    b1 + (b2 - b1) * f
  )
}

/**
 * Sort palette colors by perceived luminance.
 * descending = true -> lightest to darkest
 * descending = false -> darkest to lightest
 */
export function sortColorsByLuminance(colors: string[], descending: boolean = true): string[] {
  return [...colors].sort((a, b) => {
    const lumA = getLuminance(a)
    const lumB = getLuminance(b)
    return descending ? lumB - lumA : lumA - lumB
  })
}

/**
 * Sample a color from palette array at continuous parameter t in [0, 1].
 * Optionally orders colors by luminance (lightest to darkest) for atmospheric perspective.
 */
export function samplePalette(
  colors: string[],
  t: number,
  options?: {
    lightToDark?: boolean
    darkToLight?: boolean
  }
): string {
  if (!colors || colors.length === 0) return "#3b82f6"
  if (colors.length === 1) return sanitizeColor(colors[0], "#3b82f6")

  let palette = colors.map((c) => sanitizeColor(c, "#3b82f6"))

  if (options?.lightToDark) {
    palette = sortColorsByLuminance(palette, true)
  } else if (options?.darkToLight) {
    palette = sortColorsByLuminance(palette, false)
  }

  const clampedT = Math.max(0, Math.min(1, t))
  const pos = clampedT * (palette.length - 1)
  const idx = Math.floor(pos)
  const frac = pos - idx

  if (frac < 0.001) return palette[idx]
  if (idx >= palette.length - 1) return palette[palette.length - 1]

  return interpolateRgb(palette[idx], palette[idx + 1], frac)
}
