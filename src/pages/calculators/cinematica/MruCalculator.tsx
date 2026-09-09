import type { ReactNode } from 'react'
import { useState } from 'react'
import { InlineMath } from 'react-katex'
import PositionTimeChart from '../../../components/PositionTimeChart'
import {
  activeMruFields,
  checkMruConstraints,
  getMruFormulaTemplate,
  mruTrajectory,
  renderMruFormula,
  solveMru,
  type PositionMode,
  type TimeMode,
} from '../../../lib/mru'
import { FIELD_UNIT_KIND, fromSI, SI_UNIT, toSI, UNIT_OPTIONS } from '../../../lib/units'

const FIELD_LABELS: Record<string, string> = {
  x0: 'Posición inicial',
  xf: 'Posición final',
  dx: 'Desplazamiento',
  t0: 'Tiempo inicial',
  tf: 'Tiempo final',
  dt: 'Tiempo transcurrido',
  v: 'Velocidad',
}

/** Plain-text symbols, used only for aria-labels (accessibility, not rendering). */
const FIELD_SYMBOLS_PLAIN: Record<string, string> = {
  x0: 'x0',
  xf: 'xf',
  dx: 'Δx',
  t0: 't0',
  tf: 'tf',
  dt: 'Δt',
  v: 'v',
}

/** LaTeX symbols, rendered with KaTeX. */
const FIELD_SYMBOLS_TEX: Record<string, string> = {
  x0: 'x_0',
  xf: 'x_f',
  dx: '\\Delta x',
  t0: 't_0',
  tf: 't_f',
  dt: '\\Delta t',
  v: 'v',
}

/** LaTeX units (\text mode), rendered with KaTeX. */
const FIELD_UNITS_TEX: Record<string, string> = {
  x0: '\\text{m}',
  xf: '\\text{m}',
  dx: '\\text{m}',
  t0: '\\text{s}',
  tf: '\\text{s}',
  dt: '\\text{s}',
  v: '\\text{m/s}',
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

/** Renders a message that may contain @field@ placeholders as mixed text + InlineMath (see MruConstraint). */
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

function TargetPicker({
  fields,
  selected,
  onSelect,
}: {
  fields: string[]
  selected: string | null
  onSelect: (field: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Variable a calcular">
      {fields.map((field) => {
        const isSelected = field === selected
        return (
          <button
            key={field}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(field)}
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

export default function MruCalculator() {
  const [posMode, setPosMode] = useState<PositionMode>('endpoints')
  const [timeMode, setTimeMode] = useState<TimeMode>('endpoints')
  const [unknown, setUnknown] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [unitByField, setUnitByField] = useState<Record<string, string>>({})
  const [decimals, setDecimals] = useState(2)

  const activeFields = activeMruFields(posMode, timeMode)
  const inputFields = activeFields.filter((field) => field !== unknown)

  function getFieldUnit(field: string): string {
    return unitByField[field] ?? SI_UNIT[FIELD_UNIT_KIND[field]]
  }

  function setFieldUnit(field: string, unit: string) {
    setUnitByField((current) => ({ ...current, [field]: unit }))
  }

  function handlePosModeChange(mode: PositionMode) {
    setPosMode(mode)
    setUnknown(null)
    setValues({})
  }

  function handleTimeModeChange(mode: TimeMode) {
    setTimeMode(mode)
    setUnknown(null)
    setValues({})
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

  const earlyViolations = unknown ? checkMruConstraints(known) : []

  let result: number | null = null
  let hint: string | null = null
  let error: string | null = null

  if (!unknown) {
    hint = 'Elegí qué variable querés calcular.'
  } else if (earlyViolations.length > 0) {
    error = earlyViolations.join(' ')
  } else if (missingField) {
    hint = 'Completá todos los demás datos para calcular.'
  } else {
    try {
      const computed = solveMru(posMode, timeMode, unknown, known)
      if (!Number.isFinite(computed)) {
        error = 'No se puede calcular con estos datos (revisá que no haya una división por cero).'
      } else {
        const violations = checkMruConstraints({ ...known, [unknown]: computed })
        if (violations.length > 0) {
          error = violations.join(' ')
        } else {
          result = computed
        }
      }
    } catch {
      error = 'No se pudo calcular con estos datos.'
    }
  }

  const template = unknown ? getMruFormulaTemplate(posMode, timeMode, unknown) : undefined
  const trajectory =
    result !== null && unknown ? mruTrajectory(posMode, timeMode, { ...known, [unknown]: result }) : null
  const resultUnit = unknown ? getFieldUnit(unknown) : null
  const displayResult =
    result !== null && unknown && resultUnit ? fromSI(result, resultUnit, FIELD_UNIT_KIND[unknown]) : null

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-700">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Elegí cómo se van a tratar las variables de posición y de tiempo: por sus valores inicial y final, o
          directamente por su variación.
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
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-700">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">¿Qué variable querés calcular?</p>
        <div className="mt-3">
          <TargetPicker fields={activeFields} selected={unknown} onSelect={setUnknown} />
        </div>
      </div>

      {unknown && (
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
          {unknown && resultUnit && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
              <label className="flex items-center gap-1.5">
                Unidad
                <UnitSelect
                  kind={FIELD_UNIT_KIND[unknown]}
                  value={resultUnit}
                  onChange={(unit) => setFieldUnit(unknown, unit)}
                  ariaLabel="Unidad del resultado"
                />
              </label>
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
        {result !== null && unknown && displayResult !== null ? (
          <div className="mt-3 space-y-4">
            {template && (
              <>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Fórmula</p>
                  <p className="mt-1 text-neutral-700 dark:text-neutral-300">
                    <InlineMath math={renderMruFormula(template, (field) => FIELD_SYMBOLS_TEX[field])} />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Reemplazando los valores</p>
                  <p className="mt-1 text-neutral-700 dark:text-neutral-300">
                    <InlineMath
                      math={renderMruFormula(
                        template,
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
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{FIELD_LABELS[unknown]}</p>
              <p className="mt-1 text-2xl font-semibold text-sky-700 dark:text-sky-300">
                <InlineMath
                  math={`${FIELD_SYMBOLS_TEX[unknown]} = ${formatNumber(displayResult, decimals)}\\ \\text{${resultUnit}}`}
                />
              </p>
            </div>
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

      {trajectory && (
        <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-700">
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Gráfico
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Posición en función del tiempo</p>
          <div className="mt-3">
            <PositionTimeChart data={trajectory} />
          </div>
        </div>
      )}
    </div>
  )
}
