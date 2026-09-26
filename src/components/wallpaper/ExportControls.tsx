import { ExportSettings, Dimensions } from "@/types/wallpaper"
import { EXPORT_SCALES } from "@/lib/dimensions"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download } from "lucide-react"

interface ExportControlsProps {
  dimensions: Dimensions
  exportSettings: ExportSettings
  onChange: <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => void
  onDownload: () => void
}

export function ExportControls({
  dimensions,
  exportSettings,
  onChange,
  onDownload,
}: ExportControlsProps) {
  const finalWidth = dimensions.width * exportSettings.scale
  const finalHeight = dimensions.height * exportSettings.scale

  return (
    <div className="flex flex-col gap-2.5">
      {/* Format & Scale Selection Card */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-border/50 bg-muted/15 dark:bg-muted/10 p-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground select-none">
              Format
            </Label>
            <Select
              value={exportSettings.format}
              onValueChange={(val) => {
                if (val) onChange("format", val as ExportSettings["format"])
              }}
            >
              <SelectTrigger className="h-8.5 w-full font-mono text-xs cursor-pointer bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Lossless)</SelectItem>
                <SelectItem value="jpg">JPG (Compressed)</SelectItem>
                <SelectItem value="svg">SVG (Vector)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground select-none">
              Resolution Scale
            </Label>
            <Select
              value={exportSettings.scale.toString()}
              onValueChange={(val) => {
                if (val) onChange("scale", parseInt(val, 10))
              }}
            >
              <SelectTrigger className="h-8.5 w-full font-mono text-xs cursor-pointer bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_SCALES.map((s) => (
                  <SelectItem key={s.value} value={s.value.toString()}>
                    <span className="font-mono">{s.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* JPEG Quality slider if JPG is selected */}
        {exportSettings.format === "jpg" && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/40 bg-background/40 p-2 pt-1.5 mt-0.5">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <Label className="text-[11px] font-medium text-foreground tracking-tight select-none">
                JPEG Quality
              </Label>
              <span className="font-mono text-xs font-medium tabular-nums text-foreground/80 select-none">
                {exportSettings.quality}%
              </span>
            </div>
            <Slider
              min={40}
              max={100}
              value={exportSettings.quality}
              onValueChange={(val) => {
                const v = Array.isArray(val) ? val[0] : val
                if (typeof v === "number") onChange("quality", v)
              }}
              aria-label="JPEG Quality"
            />
          </div>
        )}

        {/* Output Summary */}
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 px-2.5 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="font-semibold text-foreground">{finalWidth} × {finalHeight}</span>
            <span className="text-muted-foreground/60">px</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="uppercase font-medium text-foreground/80">{exportSettings.format}</span>
          </div>
          <div className="flex items-center font-mono text-[11px] text-muted-foreground/80">
            <span>{exportSettings.scale}× Scale</span>
          </div>
        </div>
      </div>

      {/* Primary Export CTA */}
      <Button
        onClick={onDownload}
        className="h-10.5 w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs tracking-wider uppercase shadow-xs transition-all duration-150 active:scale-[0.985] cursor-pointer"
      >
        <Download className="size-4" />
        Download {exportSettings.format.toUpperCase()} Wallpaper
      </Button>
    </div>
  )
}
