import { ColorPalette } from "@/types/wallpaper"

export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: "mono",
    name: "Mono",
    background: {
      light: "#f4f4f6",
      dark: "#0f1115",
    },
    colors: {
      light: ["#e2e4e9", "#c6c9d2", "#9ba1b0", "#697184", "#3e4454", "#1b1e26"],
      dark: ["#1e222b", "#2c3240", "#444c60", "#636e88", "#8b96b3", "#b9c2d8"],
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    background: {
      light: "#eef2f9",
      dark: "#0b0f19",
    },
    colors: {
      light: ["#d9e2f5", "#b4c7ea", "#85a3dc", "#577eca", "#395ba5", "#1f376d"],
      dark: ["#141c2e", "#1e2c49", "#293e6a", "#3c5894", "#5b7dc2", "#8aa8e8"],
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    background: {
      light: "#e8f4f6",
      dark: "#091518",
    },
    colors: {
      light: ["#cfebee", "#9ad7de", "#5fbcc8", "#339ea9", "#1d7883", "#0f4f58"],
      dark: ["#102227", "#173740", "#215360", "#30778a", "#4ea4bb", "#7fd4eb"],
    },
  },
  {
    id: "forest",
    name: "Forest",
    background: {
      light: "#eef5ed",
      dark: "#0b160f",
    },
    colors: {
      light: ["#d7ebcf", "#afd6a0", "#7fb86b", "#589543", "#3a6d2b", "#224719"],
      dark: ["#132418", "#1c3826", "#285337", "#3a764e", "#56a571", "#84d49f"],
    },
  },
  {
    id: "sand",
    name: "Sand",
    background: {
      light: "#f9f6f0",
      dark: "#0f0c08",
    },
    colors: {
      light: ["#D8BD91", "#A9855C", "#6B5138", "#2A2118"],
      dark: ["#2A2118", "#6B5138", "#A9855C", "#D8BD91"],
    },
  },
  {
    id: "amethyst",
    name: "Amethyst",
    background: {
      light: "#f2eff9",
      dark: "#0d0a17",
    },
    colors: {
      light: ["#dcd3ee", "#9a8bc4", "#5c4b8a", "#2b204e"],
      dark: ["#171329", "#302557", "#5C4B8A", "#9A8BC4"],
    },
  },
  {
    id: "sakura",
    name: "Sakura",
    background: {
      light: "#fbf2f4",
      dark: "#0f0a0d",
    },
    colors: {
      light: ["#E0A9B5", "#A9677A", "#693B4D", "#24171D"],
      dark: ["#24171D", "#693B4D", "#A9677A", "#E0A9B5"],
    },
  },
  {
    id: "flame",
    name: "Flame",
    background: {
      light: "#fef4ed",
      dark: "#0f0504",
    },
    colors: {
      light: ["#FF9A55", "#C13B20", "#6E180E", "#1C0A08"],
      dark: ["#1C0A08", "#6E180E", "#C13B20", "#FF9A55"],
    },
  },
  {
    id: "citrus",
    name: "Citrus",
    background: {
      light: "#f9faee",
      dark: "#0a0f06",
    },
    colors: {
      light: ["#E1E66A", "#A5B52A", "#526B16", "#17210F"],
      dark: ["#17210F", "#526B16", "#A5B52A", "#E1E66A"],
    },
  },
  {
    id: "electric",
    name: "Electric",
    background: {
      light: "#eefbfd",
      dark: "#050810",
    },
    colors: {
      light: ["#5DD6E8", "#1976A8", "#123B66", "#080D18"],
      dark: ["#080D18", "#123B66", "#1976A8", "#5DD6E8"],
    },
  },
]

export const DEFAULT_CUSTOM_PALETTE: ColorPalette = {
  id: "custom",
  name: "Custom",
  isCustom: true,
  background: {
    light: "#f7f2ed",
    dark: "#14110e",
  },
  colors: {
    light: ["#e8ded4", "#d4c1ad", "#b89e83", "#9b795c", "#75563d", "#4b3422"],
    dark: ["#231d18", "#382e25", "#554436", "#7b634e", "#a6886e", "#d5b79d"],
  },
}
