import { Link } from 'react-router-dom'
import type { Calculator } from '../data/calculators'
import type { Formula } from '../data/formulas'

interface CalculatorDrawerProps {
  sectionId: string
  activeCalculatorId?: string
  calculators: Calculator[]
  /** Omit to hide the "Fórmulas usadas" section entirely (e.g. on formula pages). */
  formulas?: Formula[]
}

export default function CalculatorDrawer({
  sectionId,
  activeCalculatorId,
  calculators,
  formulas,
}: CalculatorDrawerProps) {
  return (
    <aside className="shrink-0 md:w-56">
      <div className="space-y-6 md:sticky md:top-6">
        <div>
          <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Calculadoras
          </h2>
          <nav className="mt-2 space-y-0.5">
            {calculators.map((calculator) => {
              const isActive = calculator.id === activeCalculatorId
              return (
                <Link
                  key={calculator.id}
                  to={`/${sectionId}/calculadora/${calculator.id}`}
                  className={`block rounded-md px-3 py-1.5 text-sm transition ${
                    isActive
                      ? 'bg-sky-100 font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                  }`}
                >
                  {calculator.title}
                </Link>
              )
            })}
          </nav>
        </div>

        {formulas && (
          <div>
            <h2 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
              Fórmulas usadas
            </h2>
            <nav className="mt-2 space-y-0.5">
              {formulas.length === 0 && (
                <p className="px-3 text-sm text-neutral-400 dark:text-neutral-500">
                  Sin fórmulas asociadas todavía.
                </p>
              )}
              {formulas.map((formula) => (
                <Link
                  key={formula.id}
                  to={`/${sectionId}/formula/${formula.id}`}
                  className="block rounded-md px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  {formula.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </aside>
  )
}
