import { Link, useParams } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import PageContainer from '../components/PageContainer'
import { sections } from '../data/sections'

export default function GeneralCalculatorPage() {
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

  return (
    <PageContainer>
      <Breadcrumb
        items={[
          { label: 'Unidades', to: '/' },
          { label: section.title, to: `/${section.id}` },
          { label: 'Calculadora general' },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        Calculadora general — {section.title}
      </h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Vas a poder definir uno o varios móviles, cada uno con sus propios tramos de movimiento
        (MRU, MRUV, etc.), y calcular posiciones, velocidades, tiempos y encuentros entre ellos, con
        su gráfico correspondiente.
      </p>

      <div className="mt-8 rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        Todavía en construcción.
      </div>
    </PageContainer>
  )
}
