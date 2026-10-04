import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MainLayout } from './MainLayout'
import { UpdateCheckNotice } from '../components'
import { ClearPage } from '../pages/ClearPage'
import { FootprintsPage } from '../pages/FootprintsPage'
import { OurPage } from '../pages/OurPage'
import { LoveDeliveryPage } from '../pages/LoveDeliveryPage'
import { LoveDeliveryIncomingPreviewPage } from '../pages/LoveDeliveryIncomingPreviewPage'
import { LoveDeliverySessionPreviewPage } from '../pages/LoveDeliverySessionPreviewPage'
import { LoveDeliveryConfirmationPreviewPage } from '../pages/LoveDeliveryConfirmationPreviewPage'
import { StarrySkyPage } from '../pages/StarrySkyPage'
import { StarrySkyTopicsPage } from '../pages/StarrySkyTopicsPage'
import { StarrySkyInvitePage } from '../pages/StarrySkyInvitePage'
import { StarrySkyIncomingInvitationPage } from '../pages/StarrySkyIncomingInvitationPage'
import { StarrySkySessionPreviewPage } from '../pages/StarrySkySessionPreviewPage'
import { StarrySkyHistoryPreviewPage } from '../pages/StarrySkyHistoryPreviewPage'
import { AppleIdentityPreviewPage } from '../pages/AppleIdentityPreviewPage'
import { RelationshipIdentityActionPage } from '../pages/RelationshipIdentityActionPage'
import { SettingsPage } from '../pages/SettingsPage'
import { StarBottlePage } from '../pages/StarBottlePage'
import { TodayPage } from '../pages/TodayPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { MemoryWallPhotoLibraryPage } from '../pages/MemoryWallPhotoLibraryPage'
import { HeartRevealPhotoPage } from '../pages/HeartRevealPhotoPage'
import { MomentPhotoManagementPage } from '../pages/MomentPhotoManagementPage'
import { SettingsInformationPage } from '../pages/SettingsInformationPage'
import { usePersistence } from '../data/PersistenceStateContext'
import { useEffect, useRef } from 'react'
import { isFirebaseRuntimeConfigured } from '../lib/firebase/firebaseEnvironment'
import { installQa12Diagnostics, qa12LocationCommitted, qa12RouteObserverMounted, qa12RouteObserverUnmounted, qa12RouterLocationRendered } from '../services/qa12Diagnostics'

function Qa12RouteCommitObserver() {
  const location = useLocation()
  const lastRenderedPathname = useRef<string | undefined>(undefined)
  const observerMountId = useRef<string | undefined>(undefined)
  if (lastRenderedPathname.current !== location.pathname) {
    qa12RouterLocationRendered(location.pathname)
    lastRenderedPathname.current = location.pathname
  }
  useEffect(() => {
    const mountId = qa12RouteObserverMounted()
    observerMountId.current = mountId
    return () => { if (mountId) qa12RouteObserverUnmounted(mountId) }
  }, [])
  useEffect(() => { qa12LocationCommitted(location.pathname) }, [location.pathname])
  return null
}

function FirebaseIdentityBootstrapper() {
  useEffect(() => {
    if (!isFirebaseRuntimeConfigured()) return
    let active = true
    void import('../lib/firebase/userBootstrap')
      .then(({ bootstrapAnonymousUser }) => bootstrapAnonymousUser())
      .catch(() => {
        if (active && import.meta.env.DEV) console.warn('Firebase identity bootstrap failed.')
      })
    return () => { active = false }
  }, [])
  return null
}

export function App() {
  const persistence = usePersistence()
  useEffect(() => {
    const diagnostics = installQa12Diagnostics()
    return diagnostics.dispose
  }, [])
  if (persistence && !persistence.settings.onboardingCompleted) {
    return <><UpdateCheckNotice /><Qa12RouteCommitObserver /><Routes>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes></>
  }

  return (
    <>
    <UpdateCheckNotice />
    <FirebaseIdentityBootstrapper />
    <Qa12RouteCommitObserver />
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/star-bottle" element={<StarBottlePage />} />
        <Route path="/footprints" element={<FootprintsPage />} />
        <Route path="/our" element={<OurPage />} />
        <Route path="/our/love-delivery" element={<LoveDeliveryPage />} />
        <Route path="/our/love-delivery/incoming-preview" element={<LoveDeliveryIncomingPreviewPage />} />
        <Route path="/our/love-delivery/session-preview" element={<LoveDeliverySessionPreviewPage />} />
        <Route path="/our/love-delivery/confirmation-preview" element={<LoveDeliveryConfirmationPreviewPage />} />
        <Route path="/our/starry-sky" element={<StarrySkyPage />} />
        <Route path="/our/starry-sky/topics" element={<StarrySkyTopicsPage />} />
        <Route path="/our/starry-sky/invite" element={<StarrySkyInvitePage />} />
        <Route path="/our/apple-identity-preview" element={<AppleIdentityPreviewPage />} />
        <Route path="/our/relationship-identity" element={<RelationshipIdentityActionPage />} />
        <Route path="/our/starry-sky/invitation-preview" element={<StarrySkyIncomingInvitationPage />} />
        <Route path="/our/starry-sky/session-preview" element={<StarrySkySessionPreviewPage />} />
        <Route path="/our/starry-sky/history-preview" element={<StarrySkyHistoryPreviewPage />} />
        <Route path="/clear" element={<ClearPage />} />
      </Route>
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/memory-wall-photos" element={<MemoryWallPhotoLibraryPage />} />
      <Route path="/settings/heart-reveal-photo" element={<HeartRevealPhotoPage />} />
      <Route path="/settings/moments" element={<MomentPhotoManagementPage />} />
      <Route path="/settings/help" element={<SettingsInformationPage kind="help" />} />
      <Route path="/settings/star-heart" element={<SettingsInformationPage kind="star-heart" />} />
      <Route path="/settings/star-bottle-help" element={<SettingsInformationPage kind="star-bottle-help" />} />
      <Route path="/settings/ai-chat-guide" element={<SettingsInformationPage kind="ai-chat-guide" />} />
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
