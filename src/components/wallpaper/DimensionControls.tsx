import * as React from "react"
import { DimensionCategory, Dimensions } from "@/types/wallpaper"
import { MOBILE_PRESETS, DESKTOP_PRESETS } from "@/lib/dimensions"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Smartphone, Monitor, Sliders, ArrowLeftRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DimensionControlsProps {
  category: DimensionCategory
  dimensions: Dimensions
  onCategoryChange: (cat: DimensionCategory) => void
  onDimensionsChange: (width: number, height: number) => void
}

export function DimensionControls({
  category,
  dimensions,
  onCategoryChange,
  onDimensionsChange,
}: DimensionControlsProps) {
  // Temporary string buffers so typing doesn't get blocked or jump
  const [widthInput, setWidthInput] = React.useState(dimensions.width.toString())
  const [heightInput, setHeightInput] = React.useState(dimensions.height.toString())

  // Keep string inputs in sync when dimensions change from outside (e.g. presets, undo/redo)
  React.useEffect(() => {
    setWidthInput(dimensions.width.toString())
  }, [dimensions.width])

  React.useEffect(() => {
    setHeightInput(dimensions.height.toString())
  }, [dimensions.height])

  const handleWidthChange = (val: string) => {
    setWidthInput(val)
    const num = parseInt(val, 10)
    if (!isNaN(num) && num >= 100 && num <= 10000) {
      onDimensionsChange(num, dimensions.height)
    }
  }

  const handleHeightChange = (val: string) => {
    setHeightInput(val)
    const num = parseInt(val, 10)
    if (!isNaN(num) && num >= 100 && num <= 10000) {
      onDimensionsChange(dimensions.width, num)
    }
  }

  const handlePresetSelect = (presetId: string) => {
    const preset =
      MOBILE_PRESETS.find((p) => p.id === presetId) ||
      DESKTOP_PRESETS.find((p) => p.id === presetId)
    if (preset) {
      onDimensionsChange(preset.width, preset.height)
    }
  }

  const handleSwapOrientation = () => {
    onDimensionsChange(dimensions.height, dimensions.width)
  }

  // Find currently matched preset if any
  const matchedPreset =
    [...MOBILE_PRESETS, ...DESKTOP_PRESETS].find(
      (p) => p.width === dimensions.width && p.height === dimensions.height
    )?.id || "custom"

  return (
    <div className="flex flex-col gap-2.5">
      {/* Category Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-border/60 bg-muted/20 p-1">
        <button
          type="button"
          onClick={() => onCategoryChange("mobile")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-medium transition-all duration-150 cursor-pointer select-none",
            category === "mobile"
              ? "bg-background text-foreground shadow-2xs font-semibold border border-border/70"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <Smartphone className="size-3.5" />
          <span>Mobile</span>
        </button>
        <button
          type="button"
          onClick={() => onCategoryChange("desktop")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-medium transition-all duration-150 cursor-pointer select-none",
            category === "desktop"
              ? "bg-background text-foreground shadow-2xs font-semibold border border-border/70"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <Monitor className="size-3.5" />
          <span>Desktop</span>
        </button>
        <button
          type="button"
          onClick={() => onCategoryChange("custom")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-medium transition-all duration-150 cursor-pointer select-none",
            category === "custom"
              ? "bg-background text-foreground shadow-2xs font-semibold border border-border/70"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <Sliders className="size-3.5" />
          <span>Custom</span>
        </button>
      </div>

      {/* Preset Pickers for Mobile */}
      {category === "mobile" && (
        <div className="flex flex-col gap-1.5">
          <Select
            value={matchedPreset}
            onValueChange={(val) => {
              if (val) handlePresetSelect(val)
            }}
          >
            <SelectTrigger className="h-8.5 w-full text-xs cursor-pointer bg-background/60">
              <SelectValue placeholder="Choose mobile resolution" />
            </SelectTrigger>
            <SelectContent>
              {MOBILE_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className="font-mono text-xs">{preset.label}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {preset.sublabel}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1">
            {MOBILE_PRESETS.map((preset) => {
              const isSelected =
                dimensions.width === preset.width &&
                dimensions.height === preset.height
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onDimensionsChange(preset.width, preset.height)}
                  className={cn(
                    "rounded-md border px-2 py-0.5 font-mono text-[10.5px] transition-colors duration-150 cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/60 bg-muted/15 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {preset.width}×{preset.height}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Preset Pickers for Desktop */}
      {category === "desktop" && (
        <div className="flex flex-col gap-1.5">
          <Select
            value={matchedPreset}
            onValueChange={(val) => {
              if (val) handlePresetSelect(val)
            }}
          >
            <SelectTrigger className="h-8.5 w-full text-xs cursor-pointer bg-background/60">
              <SelectValue placeholder="Choose desktop resolution" />
            </SelectTrigger>
            <SelectContent>
              {DESKTOP_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className="font-mono text-xs">{preset.label}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {preset.sublabel}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1">
            {DESKTOP_PRESETS.map((preset) => {
              const isSelected =
                dimensions.width === preset.width &&
                dimensions.height === preset.height
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onDimensionsChange(preset.width, preset.height)}
                  className={cn(
                    "rounded-md border px-2 py-0.5 font-mono text-[10.5px] transition-colors duration-150 cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border/60 bg-muted/15 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {preset.width}×{preset.height}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Numeric Resolution Inputs + Swap Action */}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between px-0.5">
            <Label htmlFor="custom-width" className="text-[10.5px] text-muted-foreground">
              W (px)
            </Label>
            <span className="font-mono text-[10px] text-muted-foreground/75">
              {dimensions.width}
            </span>
          </div>
          <Input
            id="custom-width"
            type="number"
            inputMode="numeric"
            min={100}
            max={10000}
            value={widthInput}
            onChange={(e) => handleWidthChange(e.target.value)}
            className="h-8 font-mono text-xs bg-background/60"
            placeholder="1080"
          />
        </div>

        <div className="self-end pb-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleSwapOrientation}
            title="Swap Width & Height"
            className="size-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/50"
          >
            <ArrowLeftRight className="size-3.5" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between px-0.5">
            <Label htmlFor="custom-height" className="text-[10.5px] text-muted-foreground">
              H (px)
            </Label>
            <span className="font-mono text-[10px] text-muted-foreground/75">
              {dimensions.height}
            </span>
          </div>
          <Input
            id="custom-height"
            type="number"
            inputMode="numeric"
            min={100}
            max={10000}
            value={heightInput}
            onChange={(e) => handleHeightChange(e.target.value)}
            className="h-8 font-mono text-xs bg-background/60"
            placeholder="2406"
          />
        </div>
      </div>
    </div>
  )
}
