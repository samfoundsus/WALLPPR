import * as React from "react"
import { ColorPalette } from "@/types/wallpaper"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

interface CustomPaletteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPalette: ColorPalette
  onSavePalette: (palette: ColorPalette) => void
}

export function CustomPaletteDialog({
  open,
  onOpenChange,
  currentPalette,
  onSavePalette,
}: CustomPaletteDialogProps) {
  const [name, setName] = React.useState(currentPalette.name || "Custom Palette")
  const [bgLight, setBgLight] = React.useState(currentPalette.background.light)
  const [bgDark, setBgDark] = React.useState(currentPalette.background.dark)
  const [colorsLight, setColorsLight] = React.useState<string[]>([
    ...currentPalette.colors.light,
  ])
  const [colorsDark, setColorsDark] = React.useState<string[]>([
    ...currentPalette.colors.dark,
  ])

  React.useEffect(() => {
    if (open) {
      setName(currentPalette.isCustom ? currentPalette.name : "Custom Palette")
      setBgLight(currentPalette.background.light)
      setBgDark(currentPalette.background.dark)
      setColorsLight([...currentPalette.colors.light])
      setColorsDark([...currentPalette.colors.dark])
    }
  }, [open, currentPalette])

  const handleColorChange = (
    mode: "light" | "dark",
    index: number,
    value: string
  ) => {
    if (mode === "light") {
      const updated = [...colorsLight]
      updated[index] = value
      setColorsLight(updated)
    } else {
      const updated = [...colorsDark]
      updated[index] = value
      setColorsDark(updated)
    }
  }

  const addColor = () => {
    if (colorsLight.length < 8) {
      setColorsLight([...colorsLight, "#9ca3af"])
      setColorsDark([...colorsDark, "#4b5563"])
    }
  }

  const removeColor = (index: number) => {
    if (colorsLight.length > 2) {
      setColorsLight(colorsLight.filter((_, i) => i !== index))
      setColorsDark(colorsDark.filter((_, i) => i !== index))
    }
  }

  const handleSave = () => {
    const newPalette: ColorPalette = {
      id: "custom",
      name: name.trim() || "Custom",
      isCustom: true,
      background: {
        light: bgLight,
        dark: bgDark,
      },
      colors: {
        light: colorsLight,
        dark: colorsDark,
      },
    }
    onSavePalette(newPalette)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Color Palette</DialogTitle>
          <DialogDescription>
            Configure background and layer colors for light and dark modes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Palette Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="palette-name">Palette Name</Label>
            <Input
              id="palette-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunset Glow"
            />
          </div>

          {/* Background Colors */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Light BG</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgLight}
                  onChange={(e) => setBgLight(e.target.value)}
                  className="size-7 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <span className="font-mono text-xs">{bgLight}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Dark BG</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgDark}
                  onChange={(e) => setBgDark(e.target.value)}
                  className="size-7 cursor-pointer rounded border border-input bg-transparent p-0.5"
                />
                <span className="font-mono text-xs">{bgDark}</span>
              </div>
            </div>
          </div>

          {/* Layer Colors */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Layer Gradients ({colorsLight.length} steps)</Label>
              {colorsLight.length < 8 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={addColor}
                  className="h-6 gap-1 text-xs"
                >
                  <Plus className="size-3" />
                  Add Color
                </Button>
              )}
            </div>

            <div className="flex max-h-44 flex-col gap-2 overflow-y-auto pr-1">
              {colorsLight.map((cLight, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/40 p-2 text-xs"
                >
                  <span className="w-5 text-muted-foreground">#{idx + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={cLight}
                      onChange={(e) =>
                        handleColorChange("light", idx, e.target.value)
                      }
                      className="size-6 cursor-pointer rounded border border-input p-0.5"
                      title="Light mode color"
                    />
                    <span className="w-14 font-mono text-[11px]">{cLight}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={colorsDark[idx] || "#333333"}
                      onChange={(e) =>
                        handleColorChange("dark", idx, e.target.value)
                      }
                      className="size-6 cursor-pointer rounded border border-input p-0.5"
                      title="Dark mode color"
                    />
                    <span className="w-14 font-mono text-[11px]">
                      {colorsDark[idx] || "#333333"}
                    </span>
                  </div>
                  {colorsLight.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeColor(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter showCloseButton={false}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Palette</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
