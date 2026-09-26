import { WallpaperParameters } from "@/types/wallpaper"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface ParameterControlsProps {
  parameters: WallpaperParameters
  onChange: (key: keyof WallpaperParameters, value: number) => void
}

export function ParameterControls({
  parameters,
  onChange,
}: ParameterControlsProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border/50 bg-muted/15 dark:bg-muted/10 p-3 divide-y divide-border/30">
      {/* Layer Count */}
      <div className="flex flex-col gap-1.5 pb-2.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <Label className="text-xs font-medium text-foreground tracking-tight select-none">
            Layer Count
          </Label>
          <span className="font-mono text-xs font-medium tabular-nums text-foreground/80 select-none">
            {parameters.layerCount}
          </span>
        </div>
        <Slider
          min={2}
          max={10}
          value={parameters.layerCount}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val
            if (typeof v === "number") onChange("layerCount", v)
          }}
          aria-label="Layer Count"
        />
      </div>

      {/* Height / Amplitude */}
      <div className="flex flex-col gap-1.5 py-2.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <Label className="text-xs font-medium text-foreground tracking-tight select-none">
            Height / Amplitude
          </Label>
          <span className="font-mono text-xs font-medium tabular-nums text-foreground/80 select-none">
            {parameters.height}%
          </span>
        </div>
        <Slider
          min={10}
          max={100}
          value={parameters.height}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val
            if (typeof v === "number") onChange("height", v)
          }}
          aria-label="Height / Amplitude"
        />
      </div>

      {/* Spacing / Frequency */}
      <div className="flex flex-col gap-1.5 py-2.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <Label className="text-xs font-medium text-foreground tracking-tight select-none">
            Spacing / Frequency
          </Label>
          <span className="font-mono text-xs font-medium tabular-nums text-foreground/80 select-none">
            {parameters.spacing}%
          </span>
        </div>
        <Slider
          min={10}
          max={100}
          value={parameters.spacing}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val
            if (typeof v === "number") onChange("spacing", v)
          }}
          aria-label="Spacing / Frequency"
        />
      </div>

      {/* Smoothness */}
      <div className="flex flex-col gap-1.5 pt-2.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <Label className="text-xs font-medium text-foreground tracking-tight select-none">
            Smoothness
          </Label>
          <span className="font-mono text-xs font-medium tabular-nums text-foreground/80 select-none">
            {parameters.smoothness}%
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          value={parameters.smoothness}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val
            if (typeof v === "number") onChange("smoothness", v)
          }}
          aria-label="Smoothness"
        />
      </div>
    </div>
  )
}
