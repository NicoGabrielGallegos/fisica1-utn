export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        © {year} Nicolás Gallegos. Todos los derechos reservados.
      </div>
    </footer>
  )
}
