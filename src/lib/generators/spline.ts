import { safeNum } from "./sanitize"

export interface Point {
  x: number
  y: number
}

/**
 * Convert an array of 2D points into a smooth SVG cubic Bezier path.
 * When tension === 0 (0% smoothness), points are connected with straight line segments (L).
 * When tension > 0, points are connected with smooth cubic Bezier curves (C).
 */
export function pointsToSmoothPath(
  points: Point[],
  tensionPercent: number = 50,
  closed: boolean = false
): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${safeNum(points[0].x, 0)} ${safeNum(points[0].y, 0)}`

  // Clamp tension to [0, 1]
  const tension = Math.max(0, Math.min(1, tensionPercent / 100))

  // If tension is 0 (or very low), generate straight line segments
  if (tension < 0.01) {
    let d = `M ${safeNum(points[0].x, 0)} ${safeNum(points[0].y, 0)}`
    for (let i = 1; i < points.length; i++) {
      d += ` L ${safeNum(points[i].x, 0)} ${safeNum(points[i].y, 0)}`
    }
    if (closed) d += " Z"
    return d
  }

  // Smooth Catmull-Rom to Cubic Bezier conversion
  const pts = points.slice()
  const n = pts.length

  let d = `M ${safeNum(pts[0].x, 0)} ${safeNum(pts[0].y, 0)}`

  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : closed ? pts[n - 1] : pts[0]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = i < n - 2 ? pts[i + 2] : closed ? pts[0] : p2

    // Control point distance factor (0 to 1/6 of tangent vector)
    const factor = (tension / 6)

    const cp1x = p1.x + (p2.x - p0.x) * factor
    const cp1y = p1.y + (p2.y - p0.y) * factor
    const cp2x = p2.x - (p3.x - p1.x) * factor
    const cp2y = p2.y - (p3.y - p1.y) * factor

    d += ` C ${safeNum(cp1x, p1.x)} ${safeNum(cp1y, p1.y)}, ${safeNum(cp2x, p2.x)} ${safeNum(cp2y, p2.y)}, ${safeNum(p2.x, 0)} ${safeNum(p2.y, 0)}`
  }

  if (closed) {
    // Final closing curve from last point to first point
    const p0 = pts[n - 2]
    const p1 = pts[n - 1]
    const p2 = pts[0]
    const p3 = pts[1]

    const factor = (tension / 6)
    const cp1x = p1.x + (p2.x - p0.x) * factor
    const cp1y = p1.y + (p2.y - p0.y) * factor
    const cp2x = p2.x - (p3.x - p1.x) * factor
    const cp2y = p2.y - (p3.y - p1.y) * factor

    d += ` C ${safeNum(cp1x, p1.x)} ${safeNum(cp1y, p1.y)}, ${safeNum(cp2x, p2.x)} ${safeNum(cp2y, p2.y)}, ${safeNum(p2.x, 0)} ${safeNum(p2.y, 0)} Z`
  }

  return d
}
