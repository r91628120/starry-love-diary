import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../i18n/I18nProvider'
import type { Locale } from '../../i18n/messages'
import type { User } from 'firebase/auth'

const firebaseMocks = vi.hoisted(() => ({
  configured: false,
  user: null as User | null,
  auth: { currentUser: null as User | null },
  onAuthStateChanged: vi.fn(),
  bootstrapAnonymousUser: vi.fn(),
  releaseStalledAnonymousBootstrap: vi.fn(),
}))

vi.mock('../../lib/firebase/firebaseEnvironment', () => ({ isFirebaseRuntimeConfigured: () => firebaseMocks.configured }))
vi.mock('../../lib/firebase/firebaseAuth', () => ({ firebaseAuth: firebaseMocks.auth }))
vi.mock('../../lib/firebase/userBootstrap', () => ({
  bootstrapAnonymousUser: (...args: unknown[]) => firebaseMocks.bootstrapAnonymousUser(...args),
  releaseStalledAnonymousBootstrap: (...args: unknown[]) => firebaseMocks.releaseStalledAnonymousBootstrap(...args),
}))
vi.mock('../../lib/firebase/durableIdentity', () => ({
  getDurableIdentityState: (user: User | null) => ({ hasAppleIdentity: user?.providerData.some((provider) => provider.providerId === 'apple.com') ?? false }),
  upgradeAnonymousUserWithApple: vi.fn(),
}))
vi.mock('firebase/auth', () => ({ onAuthStateChanged: (...args: unknown[]) => firebaseMocks.onAuthStateChanged(...args) }))

import { AppleIdentityGate, PairedFeatureIdentityBoundary } from './PairedFeatureIdentityBoundary'

function renderGate(locale: Locale = 'zh-TW', upgrade = vi.fn().mockResolvedValue({ status: 'cancelled' as const })) {
  const onResult = vi.fn()
  render(<I18nProvider initialLocale={locale}><MemoryRouter><AppleIdentityGate upgrade={upgrade} onResult={onResult} /></MemoryRouter></I18nProvider>)
  return { onResult, upgrade }
}

afterEach(() => {
  vi.useRealTimers()
  cleanup()
  firebaseMocks.configured = false
  firebaseMocks.user = null
  firebaseMocks.auth.currentUser = null
  firebaseMocks.onAuthStateChanged.mockReset()
  firebaseMocks.bootstrapAnonymousUser.mockReset()
  firebaseMocks.releaseStalledAnonymousBootstrap.mockReset()
})

describe('paired feature Apple identity gate', () => {
  it.each(['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'] as const)('renders the complete localized gate for %s', (locale) => {
    renderGate(locale)
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent('identityGate.title')
    expect(screen.getByRole('button', { name: /Apple/u })).toBeInTheDocument()
    expect(screen.queryByText(/identityGate\./u)).not.toBeInTheDocument()
  })

  it('uses the supplied decorative PNG Apple logo and accessible text instead of the unsupported Apple glyph', () => {
    renderGate()
    const button = screen.getByRole('button', { name: '使用 Apple 繼續' })
    expect(button.querySelector('img.identity-gate-card__apple-logo')).toHaveAttribute('src', '/assets/auth/apple-logo-white.png')
    expect(button.querySelector('img.identity-gate-card__apple-logo')).toHaveAttribute('alt', '')
    expect(button.querySelector('svg')).not.toBeInTheDocument()
    expect(button).not.toHaveTextContent('')
  })

  it('keeps the gate quiet and open when Apple authorization is cancelled', async () => {
    const { upgrade, onResult } = renderGate()
    fireEvent.click(screen.getByRole('button', { name: '使用 Apple 繼續' }))
    await vi.waitFor(() => expect(upgrade).toHaveBeenCalledOnce())
    expect(onResult).toHaveBeenCalledWith({ status: 'cancelled' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '一起走進我們的星空' })).toBeInTheDocument()
  })

  it('shows a safe explanation for a credential already in use without offering a merge', async () => {
    renderGate('zh-TW', vi.fn().mockResolvedValue({ status: 'credential-in-use' }))
    fireEvent.click(screen.getByRole('button', { name: '使用 Apple 繼續' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('無法自動合併')
    expect(screen.queryByRole('button', { name: /合併|登出/u })).not.toBeInTheDocument()
  })

  it('keeps the anonymous gate in place after an unexpected failure and allows retry', async () => {
    const upgrade = vi.fn().mockResolvedValue({ status: 'failed', code: 'auth/internal-error' })
    renderGate('zh-TW', upgrade)
    const continueButton = screen.getByRole('button', { name: '使用 Apple 繼續' })
    fireEvent.click(continueButton)
    expect(await screen.findByRole('alert')).toHaveTextContent('請稍後再試一次')
    fireEvent.click(screen.getByRole('button', { name: '使用 Apple 繼續' }))
    await vi.waitFor(() => expect(upgrade).toHaveBeenCalledTimes(2))
  })

  it('prevents repeated taps from starting more than one Apple authorization', async () => {
    let finish: (result: { status: 'cancelled' }) => void = () => undefined
    const upgrade = vi.fn().mockImplementation(() => new Promise<{ status: 'cancelled' }>((resolve) => { finish = resolve }))
    renderGate('zh-TW', upgrade)
    const continueButton = screen.getByRole('button', { name: '使用 Apple 繼續' })
    fireEvent.click(continueButton)
    fireEvent.click(continueButton)
    expect(upgrade).toHaveBeenCalledOnce()
    finish({ status: 'cancelled' })
    await vi.waitFor(() => expect(screen.getByRole('button', { name: '使用 Apple 繼續' })).toBeEnabled())
  })

  it('keeps the shared production gate visual inert when used for localhost UI preview', () => {
    const upgrade = vi.fn()
    render(<I18nProvider initialLocale="zh-TW"><MemoryRouter><AppleIdentityGate preview upgrade={upgrade} onResult={vi.fn()} /></MemoryRouter></I18nProvider>)
    fireEvent.click(screen.getByRole('button', { name: '使用 Apple 繼續' }))
    expect(upgrade).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: '一起走進我們的星空' })).toBeInTheDocument()
  })

  it('passes through a successful UID-preserving Apple link result', async () => {
    const { onResult } = renderGate('zh-TW', vi.fn().mockResolvedValue({ status: 'linked', uid: 'anonymous-uid' }))
    fireEvent.click(screen.getByRole('button', { name: '使用 Apple 繼續' }))
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledWith({ status: 'linked', uid: 'anonymous-uid' }))
  })

  it('has no call, chat, contact, or credential entry controls', () => {
    renderGate()
    expect(document.querySelectorAll('input, textarea, [href*="tel:"], [href*="facetime" i]')).toHaveLength(0)
    for (const label of ['開始通話', '加入聊天室', '傳送訊息', '選擇聯絡人']) expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument()
  })

  it('requires the same gate for an anonymous user before either paired feature is rendered', async () => {
    firebaseMocks.configured = true
    firebaseMocks.user = { uid: 'anonymous-user', isAnonymous: true, providerData: [] } as unknown as User
    firebaseMocks.auth.currentUser = firebaseMocks.user
    firebaseMocks.bootstrapAnonymousUser.mockResolvedValue({ uid: 'anonymous-user', isAnonymous: true })
    firebaseMocks.onAuthStateChanged.mockImplementation((_auth, callback: (user: User | null) => void) => { callback(firebaseMocks.user); return vi.fn() })
    render(<I18nProvider initialLocale="zh-TW"><MemoryRouter><PairedFeatureIdentityBoundary><p>paired feature</p></PairedFeatureIdentityBoundary></MemoryRouter></I18nProvider>)
    expect(await screen.findByRole('heading', { name: '一起走進我們的星空' })).toBeInTheDocument()
    expect(screen.queryByText('paired feature')).not.toBeInTheDocument()
  })

  it('skips the gate for an Apple-linked user', async () => {
    firebaseMocks.configured = true
    firebaseMocks.user = { uid: 'durable-user', isAnonymous: false, providerData: [{ providerId: 'apple.com' }] } as unknown as User
    firebaseMocks.auth.currentUser = firebaseMocks.user
    firebaseMocks.bootstrapAnonymousUser.mockResolvedValue({ uid: 'durable-user', isAnonymous: false })
    firebaseMocks.onAuthStateChanged.mockImplementation((_auth, callback: (user: User | null) => void) => { callback(firebaseMocks.user); return vi.fn() })
    render(<I18nProvider initialLocale="zh-TW"><MemoryRouter><PairedFeatureIdentityBoundary><p>paired feature</p></PairedFeatureIdentityBoundary></MemoryRouter></I18nProvider>)
    expect(await screen.findByText('paired feature')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '一起走進我們的星空' })).not.toBeInTheDocument()
  })

  it('renders visible loading while Pair identity services are pending', () => {
    firebaseMocks.configured = true
    firebaseMocks.bootstrapAnonymousUser.mockReturnValue(new Promise(() => undefined))
    firebaseMocks.onAuthStateChanged.mockReturnValue(vi.fn())
    render(<I18nProvider initialLocale="zh-TW"><MemoryRouter><PairedFeatureIdentityBoundary><p>paired feature</p></PairedFeatureIdentityBoundary></MemoryRouter></I18nProvider>)
    expect(screen.getByText('正在準備專屬配對')).toBeInTheDocument()
    expect(screen.getByText('正在確認你的配對身分，請稍候一下。')).toBeInTheDocument()
    expect(screen.getByText('正在準備專屬配對').closest('[aria-busy="true"]')).toBeInTheDocument()
  })

  it('bounds a stalled identity bootstrap, releases it, and retries with a fresh attempt', async () => {
    vi.useFakeTimers()
    firebaseMocks.configured = true
    const stalled = new Promise<never>(() => undefined)
    firebaseMocks.bootstrapAnonymousUser.mockReturnValueOnce(stalled).mockResolvedValueOnce({ uid: 'anonymous-user', isAnonymous: true })
    firebaseMocks.user = { uid: 'anonymous-user', isAnonymous: true, providerData: [] } as unknown as User
    firebaseMocks.auth.currentUser = firebaseMocks.user
    firebaseMocks.onAuthStateChanged.mockImplementation((_auth, callback: (user: User | null) => void) => { callback(firebaseMocks.user); return vi.fn() })
    render(<I18nProvider initialLocale="zh-TW"><MemoryRouter><PairedFeatureIdentityBoundary><p>paired feature</p></PairedFeatureIdentityBoundary></MemoryRouter></I18nProvider>)
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(12_000)
    expect(screen.getByText('暫時無法確認配對身分')).toBeInTheDocument()
    expect(firebaseMocks.releaseStalledAnonymousBootstrap).toHaveBeenCalledWith(stalled)
    const attemptsBeforeRetry = firebaseMocks.bootstrapAnonymousUser.mock.calls.length
    fireEvent.click(screen.getByRole('button', { name: '重新嘗試' }))
    await vi.advanceTimersByTimeAsync(0)
    expect(screen.getByRole('heading', { name: '一起走進我們的星空' })).toBeInTheDocument()
    expect(firebaseMocks.bootstrapAnonymousUser.mock.calls.length).toBeGreaterThan(attemptsBeforeRetry)
    vi.useRealTimers()
  })

  it('renders a recoverable error when identity initialization fails and retries cleanly', async () => {
    firebaseMocks.configured = true
    firebaseMocks.bootstrapAnonymousUser.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ uid: 'anonymous-user', isAnonymous: true })
    firebaseMocks.user = { uid: 'anonymous-user', isAnonymous: true, providerData: [] } as unknown as User
    firebaseMocks.auth.currentUser = firebaseMocks.user
    const unsubscribe = vi.fn()
    firebaseMocks.onAuthStateChanged.mockImplementation((_auth, callback: (user: User | null) => void) => { callback(firebaseMocks.user); return unsubscribe })
    render(<I18nProvider initialLocale="zh-TW"><MemoryRouter><PairedFeatureIdentityBoundary><p>paired feature</p></PairedFeatureIdentityBoundary></MemoryRouter></I18nProvider>)
    expect(await screen.findByText('暫時無法確認配對身分')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '重新嘗試' }))
    expect(screen.getByText('正在準備專屬配對')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '一起走進我們的星空' })).toBeInTheDocument()
    expect(unsubscribe).toHaveBeenCalledOnce()
    expect(firebaseMocks.onAuthStateChanged.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('renders a recoverable error when auth listener initialization throws', async () => {
    firebaseMocks.configured = true
    firebaseMocks.onAuthStateChanged.mockImplementation(() => { throw new Error('listener unavailable') })
    render(<I18nProvider initialLocale="zh-TW"><MemoryRouter><PairedFeatureIdentityBoundary><p>paired feature</p></PairedFeatureIdentityBoundary></MemoryRouter></I18nProvider>)
    expect(await screen.findByText('暫時無法確認配對身分')).toBeInTheDocument()
  })
})
