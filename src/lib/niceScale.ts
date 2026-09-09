export interface NiceScale {
  min: number
  max: number
  step: number
  ticks: number[]
}

/**
 * Heckbert's "nice numbers for graph labels" rounding: snaps a raw number to
 * the nearest 1, 2, or 5 times a power of ten (so steps read as 0.1, 0.2, 0.5,
 * 1, 2, 5, 10, 20, 50... regardless of the data's magnitude).
 */
function niceNumber(range: number, round: boolean): number {
  if (range <= 0) return 1

  const exponent = Math.floor(Math.log10(range))
  const fraction = range / 10 ** exponent
  let niceFraction: number

  if (round) {
    if (fraction < 1.5) niceFraction = 1
    else if (fraction < 3) niceFraction = 2
    else if (fraction < 7) niceFraction = 5
    else niceFraction = 10
  } else {
    if (fraction <= 1) niceFraction = 1
    else if (fraction <= 2) niceFraction = 2
    else if (fraction <= 5) niceFraction = 5
    else niceFraction = 10
  }

  return niceFraction * 10 ** exponent
}

/**
 * Computes a "nice" axis scale: a step that's always 1, 2, or 5 times a power
 * of ten, and min/max bounds snapped outward to whole multiples of that step,
 * so every generated tick is a clean, evenly-spaced round number instead of
 * whatever the raw data's min/max happen to be.
 */
export function niceScale(dataMin: number, dataMax: number, maxTicks = 6): NiceScale {
  let min = dataMin
  let max = dataMax
  if (min === max) {
    min -= 1
    max += 1
  }

  const range = niceNumber(max - min, false)
  const step = niceNumber(range / (maxTicks - 1), true)
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  const decimals = Math.max(0, -Math.floor(Math.log10(step)))

  const count = Math.round((niceMax - niceMin) / step)
  const ticks: number[] = []
  for (let i = 0; i <= count; i++) {
    ticks.push(Number((niceMin + i * step).toFixed(decimals)))
  }

  return { min: niceMin, max: niceMax, step, ticks }
}

/** Whether `value` lands on one of the scale's ticks (within floating-point tolerance). */
export function isOnScale(value: number, scale: NiceScale): boolean {
  return scale.ticks.some((tick) => Math.abs(tick - value) < scale.step * 1e-6)
}
