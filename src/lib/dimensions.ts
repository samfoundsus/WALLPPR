import { DimensionPreset } from "@/types/wallpaper"

export const MOBILE_PRESETS: DimensionPreset[] = [
  {
    id: "mob-1080-1920",
    label: "1080 × 1920",
    width: 1080,
    height: 1920,
    category: "mobile",
    sublabel: "FHD Mobile 9:16",
  },
  {
    id: "mob-1440-2560",
    label: "1440 × 2560",
    width: 1440,
    height: 2560,
    category: "mobile",
    sublabel: "QHD Mobile 9:16",
  },
  {
    id: "mob-1284-2778",
    label: "1284 × 2778",
    width: 1284,
    height: 2778,
    category: "mobile",
    sublabel: "iPhone Pro Max",
  },
  {
    id: "mob-1179-2556",
    label: "1179 × 2556",
    width: 1179,
    height: 2556,
    category: "mobile",
    sublabel: "iPhone Pro",
  },
]

export const DESKTOP_PRESETS: DimensionPreset[] = [
  {
    id: "desk-1920-1080",
    label: "1920 × 1080",
    width: 1920,
    height: 1080,
    category: "desktop",
    sublabel: "Full HD 16:9",
  },
  {
    id: "desk-2560-1440",
    label: "2560 × 1440",
    width: 2560,
    height: 1440,
    category: "desktop",
    sublabel: "2K QHD 16:9",
  },
  {
    id: "desk-3840-2160",
    label: "3840 × 2160",
    width: 3840,
    height: 2160,
    category: "desktop",
    sublabel: "4K UHD 16:9",
  },
]

export const EXPORT_SCALES = [
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
  { label: "3×", value: 3 },
  { label: "4×", value: 4 },
  { label: "8×", value: 8 },
]
