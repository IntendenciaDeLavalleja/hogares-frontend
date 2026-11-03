import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function FormLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-base-200"><Navbar />{children}<Footer /></div>
}
