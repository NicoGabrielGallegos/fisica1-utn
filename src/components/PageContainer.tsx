import type { ReactNode } from 'react'

export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>
}
