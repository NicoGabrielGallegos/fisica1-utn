import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1">
          {index > 0 && <span className="text-neutral-300 dark:text-neutral-600">/</span>}
          {item.to ? (
            <Link to={item.to} className="text-sky-600 hover:underline dark:text-sky-400">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
