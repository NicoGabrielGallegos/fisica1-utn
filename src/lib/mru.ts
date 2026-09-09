export type PositionMode = 'endpoints' | 'delta'
export type TimeMode = 'endpoints' | 'delta'

export const POSITION_FIELDS: Record<PositionMode, string[]> = {
  endpoints: ['x0', 'xf'],
  delta: ['dx'],
}

export const TIME_FIELDS: Record<TimeMode, string[]> = {
  endpoints: ['t0', 'tf'],
  delta: ['dt'],
}

export function activeMruFields(posMode: PositionMode, timeMode: TimeMode): string[] {
  return [...POSITION_FIELDS[posMode], ...TIME_FIELDS[timeMode], 'v']
}

/**
 * Solves x = x0 + v*t (equivalently Δx = v·Δt) for `unknown`, given whichever
 * known values are provided for the fields active under posMode/timeMode.
 */
export function solveMru(
  posMode: PositionMode,
  timeMode: TimeMode,
  unknown: string,
  known: Record<string, number>,
): number {
  const { x0, xf, dx, t0, tf, dt, v } = known

  if (posMode === 'endpoints' && timeMode === 'endpoints') {
    switch (unknown) {
      case 'x0':
        return xf - v * (tf - t0)
      case 'xf':
        return x0 + v * (tf - t0)
      case 't0':
        return tf - (xf - x0) / v
      case 'tf':
        return t0 + (xf - x0) / v
      case 'v':
        return (xf - x0) / (tf - t0)
    }
  } else if (posMode === 'endpoints' && timeMode === 'delta') {
    switch (unknown) {
      case 'x0':
        return xf - v * dt
      case 'xf':
        return x0 + v * dt
      case 'dt':
        return (xf - x0) / v
      case 'v':
        return (xf - x0) / dt
    }
  } else if (posMode === 'delta' && timeMode === 'endpoints') {
    switch (unknown) {
      case 'dx':
        return v * (tf - t0)
      case 't0':
        return tf - dx / v
      case 'tf':
        return t0 + dx / v
      case 'v':
        return dx / (tf - t0)
    }
  } else {
    switch (unknown) {
      case 'dx':
        return v * dt
      case 'dt':
        return dx / v
      case 'v':
        return dx / dt
    }
  }

  throw new Error(`No se pudo resolver "${unknown}" con posMode=${posMode} y timeMode=${timeMode}.`)
}

/**
 * LaTeX templates for each solvable case, mirroring solveMru's algebra exactly.
 * Known-field placeholders are written as @field@ (not plain LaTeX braces, to
 * avoid colliding with \dfrac{...}{...} syntax) and get substituted by
 * renderMruFormula.
 */
const MRU_FORMULA_TEMPLATES: Record<PositionMode, Record<TimeMode, Record<string, string>>> = {
  endpoints: {
    endpoints: {
      x0: 'x_0 = @xf@ - @v@(@tf@ - @t0@)',
      xf: 'x_f = @x0@ + @v@(@tf@ - @t0@)',
      t0: 't_0 = @tf@ - \\dfrac{@xf@ - @x0@}{@v@}',
      tf: 't_f = @t0@ + \\dfrac{@xf@ - @x0@}{@v@}',
      v: 'v = \\dfrac{@xf@ - @x0@}{@tf@ - @t0@}',
    },
    delta: {
      x0: 'x_0 = @xf@ - @v@ \\cdot @dt@',
      xf: 'x_f = @x0@ + @v@ \\cdot @dt@',
      dt: '\\Delta t = \\dfrac{@xf@ - @x0@}{@v@}',
      v: 'v = \\dfrac{@xf@ - @x0@}{@dt@}',
    },
  },
  delta: {
    endpoints: {
      dx: '\\Delta x = @v@(@tf@ - @t0@)',
      t0: 't_0 = @tf@ - \\dfrac{@dx@}{@v@}',
      tf: 't_f = @t0@ + \\dfrac{@dx@}{@v@}',
      v: 'v = \\dfrac{@dx@}{@tf@ - @t0@}',
    },
    delta: {
      dx: '\\Delta x = @v@ \\cdot @dt@',
      dt: '\\Delta t = \\dfrac{@dx@}{@v@}',
      v: 'v = \\dfrac{@dx@}{@dt@}',
    },
  },
}

export function getMruFormulaTemplate(
  posMode: PositionMode,
  timeMode: TimeMode,
  unknown: string,
): string | undefined {
  return MRU_FORMULA_TEMPLATES[posMode][timeMode][unknown]
}

/** Replaces every @field@ placeholder in a template using the given substitution function. */
export function renderMruFormula(template: string, substitute: (field: string) => string): string {
  return template.replace(/@(\w+)@/g, (_, field: string) => substitute(field))
}

/**
 * A physical constraint on one or more fields (e.g. "t0 must be before tf").
 * `fields` lists every field the check needs; the constraint only runs once
 * all of them are present in the values being checked, so it naturally only
 * applies in the position/time modes where those fields actually exist.
 *
 * `check` returns a message *template*, not plain prose: variable names are
 * written as @field@ placeholders (same convention as the formula templates)
 * so the UI layer can render them with KaTeX instead of plain text.
 */
export interface MruConstraint {
  fields: string[]
  check: (values: Record<string, number>) => string | null
}

export const MRU_CONSTRAINTS: MruConstraint[] = [
  {
    fields: ['t0', 'tf'],
    check: ({ t0, tf }) =>
      t0 < tf ? null : 'El tiempo inicial (@t0@) debe ser menor que el tiempo final (@tf@): el tiempo siempre avanza.',
  },
  {
    fields: ['dt'],
    check: ({ dt }) => (dt >= 0 ? null : 'El tiempo transcurrido (@dt@) no puede ser negativo.'),
  },
]

/** Runs every constraint whose required fields are all present in `values`, returning the violation messages. */
export function checkMruConstraints(values: Record<string, number>): string[] {
  const violations: string[] = []
  for (const constraint of MRU_CONSTRAINTS) {
    if (constraint.fields.every((field) => Number.isFinite(values[field]))) {
      const message = constraint.check(values)
      if (message) violations.push(message)
    }
  }
  return violations
}

export interface MruTrajectoryPoint {
  t: number
  x: number
}

/**
 * Builds the two endpoints of the (linear) x(t) trajectory from a fully-solved
 * value set. Whichever axis is only known as a delta (posMode/timeMode === 'delta')
 * has no absolute origin, so it's plotted starting from 0.
 */
export function mruTrajectory(
  posMode: PositionMode,
  timeMode: TimeMode,
  values: Record<string, number>,
): MruTrajectoryPoint[] {
  const x0 = posMode === 'endpoints' ? values.x0 : 0
  const xf = posMode === 'endpoints' ? values.xf : values.dx
  const t0 = timeMode === 'endpoints' ? values.t0 : 0
  const tf = timeMode === 'endpoints' ? values.tf : values.dt

  return [
    { t: t0, x: x0 },
    { t: tf, x: xf },
  ]
}
