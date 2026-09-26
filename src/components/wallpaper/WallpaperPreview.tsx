import * as React from "react"
import { WallpaperConfig } from "@/types/wallpaper"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateWallpaper } from "@/lib/generators"

interface WallpaperPreviewProps {
  config: WallpaperConfig
  className?: string
}

export function WallpaperPreview({ config, className }: WallpaperPreviewProps) {
  const [zoomMode, setZoomMode] = React.useState<"fit" | "actual">("fit")
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const { width, height } = config.dimensions
  const isLandscape = width >= height
  const aspectRatioValue = (width / height).toFixed(2)

  // Procedural SVG Generation (pure, deterministic, reactive to all parameters)
  const wallpaper = React.useMemo(() => {
    return generateWallpaper(config)
  }, [config])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  React.useEffect(() => {
    const handler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card/40 dark:bg-card/30 p-3 sm:p-4 lg:p-5 transition-all duration-200 lg:h-[calc(100vh-6.5rem)] lg:min-h-[600px]",
        isFullscreen && "fixed inset-0 z-50 rounded-none border-0 bg-background p-6 min-h-screen h-screen",
        className
      )}
    >
      {/* Top Bar inside preview */}
      <div className="flex w-full items-center justify-between gap-3 text-xs text-muted-foreground pb-2.5 sm:pb-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-foreground tracking-tight">
            {wallpaper.width} × {wallpaper.height}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {isLandscape ? "Landscape" : "Portrait"} ({aspectRatioValue})
          </span>
        </div>

        {/* Preview View Controls */}
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-0.5">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={zoomMode === "fit" ? "secondary" : "ghost"}
                  size="icon-xs"
                  onClick={() => setZoomMode("fit")}
                  aria-label="Fit to screen"
                  className={cn(
                    "size-6.5 rounded-md transition-colors duration-150 cursor-pointer",
                    zoomMode === "fit" ? "bg-background text-foreground shadow-2xs font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ZoomOut className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent>Fit to View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={zoomMode === "actual" ? "secondary" : "ghost"}
                  size="icon-xs"
                  onClick={() => setZoomMode("actual")}
                  aria-label="100% scale"
                  className={cn(
                    "size-6.5 rounded-md transition-colors duration-150 cursor-pointer",
                    zoomMode === "actual" ? "bg-background text-foreground shadow-2xs font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ZoomIn className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent>100% Size</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  className="size-6.5 rounded-md text-muted-foreground hover:text-foreground transition-colors duration-150 cursor-pointer"
                >
                  {isFullscreen ? (
                    <Minimize2 className="size-3.5" />
                  ) : (
                    <Maximize2 className="size-3.5" />
                  )}
                </Button>
              }
            />
            <TooltipContent>
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* SVG Canvas Container with Desktop-Optimized Spacious Viewport */}
      <div
        className={cn(
          "relative flex flex-1 items-center justify-center my-auto w-full transition-all duration-200 py-3 sm:py-4",
          zoomMode === "fit"
            ? "h-full min-h-[380px] sm:min-h-[460px] lg:min-h-[520px] overflow-hidden"
            : "overflow-auto max-h-[650px] lg:max-h-[780px]"
        )}
      >
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-xl shadow-lg ring-1 ring-border/50 transition-all duration-200"
          style={{
            aspectRatio: `${wallpaper.width} / ${wallpaper.height}`,
            maxHeight: zoomMode === "fit" ? "100%" : undefined,
            maxWidth: "100%",
            width: zoomMode === "actual" ? `${Math.min(wallpaper.width, 1600)}px` : "auto",
            height: zoomMode === "fit" ? "100%" : "auto",
          }}
        >
          {/* Real SVG element with exact selected dimensions & viewBox */}
          <svg
            id="wallpaper-svg"
            width="100%"
            height="100%"
            viewBox={wallpaper.viewBox}
            preserveAspectRatio="xMidYMid slice"
            className="block h-full w-full select-none"
            style={{ backgroundColor: wallpaper.backgroundColor }}
          >
            {/* Background Rect */}
            <rect
              width={wallpaper.width}
              height={wallpaper.height}
              fill={wallpaper.backgroundColor}
            />

            {/* Procedurally Generated Mathematical SVG Layers */}
            <g id="wallpaper-procedural-layers">
              {wallpaper.layers.map((layer) => (
                <path
                  key={layer.id}
                  id={layer.id}
                  d={layer.d}
                  fill={layer.fill ?? "none"}
                  stroke={layer.stroke}
                  strokeWidth={layer.strokeWidth}
                  opacity={layer.opacity}
                  transform={layer.transform}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex w-full items-center justify-between text-[11px] text-muted-foreground pt-2.5 sm:pt-3 border-t border-border/40 shrink-0">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="capitalize text-foreground">
            {config.style}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>{config.activePalette.name}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="capitalize">{config.wallpaperMode}</span>
        </span>
        <span className="font-mono text-muted-foreground/75">
          Seed #{config.advanced.seed}
        </span>
      </div>
    </div>
  )
}
