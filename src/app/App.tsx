import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './MainLayout'
import { UpdateCheckNotice } from '../components'
import { ClearPage } from '../pages/ClearPage'
import { FootprintsPage } from '../pages/FootprintsPage'
import { OurPage } from '../pages/OurPage'
import { SettingsPage } from '../pages/SettingsPage'
import { StarBottlePage } from '../pages/StarBottlePage'
import { TodayPage } from '../pages/TodayPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { MemoryWallPhotoLibraryPage } from '../pages/MemoryWallPhotoLibraryPage'
import { HeartRevealPhotoPage } from '../pages/HeartRevealPhotoPage'
import { MomentPhotoManagementPage } from '../pages/MomentPhotoManagementPage'
import { SettingsInformationPage } from '../pages/SettingsInformationPage'
import { usePersistence } from '../data/PersistenceStateContext'

export function App() {
  const persistence = usePersistence()
  if (persistence && !persistence.settings.onboardingCompleted) {
    return <><UpdateCheckNotice /><Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes></>
  }

  return (
    <>
    <UpdateCheckNotice />
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/star-bottle" element={<StarBottlePage />} />
        <Route path="/footprints" element={<FootprintsPage />} />
        <Route path="/our" element={<OurPage />} />
        <Route path="/clear" element={<ClearPage />} />
      </Route>
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/memory-wall-photos" element={<MemoryWallPhotoLibraryPage />} />
      <Route path="/settings/heart-reveal-photo" element={<HeartRevealPhotoPage />} />
      <Route path="/settings/moments" element={<MomentPhotoManagementPage />} />
      <Route path="/settings/help" element={<SettingsInformationPage kind="help" />} />
      <Route path="/settings/star-heart" element={<SettingsInformationPage kind="star-heart" />} />
      <Route path="/settings/star-bottle-help" element={<SettingsInformationPage kind="star-bottle-help" />} />
      <Route path="/settings/data-help" element={<SettingsInformationPage kind="data-help" />} />
      <Route path="/settings/privacy" element={<SettingsInformationPage kind="privacy" />} />
      <Route path="/settings/terms" element={<SettingsInformationPage kind="terms" />} />
      <Route path="/settings/version" element={<SettingsInformationPage kind="version" />} />
      <Route path="/onboarding" element={<Navigate to="/today" replace />} />
      <Route path="/" element={<Navigate to="/today" replace />} />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
    </>
  )
}
