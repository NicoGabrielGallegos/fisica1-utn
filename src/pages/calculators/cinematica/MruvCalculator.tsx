import type { ReactNode } from 'react'
import { useState } from 'react'
import { InlineMath } from 'react-katex'
import FunctionChart from '../../../components/FunctionChart'
import {
  activeMruvFields,
  checkMruvConstraints,
  checkMruvSingleConsistency,
  FIELD_TO_CANONICAL,
  getMruvFormulaTemplate,
  getMruvSystemEquations,
  mruvAccelerationMarkers,
  mruvAccelerationPlot,
  mruvMarkers,
  mruvPositionPlot,
  mruvVelocityMarkers,
  mruvVelocityPlot,
  renderMruvFormula,
  solveMruvMulti,
  type PositionMode,
  type TimeMode,
  type VelocityMode,
} from '../../../lib/mruv'
import { FIELD_UNIT_KIND, fromSI, SI_UNIT, toSI, UNIT_OPTIONS, unitToLatex } from '../../../lib/units'

const FIELD_LABELS: Record<string, string> = {
  x0: 'Posición inicial',
  xf: 'Posición final',
  dx: 'Desplazamiento',
  t0: 'Tiempo inicial',
  tf: 'Tiempo final',
  dt: 'Tiempo transcurrido',
  v0: 'Velocidad inicial',
  vf: 'Velocidad final',
  dv: 'Variación de velocidad',
  a: 'Aceleración',
}

/** Plain-text symbols, used only for aria-labels (accessibility, not rendering). */
const FIELD_SYMBOLS_PLAIN: Record<string, string> = {
  x0: 'x0',
  xf: 'xf',
  dx: 'Δx',
  t0: 't0',
  tf: 'tf',
  dt: 'Δt',
  v0: 'v0',
  vf: 'vf',
  dv: 'Δv',
  a: 'a',
}

/** LaTeX symbols, rendered with KaTeX. */
const FIELD_SYMBOLS_TEX: Record<string, string> = {
  x0: 'x_0',
  xf: 'x_f',
  dx: '\\Delta x',
  t0: 't_0',
  tf: 't_f',
  dt: '\\Delta t',
  v0: 'v_0',
  vf: 'v_f',
  dv: '\\Delta v',
  a: 'a',
}

/** LaTeX units (\text mode), rendered with KaTeX. */
const FIELD_UNITS_TEX: Record<string, string> = {
  x0: '\\text{m}',
  xf: '\\text{m}',
  dx: '\\text{m}',
  t0: '\\text{s}',
  tf: '\\text{s}',
  dt: '\\text{s}',
  v0: '\\text{m/s}',
  vf: '\\text{m/s}',
  dv: '\\text{m/s}',
  a: '\\text{m/s}^2',
}

function formatNumber(value: number, decimals = 4): string {
  if (!Number.isFinite(value)) return '—'
  return Number(value.toFixed(decimals)).toString()
}

/** Same as formatNumber, but parenthesizes negatives so substitutions like "5 - (-3)" don't read as "5 - -3". */
function formatSubstitutedNumber(value: number): string {
  const formatted = formatNumber(value)
  return value < 0 ? `(${formatted})` : formatted
}

/** Renders a message that may contain @field@ placeholders as mixed text + InlineMath (see MruvConstraint). */
function renderMixedMessage(template: string): ReactNode {
  return template.split(/(@\w+@)/g).map((part, index) => {
    const match = /^@(\w+)@$/.exec(part)
    return match ? <InlineMath key={index} math={FIELD_SYMBOLS_TEX[match[1]]} /> : part
  })
}

function fieldLabelNode(id: string): ReactNode {
  return (
    <>
      {FIELD_LABELS[id]} (<InlineMath math={FIELD_SYMBOLS_TEX[id]} />)
    </>
  )
}

function ModeToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (next: T) => void
  options: { value: T; label: ReactNode }[]
}) {
  return (
    <div className="inline-flex rounded-md border border-neutral-300 p-0.5 dark:border-neutral-600">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded px-3 py-1 text-sm transition ${
            value === option.value
              ? 'bg-sky-600 text-white'
              : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Multi-select (up to 2) chip picker for "which variables don't you know". */
function UnknownPicker({
  fields,
  selected,
  onToggle,
}: {
  fields: string[]
  selected: string[]
  onToggle: (field: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Variables desconocidas">
      {fields.map((field) => {
        const isSelected = selected.includes(field)
        return (
          <button
            key={field}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            onClick={() => onToggle(field)}
            className={`rounded-md border px-3 py-2 text-sm transition ${
              isSelected
                ? 'border-sky-600 bg-sky-600 text-white'
                : 'border-neutral-300 text-neutral-700 hover:border-sky-400 hover:text-sky-600 dark:border-neutral-600 dark:text-neutral-300 dark:hover:border-sky-500 dark:hover:text-sky-400'
            }`}
          >
            {fieldLabelNode(field)}
          </button>
        )
      })}
    </div>
  )
}

function UnitSelect({
  kind,
  value,
  onChange,
  ariaLabel,
}: {
  kind: keyof typeof UNIT_OPTIONS
  value: string
  onChange: (unit: string) => void
  ariaLabel: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
    >
      {UNIT_OPTIONS[kind].map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function FieldInput({
  id,
  value,
  unit,
  onValueChange,
  onUnitChange,
}: {
  id: string
  value: string
  unit: string
  onValueChange: (value: string) => void
  onUnitChange: (unit: string) => void
}) {
  const ariaLabel = `${FIELD_LABELS[id]} (${FIELD_SYMBOLS_PLAIN[id]})`

  return (
    <div data-field={id} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
      <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {fieldLabelNode(id)}
      </span>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="0"
          aria-label={ariaLabel}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
        />
        <UnitSelect
          kind={FIELD_UNIT_KIND[id]}
          value={unit}
          onChange={onUnitChange}
          ariaLabel={`Unidad de ${ariaLabel}`}
        />
      </div>
    </div>
  )
}

export default function MruvCalculator() {
  const [posMode, setPosMode] = useState<PositionMode>('endpoints')
  const [timeMode, setTimeMode] = useState<TimeMode>('endpoints')
  const [velMode, setVelMode] = useState<VelocityMode>('endpoints')
  const [unknowns, setUnknowns] = useState<string[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [unitByField, setUnitByField] = useState<Record<string, string>>({})
  const [decimals, setDecimals] = useState(2)

  const activeFields = activeMruvFields(posMode, timeMode, velMode)
  const inputFields = activeFields.filter((field) => !unknowns.includes(field))

  function getFieldUnit(field: string): string {
    return unitByField[field] ?? SI_UNIT[FIELD_UNIT_KIND[field]]
  }

  function setFieldUnit(field: string, unit: string) {
    setUnitByField((current) => ({ ...current, [field]: unit }))
  }

  function resetSelection() {
    setUnknowns([])
    setValues({})
  }

  function handlePosModeChange(mode: PositionMode) {
    setPosMode(mode)
    resetSelection()
  }

  function handleTimeModeChange(mode: TimeMode) {
    setTimeMode(mode)
    resetSelection()
  }

  function handleVelModeChange(mode: VelocityMode) {
    setVelMode(mode)
    resetSelection()
  }

  function toggleUnknown(field: string) {
    setUnknowns((current) => {
      if (current.includes(field)) {
        return current.filter((f) => f !== field)
      }
      // At most one field per canonical quantity (e.g. x0 and xf both mean
      // "Δx"), and at most 2 total — adding a 3rd bumps the oldest pick.
      const canonical = FIELD_TO_CANONICAL[field]
      const next = current.filter((f) => FIELD_TO_CANONICAL[f] !== canonical)
      next.push(field)
      return next.length > 2 ? next.slice(next.length - 2) : next
    })
  }

  function setFieldValue(field: string, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const known: Record<string, number> = {}
  let missingField: string | null = null
  for (const field of inputFields) {
    const raw = values[field]
    const parsed = raw === undefined || raw.trim() === '' ? NaN : Number(raw)
    if (Number.isNaN(parsed)) {
      missingField = field
    } else {
      known[field] = toSI(parsed, getFieldUnit(field), FIELD_UNIT_KIND[field])
    }
  }

  const earlyViolations = unknowns.length > 0 ? checkMruvConstraints(known) : []

  let results: Record<string, number> | null = null
  let hint: string | null = null
  let error: string | null = null

  if (unknowns.length === 0) {
    hint = 'Elegí qué variable (o variables) no conocés.'
  } else if (earlyViolations.length > 0) {
    error = earlyViolations.join(' ')
  } else if (missingField) {
    hint = 'Completá todos los demás datos para calcular.'
  } else {
    try {
      const computed = solveMruvMulti(posMode, timeMode, velMode, unknowns, known)
      if (!Object.values(computed).every(Number.isFinite)) {
        error = 'No se puede calcular con estos datos (revisá que no haya una división por cero).'
      } else {
        const violations = checkMruvConstraints({ ...known, ...computed })
        const consistencyError =
          unknowns.length === 1
            ? checkMruvSingleConsistency(posMode, timeMode, velMode, unknowns[0], known, computed[unknowns[0]])
            : null
        if (violations.length > 0) {
          error = violations.join(' ')
        } else if (consistencyError) {
          error = consistencyError
        } else {
          results = computed
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'No se pudo calcular con estos datos.'
    }
  }

  const singleTemplate =
    unknowns.length === 1 ? getMruvFormulaTemplate(posMode, timeMode, velMode, unknowns[0]) : undefined
  const systemEquations = unknowns.length === 2 ? getMruvSystemEquations(timeMode, velMode) : undefined

  const fullValues = results ? { ...known, ...results } : null
  const positionPlot = fullValues ? mruvPositionPlot(posMode, timeMode, fullValues) : null
  const positionMarkers = fullValues ? mruvMarkers(posMode, timeMode, fullValues) : null
  const velocityPlot = fullValues ? mruvVelocityPlot(timeMode, fullValues) : null
  const velocityMarkers = fullValues ? mruvVelocityMarkers(timeMode, fullValues) : null
  const accelerationPlot = fullValues ? mruvAccelerationPlot(timeMode, fullValues) : null
  const accelerationMarkers = fullValues ? mruvAccelerationMarkers(timeMode, fullValues) : null

  const resultUnits = unknowns.map((field) => getFieldUnit(field))
  const displayResults =
    results && unknowns.every((field) => Number.isFinite(results![field]))
      ? unknowns.map((field, i) => fromSI(results![field], resultUnits[i], FIELD_UNIT_KIND[field]))
      : null

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-700">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Elegí cómo se van a tratar las variables de posición, tiempo y velocidad: por sus valores inicial y
          final, o directamente por su variación.
        </p>
        <div className="mt-3 flex flex-wrap gap-6">
          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">Posición</p>
            <ModeToggle
              value={posMode}
              onChange={handlePosModeChange}
              options={[
                {
                  value: 'endpoints',
                  label: (
                    <>
                      <InlineMath math="x_0" /> y <InlineMath math="x_f" />
                    </>
                  ),
                },
                { value: 'delta', label: <InlineMath math="\Delta x" /> },
              ]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">Tiempo</p>
            <ModeToggle
              value={timeMode}
              onChange={handleTimeModeChange}
              options={[
                {
                  value: 'endpoints',
                  label: (
                    <>
                      <InlineMath math="t_0" /> y <InlineMath math="t_f" />
                    </>
                  ),
                },
                { value: 'delta', label: <InlineMath math="\Delta t" /> },
              ]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">Velocidad</p>
            <ModeToggle
              value={velMode}
              onChange={handleVelModeChange}
              options={[
                {
                  value: 'endpoints',
                  label: (
                    <>
                      <InlineMath math="v_0" /> y <InlineMath math="v_f" />
                    </>
                  ),
                },
                {
                  value: 'delta',
                  label: (
                    <>
                      <InlineMath math="v_0" /> y <InlineMath math="\Delta v" />
                    </>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-700">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          ¿Qué variable (o variables) no conocés? El MRUV tiene 2 ecuaciones, así que en algunos casos se
          pueden calcular hasta 2 incógnitas a la vez.
        </p>
        <div className="mt-3">
          <UnknownPicker fields={activeFields} selected={unknowns} onToggle={toggleUnknown} />
        </div>
      </div>

      {unknowns.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Completá los siguientes datos
          </p>
          {inputFields.map((field) => (
            <FieldInput
              key={field}
              id={field}
              value={values[field] ?? ''}
              unit={getFieldUnit(field)}
              onValueChange={(value) => setFieldValue(field, value)}
              onUnitChange={(unit) => setFieldUnit(field, unit)}
            />
          ))}
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Resultado
          </h2>
          {unknowns.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
              {unknowns.map((field) => (
                <label key={field} className="flex items-center gap-1.5">
                  Unidad (<InlineMath math={FIELD_SYMBOLS_TEX[field]} />)
                  <UnitSelect
                    kind={FIELD_UNIT_KIND[field]}
                    value={getFieldUnit(field)}
                    onChange={(unit) => setFieldUnit(field, unit)}
                    ariaLabel={`Unidad del resultado (${FIELD_SYMBOLS_PLAIN[field]})`}
                  />
                </label>
              ))}
              <label className="flex items-center gap-1.5">
                Decimales
                <select
                  value={decimals}
                  onChange={(e) => setDecimals(Number(e.target.value))}
                  aria-label="Cantidad de decimales"
                  className="rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
        {results && displayResults ? (
          <div className="mt-3 space-y-4">
            {singleTemplate && (
              <>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Fórmula</p>
                  <p className="mt-1 text-neutral-700 dark:text-neutral-300">
                    <InlineMath math={renderMruvFormula(singleTemplate, (field) => FIELD_SYMBOLS_TEX[field])} />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Reemplazando los valores</p>
                  <p className="mt-1 text-neutral-700 dark:text-neutral-300">
                    <InlineMath
                      math={renderMruvFormula(
                        singleTemplate,
                        (field) => `${formatSubstitutedNumber(known[field])}\\,${FIELD_UNITS_TEX[field]}`,
                      )}
                    />
                  </p>
                  <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                    (valores en unidades del sistema internacional)
                  </p>
                </div>
              </>
            )}
            {systemEquations && (
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Sistema de 2 ecuaciones (2 incógnitas)
                </p>
                {systemEquations.map((equation, index) => (
                  <p key={index} className="mt-1 text-neutral-700 dark:text-neutral-300">
                    <InlineMath math={renderMruvFormula(equation, (field) => FIELD_SYMBOLS_TEX[field])} />
                  </p>
                ))}
              </div>
            )}
            {unknowns.map((field, index) => (
              <div key={field}>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{FIELD_LABELS[field]}</p>
                <p className="mt-1 text-2xl font-semibold text-sky-700 dark:text-sky-300">
                  <InlineMath
                    math={`${FIELD_SYMBOLS_TEX[field]} = ${formatNumber(displayResults[index], decimals)}\\ ${unitToLatex(resultUnits[index])}`}
                  />
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p
            className={`mt-2 text-sm ${
              error ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {renderMixedMessage(error ?? hint ?? '')}
          </p>
        )}
      </div>

      {positionPlot && positionMarkers && (
        <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-700">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Gráfico
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Posición en función del tiempo</p>
          <div className="mt-3">
            <FunctionChart
              fn={positionPlot.fn}
              domain={positionPlot.domain}
              markers={positionMarkers}
              color="green"
            />
          </div>
        </div>
      )}

      {velocityPlot && velocityMarkers && (
        <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-700">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Gráfico
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Velocidad en función del tiempo</p>
          <div className="mt-3">
            <FunctionChart
              fn={velocityPlot.fn}
              domain={velocityPlot.domain}
              markers={velocityMarkers}
              yLabel="v\ (\text{m/s})"
              valueLabel="Velocidad"
              valueUnit="m/s"
            />
          </div>
        </div>
      )}

      {accelerationPlot && accelerationMarkers && (
        <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-700">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Gráfico
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Aceleración en función del tiempo</p>
          <div className="mt-3">
            <FunctionChart
              fn={accelerationPlot.fn}
              domain={accelerationPlot.domain}
              markers={accelerationMarkers}
              color="red"
              yLabel="a\ (\text{m/s}^2)"
              valueLabel="Aceleración"
              valueUnit="m/s²"
            />
          </div>
        </div>
      )}
    </div>
  )
}
