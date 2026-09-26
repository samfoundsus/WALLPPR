/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 * Ensures reproducible procedural generation for any given seed.
 */
export interface PRNG {
  /** Return next float in [0, 1) */
  next: () => number
  /** Return float in [min, max) */
  range: (min: number, max: number) => number
  /** Return integer in [min, max] inclusive */
  int: (min: number, max: number) => number
  /** Return boolean with probability p */
  bool: (p?: number) => boolean
  /** Smooth 1D value noise in [-1, 1] */
  noise1D: (x: number) => number
  /** Multi-octave 1D fractional Brownian motion (fBm) in [-1, 1] */
  fbm1D: (x: number, octaves?: number) => number
}

export function createPRNG(seed: number): PRNG {
  // Normalize seed to non-zero 32-bit unsigned int
  let s = (Math.abs(Math.floor(seed)) || 1) >>> 0

  const next = (): number => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const range = (min: number, max: number): number => {
    return min + next() * (max - min)
  }

  const int = (min: number, max: number): number => {
    const lo = Math.ceil(min)
    const hi = Math.floor(max)
    return Math.floor(lo + next() * (hi - lo + 1))
  }

  const bool = (p: number = 0.5): boolean => {
    return next() < p
  }

  // Pre-generate deterministic gradient hash table for value noise
  const permSize = 256
  const perm = new Float32Array(permSize)
  for (let i = 0; i < permSize; i++) {
    perm[i] = next() * 2 - 1
  }

  // Quintic smoothstep interpolation
  const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

  const noise1D = (x: number): number => {
    const x0 = Math.floor(x)
    const x1 = x0 + 1
    const frac = x - x0
    const w = smooth(frac)

    const idx0 = ((x0 % permSize) + permSize) % permSize
    const idx1 = ((x1 % permSize) + permSize) % permSize

    const v0 = perm[idx0]
    const v1 = perm[idx1]

    return v0 + (v1 - v0) * w
  }

  const fbm1D = (x: number, octaves: number = 3): number => {
    let total = 0
    let frequency = 1
    let amplitude = 1
    let maxValue = 0

    for (let i = 0; i < octaves; i++) {
      total += noise1D(x * frequency) * amplitude
      maxValue += amplitude
      amplitude *= 0.5
      frequency *= 2
    }

    return maxValue > 0 ? total / maxValue : 0
  }

  return {
    next,
    range,
    int,
    bool,
    noise1D,
    fbm1D,
  }
}
