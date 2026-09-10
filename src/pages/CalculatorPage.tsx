import type { ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import CalculatorDrawer from '../components/CalculatorDrawer'
import PageContainer from '../components/PageContainer'
import { calculatorComponentFor } from '../data/calculatorComponents'
import { calculators, calculatorsForSection } from '../data/calculators'
import { formulas } from '../data/formulas'
import { sections } from '../data/sections'

function CalculatorBody({ component: Component }: { component?: ComponentType }) {
  if (!Component) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        Esta calculadora todavía está en construcción.
      </div>
    )
  }
  return <Component />
}

export default function CalculatorPage() {
  const { sectionId, calculatorId } = useParams<{ sectionId: string; calculatorId: string }>()
  const section = sections.find((s) => s.id === sectionId)
  const calculator = calculators.find((c) => c.id === calculatorId && c.sectionId === sectionId)

  if (!section || !calculator) {
    return (
      <PageContainer>
        <p className="text-neutral-600 dark:text-neutral-400">Calculadora no encontrada.</p>
        <Link to="/" className="text-sky-600 dark:text-sky-400">
          Volver al inicio
        </Link>
      </PageContainer>
    )
  }

  const siblingCalculators = calculatorsForSection(section.id)
  const calculatorFormulas = formulas.filter((formula) => calculator.formulaIds.includes(formula.id))
  const calculatorComponent = calculatorComponentFor(section.id, calculator.id)

  return (
    <div className="px-6 py-10">
      <Breadcrumb
        items={[
          { label: 'Unidades', to: '/' },
          { label: section.title, to: `/${section.id}` },
          { label: calculator.title },
        ]}
      />

      {/* No outer max-width/mx-auto here on purpose: the drawer sits right after
          the page padding, hugging the screen's left edge, while the main
          content is centered within whatever space is left (see the inner
          max-w-4xl wrapper below) instead of the whole row being centered as
          one block. */}
      <div className="mt-6 flex flex-col gap-8 md:flex-row md:items-start">
        <CalculatorDrawer
          sectionId={section.id}
          activeCalculatorId={calculator.id}
          calculators={siblingCalculators}
          formulas={calculatorFormulas}
        />

        <div className="flex min-w-0 flex-1 justify-center">
          <div className="w-full max-w-4xl">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {calculator.title}
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">{calculator.description}</p>

            <div className="mt-8">
              <CalculatorBody component={calculatorComponent} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
