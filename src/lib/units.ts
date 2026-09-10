import { unit } from 'mathjs'

export type UnitKind = 'length' | 'time' | 'speed' | 'acceleration'

/** The base SI unit used internally for every calculation, per unit kind. */
export const SI_UNIT: Record<UnitKind, string> = {
  length: 'm',
  time: 's',
  speed: 'm/s',
  acceleration: 'm/s^2',
}

/** Units offered to the user for each kind, in ascending order. */
export const UNIT_OPTIONS: Record<UnitKind, string[]> = {
  length: ['mm', 'cm', 'm', 'km'],
  time: ['ms', 's', 'min', 'h'],
  speed: ['cm/s', 'm/s', 'km/h'],
  acceleration: ['cm/s^2', 'm/s^2'],
}

/** Which unit kind each field (across MRU, MRUV, etc.) is measured in. */
export const FIELD_UNIT_KIND: Record<string, UnitKind> = {
  x0: 'length',
  xf: 'length',
  dx: 'length',
  t0: 'time',
  tf: 'time',
  dt: 'time',
  v: 'speed',
  v0: 'speed',
  vf: 'speed',
  dv: 'speed',
  a: 'acceleration',
}

/** Converts a value expressed in `fromUnit` to the base SI unit for its kind. */
export function toSI(value: number, fromUnit: string, kind: UnitKind): number {
  return unit(value, fromUnit).toNumber(SI_UNIT[kind])
}

/** Converts a value expressed in the base SI unit for its kind to `toUnit`. */
export function fromSI(value: number, toUnit: string, kind: UnitKind): number {
  return unit(value, SI_UNIT[kind]).toNumber(toUnit)
}

/**
 * Converts a plain-text unit string (as shown in the `<select>` options, e.g.
 * "m/s^2") into safe KaTeX source. A trailing "^N" can't sit inside `\text{}`
 * — `^` isn't valid there even in text mode — so it must be moved outside the
 * braces: "m/s^2" becomes `\text{m/s}^2`, while a plain unit like "m" just
 * becomes `\text{m}`.
 */
export function unitToLatex(unitLabel: string): string {
  const match = /^(.*)\^(\d+)$/.exec(unitLabel)
  if (match) {
    const [, base, exponent] = match
    return `\\text{${base}}^${exponent}`
  }
  return `\\text{${unitLabel}}`
}
