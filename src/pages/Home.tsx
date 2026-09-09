import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import { sections } from '../data/sections'

export default function Home() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
        Física 1 — UTN FRRo
      </h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        Elegí una unidad para resolver problemas y ver desarrollos paso a paso.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.id}
            to={`/${section.id}`}
            className="rounded-lg border border-neutral-200 p-5 transition hover:border-neutral-400 hover:shadow-md dark:border-neutral-700 dark:hover:border-neutral-500"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-sky-400">
              Unidad {section.order}
            </span>
            <h2 className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </PageContainer>
  )
}
