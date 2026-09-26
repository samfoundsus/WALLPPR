/**
 * Sanitization & Validation utilities for procedural SVG wallpaper generation.
 * Guarantees that all inputs, colors, coordinates, and attributes are safe,
 * well-formed, and free from script injection or malformed geometry.
 */

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const RGB_COLOR_REGEX = /^rgba?\(\s*([0-9]{1,3}\s*,\s*){2}[0-9]{1,3}(\s*,\s*(0|1|0?\.[0-9]+))?\s*\)$/i
const HSL_COLOR_REGEX = /^hsla?\(\s*[0-9]{1,3}\s*,\s*[0-9]{1,3}%\s*,\s*[0-9]{1,3}%(\s*,\s*(0|1|0?\.[0-9]+))?\s*\)$/i

/**
 * Sanitize color string. If invalid, falls back to safe fallback color.
 */
export function sanitizeColor(color: unknown, fallback: string = "#1a1a1a"): string {
  if (typeof color !== "string") return fallback
  const trimmed = color.trim()
  if (
    HEX_COLOR_REGEX.test(trimmed) ||
    RGB_COLOR_REGEX.test(trimmed) ||
    HSL_COLOR_REGEX.test(trimmed)
  ) {
    return trimmed
  }
  return fallback
}

/**
 * Ensure number is finite and strictly within [min, max] bounds.
 * Formats to 2 decimal places to prevent SVG path bloat.
 */
export function safeNum(
  val: unknown,
  fallback: number,
  min: number = -100000,
  max: number = 100000
): number {
  if (typeof val !== "number" || !Number.isFinite(val) || Number.isNaN(val)) {
    return fallback
  }
  const clamped = Math.max(min, Math.min(max, val))
  return Math.round(clamped * 100) / 100
}

/**
 * Clamp percentage values to [0, 100]
 */
export function clampPercent(val: unknown, fallback: number = 50): number {
  return safeNum(val, fallback, 0, 100)
}
