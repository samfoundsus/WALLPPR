import * as React from "react"
import { useWallpaperConfig } from "@/hooks/useWallpaperConfig"
import { PRESET_PALETTES } from "@/lib/palettes"
import { WallpaperStyle } from "@/types/wallpaper"
import { WallpaperPreview } from "@/components/wallpaper/WallpaperPreview"
import { DimensionControls } from "@/components/wallpaper/DimensionControls"
import { ParameterControls } from "@/components/wallpaper/ParameterControls"
import { ExportControls } from "@/components/wallpaper/ExportControls"
import { CustomPaletteDialog } from "@/components/wallpaper/CustomPaletteDialog"
import { downloadWallpaper } from "@/lib/generators/export"
import {
  AnimatedThemeToggler,
  TransitionVariant,
} from "@/components/ui/animated-theme-toggler"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  RefreshCw,
  Dices,
  Undo2,
  Redo2,
  SlidersHorizontal,
  Palette as PaletteIcon,
  Sun,
  Moon,
  Layers,
  Mountain,
  Waves as WavesIcon,
  CircleDot,
  Radio,
  Shapes,
  Settings2,
  Grid,
  Spline,
  Orbit,
  Boxes,
  Rows,
} from "lucide-react"
import { cn } from "@/lib/utils"

const STYLES: { id: WallpaperStyle; label: string; icon: React.ReactNode }[] = [
  { id: "hills", label: "Hills", icon: <Mountain className="size-3.5" /> },
  { id: "waves", label: "Waves", icon: <WavesIcon className="size-3.5" /> },
  { id: "arcs", label: "Arcs", icon: <Radio className="size-3.5" /> },
  { id: "blobs", label: "Blobs", icon: <Shapes className="size-3.5" /> },
  { id: "rings", label: "Rings", icon: <CircleDot className="size-3.5" /> },
  { id: "mesh", label: "Mesh", icon: <Grid className="size-3.5" /> },
  { id: "contour", label: "Contour", icon: <Spline className="size-3.5" /> },
  { id: "orbit", label: "Orbit", icon: <Orbit className="size-3.5" /> },
  { id: "cells", label: "Cells", icon: <Boxes className="size-3.5" /> },
  { id: "stripes", label: "Stripes", icon: <Rows className="size-3.5" /> },
]

export default function App() {
  const {
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
    setExportSetting,
    regenerate,
    randomize,
  } = useWallpaperConfig()

  const [isCustomPaletteOpen, setIsCustomPaletteOpen] = React.useState(false)
  const [themeTransitionVariant, setThemeTransitionVariant] =
    React.useState<TransitionVariant>("circle")
  const [notification, setNotification] = React.useState<string | null>(null)

  const showNotification = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  const [isExporting, setIsExporting] = React.useState(false)

  const handleDownload = async () => {
    if (isExporting) return
    setIsExporting(true)
    const scale = config.exportSettings.scale
    const targetW = config.dimensions.width * scale
    const targetH = config.dimensions.height * scale
    const formatUpper = config.exportSettings.format.toUpperCase()

    showNotification(`Preparing ${formatUpper} wallpaper (${targetW} × ${targetH} px)...`)

    try {
      await downloadWallpaper(config)
      showNotification(`${formatUpper} wallpaper downloaded!`)
    } catch (err) {
      console.error("Download failed:", err)
      showNotification(
        `Export notice: ${err instanceof Error ? err.message : "Download initiated"}`
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers
                className="size-4 shrink-0 text-foreground"
                strokeWidth={2.2}
                aria-hidden="true"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-widest text-sm sm:text-base leading-none select-none text-foreground">
                WALLPPR
              </span>
              <span className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase font-semibold text-muted-foreground bg-muted/60 border border-border/40 select-none">
                Studio
              </span>
            </div>
          </div>

          {/* Header Controls: Undo, Redo, Theme Variant Settings, Animated Theme Toggle */}
          <div className="flex items-center gap-1.5">
            {/* History Controls Group */}
            <div className="inline-flex items-center rounded-lg border border-border/50 bg-muted/25 p-0.5">
              {/* Undo */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={!canUndo}
                      onClick={undo}
                      aria-label="Undo"
                      className="size-7 rounded-md cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-25"
                    >
                      <Undo2 className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>

              {/* Redo */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={!canRedo}
                      onClick={redo}
                      aria-label="Redo"
                      className="size-7 rounded-md cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-25"
                    >
                      <Redo2 className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
            </div>

            <div className="mx-0.5 h-4 w-px bg-border/50" />

            {/* Transition Variant Selector Popover */}
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Theme transition options"
                    title="Theme Transition Effect"
                    className="size-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  >
                    <Settings2 className="size-3.5" />
                  </Button>
                }
              />
              <PopoverContent align="end" className="w-48 p-2">
                <span className="px-1 text-[11px] font-medium text-muted-foreground">
                  Theme Transition Variant
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-1 text-xs">
                  {(
                    [
                      "circle",
                      "square",
                      "triangle",
                      "diamond",
                      "hexagon",
                      "rectangle",
                      "star",
                    ] as TransitionVariant[]
                  ).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setThemeTransitionVariant(v)}
                      className={cn(
                        "rounded px-2 py-1 text-left capitalize transition-colors cursor-pointer",
                        themeTransitionVariant === v
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Animated Theme Toggler */}
            <AnimatedThemeToggler
              variant={themeTransitionVariant}
              duration={400}
            />
          </div>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-border bg-popover px-3.5 py-2.5 text-xs text-popover-foreground shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Main Studio Viewport */}
      <main className="mx-auto max-w-[1680px] px-3 sm:px-5 lg:px-6 py-3 sm:py-4">
        {/* Desktop-Optimized 2-Column Split Layout (~67% Left Preview / ~33% Right Controls) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6 lg:items-start">
          {/* Left Column: Primary Wallpaper Viewport (~67% width) */}
          <section
            aria-label="Wallpaper Preview"
            className="flex flex-col lg:col-span-8 xl:col-span-8 lg:sticky lg:top-18"
          >
            <WallpaperPreview config={config} />
          </section>

          {/* Right Column: Ergonomic Control Deck (~33% width, independent scrolling) */}
          <section
            aria-label="Wallpaper Controls"
            className="flex flex-col gap-4 lg:col-span-4 xl:col-span-4 rounded-2xl border border-border/50 bg-card/40 dark:bg-card/25 p-4 sm:p-5 shadow-xs lg:sticky lg:top-18 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto custom-scrollbar"
          >
            {/* 1. Primary Actions: Regenerate (Dominant) & Random (Secondary) */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  onClick={regenerate}
                  className="flex-[1.4] h-10 gap-2 font-medium text-xs tracking-wider uppercase rounded-xl cursor-pointer shadow-xs transition-all duration-150 active:scale-[0.985]"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Regenerate</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={randomize}
                  className="flex-1 h-10 gap-1.5 font-medium text-xs tracking-wide rounded-xl cursor-pointer border-border/70 bg-background/60 hover:bg-muted/40 text-foreground transition-all duration-150 active:scale-[0.985]"
                >
                  <Dices className="size-4 text-muted-foreground" />
                  <span>Random</span>
                </Button>
              </div>

              {/* Polished Compact Style Segmented Selector */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none">
                  Style
                </Label>
                <div className="grid grid-cols-5 gap-1 rounded-xl border border-border/60 bg-muted/20 p-1">
                  {STYLES.map((st) => {
                    const isSelected = config.style === st.id
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStyle(st.id)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 text-xs transition-all duration-150 cursor-pointer select-none",
                          isSelected
                            ? "bg-background text-foreground shadow-2xs font-semibold border border-border/70 ring-1 ring-border/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent"
                        )}
                      >
                        {st.icon}
                        <span className="text-[10.5px] leading-tight">{st.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="h-px bg-border/40" />

            {/* 2. Color Palette Selector & Wallpaper Light/Dark Mode */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <PaletteIcon className="size-3 text-muted-foreground" />
                  <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none">
                    Palette
                  </Label>
                </div>

                {/* Wallpaper Light/Dark Mode Switch */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {config.wallpaperMode === "dark" ? (
                    <Moon className="size-3 text-muted-foreground" />
                  ) : (
                    <Sun className="size-3 text-muted-foreground" />
                  )}
                  <span className="text-[11px] capitalize font-medium text-foreground">
                    {config.wallpaperMode}
                  </span>
                  <Switch
                    checked={config.wallpaperMode === "dark"}
                    onCheckedChange={(checked) =>
                      setWallpaperMode(checked ? "dark" : "light")
                    }
                    size="sm"
                    aria-label="Toggle wallpaper light/dark mode"
                    className="cursor-pointer ml-1"
                  />
                </div>
              </div>

              {/* Preset Palettes + Custom Palette Button */}
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {PRESET_PALETTES.map((pal) => {
                  const isSelected = config.activePalette.id === pal.id
                  const isDark = config.wallpaperMode === "dark"
                  const colors = isDark ? pal.colors.dark : pal.colors.light
                  const bg = isDark ? pal.background.dark : pal.background.light

                  return (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setActivePalette(pal)}
                      className={cn(
                        "flex flex-col gap-1 rounded-lg border p-1.5 text-left transition-all duration-150 cursor-pointer select-none",
                        isSelected
                          ? "border-primary/80 bg-accent/25 ring-1 ring-primary/30"
                          : "border-border/60 bg-muted/10 hover:border-border hover:bg-muted/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-medium text-foreground truncate">
                          {pal.name}
                        </span>
                        {isSelected && (
                          <span className="size-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      {/* Swatch stripe */}
                      <div
                        className="flex h-3 w-full overflow-hidden rounded border border-border/40"
                        style={{ backgroundColor: bg }}
                      >
                        {colors.slice(0, 4).map((c, idx) => (
                          <div
                            key={idx}
                            className="h-full flex-1"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </button>
                  )
                })}

                {/* Custom Palette Option */}
                <button
                  type="button"
                  onClick={() => setIsCustomPaletteOpen(true)}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg border p-1.5 text-left transition-all duration-150 cursor-pointer select-none",
                    config.activePalette.isCustom
                      ? "border-primary/80 bg-accent/25 ring-1 ring-primary/30"
                      : "border-dashed border-border/70 bg-muted/10 hover:border-border hover:bg-muted/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11.5px] font-medium text-foreground truncate">
                      {config.activePalette.isCustom
                        ? config.activePalette.name
                        : "Custom..."}
                    </span>
                    <SlidersHorizontal className="size-3 text-muted-foreground shrink-0" />
                  </div>
                  {/* Swatch stripe for custom */}
                  <div className="flex h-3 w-full overflow-hidden rounded border border-border/40">
                    {(config.wallpaperMode === "dark"
                      ? config.activePalette.colors.dark
                      : config.activePalette.colors.light
                    )
                      .slice(0, 4)
                      .map((c, idx) => (
                        <div
                          key={idx}
                          className="h-full flex-1"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                  </div>
                </button>
              </div>
            </div>

            <div className="h-px bg-border/40" />

            {/* 3. Dimensions & Resolution */}
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none">
                Dimensions
              </Label>
              <DimensionControls
                category={config.dimensionCategory}
                dimensions={config.dimensions}
                onCategoryChange={setDimensionCategory}
                onDimensionsChange={setDimensions}
              />
            </div>

            <div className="h-px bg-border/40" />

            {/* 4. Geometry & Formation Sliders */}
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none">
                Geometry & Formation
              </Label>
              <ParameterControls
                parameters={config.parameters}
                onChange={setParameter}
              />
            </div>

            <div className="h-px bg-border/40" />

            {/* 5. Export Settings & Primary Download CTA */}
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none">
                Export & Download
              </Label>
              <ExportControls
                dimensions={config.dimensions}
                exportSettings={config.exportSettings}
                onChange={setExportSetting}
                onDownload={handleDownload}
              />
            </div>
          </section>
        </div>
      </main>

      {/* Custom Palette Dialog */}
      <CustomPaletteDialog
        open={isCustomPaletteOpen}
        onOpenChange={setIsCustomPaletteOpen}
        currentPalette={config.activePalette}
        onSavePalette={setActivePalette}
      />
    </div>
  )
}
