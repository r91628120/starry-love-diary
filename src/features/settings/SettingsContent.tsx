import { useEffect, useMemo, useRef, useState, type ChangeEvent, type Dispatch, type PointerEvent as ReactPointerEvent, type SetStateAction } from 'react'
import { useNavigate } from 'react-router-dom'
import { ourAssets, settingsAssets, starBottleAssets, todayAssets } from '../../assets/uiAssets'
import { ConfirmDialog, ProfilePhotoVisual } from '../../components'
import { usePersistence } from '../../data/PersistenceStateContext'
import type { PhotoPlacement, ProfileKind } from '../../data/types'
import { useI18n } from '../../i18n/I18nContext'
import type { Locale, TranslationKey } from '../../i18n/messages'
import { WebPhotoPickerService } from '../../services/photoPickerService'
import { usePhotoObjectUrl } from '../../services/usePhotoObjectUrl'
import { DEFAULT_PHOTO_PLACEMENT, normalizePhotoPlacement, photoObjectPosition } from '../../services/photoPlacement'
import { applyPointerDeltaToPlacement, measurePhotoPlacementGeometry } from '../../services/photoPlacementGeometry'
import { useProfilePhotoPlacement } from '../../services/useProfilePhotoPlacement'
import { formatSettingsDate } from './settingsFormatters'
import { SettingsRow, SettingsSection } from './SettingsSection'
import { APP_VERSION } from '../../app/appMetadata'
import { exportAppData } from '../../services/exportAppData'
import { exportTextData } from '../../services/exportTextData'
import { exportQa12Diagnostics } from '../../services/qa12Diagnostics'
import { AppDataImportError, buildImportPlan, parseAppDataFile, summarizeImportPlan, type AppDataImportPlan } from '../../services/importAppData'

const languages: Array<{ locale: Locale; key: TranslationKey }> = [
  { locale: 'zh-TW', key: 'settings.language.zh' },
  { locale: 'en', key: 'settings.language.en' },
  { locale: 'ja', key: 'settings.language.ja' },
  { locale: 'ko', key: 'settings.language.ko' },
  { locale: 'es', key: 'settings.language.es' },
  { locale: 'fr', key: 'settings.language.fr' },
]

export function SettingsContent() {
  const { t, locale, setLocale } = useI18n()
  const navigate = useNavigate()
  const persistence = usePersistence()
  const [userNickname, setUserNickname] = useState(persistence?.userProfile.nickname ?? t('settings.profile.meValue'))
  const [partnerNickname, setPartnerNickname] = useState(persistence?.partnerProfile.nickname ?? t('settings.profile.partnerValue'))
  const [feedbackKey, setFeedbackKey] = useState<TranslationKey>()
  const [isExporting, setIsExporting] = useState(false)
  const textExportInFlight = useRef(false)
  const [isExportingAppData, setIsExportingAppData] = useState(false)
  const [isExportingQa12Diagnostics, setIsExportingQa12Diagnostics] = useState(false)
  const qa12DiagnosticsInFlight = useRef(false)
  const appDataExportInFlight = useRef(false)
  const appDataFileInput = useRef<HTMLInputElement>(null)
  const [pendingImportPlan, setPendingImportPlan] = useState<AppDataImportPlan>()
  const [isImporting, setIsImporting] = useState(false)
  const [clearDialogStep, setClearDialogStep] = useState<1 | 2>()
  const [isClearingRelationship, setIsClearingRelationship] = useState(false)
  const [busyPhotoKind, setBusyPhotoKind] = useState<ProfileKind>()
  const [removePhotoKind, setRemovePhotoKind] = useState<ProfileKind>()
  const [adjustPhotoKind, setAdjustPhotoKind] = useState<ProfileKind>()
  const [draftPlacement, setDraftPlacement] = useState<PhotoPlacement>({ ...DEFAULT_PHOTO_PLACEMENT })
  const photoPicker = useMemo(() => new WebPhotoPickerService(), [])
  const userPhotoUrl = usePhotoObjectUrl(persistence?.repositories.photos, persistence?.userProfile.photoAssetId, 'thumbnail')
  const partnerPhotoUrl = usePhotoObjectUrl(persistence?.repositories.photos, persistence?.partnerProfile.photoAssetId, 'thumbnail')
  const [userPhotoPlacement, setUserPhotoPlacement] = useProfilePhotoPlacement(persistence?.repositories.profilePhotoPlacements, 'user', persistence?.userProfile.photoAssetId)
  const [partnerPhotoPlacement, setPartnerPhotoPlacement] = useProfilePhotoPlacement(persistence?.repositories.profilePhotoPlacements, 'partner', persistence?.partnerProfile.photoAssetId)

  useEffect(() => {
    if (persistence) setUserNickname(persistence.userProfile.nickname)
  }, [persistence, persistence?.userProfile.nickname])
  useEffect(() => {
    if (persistence) setPartnerNickname(persistence.partnerProfile.nickname)
  }, [persistence, persistence?.partnerProfile.nickname])
  const persistNickname = async (kind: 'user' | 'partner', nickname: string) => {
    const normalized = nickname.trim()
    if (!normalized) {
      setFeedbackKey('settings.validation.nicknameRequired')
      return
    }
    if ([...normalized].length > 20) {
      setFeedbackKey('settings.validation.nicknameTooLong')
      return
    }
    if (!persistence) return
    try {
      await persistence.updateProfile(kind, { nickname: normalized })
      setFeedbackKey('settings.feedback.profileSaved')
    } catch {
      setFeedbackKey('settings.feedback.saveError')
    }
  }

  const chooseLocale = (nextLocale: Locale) => {
    setLocale(nextLocale)
    if (persistence) void persistence.updateSettings({ locale: nextLocale }).catch(() => setFeedbackKey('settings.feedback.saveError'))
  }

  const exportText = async () => {
    if (!persistence || textExportInFlight.current) return
    textExportInFlight.current = true
    setIsExporting(true)
    setFeedbackKey('export.feedback.preparing')
    try {
      const { delivery } = await exportTextData({ repositories: persistence.repositories, locale, localDate: persistence.currentLocalDate, t })
      setFeedbackKey(delivery === 'downloaded' ? 'export.feedback.success' : delivery === 'share-sheet-opened' ? 'export.feedback.shareSheetOpened' : delivery === 'cancelled' ? 'export.feedback.cancelled' : 'export.feedback.error')
    } catch {
      setFeedbackKey('export.feedback.error')
    } finally {
      textExportInFlight.current = false
      setIsExporting(false)
    }
  }

  const exportFullAppData = async () => {
    if (!persistence || appDataExportInFlight.current) return
    appDataExportInFlight.current = true
    setIsExportingAppData(true)
    setFeedbackKey('exportAppData.preparing')
    try {
      const result = await exportAppData({ repositories: persistence.repositories, localDate: persistence.currentLocalDate })
      setFeedbackKey(result.delivery === 'downloaded' ? 'exportAppData.success'
        : result.delivery === 'share-sheet-opened' ? 'exportAppData.shareSheetOpened'
          : result.delivery === 'cancelled' ? 'exportAppData.cancelled'
            : 'exportAppData.error')
    } catch {
      setFeedbackKey('exportAppData.error')
    } finally {
      appDataExportInFlight.current = false
      setIsExportingAppData(false)
    }
  }

  const exportQa12DiagnosticLog = async () => {
    if (qa12DiagnosticsInFlight.current) return
    qa12DiagnosticsInFlight.current = true
    setIsExportingQa12Diagnostics(true)
    setFeedbackKey('settings.qa12.preparing')
    try {
      const delivery = await exportQa12Diagnostics()
      setFeedbackKey(delivery === 'share-sheet-opened' ? 'settings.qa12.ready' : delivery === 'downloaded' ? 'settings.qa12.downloaded' : delivery === 'cancelled' ? 'settings.qa12.cancelled' : 'settings.qa12.error')
    } catch {
      setFeedbackKey('settings.qa12.error')
    } finally {
      qa12DiagnosticsInFlight.current = false
      setIsExportingQa12Diagnostics(false)
    }
  }

  const importErrorKey = (error: unknown): TranslationKey => {
    if (!(error instanceof AppDataImportError)) return 'importAppData.error.write'
    const keys: Record<AppDataImportError['code'], TranslationKey> = {
      file_too_large: 'importAppData.error.tooLarge', file_read_failed: 'importAppData.error.fileRead', invalid_json: 'importAppData.error.invalidJson', invalid_format: 'importAppData.error.invalidFormat', unsupported_export_version: 'importAppData.error.unsupportedVersion', newer_schema: 'importAppData.error.newerSchema', invalid_data: 'importAppData.error.invalidData',
    }
    return keys[error.code]
  }
  const chooseAppDataFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file || !persistence || isImporting) return
    setFeedbackKey('importAppData.checking')
    try {
      const parsed = await parseAppDataFile(file)
      setPendingImportPlan(await buildImportPlan(persistence.repositories, parsed))
      setFeedbackKey(undefined)
    } catch (error) {
      setFeedbackKey(importErrorKey(error))
    }
  }
  const cancelAppDataImport = () => {
    setPendingImportPlan(undefined)
    if (appDataFileInput.current) appDataFileInput.current.value = ''
  }
  const confirmAppDataImport = async () => {
    if (!persistence || !pendingImportPlan || isImporting) return
    setIsImporting(true)
    try {
      const summary = await persistence.applyAppDataImport(pendingImportPlan)
      const importedSettings = await persistence.repositories.settings.getSettings()
      if (importedSettings) setLocale(importedSettings.locale)
      setPendingImportPlan(undefined)
      setFeedbackKey(summary.added + summary.updated ? 'importAppData.success' : 'importAppData.noChanges')
    } catch {
      setFeedbackKey('importAppData.error.write')
    } finally {
      setIsImporting(false)
      if (appDataFileInput.current) appDataFileInput.current.value = ''
    }
  }
  const confirmClearRelationship = async () => {
    if (!persistence || isClearingRelationship) return
    setIsClearingRelationship(true)
    try {
      await persistence.clearCurrentRelationshipData()
      navigate('/onboarding', { replace: true })
    } catch {
      setClearDialogStep(undefined)
      setFeedbackKey('settings.clearRelationship.error')
    } finally {
      setIsClearingRelationship(false)
    }
  }

  const chooseProfilePhoto = async (kind: ProfileKind) => {
    if (!persistence || busyPhotoKind) return
    setBusyPhotoKind(kind)
    setFeedbackKey(undefined)
    try {
      const file = await photoPicker.pickOne()
      if (!file) return
      await persistence.replaceProfilePhoto(kind, file)
      if (kind === 'user') setUserPhotoPlacement({ ...DEFAULT_PHOTO_PLACEMENT })
      else setPartnerPhotoPlacement({ ...DEFAULT_PHOTO_PLACEMENT })
      if (adjustPhotoKind === kind) setAdjustPhotoKind(undefined)
      setFeedbackKey('settings.feedback.photoImported')
    } catch {
      setFeedbackKey('settings.feedback.photoImportError')
    } finally {
      setBusyPhotoKind(undefined)
    }
  }

  const confirmRemovePhoto = async () => {
    const kind = removePhotoKind
    setRemovePhotoKind(undefined)
    if (!kind || !persistence || busyPhotoKind) return
    setBusyPhotoKind(kind)
    setFeedbackKey(undefined)
    try {
      await persistence.removeProfilePhoto(kind)
      if (kind === 'user') setUserPhotoPlacement({ ...DEFAULT_PHOTO_PLACEMENT })
      else setPartnerPhotoPlacement({ ...DEFAULT_PHOTO_PLACEMENT })
      if (adjustPhotoKind === kind) setAdjustPhotoKind(undefined)
      setFeedbackKey('settings.feedback.photoRemoved')
    } catch {
      setFeedbackKey('settings.feedback.photoRemoveError')
    } finally {
      setBusyPhotoKind(undefined)
    }
  }

  const birthdayRecord = persistence?.importantDates.find((record) => record.type === 'birthday')
  const metRecord = persistence?.importantDates.find((record) => record.type === 'first_meeting')
  const anniversaryRecord = persistence?.importantDates.find((record) => record.type === 'anniversary')
  const birthday = birthdayRecord ? formatSettingsDate(birthdayRecord.date, locale, { month: 'short', day: 'numeric' }) : t('settings.common.notSet')
  const metDate = metRecord ? formatSettingsDate(metRecord.date, locale) : t('settings.common.notSet')
  const anniversary = anniversaryRecord ? formatSettingsDate(anniversaryRecord.date, locale) : t('settings.common.notSet')
  const beginPhotoAdjustment = (kind: ProfileKind) => {
    setDraftPlacement({ ...(kind === 'user' ? userPhotoPlacement : partnerPhotoPlacement) })
    setAdjustPhotoKind(kind)
    setFeedbackKey(undefined)
  }
  const completePhotoAdjustment = async () => {
    if (!persistence || !adjustPhotoKind) return
    const kind = adjustPhotoKind
    const photoAssetId = kind === 'user' ? persistence.userProfile.photoAssetId : persistence.partnerProfile.photoAssetId
    if (!photoAssetId) return
    setBusyPhotoKind(kind)
    try {
      const saved = await persistence.repositories.profilePhotoPlacements.savePlacement(kind, photoAssetId, draftPlacement)
      if (kind === 'user') setUserPhotoPlacement(saved)
      else setPartnerPhotoPlacement(saved)
      setAdjustPhotoKind(undefined)
    } catch {
      setFeedbackKey('settings.feedback.saveError')
    } finally {
      setBusyPhotoKind(undefined)
    }
  }

  return <>
    <div className="settings-grid">
      <SettingsSection title={t('settings.profile.title')} icon={settingsAssets.star}>
        <SettingsRow label={t('settings.profile.meName')} controlLayout="responsive" control={<input className="settings-text-input" aria-label={t('settings.profile.meName')} aria-invalid={!userNickname.trim()} maxLength={20} value={userNickname} onChange={(event) => setUserNickname(event.target.value)} onBlur={() => void persistNickname('user', userNickname)} />} />
        <SettingsRow label={t('settings.profile.partnerName')} controlLayout="responsive" control={<input className="settings-text-input" aria-label={t('settings.profile.partnerName')} aria-invalid={!partnerNickname.trim()} maxLength={20} value={partnerNickname} onChange={(event) => setPartnerNickname(event.target.value)} onBlur={() => void persistNickname('partner', partnerNickname)} />} />
        <SettingsRow icon={userPhotoUrl ?? starBottleAssets.profilePlaceholders.blue} iconClassName={`settings-profile-photo ${userPhotoUrl ? 'settings-profile-photo--real' : ''}`.trim()} iconStyle={userPhotoUrl ? { objectPosition: photoObjectPosition(userPhotoPlacement) } : undefined} label={t('settings.profile.mePhoto')} controlLayout="below" control={<div className="settings-photo-actions"><button type="button" disabled={Boolean(busyPhotoKind)} onClick={() => void chooseProfilePhoto('user')}>{t(persistence?.userProfile.photoAssetId ? 'settings.profile.changePhoto' : 'settings.profile.selectPhoto')}</button>{persistence?.userProfile.photoAssetId ? <><button type="button" disabled={Boolean(busyPhotoKind)} onClick={() => beginPhotoAdjustment('user')}>{t('memoryWallEditor.adjust')}</button><button type="button" className="settings-photo-actions__remove" disabled={Boolean(busyPhotoKind)} onClick={() => setRemovePhotoKind('user')}>{t('settings.profile.removePhoto')}</button></> : null}</div>} />
        <SettingsRow icon={partnerPhotoUrl ?? starBottleAssets.profilePlaceholders.pink} iconClassName={`settings-profile-photo ${partnerPhotoUrl ? 'settings-profile-photo--real' : ''}`.trim()} iconStyle={partnerPhotoUrl ? { objectPosition: photoObjectPosition(partnerPhotoPlacement) } : undefined} label={t('settings.profile.partnerPhoto')} controlLayout="below" control={<div className="settings-photo-actions"><button type="button" disabled={Boolean(busyPhotoKind)} onClick={() => void chooseProfilePhoto('partner')}>{t(persistence?.partnerProfile.photoAssetId ? 'settings.profile.changePhoto' : 'settings.profile.selectPhoto')}</button>{persistence?.partnerProfile.photoAssetId ? <><button type="button" disabled={Boolean(busyPhotoKind)} onClick={() => beginPhotoAdjustment('partner')}>{t('memoryWallEditor.adjust')}</button><button type="button" className="settings-photo-actions__remove" disabled={Boolean(busyPhotoKind)} onClick={() => setRemovePhotoKind('partner')}>{t('settings.profile.removePhoto')}</button></> : null}</div>} />
        {adjustPhotoKind ? <ProfilePhotoPlacementEditor kind={adjustPhotoKind} photoUrl={adjustPhotoKind === 'user' ? userPhotoUrl : partnerPhotoUrl} placement={draftPlacement} setPlacement={setDraftPlacement} frameSrc={adjustPhotoKind === 'user' ? todayAssets.profileFrameBlue : todayAssets.profileFramePink} placeholderSrc={adjustPhotoKind === 'user' ? starBottleAssets.profilePlaceholders.blue : starBottleAssets.profilePlaceholders.pink} alt={t(adjustPhotoKind === 'user' ? 'today.profile.meAlt' : 'today.profile.partnerAlt')} onDone={() => void completePhotoAdjustment()} /> : null}
      </SettingsSection>
      <SettingsSection title={t('settings.dates.title')} icon={settingsAssets.metDate}>
        <SettingsRow icon={settingsAssets.birthdayCake} label={t('settings.dates.birthday')} value={birthday} onClick={() => navigate('/our')} />
        <SettingsRow icon={settingsAssets.metDate} label={t('settings.dates.met')} value={metDate} onClick={() => navigate('/our')} />
        <SettingsRow icon={settingsAssets.anniversary} label={t('settings.dates.anniversary')} value={anniversary} onClick={() => navigate('/our')} />
      </SettingsSection>
      <SettingsSection title={t('settings.memories.title')} icon={settingsAssets.camera}>
        <SettingsRow icon={settingsAssets.memoryWall} label={t('settings.memories.wall')} onClick={() => navigate('/settings/memory-wall-photos', { state: { from: '/settings' } })} />
        <SettingsRow icon={settingsAssets.camera} label={t('today.heartReveal.title')} onClick={() => navigate('/settings/heart-reveal-photo', { state: { from: '/settings' } })} />
        <SettingsRow icon={settingsAssets.moment} label={t('settings.memories.moments')} onClick={() => navigate('/settings/moments', { state: { from: '/settings' } })} />
        <SettingsRow icon={ourAssets.message.edit} label={t('settings.memories.message')} onClick={() => navigate('/our')} />
      </SettingsSection>
      <SettingsSection title={t('settings.diary.title')} icon={settingsAssets.star}>
        <SettingsRow icon={settingsAssets.star} label={t('settings.diary.stars')} onClick={() => navigate('/star-bottle')} />
        <SettingsRow icon={settingsAssets.exportData} label={t('settings.diary.export')} onClick={isExporting ? undefined : () => void exportText()} />
        <SettingsRow icon={settingsAssets.exportData} label={t('settings.diary.exportAppData')} description={t('exportAppData.description')} onClick={isExportingAppData ? undefined : () => void exportFullAppData()} />
        <SettingsRow icon={settingsAssets.exportData} label={t('settings.diary.importAppData')} description={t('importAppData.description')} onClick={isImporting ? undefined : () => appDataFileInput.current?.click()} />
      </SettingsSection>
      <SettingsSection title={t('settings.help.title')} icon={settingsAssets.info}>
        <SettingsRow icon={settingsAssets.info} label={t('settings.help.usingApp')} description={t('settings.help.usingApp.description')} onClick={() => navigate('/settings/help', { state: { from: '/settings' } })} />
        <SettingsRow icon={settingsAssets.star} label={t('settings.help.starHeart')} description={t('settings.help.starHeart.description')} onClick={() => navigate('/settings/star-heart', { state: { from: '/settings' } })} />
        <SettingsRow icon={starBottleAssets.moodStar} label={t('settings.help.starBottle')} description={t('settings.help.starBottle.description')} onClick={() => navigate('/settings/star-bottle-help', { state: { from: '/settings' } })} />
        <SettingsRow icon={settingsAssets.backup} label={t('settings.help.data')} description={t('settings.help.data.description')} onClick={() => navigate('/settings/data-help', { state: { from: '/settings' } })} />
      </SettingsSection>
    </div>
    <SettingsSection title={t('settings.language.title')} icon={settingsAssets.language} className="settings-section--wide">
      <div className="language-options" role="group" aria-label={t('settings.language.title')}>
        {languages.map((item) => <button type="button" aria-pressed={locale === item.locale} className={locale === item.locale ? 'is-active' : ''} onClick={() => chooseLocale(item.locale)} key={item.locale}>{locale === item.locale ? <span aria-hidden="true">✓</span> : null}{t(item.key)}</button>)}
      </div>
    </SettingsSection>
    <div className="settings-grid settings-grid--last">
      <SettingsSection title={t('settings.privacy.title')} icon={settingsAssets.privacy}>
        <SettingsRow icon={settingsAssets.trash} label={t('settings.privacy.clearData')} description={t('settings.clearRelationship.description')} onClick={() => setClearDialogStep(1)} danger />
      </SettingsSection>
      <SettingsSection title={t('settings.about.title')} icon={settingsAssets.info}>
        <SettingsRow icon={settingsAssets.info} label={t('settings.about.version')} value={APP_VERSION} onClick={() => navigate('/settings/version', { state: { from: '/settings' } })} />
        <SettingsRow icon={settingsAssets.privacyPolicy} label={t('settings.about.privacyPolicy')} onClick={() => navigate('/settings/privacy', { state: { from: '/settings' } })} />
        <SettingsRow icon={settingsAssets.terms} label={t('settings.about.terms')} onClick={() => navigate('/settings/terms', { state: { from: '/settings' } })} />
        <SettingsRow icon={settingsAssets.info} label={t('settings.qa12.export')} description={t('settings.qa12.description')} onClick={isExportingQa12Diagnostics ? undefined : () => void exportQa12DiagnosticLog()} />
      </SettingsSection>
    </div>
    <p className="mock-feedback" aria-live="polite">{feedbackKey ? t(feedbackKey) : ''}</p>
    <input ref={appDataFileInput} className="sr-only" type="file" accept="application/json,.json" aria-label={t('importAppData.chooseFile')} onChange={(event) => void chooseAppDataFile(event)} />
    <ConfirmDialog open={Boolean(removePhotoKind)} title={t('settings.profile.removePhotoConfirmTitle')} description={t('settings.profile.removePhotoConfirmBody')} onCancel={() => setRemovePhotoKind(undefined)} onConfirm={() => void confirmRemovePhoto()} />
    <ConfirmDialog open={Boolean(pendingImportPlan)} title={t('importAppData.confirmTitle')} description={t('importAppData.confirmBody')} confirmLabel={t('importAppData.confirm')} onCancel={cancelAppDataImport} onConfirm={() => void confirmAppDataImport()}>
      {pendingImportPlan ? <p className="settings-import-summary" role="status">{t('importAppData.summary', { added: summarizeImportPlan(pendingImportPlan).added, updated: summarizeImportPlan(pendingImportPlan).updated, skipped: summarizeImportPlan(pendingImportPlan).skipped })}</p> : null}
    </ConfirmDialog>
    <ConfirmDialog open={clearDialogStep === 1} title={t('settings.clearRelationship.firstTitle')} description={t('settings.clearRelationship.firstBody')} confirmLabel={t('settings.clearRelationship.continue')} onCancel={() => setClearDialogStep(undefined)} onConfirm={() => setClearDialogStep(2)}>
      <p className="settings-clear-dialog__note">{t('settings.clearRelationship.firstNote')}</p>
    </ConfirmDialog>
    <ConfirmDialog open={clearDialogStep === 2} title={t('settings.clearRelationship.secondTitle')} description={t('settings.clearRelationship.secondBody')} cancelLabel={t('settings.clearRelationship.back')} confirmLabel={isClearingRelationship ? t('settings.clearRelationship.clearing') : t('settings.clearRelationship.confirm')} danger onCancel={() => setClearDialogStep(1)} onConfirm={() => void confirmClearRelationship()} />
  </>
}

interface PlacementDragState { startX: number; startY: number; placement: PhotoPlacement }

function ProfilePhotoPlacementEditor({ kind, photoUrl, placement, setPlacement, frameSrc, placeholderSrc, alt, onDone }: { kind: ProfileKind; photoUrl?: string; placement: PhotoPlacement; setPlacement: Dispatch<SetStateAction<PhotoPlacement>>; frameSrc: string; placeholderSrc: string; alt: string; onDone: () => void }) {
  const { t } = useI18n()
  const drag = useRef<PlacementDragState | undefined>(undefined)
  const update = (changes: Partial<PhotoPlacement>) => setPlacement((current) => normalizePhotoPlacement({ ...current, ...changes }))
  const pointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { startX: event.clientX, startY: event.clientY, placement: { ...placement } }
  }
  const pointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const state = drag.current
    if (!state || !event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.preventDefault()
    const frame = event.currentTarget.querySelector<HTMLElement>('.profile-photo-visual__crop')
    const image = frame?.querySelector<HTMLImageElement>('.profile-photo-visual__photo--real') ?? null
    const geometry = measurePhotoPlacementGeometry(frame, image, state.placement)
    if (!geometry) return
    setPlacement(applyPointerDeltaToPlacement(state.placement, event.clientX - state.startX, event.clientY - state.startY, geometry))
  }
  const pointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current = undefined
  }
  return <section className="profile-photo-editor" aria-label={t('memoryWallEditor.adjust')} data-profile-kind={kind}>
    <strong>{t('memoryWallEditor.adjust')}</strong>
    <button type="button" className="profile-photo-editor__preview" aria-label={t('memoryWallEditor.adjust')} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}>
      <ProfilePhotoVisual photoUrl={photoUrl} placeholderSrc={placeholderSrc} frameSrc={frameSrc} placement={placement} alt={alt} />
    </button>
    <div className="profile-photo-editor__controls">
      <button type="button" className="button button--secondary" aria-label={t('memoryWallEditor.zoomOut')} onClick={() => update({ zoom: placement.zoom - .25 })}>−</button>
      <button type="button" className="button button--secondary" aria-label={t('memoryWallEditor.zoomIn')} onClick={() => update({ zoom: placement.zoom + .25 })}>＋</button>
      <button type="button" className="button button--secondary" onClick={() => setPlacement({ ...DEFAULT_PHOTO_PLACEMENT })}>{t('memoryWallEditor.reset')}</button>
      <button type="button" className="button button--primary" onClick={onDone}>{t('memoryWallEditor.doneAdjustment')}</button>
    </div>
  </section>
}
