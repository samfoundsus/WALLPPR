import * as React from "react"
import {
  WallpaperConfig,
  WallpaperStyle,
  WallpaperMode,
  DimensionCategory,
  ColorPalette,
  WallpaperParameters,
} from "@/types/wallpaper"
import { PRESET_PALETTES } from "@/lib/palettes"
import { MOBILE_PRESETS, DESKTOP_PRESETS } from "@/lib/dimensions"

export const STYLE_DEFAULT_PARAMETERS: Record<WallpaperStyle, WallpaperParameters> = {
  hills: {
    layerCount: 4, // 3-4 layers, preferably 4 as requested
    height: 65, // 60-70%, preferably around 65% as requested
    spacing: 45,
    smoothness: 60,
  },
  waves: {
    layerCount: 5,
    height: 35, // 30-40%, preferably around 35% as requested
    spacing: 35, // 30-40%, preferably around 35% as requested
    smoothness: 75,
  },
  arcs: {
    layerCount: 5,
    height: 45,
    spacing: 50,
    smoothness: 70,
  },
  blobs: {
    layerCount: 4,
    height: 42,
    spacing: 55,
    smoothness: 65,
  },
  rings: {
    layerCount: 5,
    height: 45,
    spacing: 48,
    smoothness: 60,
  },
  mesh: {
    layerCount: 5,
    height: 45,
    spacing: 50,
    smoothness: 70,
  },
  contour: {
    layerCount: 5,
    height: 45,
    spacing: 48,
    smoothness: 65,
  },
  orbit: {
    layerCount: 5,
    height: 48,
    spacing: 45,
    smoothness: 60,
  },
  cells: {
    layerCount: 4,
    height: 42,
    spacing: 50,
    smoothness: 70,
  },
  stripes: {
    layerCount: 5,
    height: 40,
    spacing: 45,
    smoothness: 65,
  },
}

export interface StyleParameterConstraints {
  layerCount: { min: number; max: number }
  height: { min: number; max: number }
  spacing: { min: number; max: number }
  smoothness: { min: number; max: number }
}

export const STYLE_PARAMETER_CONSTRAINTS: Record<WallpaperStyle, StyleParameterConstraints> = {
  hills: {
    layerCount: { min: 3, max: 4 }, // Strictly 3-4 layers as requested in Phase 2.6
    height: { min: 60, max: 70 },   // Strictly 60-70% height as requested in Phase 2.6
    spacing: { min: 38, max: 54 },
    smoothness: { min: 50, max: 70 },
  },
  waves: {
    layerCount: { min: 4, max: 6 },
    height: { min: 30, max: 40 },   // Strictly 30-40% height
    spacing: { min: 30, max: 40 },  // Strictly 30-40% spacing
    smoothness: { min: 68, max: 82 },
  },
  arcs: {
    layerCount: { min: 4, max: 6 },
    height: { min: 38, max: 52 },
    spacing: { min: 42, max: 58 },
    smoothness: { min: 60, max: 78 },
  },
  blobs: {
    layerCount: { min: 3, max: 5 },
    height: { min: 36, max: 48 },
    spacing: { min: 45, max: 62 },
    smoothness: { min: 55, max: 75 },
  },
  rings: {
    layerCount: { min: 4, max: 6 },
    height: { min: 38, max: 52 },
    spacing: { min: 40, max: 56 },
    smoothness: { min: 50, max: 70 },
  },
  mesh: {
    layerCount: { min: 4, max: 6 },
    height: { min: 35, max: 55 },
    spacing: { min: 40, max: 60 },
    smoothness: { min: 60, max: 80 },
  },
  contour: {
    layerCount: { min: 4, max: 6 },
    height: { min: 35, max: 55 },
    spacing: { min: 38, max: 58 },
    smoothness: { min: 55, max: 75 },
  },
  orbit: {
    layerCount: { min: 4, max: 6 },
    height: { min: 38, max: 58 },
    spacing: { min: 35, max: 55 },
    smoothness: { min: 50, max: 70 },
  },
  cells: {
    layerCount: { min: 3, max: 5 },
    height: { min: 35, max: 50 },
    spacing: { min: 40, max: 60 },
    smoothness: { min: 60, max: 80 },
  },
  stripes: {
    layerCount: { min: 4, max: 6 },
    height: { min: 32, max: 48 },
    spacing: { min: 35, max: 55 },
    smoothness: { min: 55, max: 75 },
  },
}

export function generateParametersForStyle(style: WallpaperStyle): WallpaperParameters {
  const constraints = STYLE_PARAMETER_CONSTRAINTS[style]
  const randomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min

  return {
    layerCount: randomInt(constraints.layerCount.min, constraints.layerCount.max),
    height: randomInt(constraints.height.min, constraints.height.max),
    spacing: randomInt(constraints.spacing.min, constraints.spacing.max),
    smoothness: randomInt(constraints.smoothness.min, constraints.smoothness.max),
  }
}

const INITIAL_CONFIG: WallpaperConfig = {
  style: "hills",
  wallpaperMode: "dark",
  dimensionCategory: "mobile",
  dimensions: {
    width: 1080,
    height: 2406,
  },
  activePalette: PRESET_PALETTES[1], // Midnight
  parameters: {
    ...STYLE_DEFAULT_PARAMETERS.hills,
  },
  advanced: {
    seed: 4289,
    peakVariation: 55,
    depthVariation: 50,
    pathComplexity: 50,
  },
  exportSettings: {
    format: "png",
    scale: 4,
    quality: 100,
  },
}

const ALL_STYLES: WallpaperStyle[] = [
  "hills",
  "waves",
  "arcs",
  "blobs",
  "rings",
  "mesh",
  "contour",
  "orbit",
  "cells",
  "stripes",
]

function getRandomPalette(excludeId?: string): ColorPalette {
  const eligible = excludeId
    ? PRESET_PALETTES.filter((p) => p.id !== excludeId)
    : PRESET_PALETTES
  const pool = eligible.length > 0 ? eligible : PRESET_PALETTES
  return pool[Math.floor(Math.random() * pool.length)]
}

function getRandomStyle(excludeStyle?: WallpaperStyle): WallpaperStyle {
  const eligible = excludeStyle
    ? ALL_STYLES.filter((s) => s !== excludeStyle)
    : ALL_STYLES
  const pool = eligible.length > 0 ? eligible : ALL_STYLES
  return pool[Math.floor(Math.random() * pool.length)]
}

export function useWallpaperConfig() {
  const [config, setConfig] = React.useState<WallpaperConfig>(INITIAL_CONFIG)
  const [history, setHistory] = React.useState<WallpaperConfig[]>([INITIAL_CONFIG])
  const [historyIndex, setHistoryIndex] = React.useState(0)
  const isUndoRedoRef = React.useRef(false)

  // Push to history with debounce
  const pushHistory = React.useCallback(
    (newConfig: WallpaperConfig) => {
      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false
        return
      }
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1)
        next.push(newConfig)
        if (next.length > 30) next.shift()
        return next
      })
      setHistoryIndex((prev) => Math.min(prev + 1, 29))
    },
    [historyIndex]
  )

  const updateConfig = React.useCallback(
    (updater: Partial<WallpaperConfig> | ((prev: WallpaperConfig) => WallpaperConfig)) => {
      setConfig((prev) => {
        const updated =
          typeof updater === "function" ? updater(prev) : { ...prev, ...updater }
        pushHistory(updated)
        return updated
      })
    },
    [pushHistory]
  )

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const undo = React.useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true
      const prevIndex = historyIndex - 1
      const prevConfig = history[prevIndex]
      setHistoryIndex(prevIndex)
      setConfig(prevConfig)
    }
  }, [historyIndex, history])

  const redo = React.useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true
      const nextIndex = historyIndex + 1
      const nextConfig = history[nextIndex]
      setHistoryIndex(nextIndex)
      setConfig(nextConfig)
    }
  }, [historyIndex, history])

  const setStyle = (style: WallpaperStyle) => {
    updateConfig((prev) => ({
      ...prev,
      style,
      parameters: {
        ...STYLE_DEFAULT_PARAMETERS[style],
      },
    }))
  }

  const setWallpaperMode = (wallpaperMode: WallpaperMode) =>
    updateConfig({ wallpaperMode })

  const setDimensionCategory = (category: DimensionCategory) => {
    updateConfig((prev) => {
      let nextDims = prev.dimensions
      if (category === "mobile") {
        nextDims = { width: MOBILE_PRESETS[0].width, height: MOBILE_PRESETS[0].height }
      } else if (category === "desktop") {
        nextDims = { width: DESKTOP_PRESETS[0].width, height: DESKTOP_PRESETS[0].height }
      }
      return {
        ...prev,
        dimensionCategory: category,
        dimensions: nextDims,
      }
    })
  }

  const setDimensions = (width: number, height: number) => {
    // Graceful validation to never allow NaN, Infinity, negative or zero
    const safeW = Math.max(100, Math.min(10000, Number.isFinite(width) ? Math.round(width) : 1080))
    const safeH = Math.max(100, Math.min(10000, Number.isFinite(height) ? Math.round(height) : 2406))

    updateConfig((prev) => ({
      ...prev,
      dimensions: { width: safeW, height: safeH },
    }))
  }

  const setActivePalette = (palette: ColorPalette) => {
    updateConfig({ activePalette: palette })
  }

  const setParameter = (key: keyof WallpaperConfig["parameters"], value: number) => {
    updateConfig((prev) => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value,
      },
    }))
  }

  const setAdvanced = (key: keyof WallpaperConfig["advanced"], value: number) => {
    updateConfig((prev) => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        [key]: value,
      },
    }))
  }

  const setExportSetting = <K extends keyof WallpaperConfig["exportSettings"]>(
    key: K,
    value: WallpaperConfig["exportSettings"][K]
  ) => {
    updateConfig((prev) => ({
      ...prev,
      exportSettings: {
        ...prev.exportSettings,
        [key]: value,
      },
    }))
  }

  const regenerate = React.useCallback(() => {
    updateConfig((prev) => {
      const newSeed = Math.floor(Math.random() * 1000000)
      const newPalette = getRandomPalette(prev.activePalette?.id)
      const newParams = generateParametersForStyle(prev.style)

      return {
        ...prev,
        activePalette: newPalette,
        parameters: newParams,
        advanced: {
          ...prev.advanced,
          seed: newSeed,
          peakVariation: Math.floor(Math.random() * 41) + 30, // 30 - 70
          depthVariation: Math.floor(Math.random() * 41) + 30, // 30 - 70
          pathComplexity: Math.floor(Math.random() * 41) + 30, // 30 - 70
        },
      }
    })
  }, [updateConfig])

  const randomize = React.useCallback(() => {
    updateConfig((prev) => {
      const newStyle = getRandomStyle(prev.style)
      const newPalette = getRandomPalette(prev.activePalette?.id)
      const newSeed = Math.floor(Math.random() * 1000000)
      const newParams = generateParametersForStyle(newStyle)

      return {
        ...prev,
        style: newStyle,
        activePalette: newPalette,
        parameters: newParams,
        advanced: {
          ...prev.advanced,
          seed: newSeed,
          peakVariation: Math.floor(Math.random() * 41) + 30, // 30 - 70
          depthVariation: Math.floor(Math.random() * 41) + 30, // 30 - 70
          pathComplexity: Math.floor(Math.random() * 41) + 30, // 30 - 70
        },
      }
    })
  }, [updateConfig])

  return {
    config,
    canUndo,
    canRedo,
    undo,
    redo,
    setStyle,
    setWallpaperMode,
    setDimensionCategory,
    setDimensions,
    setActivePalette,
    setParameter,
    setAdvanced,
    setExportSetting,
    regenerate,
    randomize,
  }
}
