import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function FormLayout({ children }: { children: ReactNode }) {
  return <div className="form-page min-h-screen bg-base-200 text-base-content" data-theme="light"><Navbar />{children}<Footer /></div>
}
