import { Link, useParams } from 'react-router-dom'
import { sections } from '../data/sections'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const { sectionId } = useParams<{ sectionId: string }>()

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-3">
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          <Link to="/" className="mr-4 shrink-0 font-semibold text-neutral-900 dark:text-neutral-100">
            Física 1
          </Link>
          {sections.map((section) => {
            const isActive = section.id === sectionId
            return (
              <Link
                key={section.id}
                to={`/${section.id}`}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`}
              >
                {section.title}
              </Link>
            )
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
