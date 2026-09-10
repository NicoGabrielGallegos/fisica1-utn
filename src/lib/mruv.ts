import type { PlotFunction, PlotPoint } from './plot'

export type PositionMode = 'endpoints' | 'delta'
export type TimeMode = 'endpoints' | 'delta'
export type VelocityMode = 'endpoints' | 'delta'

export const POSITION_FIELDS: Record<PositionMode, string[]> = {
  endpoints: ['x0', 'xf'],
  delta: ['dx'],
}

export const TIME_FIELDS: Record<TimeMode, string[]> = {
  endpoints: ['t0', 'tf'],
  delta: ['dt'],
}

/** v0 is always present; only the second velocity value toggles between vf and Δv. */
export const VELOCITY_FIELDS: Record<VelocityMode, string[]> = {
  endpoints: ['v0', 'vf'],
  delta: ['v0', 'dv'],
}

export function activeMruvFields(posMode: PositionMode, timeMode: TimeMode, velMode: VelocityMode): string[] {
  return [...POSITION_FIELDS[posMode], ...TIME_FIELDS[timeMode], ...VELOCITY_FIELDS[velMode], 'a']
}

export type Canonical = 'dx' | 'dt' | 'v0' | 'vf' | 'a'

/**
 * Which canonical quantity (from {Δx, Δt, v0, vf, a}) a field represents.
 * At most one field per canonical group can be marked unknown at once — e.g.
 * x0 and xf both represent 'dx', so picking both would leave only one real
 * unknown (their difference) with no way to pin its absolute value. Note v0
 * and vf/Δv are *different* canonicals (v0 never collapses into a
 * difference — see the memory on this), so both v0 and vf/Δv *can* be
 * marked unknown at the same time; that's a legitimate 2-unknown case.
 */
export const FIELD_TO_CANONICAL: Record<string, Canonical> = {
  x0: 'dx',
  xf: 'dx',
  dx: 'dx',
  t0: 'dt',
  tf: 'dt',
  dt: 'dt',
  v0: 'v0',
  vf: 'vf',
  dv: 'vf',
  a: 'a',
}

/** Picks the physically sensible root of a quadratic in Δt: the smallest non-negative one, since time can't run backwards. */
function choosePositiveRoot(t1: number, t2: number): number {
  const candidates = [t1, t2].filter((t) => Number.isFinite(t) && t >= 0)
  if (candidates.length === 0) return Math.max(t1, t2)
  return Math.min(...candidates)
}

/**
 * Solves the MRUV equations — v = v0 + a·t and x = x0 + v0·t + ½·a·t² — for
 * `unknown`, given whichever known values are provided for the fields active
 * under posMode/timeMode/velMode.
 *
 * Exactly one of {Δx, Δt, v0, vf, a} is unknown at a time (the UI always
 * leaves every other active field filled in), so every case reduces to
 * direct algebra — never a quadratic — except that v0 needs a different
 * formula depending on whether vf is directly available (velMode=endpoints)
 * or only Δv is (velMode=delta, where using vf would be circular).
 */
export function solveMruv(
  posMode: PositionMode,
  timeMode: TimeMode,
  velMode: VelocityMode,
  unknown: string,
  known: Record<string, number>,
): number {
  const dx = posMode === 'endpoints' ? known.xf - known.x0 : known.dx
  const dt = timeMode === 'endpoints' ? known.tf - known.t0 : known.dt
  const v0 = known.v0
  const vf = velMode === 'endpoints' ? known.vf : v0 + known.dv
  const a = known.a

  switch (unknown) {
    case 'x0':
      return known.xf - (v0 * dt + 0.5 * a * dt * dt)
    case 'xf':
      return known.x0 + (v0 * dt + 0.5 * a * dt * dt)
    case 'dx':
      return v0 * dt + 0.5 * a * dt * dt
    case 't0':
      return known.tf - (vf - v0) / a
    case 'tf':
      return known.t0 + (vf - v0) / a
    case 'dt':
      return (vf - v0) / a
    case 'v0':
      return velMode === 'endpoints' ? vf - a * dt : (dx - 0.5 * a * dt * dt) / dt
    case 'vf':
      return v0 + a * dt
    case 'dv':
      return v0 + a * dt - v0
    case 'a':
      return (vf - v0) / dt
  }

  throw new Error(`No se pudo resolver "${unknown}" para MRUV.`)
}

/**
 * Solves MRUV for 1 or 2 simultaneous unknowns. With 2 unknowns, the two
 * canonical quantities they represent (from {Δx, Δt, v0, vf, a}) must be
 * distinct — picking, say, both x0 and xf as unknowns leaves Δx as the only
 * missing canonical, which isn't a valid 2-unknown system.
 *
 * Most pairs solve linearly by substitution. Two require the quadratic
 * formula (whichever pair leaves both a velocity endpoint and Δt unknown at
 * once, with the other velocity endpoint given directly) — the smaller
 * non-negative root is chosen, since time can't run backwards. One
 * combination is mathematically unsolvable and rejected outright: position
 * plus v0 unknown while velocity is in Δv mode, because without v0 or vf
 * directly, Δv alone can never relate to position (see MRUV_UI_CONVENTIONS
 * memory point 7 — v0 is never "just a difference").
 */
export function solveMruvMulti(
  posMode: PositionMode,
  timeMode: TimeMode,
  velMode: VelocityMode,
  unknownFields: string[],
  known: Record<string, number>,
): Record<string, number> {
  if (unknownFields.length === 1) {
    return { [unknownFields[0]]: solveMruv(posMode, timeMode, velMode, unknownFields[0], known) }
  }
  if (unknownFields.length !== 2) {
    throw new Error('Elegí una o dos variables para calcular.')
  }

  const [fieldA, fieldB] = unknownFields
  const gapA = FIELD_TO_CANONICAL[fieldA]
  const gapB = FIELD_TO_CANONICAL[fieldB]
  if (gapA === gapB) {
    throw new Error('Elegí dos variables que representen magnitudes distintas.')
  }
  const gaps = new Set<Canonical>([gapA, gapB])

  const dx = gaps.has('dx') ? undefined : posMode === 'endpoints' ? known.xf - known.x0 : known.dx
  const dt = gaps.has('dt') ? undefined : timeMode === 'endpoints' ? known.tf - known.t0 : known.dt
  const v0 = gaps.has('v0') ? undefined : known.v0
  const a = gaps.has('a') ? undefined : known.a
  let vf: number | undefined
  if (!gaps.has('vf')) {
    vf = velMode === 'endpoints' ? known.vf : v0 !== undefined ? v0 + known.dv : undefined
  }

  const solved: Partial<Record<Canonical, number>> = {}

  if (!gaps.has('v0')) {
    // v0 known; the two gaps come from {Δx, Δt, vf, a}.
    if (gaps.has('dx') && gaps.has('dt')) {
      if (vf === undefined) throw new Error('Datos insuficientes.')
      solved.dt = (vf - v0!) / a!
      solved.dx = v0! * solved.dt + 0.5 * a! * solved.dt * solved.dt
    } else if (gaps.has('dx') && gaps.has('vf')) {
      solved.vf = v0! + a! * dt!
      solved.dx = v0! * dt! + 0.5 * a! * dt! * dt!
    } else if (gaps.has('dx') && gaps.has('a')) {
      if (vf === undefined) throw new Error('Datos insuficientes.')
      solved.a = (vf - v0!) / dt!
      solved.dx = v0! * dt! + 0.5 * solved.a * dt! * dt!
    } else if (gaps.has('dt') && gaps.has('vf')) {
      const disc = v0! * v0! + 2 * a! * dx!
      if (disc < 0) throw new Error('No hay una solución real con estos datos.')
      const sq = Math.sqrt(disc)
      solved.dt = choosePositiveRoot((-v0! + sq) / a!, (-v0! - sq) / a!)
      solved.vf = v0! + a! * solved.dt
    } else if (gaps.has('dt') && gaps.has('a')) {
      if (vf === undefined) throw new Error('Datos insuficientes.')
      solved.dt = (2 * dx!) / (v0! + vf)
      solved.a = (vf - v0!) / solved.dt
    } else {
      // {vf, a}
      solved.a = (2 * (dx! - v0! * dt!)) / (dt! * dt!)
      solved.vf = v0! + solved.a * dt!
    }
  } else {
    // v0 is one of the two unknowns; the other comes from {Δx, Δt, vf, a}.
    if (gaps.has('dx')) {
      if (velMode === 'delta') {
        throw new Error(
          'Con @v0@ y @dx@ desconocidos, y la velocidad en modo @dv@, no alcanzan los datos: sin v0 ni vf no se puede relacionar la posición con el tiempo.',
        )
      }
      solved.v0 = known.vf - a! * dt!
      solved.dx = solved.v0 * dt! + 0.5 * a! * dt! * dt!
    } else if (gaps.has('dt')) {
      if (velMode === 'endpoints') {
        const disc = known.vf * known.vf - 2 * a! * dx!
        if (disc < 0) throw new Error('No hay una solución real con estos datos.')
        const sq = Math.sqrt(disc)
        solved.dt = choosePositiveRoot((known.vf + sq) / a!, (known.vf - sq) / a!)
        solved.v0 = known.vf - a! * solved.dt
      } else {
        solved.dt = known.dv / a!
        solved.v0 = (dx! - 0.5 * a! * solved.dt * solved.dt) / solved.dt
      }
    } else if (gaps.has('vf')) {
      solved.v0 = (dx! - 0.5 * a! * dt! * dt!) / dt!
      solved.vf = solved.v0 + a! * dt!
    } else {
      // {v0, a}
      if (velMode === 'endpoints') {
        solved.a = (2 * (known.vf * dt! - dx!)) / (dt! * dt!)
        solved.v0 = known.vf - solved.a * dt!
      } else {
        solved.a = known.dv / dt!
        solved.v0 = (dx! - 0.5 * solved.a * dt! * dt!) / dt!
      }
    }
  }

  const finalDx = dx ?? solved.dx
  const finalDt = dt ?? solved.dt
  const finalV0 = v0 ?? solved.v0
  const finalVf = vf ?? solved.vf
  const finalA = a ?? solved.a

  const result: Record<string, number> = {}
  for (const field of unknownFields) {
    switch (field) {
      case 'x0':
        result.x0 = known.xf - finalDx!
        break
      case 'xf':
        result.xf = known.x0 + finalDx!
        break
      case 'dx':
        result.dx = finalDx!
        break
      case 't0':
        result.t0 = known.tf - finalDt!
        break
      case 'tf':
        result.tf = known.t0 + finalDt!
        break
      case 'dt':
        result.dt = finalDt!
        break
      case 'v0':
        result.v0 = finalV0!
        break
      case 'vf':
        result.vf = finalVf!
        break
      case 'dv':
        result.dv = finalVf! - finalV0!
        break
      case 'a':
        result.a = finalA!
        break
    }
  }
  return result
}

/** Snippet builders so formula templates always match the active mode. */
function dxSnippet(posMode: PositionMode): string {
  return posMode === 'endpoints' ? '(@xf@ - @x0@)' : '@dx@'
}
function dtSnippet(timeMode: TimeMode): string {
  return timeMode === 'endpoints' ? '(@tf@ - @t0@)' : '@dt@'
}
function vfSnippet(velMode: VelocityMode): string {
  return velMode === 'endpoints' ? '@vf@' : '(@v0@ + @dv@)'
}

/**
 * The two base MRUV equations, in the current mode's notation — used to
 * explain a 2-unknown solve (which always draws on both equations at once),
 * rather than the single-unknown per-case rearranged templates below.
 */
export function getMruvSystemEquations(timeMode: TimeMode, velMode: VelocityMode): [string, string] {
  const dtE = dtSnippet(timeMode)
  const vfE = vfSnippet(velMode)
  return [
    `${vfE} = @v0@ + @a@ \\cdot ${dtE}`,
    `\\Delta x = @v0@ \\cdot ${dtE} + \\dfrac{1}{2} @a@ \\cdot ${dtE}^2`,
  ]
}

export function getMruvFormulaTemplate(
  posMode: PositionMode,
  timeMode: TimeMode,
  velMode: VelocityMode,
  unknown: string,
): string {
  const dxE = dxSnippet(posMode)
  const dtE = dtSnippet(timeMode)
  const vfE = vfSnippet(velMode)

  switch (unknown) {
    case 'x0':
      return `x_0 = @xf@ - \\left(@v0@ \\cdot ${dtE} + \\dfrac{1}{2} @a@ \\cdot ${dtE}^2\\right)`
    case 'xf':
      return `x_f = @x0@ + @v0@ \\cdot ${dtE} + \\dfrac{1}{2} @a@ \\cdot ${dtE}^2`
    case 'dx':
      return `\\Delta x = @v0@ \\cdot ${dtE} + \\dfrac{1}{2} @a@ \\cdot ${dtE}^2`
    case 't0':
      return `t_0 = @tf@ - \\dfrac{${vfE} - @v0@}{@a@}`
    case 'tf':
      return `t_f = @t0@ + \\dfrac{${vfE} - @v0@}{@a@}`
    case 'dt':
      return `\\Delta t = \\dfrac{${vfE} - @v0@}{@a@}`
    case 'v0':
      return velMode === 'endpoints'
        ? `v_0 = @vf@ - @a@ \\cdot ${dtE}`
        : `v_0 = \\dfrac{${dxE} - \\dfrac{1}{2} @a@ \\cdot ${dtE}^2}{${dtE}}`
    case 'vf':
      return `v_f = @v0@ + @a@ \\cdot ${dtE}`
    case 'dv':
      return `\\Delta v = @a@ \\cdot ${dtE}`
    case 'a':
      return `a = \\dfrac{${vfE} - @v0@}{${dtE}}`
  }

  throw new Error(`No hay plantilla para "${unknown}" en MRUV.`)
}

/** Replaces every @field@ placeholder in a template using the given substitution function. */
export function renderMruvFormula(template: string, substitute: (field: string) => string): string {
  return template.replace(/@(\w+)@/g, (_, field: string) => substitute(field))
}

export interface MruvConstraint {
  fields: string[]
  check: (values: Record<string, number>) => string | null
}

export const MRUV_CONSTRAINTS: MruvConstraint[] = [
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

export function checkMruvConstraints(values: Record<string, number>): string[] {
  const violations: string[] = []
  for (const constraint of MRUV_CONSTRAINTS) {
    if (constraint.fields.every((field) => Number.isFinite(values[field]))) {
      const message = constraint.check(values)
      if (message) violations.push(message)
    }
  }
  return violations
}

function roundForMessage(value: number): string {
  return Number(value.toFixed(4)).toString()
}

function withinTolerance(actual: number, predicted: number): boolean {
  const scale = Math.max(1, Math.abs(actual), Math.abs(predicted))
  return Math.abs(actual - predicted) <= 1e-6 * scale
}

/**
 * With only ONE unknown, MRUV's 2 equations mean one of them ends up unused
 * for solving — but every field it needs was still *entered independently*
 * by the user, so it's a free consistency check: does the equation NOT used
 * to solve still hold for the given data? If not, the user typed a value
 * (say vf) that doesn't match what the other inputs (v0, a, Δt) actually
 * imply, and the "answer" would otherwise silently ignore that mismatch.
 *
 * Only meaningful for a single unknown — with 2 unknowns both equations are
 * used together to solve, so there's no leftover data to cross-check.
 */
export function checkMruvSingleConsistency(
  posMode: PositionMode,
  timeMode: TimeMode,
  velMode: VelocityMode,
  unknown: string,
  known: Record<string, number>,
  solvedValue: number,
): string | null {
  const canonical = FIELD_TO_CANONICAL[unknown]
  const v0 = canonical === 'v0' ? solvedValue : known.v0
  const a = canonical === 'a' ? solvedValue : known.a
  const dt =
    canonical === 'dt' ? solvedValue : timeMode === 'endpoints' ? known.tf - known.t0 : known.dt

  // eq2 (position) is the one NOT used to solve exactly when the unknown is
  // 'dx' itself, or when v0 was solved via eq2 (velMode=delta's only path).
  const eq2WasUsedToSolve = canonical === 'dx' || (canonical === 'v0' && velMode === 'delta')

  if (eq2WasUsedToSolve) {
    // eq1 is free to check: does the vf-slot value match v0 + a·Δt (or, in Δv
    // mode, does Δv match a·Δt)?
    if (velMode === 'endpoints') {
      const predictedVf = v0 + a * dt
      if (!withinTolerance(known.vf, predictedVf)) {
        return `Los datos no son consistentes entre sí: con @v0@, @a@ y @dt@, @vf@ debería ser ${roundForMessage(predictedVf)} m/s, pero ingresaste otro valor.`
      }
    } else {
      const predictedDv = a * dt
      if (!withinTolerance(known.dv, predictedDv)) {
        return `Los datos no son consistentes entre sí: con @a@ y @dt@, @dv@ debería ser ${roundForMessage(predictedDv)} m/s, pero ingresaste otro valor.`
      }
    }
    return null
  }

  // eq1 was used to solve (or the unknown is the vf-slot, making eq1 trivial
  // for it) — eq2 is free to check: does the known Δx match v0·Δt + ½·a·Δt²?
  const dx = posMode === 'endpoints' ? known.xf - known.x0 : known.dx
  const predictedDx = v0 * dt + 0.5 * a * dt * dt
  if (!withinTolerance(dx, predictedDx)) {
    return `Los datos no son consistentes entre sí: con @v0@, @a@ y @dt@, @dx@ debería ser ${roundForMessage(predictedDx)} m, pero los valores de posición que ingresaste no coinciden.`
  }
  return null
}

function resolveT0Tf(timeMode: TimeMode, values: Record<string, number>): [number, number] {
  const t0 = timeMode === 'endpoints' ? values.t0 : 0
  const tf = timeMode === 'endpoints' ? values.tf : values.dt
  return [t0, tf]
}

/**
 * x(t) = x0 + v0·(t − t0) + ½·a·(t − t0)², the (generally parabolic) position
 * curve. Whichever axis is only known as a delta has no absolute origin, so
 * it's anchored at 0.
 */
export function mruvPositionPlot(
  posMode: PositionMode,
  timeMode: TimeMode,
  values: Record<string, number>,
): PlotFunction {
  const x0 = posMode === 'endpoints' ? values.x0 : 0
  const [t0, tf] = resolveT0Tf(timeMode, values)
  const { v0, a } = values
  return {
    fn: (t) => {
      const dt = t - t0
      return x0 + v0 * dt + 0.5 * a * dt * dt
    },
    domain: [t0, tf],
  }
}

/** The two physically meaningful endpoints of the x(t) curve (for dots/projections). */
export function mruvMarkers(posMode: PositionMode, timeMode: TimeMode, values: Record<string, number>): PlotPoint[] {
  const x0 = posMode === 'endpoints' ? values.x0 : 0
  const xf = posMode === 'endpoints' ? values.xf : values.dx
  const [t0, tf] = resolveT0Tf(timeMode, values)

  return [
    { t: t0, x: x0 },
    { t: tf, x: xf },
  ]
}

/** v(t) = v0 + a·(t − t0). */
export function mruvVelocityPlot(timeMode: TimeMode, values: Record<string, number>): PlotFunction {
  const [t0, tf] = resolveT0Tf(timeMode, values)
  const { v0, a } = values
  return { fn: (t) => v0 + a * (t - t0), domain: [t0, tf] }
}

/** The two endpoints of the v(t) line (for dots/projections). */
export function mruvVelocityMarkers(timeMode: TimeMode, values: Record<string, number>): PlotPoint[] {
  const [t0, tf] = resolveT0Tf(timeMode, values)
  const { v0, a } = values
  return [
    { t: t0, x: v0 },
    { t: tf, x: v0 + a * (tf - t0) },
  ]
}

/** a(t) = a, constant throughout the movement. */
export function mruvAccelerationPlot(timeMode: TimeMode, values: Record<string, number>): PlotFunction {
  const [t0, tf] = resolveT0Tf(timeMode, values)
  return { fn: () => values.a, domain: [t0, tf] }
}

/** The two endpoints of the (constant) a(t) line. */
export function mruvAccelerationMarkers(timeMode: TimeMode, values: Record<string, number>): PlotPoint[] {
  const [t0, tf] = resolveT0Tf(timeMode, values)
  return [
    { t: t0, x: values.a },
    { t: tf, x: values.a },
  ]
}
