import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PersistenceProvider } from '../data/PersistenceContext'
import { type PersistenceContextValue, usePersistence } from '../data/PersistenceStateContext'
import { initializePersistence } from '../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { formatSettingsDate } from '../features/settings/settingsFormatters'
import { SettingsPage } from '../pages/SettingsPage'
import { I18nProvider } from './I18nProvider'
import { messages, supportedLocales } from './messages'
import { settingsBatch5Messages } from './settingsBatch5Messages'
import { exportAppDataMessages } from './exportAppDataMessages'
import { importAppDataMessages } from './importAppDataMessages'
import { buildAppDataExport, serializeAppDataExport } from '../services/exportAppData'

const settingsKeys = Object.keys(settingsBatch5Messages['zh-TW']) as Array<keyof (typeof settingsBatch5Messages)['zh-TW']>
const appDataExportKeys = Object.keys(exportAppDataMessages['zh-TW']) as Array<keyof (typeof exportAppDataMessages)['zh-TW']>

const scopedRuntimeFiles = [
  '../pages/SettingsPage.tsx',
  '../features/settings/SettingsContent.tsx',
  '../features/settings/SettingsSection.tsx',
] as const

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

function createJsonFile(name: string, content: string) {
  const file = new File([content], name, { type: 'application/json' })
  Object.defineProperty(file, 'text', { value: async () => content })
  return file
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise })
  return { promise, resolve }
}

function PersistenceProbe({ onValue }: { onValue: (value: PersistenceContextValue) => void }) {
  const value = usePersistence()
  if (value) onValue(value)
  return null
}

describe('Milestone 4C-3 Settings localization', () => {
  it.each(supportedLocales)('has every non-empty Settings UI key in %s', (locale) => {
    expect(Object.keys(settingsBatch5Messages[locale])).toEqual(settingsKeys)
    for (const key of settingsKeys) {
      expect(Object.prototype.hasOwnProperty.call(messages[locale], key), `${locale} missing ${key}`).toBe(true)
      expect(messages[locale][key].trim(), `${locale} empty ${key}`).not.toBe('')
    }
  })

  it.each(supportedLocales)('has every non-empty app data export key in %s', (locale) => {
    expect(Object.keys(exportAppDataMessages[locale])).toEqual(appDataExportKeys)
    for (const key of appDataExportKeys) {
      expect(messages[locale][key].trim(), `${locale} empty ${key}`).not.toBe('')
    }
  })

  it.each(supportedLocales)('has every Restore data-management key in %s', (locale) => {
    for (const key of ['settings.diary.restoreAppData', 'restoreAppData.description', 'restoreAppData.chooseFile', 'restoreAppData.confirmTitle', 'restoreAppData.confirmBody', 'restoreAppData.confirm'] as const) {
      expect(importAppDataMessages[locale][key]).toBeTruthy()
    }
  })

  it('contains no hardcoded Han UI strings in the scoped runtime components', () => {
    for (const relativePath of scopedRuntimeFiles) {
      const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
      expect(source, relativePath).not.toMatch(/[\u3400-\u9fff]/u)
    }
  })

  it('rerenders labels, dates, and feedback while preserving Settings data and user text', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    await first.profiles.updateProfile('user', { nickname: '使用者原始暱稱' })
    await first.profiles.updateProfile('partner', { nickname: '對方原始暱稱' })
    await first.settings.updateSettings({
      locale: 'zh-TW',
      loveQuoteReminderEnabled: false,
      importantDateReminderEnabled: true,
      reminderTime: '20:45',
    })
    await first.importantDates.createImportantDate({ type: 'birthday', title: '生日', date: '2026-09-12' })
    await first.importantDates.createImportantDate({ type: 'first_meeting', title: '相識日', date: '2024-02-14' })
    await first.importantDates.createImportantDate({ type: 'anniversary', title: '紀念日', date: '2024-08-23' })
    first.adapter.close()

    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )

    const userInput = screen.getByRole('textbox', { name: '我的暱稱' })
    fireEvent.change(userInput, { target: { value: '使用者未儲存暱稱' } })
    expect(screen.getByRole('textbox', { name: '對方暱稱' })).toHaveValue('對方原始暱稱')
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('提醒時間')).not.toBeInTheDocument()
    expect(screen.queryByText('目前只保存提醒偏好，尚未啟用系統通知。')).not.toBeInTheDocument()
    expect(screen.getByText(formatSettingsDate('2024-02-14', 'zh-TW'))).toBeInTheDocument()

    expect(screen.getAllByRole('button', { name: '選擇照片' })).toHaveLength(2)
    expect(screen.getByText('我的照片').closest('.settings-row')).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('button', { name: /清空目前戀情資料/u })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument())
    expect(userInput).toHaveValue('使用者未儲存暱稱')
    expect(screen.getByRole('textbox', { name: 'Partner’s nickname' })).toHaveValue('對方原始暱稱')
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Reminder time')).not.toBeInTheDocument()
    expect(screen.queryByText('Reminder preferences are saved, but system notifications are not enabled yet.')).not.toBeInTheDocument()
    expect(screen.getByText(formatSettingsDate('2024-02-14', 'en'))).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Choose photo' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: /Clear current relationship data/u })).toBeEnabled()
    expect(screen.queryByText('尚未開放')).not.toBeInTheDocument()

    const savedSettings = await runtime.settings.getSettings()
    expect(savedSettings).toMatchObject({
      locale: 'en',
      loveQuoteReminderEnabled: false,
      importantDateReminderEnabled: true,
      reminderTime: '20:45',
    })
    expect((await runtime.profiles.getProfile('user'))?.nickname).toBe('使用者原始暱稱')
    expect((await runtime.profiles.getProfile('partner'))?.nickname).toBe('對方原始暱稱')
  })

  it('uses localized nickname validation without changing persisted profile data', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-08-31' })
    await runtime.profiles.updateProfile('user', { nickname: 'Original nickname' })
    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="en">
          <MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )

    const input = screen.getByRole('textbox', { name: 'My nickname' })
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.blur(input)
    expect(await screen.findByText('Nickname cannot be empty.')).toBeInTheDocument()
    expect((await runtime.profiles.getProfile('user'))?.nickname).toBe('Original nickname')
  })

  it('preserves the gender-neutral profile icon contract', () => {
    const source = readFileSync('src/features/settings/SettingsContent.tsx', 'utf8')
    const profileBlock = source.slice(source.indexOf("t('settings.profile.title')"), source.indexOf("t('settings.dates.title')"))
    expect(profileBlock).toContain('icon={settingsAssets.star}')
    expect(profileBlock).toContain('profilePlaceholders.blue')
    expect(profileBlock).toContain('profilePlaceholders.pink')
    expect(profileBlock).not.toMatch(/person|male|female|gender|woman|man/u)
  })

  it.each(supportedLocales)('formats Settings dates for %s without changing their stable value', (locale) => {
    const formatted = formatSettingsDate('2024-08-23', locale)
    expect(formatted).not.toBe('')
    expect(formatSettingsDate('2024-08-23', locale)).toBe(formatted)
  })

  it('uses persisted Important Dates and a real empty state without retired fixed dates', async () => {
    const emptyRuntime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
    render(
      <PersistenceProvider runtime={emptyRuntime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )
    expect(screen.getAllByText('尚未設定')).toHaveLength(3)
    const source = readFileSync('src/features/settings/SettingsContent.tsx', 'utf8')
    expect(source).not.toMatch(/2026-09-12|2024-02-14|2024-08-23/u)
    cleanup()

    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
    await first.importantDates.createImportantDate({ type: 'birthday', title: '生日', date: '2027-01-05' })
    await first.importantDates.createImportantDate({ type: 'first_meeting', title: '相識', date: '2025-03-09' })
    await first.importantDates.createImportantDate({ type: 'anniversary', title: '紀念', date: '2026-11-20' })
    first.adapter.close()
    const reopened = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
    render(
      <PersistenceProvider runtime={reopened}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )
    expect(screen.getByText(formatSettingsDate('2027-01-05', 'zh-TW', { month: 'short', day: 'numeric' }))).toBeInTheDocument()
    expect(screen.getByText(formatSettingsDate('2025-03-09', 'zh-TW'))).toBeInTheDocument()
    expect(screen.getByText(formatSettingsDate('2026-11-20', 'zh-TW'))).toBeInTheDocument()
  })

  it.each([
    ['對方生日', '/our'],
    ['我們的時刻', '/settings/moments'],
    ['想對你說', '/our'],
    ['星星資料', '/star-bottle'],
  ])('routes %s to the existing %s page', async (label, destination) => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/settings']}>
            <Routes>
              <Route path="/settings" element={<SettingsPage />} />
              <Route path={destination} element={<p>destination reached</p>} />
            </Routes>
          </MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )
    const row = screen.getByText(label).closest('button')
    expect(row).not.toBeNull()
    fireEvent.click(row!)
    expect(screen.getByText('destination reached')).toBeInTheDocument()
  })

  it('renders unavailable features as non-actionable rows instead of mock actions', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )
    expect(screen.getByRole('button', { name: /清空目前戀情資料/u })).toBeEnabled()
    expect(screen.getByRole('button', { name: '匯出文字資料' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /匯出 App 資料/u })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /匯入 App 資料|從備份還原/u })).toBeInTheDocument()
    expect(screen.queryByText('備份')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '回憶牆照片管理' })).toBeInTheDocument()
    expect(screen.queryByText('相片權限')).not.toBeInTheDocument()
    expect(screen.queryByText('通知權限')).not.toBeInTheDocument()
    for (const label of ['我的照片', '對方照片']) expect(screen.getByText(label).closest('.settings-row')).not.toHaveAttribute('aria-disabled')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByText('此功能目前尚未開放')).not.toBeInTheDocument()
  })

  it('exports real text data and gives localized feedback without changing other Settings rows', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    const createObjectURL = vi.fn((blob: Blob) => { void blob; return 'blob:settings-export' })
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter></I18nProvider></PersistenceProvider>)
    fireEvent.click(screen.getByRole('button', { name: '匯出文字資料' }))
    await waitFor(() => expect(screen.getByText('文字資料已匯出。')).toBeInTheDocument())
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: '回憶牆照片管理' })).toBeInTheDocument()
  })

  it('shows localized export failure feedback when browser download creation fails', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => { throw new Error('download unavailable') }), revokeObjectURL: vi.fn() })
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter></I18nProvider></PersistenceProvider>)
    fireEvent.click(screen.getByRole('button', { name: '匯出文字資料' }))
    await waitFor(() => expect(screen.getByText('匯出失敗，請稍後再試。')).toBeInTheDocument())
  })

  it('exports structured app data once per in-flight click and gives localized feedback', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    const createObjectURL = vi.fn(() => 'blob:settings-app-data')
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter></I18nProvider></PersistenceProvider>)
    const exportButton = screen.getByRole('button', { name: /匯出 App 資料/u })
    fireEvent.click(exportButton)
    fireEvent.click(exportButton)
    await waitFor(() => expect(screen.getByText('App 資料已匯出。')).toBeInTheDocument())
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(screen.getByText('可供之後匯入 App，不包含照片。')).toBeInTheDocument()
    expect(screen.queryByText('備份')).not.toBeInTheDocument()
  })

  it('routes Restore from Backup through its destructive replacement confirmation', async () => {
    const source = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    await source.profiles.updateProfile('user', { nickname: 'backup user' })
    const content = serializeAppDataExport(await buildAppDataExport({ repositories: source, localDate: '2026-09-11', exportedAt: '2026-09-11T00:00:00.000Z' }))
    const file = new File([content], 'backup.json', { type: 'application/json' }); Object.defineProperty(file, 'text', { value: async () => content })
    const target = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    await target.profiles.updateProfile('user', { nickname: 'newer user' })
    render(<PersistenceProvider runtime={target}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter></I18nProvider></PersistenceProvider>)
    fireEvent.click(screen.getByRole('button', { name: /匯入 App 資料|從備份還原/u })); fireEvent.change(screen.getByLabelText('選擇備份檔'), { target: { files: [file] } })
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('取代目前 App 中的資料')
    fireEvent.click(screen.getByRole('button', { name: '取消' })); expect((await target.profiles.getProfile('user'))?.nickname).toBe('newer user')
    fireEvent.change(screen.getByLabelText('選擇備份檔'), { target: { files: [file] } }); expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /確認匯入|確認還原/u })); await waitFor(async () => expect((await target.profiles.getProfile('user'))?.nickname).toBe('backup user'))
    fireEvent.change(screen.getByLabelText('選擇備份檔'), { target: { files: [file] } }); expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.queryByText('合併 App 資料')).not.toBeInTheDocument()
  })

  it('rejects an invalid Restore file in Settings, then accepts a valid replacement file', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    const invalid = new File(['{"format":"starry-love-diary-data"}'], 'invalid.json', { type: 'application/json' }); Object.defineProperty(invalid, 'text', { value: async () => '{"format":"starry-love-diary-data"}' })
    const content = serializeAppDataExport(await buildAppDataExport({ repositories: runtime, localDate: '2026-09-11' }))
    const valid = new File([content], 'valid.json', { type: 'application/json' }); Object.defineProperty(valid, 'text', { value: async () => content })
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter></I18nProvider></PersistenceProvider>)
    fireEvent.click(screen.getByRole('button', { name: /匯入 App 資料|從備份還原/u })); const input = screen.getByLabelText('選擇備份檔')
    fireEvent.change(input, { target: { files: [invalid] } }); await waitFor(() => expect(screen.getByText('這個資料檔版本尚不支援。')).toBeInTheDocument()); expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    fireEvent.change(input, { target: { files: [invalid] } }); await waitFor(() => expect(screen.getByText('這個資料檔版本尚不支援。')).toBeInTheDocument())
    fireEvent.change(input, { target: { files: [valid] } }); expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
  })

  it('prevents Restore reentry while Restore is pending', async () => {
    const source = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    await source.profiles.updateProfile('user', { nickname: 'restore source' })
    const content = serializeAppDataExport(await buildAppDataExport({ repositories: source, localDate: '2026-09-11' }))
    const backup = createJsonFile('restore-pending.json', content)
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    const releaseRestore = deferred<void>()
    let persistence!: PersistenceContextValue
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter></I18nProvider><PersistenceProbe onValue={(value) => { persistence = value }} /></PersistenceProvider>)
    const restoreOriginal = persistence.restoreAppData.bind(persistence)
    const restoreSpy = vi.spyOn(persistence, 'restoreAppData').mockImplementation(async (...args) => {
      await releaseRestore.promise
      return restoreOriginal(...args)
    })
    fireEvent.click(screen.getByRole('button', { name: /匯入 App 資料|從備份還原/u }))
    fireEvent.change(screen.getByLabelText('選擇備份檔'), { target: { files: [backup] } })
    fireEvent.click(await screen.findByRole('button', { name: /確認匯入|確認還原/u }))
    await waitFor(() => expect(restoreSpy).toHaveBeenCalledTimes(1))

    expect(restoreSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alertdialog')).toHaveTextContent(/匯入 App 資料？|從備份還原？/u)

    releaseRestore.resolve()
    await waitFor(() => expect(screen.getByText('App 資料已還原完成。')).toBeInTheDocument())
  })

  it('shows localized app data export failure feedback without changing Settings data', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-11' })
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => { throw new Error('download unavailable') }), revokeObjectURL: vi.fn() })
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter></I18nProvider></PersistenceProvider>)
    fireEvent.click(screen.getByRole('button', { name: /匯出 App 資料/u }))
    await waitFor(() => expect(screen.getByText('App 資料匯出失敗，請稍後再試。')).toBeInTheDocument())
    expect((await runtime.settings.getSettings())?.locale).toBe('zh-TW')
  })

  it('does not render the retired Clear Settings card while the Clear route remains registered', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )
    for (const label of ['清醒紀錄', '戀愛腦檢測結果', '暈船法典紀錄', '喜歡？習慣？']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument()
    }
    expect(readFileSync('src/app/App.tsx', 'utf8')).toMatch(/path="\/clear"/u)
  })

  it('reads legacy reminder preferences without rendering notification controls', async () => {
    const backing = createMemoryStorageBacking()
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
    await runtime.settings.updateSettings({
      loveQuoteReminderEnabled: false,
      importantDateReminderEnabled: false,
      reminderTime: '07:35',
    })
    runtime.adapter.close()

    const reopened = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
    render(
      <PersistenceProvider runtime={reopened}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )
    expect(await reopened.settings.getSettings()).toMatchObject({
      loveQuoteReminderEnabled: false,
      importantDateReminderEnabled: false,
      reminderTime: '07:35',
    })
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('提醒時間')).not.toBeInTheDocument()
    expect(screen.queryByText('戀愛星語提醒')).not.toBeInTheDocument()
    expect(screen.queryByText('重要日子提醒')).not.toBeInTheDocument()
    expect(screen.queryByText('目前只保存提醒偏好，尚未啟用系統通知。')).not.toBeInTheDocument()
    expect(screen.getByText('重要日子')).toBeInTheDocument()
  })

  it('requires two confirmations before clearing relationship data and routes to onboarding', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-14' })
    await runtime.settings.updateSettings({ onboardingCompleted: true })
    await runtime.adapter.put('diaries', { id: 'story-diary', localDate: '2026-09-14', content: 'story', savedAsStar: false, timezone: 'Asia/Taipei', createdAt: '2026-09-14T00:00:00.000Z', updatedAt: '2026-09-14T00:00:00.000Z' })
    render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/settings']}><SettingsPage /></MemoryRouter></I18nProvider></PersistenceProvider>)

    const clearButton = screen.getByRole('button', { name: /清空目前戀情資料/u })
    expect(clearButton).not.toHaveAttribute('aria-disabled')
    fireEvent.click(clearButton)
    expect(screen.getByRole('alertdialog', { name: '清空目前戀情資料？' })).toHaveTextContent('不會刪除手機相簿中的原始照片')
    expect(screen.getByRole('alertdialog')).toHaveTextContent('匯出 App 資料')
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(await runtime.adapter.get('diaries', 'story-diary')).toBeDefined()

    fireEvent.click(clearButton)
    fireEvent.click(screen.getByRole('button', { name: '繼續' }))
    expect(screen.getByRole('alertdialog', { name: '確定要重新開始嗎？' })).toHaveTextContent('無法復原')
    fireEvent.click(screen.getByRole('alertdialog').querySelector('.button--secondary')!)
    expect(await runtime.adapter.get('diaries', 'story-diary')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: '繼續' }))
    fireEvent.click(screen.getByRole('button', { name: '清空並重新開始' }))
    await waitFor(() => expect(runtime.adapter.get('diaries', 'story-diary')).resolves.toBeUndefined())
    expect((await runtime.settings.getSettings())?.onboardingCompleted).toBe(false)
  })
})
