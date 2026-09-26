export type WallpaperStyle =
  | "hills"
  | "waves"
  | "arcs"
  | "blobs"
  | "rings"
  | "mesh"
  | "contour"
  | "orbit"
  | "cells"
  | "stripes"

export type WallpaperMode = "light" | "dark"

export type DimensionCategory = "mobile" | "desktop" | "custom"

export interface Dimensions {
  width: number
  height: number
}

export interface DimensionPreset {
  id: string
  label: string
  width: number
  height: number
  category: "mobile" | "desktop"
  sublabel?: string
}

export interface ColorPalette {
  id: string
  name: string
  background: {
    light: string
    dark: string
  }
  colors: {
    light: string[]
    dark: string[]
  }
  isCustom?: boolean
}

export interface WallpaperParameters {
  layerCount: number
  height: number
  spacing: number
  smoothness: number
}

export interface AdvancedSettings {
  seed: number
  peakVariation: number
  depthVariation: number
  pathComplexity: number
}

export type ExportFormat = "png" | "jpg" | "svg"

export interface ExportSettings {
  format: ExportFormat
  scale: number
  quality: number
}

export interface WallpaperConfig {
  style: WallpaperStyle
  wallpaperMode: WallpaperMode
  dimensionCategory: DimensionCategory
  dimensions: Dimensions
  activePalette: ColorPalette
  parameters: WallpaperParameters
  advanced: AdvancedSettings
  exportSettings: ExportSettings
}
