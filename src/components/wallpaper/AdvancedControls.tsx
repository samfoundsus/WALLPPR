import * as React from "react"
import { AdvancedSettings } from "@/types/wallpaper"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdvancedControlsProps {
  advanced: AdvancedSettings
  onChange: (key: keyof AdvancedSettings, value: number) => void
  onRandomSeed: () => void
}

export function AdvancedControls({
  advanced,
  onChange,
  onRandomSeed,
}: AdvancedControlsProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="flex flex-col rounded-xl border border-border/60 bg-muted/10 transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium text-foreground hover:bg-muted/20 transition-colors duration-150 rounded-xl cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-150 ease-out",
              !isOpen && "-rotate-90"
            )}
          />
          <span>Advanced Procedural Settings</span>
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          #{advanced.seed}
        </span>
      </button>

      {isOpen && (
        <div className="flex flex-col gap-2.5 border-t border-border/40 p-3 pt-2.5 divide-y divide-border/40">
          {/* Seed Input Row */}
          <div className="flex items-center justify-between gap-3 pb-2">
            <Label className="text-xs text-muted-foreground shrink-0">Random Seed</Label>
            <div className="flex items-center gap-1.5 max-w-[180px]">
              <Input
                type="number"
                value={advanced.seed}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val)) onChange("seed", val)
                }}
                className="h-8 font-mono text-xs tabular-nums"
              />
              <Button
                variant="outline"
                size="icon-xs"
                onClick={onRandomSeed}
                title="Randomize Seed"
                className="size-8 shrink-0 cursor-pointer"
              >
                <Shuffle className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Peak Variation */}
          <div className="flex flex-col gap-1.5 py-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <Label className="text-xs font-medium text-foreground tracking-tight select-none">
                Peak Variation
              </Label>
              <span className="font-mono text-xs font-medium tabular-nums text-foreground/80 select-none">
                {advanced.peakVariation}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              value={advanced.peakVariation}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val
                if (typeof v === "number") onChange("peakVariation", v)
              }}
              aria-label="Peak Variation"
            />
          </div>

          {/* Depth Layer Spacing */}
          <div className="flex flex-col gap-1.5 py-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <Label className="text-xs font-medium text-foreground tracking-tight select-none">
                Depth Layer Spacing
              </Label>
              <span className="font-mono text-xs font-medium tabular-nums text-foreground/80 select-none">
                {advanced.depthVariation}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              value={advanced.depthVariation}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val
                if (typeof v === "number") onChange("depthVariation", v)
              }}
              aria-label="Depth Layer Spacing"
            />
          </div>

          {/* Path Point Density */}
          <div className="flex flex-col gap-1.5 pt-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <Label className="text-xs font-medium text-foreground tracking-tight select-none">
                Path Point Density
              </Label>
              <span className="font-mono text-xs font-medium tabular-nums text-foreground/80 select-none">
                {advanced.pathComplexity}%
              </span>
            </div>
            <Slider
              min={10}
              max={100}
              value={advanced.pathComplexity}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val
                if (typeof v === "number") onChange("pathComplexity", v)
              }}
              aria-label="Path Point Density"
            />
          </div>
        </div>
      )}
    </div>
  )
}
