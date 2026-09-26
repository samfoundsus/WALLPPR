import { WallpaperConfig } from "@/types/wallpaper"

export interface GeneratedLayer {
  id: string
  d: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  transform?: string
}

export interface GeneratedWallpaper {
  viewBox: string
  width: number
  height: number
  backgroundColor: string
  layers: GeneratedLayer[]
}

export interface GeneratorContext {
  width: number
  height: number
  config: WallpaperConfig
  paletteColors: string[]
  bgColor: string
}
