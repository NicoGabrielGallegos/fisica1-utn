import { unit } from 'mathjs'

export type UnitKind = 'length' | 'time' | 'speed'

/** The base SI unit used internally for every calculation, per unit kind. */
export const SI_UNIT: Record<UnitKind, string> = {
  length: 'm',
  time: 's',
  speed: 'm/s',
}

/** Units offered to the user for each kind, in ascending order. */
export const UNIT_OPTIONS: Record<UnitKind, string[]> = {
  length: ['mm', 'cm', 'm', 'km'],
  time: ['ms', 's', 'min', 'h'],
  speed: ['cm/s', 'm/s', 'km/h'],
}

/** Which unit kind each MRU field is measured in. */
export const FIELD_UNIT_KIND: Record<string, UnitKind> = {
  x0: 'length',
  xf: 'length',
  dx: 'length',
  t0: 'time',
  tf: 'time',
  dt: 'time',
  v: 'speed',
}

/** Converts a value expressed in `fromUnit` to the base SI unit for its kind. */
export function toSI(value: number, fromUnit: string, kind: UnitKind): number {
  return unit(value, fromUnit).toNumber(SI_UNIT[kind])
}

/** Converts a value expressed in the base SI unit for its kind to `toUnit`. */
export function fromSI(value: number, toUnit: string, kind: UnitKind): number {
  return unit(value, SI_UNIT[kind]).toNumber(toUnit)
}
