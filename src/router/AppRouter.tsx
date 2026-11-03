import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ApplicationPage } from '../pages/ApplicationPage'
import { ConfirmationPage } from '../pages/ConfirmationPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/solicitud" element={<ApplicationPage />} />
        <Route path="/comprobante" element={<ConfirmationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
