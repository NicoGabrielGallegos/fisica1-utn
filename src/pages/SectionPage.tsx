import { InlineMath } from 'react-katex'
import { Link, useParams } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import PageContainer from '../components/PageContainer'
import { calculatorsForSection } from '../data/calculators'
import { formulasForSection } from '../data/formulas'
import { sections } from '../data/sections'

export default function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const section = sections.find((s) => s.id === sectionId)

  if (!section) {
    return (
      <PageContainer>
        <p className="text-neutral-600 dark:text-neutral-400">Unidad no encontrada.</p>
        <Link to="/" className="text-sky-600 dark:text-sky-400">
          Volver al inicio
        </Link>
      </PageContainer>
    )
  }

  const calculators = calculatorsForSection(section.id)
  const formulas = formulasForSection(section.id)

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: 'Unidades', to: '/' }, { label: section.title }]} />

      <span className="mt-4 block text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
        Unidad {section.order}
      </span>
      <h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {section.title}
      </h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">{section.description}</p>

      {/* 1. Calculadoras específicas */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Calculadoras</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Elegí el tipo de problema que querés resolver.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {calculators.map((calculator) => (
            <Link
              key={calculator.id}
              to={`/${section.id}/calculadora/${calculator.id}`}
              className="rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400 hover:shadow-md dark:border-neutral-700 dark:hover:border-neutral-500"
            >
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                {calculator.title}
                {!calculator.available && (
                  <span className="ml-2 text-xs font-normal text-neutral-400">(en construcción)</span>
                )}
              </h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{calculator.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Fórmulas del módulo */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Fórmulas</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Las ecuaciones usadas en esta unidad. Entrá a cada una para ver su demostración.
        </p>
        <div className="mt-4 space-y-2">
          {formulas.map((formula) => (
            <Link
              key={formula.id}
              to={`/${section.id}/formula/${formula.id}`}
              className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400 hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:border-neutral-700 dark:hover:border-neutral-500"
            >
              <div>
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                  {formula.name}
                  {!formula.derivationAvailable && (
                    <span className="ml-2 text-xs font-normal text-neutral-400">(demostración próximamente)</span>
                  )}
                </h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{formula.description}</p>
              </div>
              <div className="shrink-0 text-neutral-800 dark:text-neutral-200">
                <InlineMath math={formula.latex} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Calculadora general */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Calculadora general</h2>
        <Link
          to={`/${section.id}/general`}
          className="mt-4 block rounded-lg border border-dashed border-sky-300 bg-sky-50/50 p-5 transition hover:border-sky-400 dark:border-sky-700 dark:bg-sky-950/20"
        >
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Armá tu propio problema</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Definí uno o varios móviles, cada uno con sus propios tramos (MRU, MRUV, etc.) y calculá
            posiciones, velocidades, tiempos y encuentros entre ellos.
          </p>
        </Link>
      </section>
    </PageContainer>
  )
}
