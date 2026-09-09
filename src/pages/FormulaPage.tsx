import type { ComponentType } from 'react'
import { BlockMath } from 'react-katex'
import { Link, useParams } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import CalculatorDrawer from '../components/CalculatorDrawer'
import PageContainer from '../components/PageContainer'
import { calculatorsForSection } from '../data/calculators'
import { derivationFor } from '../data/derivations'
import { formulas } from '../data/formulas'
import { sections } from '../data/sections'

function DerivationBody({ component: Component }: { component?: ComponentType }) {
  if (!Component) {
    return <p className="text-neutral-500 dark:text-neutral-400">Demostración próximamente.</p>
  }
  return <Component />
}

export default function FormulaPage() {
  const { sectionId, formulaId } = useParams<{ sectionId: string; formulaId: string }>()
  const section = sections.find((s) => s.id === sectionId)
  const formula = formulas.find((f) => f.id === formulaId && f.sectionId === sectionId)

  if (!section || !formula) {
    return (
      <PageContainer>
        <p className="text-neutral-600 dark:text-neutral-400">Fórmula no encontrada.</p>
        <Link to="/" className="text-sky-600 dark:text-sky-400">
          Volver al inicio
        </Link>
      </PageContainer>
    )
  }

  const derivation = derivationFor(section.id, formula.id)
  const sectionCalculators = calculatorsForSection(section.id)

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumb
        items={[
          { label: 'Unidades', to: '/' },
          { label: section.title, to: `/${section.id}` },
          { label: formula.name },
        ]}
      />

      <div className="mt-6 flex flex-col gap-8 md:flex-row">
        <CalculatorDrawer sectionId={section.id} calculators={sectionCalculators} />

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{formula.name}</h1>

          <div className="mt-4 rounded-lg border border-neutral-200 p-6 text-center dark:border-neutral-700">
            <BlockMath math={formula.latex} />
          </div>

          <p className="mt-4 text-neutral-600 dark:text-neutral-400">{formula.description}</p>

          <h2 className="mt-10 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Demostración</h2>
          <div className="mt-4">
            <DerivationBody component={derivation} />
          </div>
        </div>
      </div>
    </div>
  )
}
