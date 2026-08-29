import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './MainLayout'
import { ClearPage } from '../pages/ClearPage'
import { FootprintsPage } from '../pages/FootprintsPage'
import { OurPage } from '../pages/OurPage'
import { SettingsPage } from '../pages/SettingsPage'
import { StarBottlePage } from '../pages/StarBottlePage'
import { TodayPage } from '../pages/TodayPage'

export function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/star-bottle" element={<StarBottlePage />} />
        <Route path="/footprints" element={<FootprintsPage />} />
        <Route path="/our" element={<OurPage />} />
        <Route path="/clear" element={<ClearPage />} />
      </Route>
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  )
}
