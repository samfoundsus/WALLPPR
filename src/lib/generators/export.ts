import { WallpaperConfig } from "@/types/wallpaper"
import { generateWallpaper, serializeWallpaperToSvg } from "./index"

/**
 * Trigger browser file download from Blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Export wallpaper to user's desired format (SVG, PNG, or JPG)
 */
export async function downloadWallpaper(config: WallpaperConfig): Promise<void> {
  const wallpaper = generateWallpaper(config)
  const svgString = serializeWallpaperToSvg(wallpaper)
  const { width, height } = wallpaper
  const { format, scale, quality } = config.exportSettings

  const targetWidth = Math.round(width * Math.max(1, Math.min(8, scale)))
  const targetHeight = Math.round(height * Math.max(1, Math.min(8, scale)))
  const filename = `wallppr-${config.style}-${targetWidth}x${targetHeight}-s${config.advanced.seed}.${format}`

  if (format === "svg") {
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    downloadBlob(blob, filename)
    return
  }

  // Raster export (PNG or JPG) using OffscreenCanvas or standard Canvas
  return new Promise((resolve, reject) => {
    const img = new Image()
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          URL.revokeObjectURL(url)
          reject(new Error("Failed to get 2d context for canvas export"))
          return
        }

        // Draw background first
        ctx.fillStyle = wallpaper.backgroundColor
        ctx.fillRect(0, 0, targetWidth, targetHeight)

        // Draw SVG image scaled to canvas
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        URL.revokeObjectURL(url)

        const mimeType = format === "jpg" ? "image/jpeg" : "image/png"
        const qualityRatio = Math.max(0.4, Math.min(1.0, quality / 100))

        canvas.toBlob(
          (blob) => {
            if (blob) {
              downloadBlob(blob, filename)
              resolve()
            } else {
              reject(new Error("Canvas blob conversion failed"))
            }
          },
          mimeType,
          format === "jpg" ? qualityRatio : undefined
        )
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }

    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }

    img.src = url
  })
}
