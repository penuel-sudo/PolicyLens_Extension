import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import LoginPage from './auth.tsx'
import Dashboard from './Dashboard.tsx'
import BadgePreview from './BadgePreview.tsx'
import SettingsPage from './components/Settings.tsx'
import Onboarding from './components/Onboarding.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/badge-preview" element={<BadgePreview />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
