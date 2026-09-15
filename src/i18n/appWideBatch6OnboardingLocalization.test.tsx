import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../app/App'
import { PersistenceProvider } from '../data/PersistenceContext'
import { initializePersistence } from '../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { I18nProvider } from './I18nProvider'
import { messages, supportedLocales } from './messages'
import { onboardingBatch6Messages } from './onboardingBatch6Messages'

const onboardingKeys = Object.keys(onboardingBatch6Messages['zh-TW']) as Array<keyof (typeof onboardingBatch6Messages)['zh-TW']>
const runtimeFiles = [
  '../app/App.tsx',
  '../pages/OnboardingPage.tsx',
  '../features/onboarding/OnboardingFlow.tsx',
] as const

function renderRuntime(runtime: Awaited<ReturnType<typeof initializePersistence>>, path = '/today') {
  return render(
    <PersistenceProvider runtime={runtime}>
      <I18nProvider initialLocale={runtime.initial.settings.locale}>
        <MemoryRouter initialEntries={[path]}><App /></MemoryRouter>
      </I18nProvider>
    </PersistenceProvider>,
  )
}

afterEach(cleanup)

describe('Milestone 4C-3 Onboarding localization and runtime', () => {
  it.each(supportedLocales)('has every non-empty Onboarding key in %s', (locale) => {
    expect(Object.keys(onboardingBatch6Messages[locale])).toEqual(onboardingKeys)
    for (const key of onboardingKeys) {
      expect(Object.prototype.hasOwnProperty.call(messages[locale], key), `${locale} missing ${key}`).toBe(true)
      expect(messages[locale][key].trim(), `${locale} empty ${key}`).not.toBe('')
    }
  })

  it('contains no hardcoded Han UI strings in the Onboarding runtime', () => {
    for (const relativePath of runtimeFiles) {
      const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
      expect(source, relativePath).not.toMatch(/[\u3400-\u9fff]/u)
    }
  })

  it('routes a fresh user to Onboarding from the first launch', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    expect(runtime.initial.settings.onboardingCompleted).toBe(false)
    renderRuntime(runtime)
    expect(await screen.findByRole('heading', { level: 1, name: '歡迎來到星星戀愛日記' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('saves both nicknames, enters Today, and stays completed after reopen', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    renderRuntime(first)

    fireEvent.change(screen.getByLabelText('我的暱稱'), { target: { value: '小星原文' } })
    fireEvent.change(screen.getByLabelText('我喜歡對象的暱稱'), { target: { value: '月亮原文' } })
    fireEvent.click(screen.getByRole('button', { name: /下一步/ }))
    expect(screen.getByRole('heading', { level: 2, name: '照片可以之後再加入' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '開始記錄' }))

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: '今天' })).toBeInTheDocument())
    expect((await first.profiles.getProfile('user'))?.nickname).toBe('小星原文')
    expect((await first.profiles.getProfile('partner'))?.nickname).toBe('月亮原文')
    expect((await first.settings.getSettings())?.onboardingCompleted).toBe(true)
    cleanup()
    first.adapter.close()

    const reopened = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'en', localDate: '2026-09-01' })
    renderRuntime(reopened, '/onboarding')
    expect(await screen.findByRole('heading', { level: 1, name: '今天' })).toBeInTheDocument()
    expect(screen.queryByText('Welcome to Starry Love Diary')).not.toBeInTheDocument()
    expect(reopened.initial.userProfile.nickname).toBe('小星原文')
    expect(reopened.initial.partnerProfile.nickname).toBe('月亮原文')
  })

  it('does not force an existing user through Onboarding during migration', async () => {
    const backing = createMemoryStorageBacking()
    const adapter = new MemoryStorageAdapter(backing)
    await adapter.open()
    const timestamp = '2026-08-01T00:00:00.000Z'
    await adapter.put('settings', {
      id: 'settings',
      locale: 'zh-TW',
      dailyLoveQuoteActivationDate: '2026-08-01',
      loveQuoteReminderEnabled: false,
      importantDateReminderEnabled: true,
      reminderTime: '19:30',
      schemaVersion: 4,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    await adapter.put('profiles', { id: 'user', kind: 'user', nickname: '既有使用者', createdAt: timestamp, updatedAt: timestamp })
    await adapter.put('profiles', { id: 'partner', kind: 'partner', nickname: '既有對方', createdAt: timestamp, updatedAt: timestamp })

    const runtime = await initializePersistence({ adapter, defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    expect(runtime.initial.settings.onboardingCompleted).toBe(true)
    renderRuntime(runtime)
    expect(await screen.findByRole('heading', { level: 1, name: '今天' })).toBeInTheDocument()
    expect(runtime.initial.userProfile.nickname).toBe('既有使用者')
    expect(runtime.initial.partnerProfile.nickname).toBe('既有對方')
    expect(runtime.initial.settings.reminderTime).toBe('19:30')
  })

  it('returns to Onboarding after an unfinished reload without persisting partial nicknames', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    renderRuntime(first)
    fireEvent.change(screen.getByLabelText('我的暱稱'), { target: { value: '未完成草稿' } })
    cleanup()
    first.adapter.close()

    const reopened = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    renderRuntime(reopened, '/today')
    expect(await screen.findByRole('heading', { level: 1, name: '歡迎來到星星戀愛日記' })).toBeInTheDocument()
    expect(screen.getByLabelText('我的暱稱')).toHaveValue('')
    expect(reopened.initial.settings.onboardingCompleted).toBe(false)
    expect(reopened.initial.userProfile.nickname).toBe('星星')
  })

  it('switches locale without clearing either in-progress nickname or showing stale text', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    renderRuntime(runtime)
    const userInput = screen.getByLabelText('我的暱稱')
    const otherInput = screen.getByLabelText('我喜歡對象的暱稱')
    fireEvent.change(userInput, { target: { value: '保留我的暱稱' } })
    fireEvent.change(otherInput, { target: { value: '保留對方暱稱' } })
    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Welcome to Starry Love Diary' })).toBeInTheDocument())
    expect(screen.getByLabelText('My nickname')).toHaveValue('保留我的暱稱')
    expect(screen.getByLabelText('Nickname of the person I like')).toHaveValue('保留對方暱稱')
    expect(screen.queryByText('歡迎來到星星戀愛日記')).not.toBeInTheDocument()
    expect((await runtime.settings.getSettings())?.locale).toBe('en')
    expect((await runtime.settings.getSettings())?.onboardingCompleted).toBe(false)
  })

  it('keeps validation localized and does not save incomplete profiles', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'en', localDate: '2026-08-31' })
    renderRuntime(runtime)
    fireEvent.change(screen.getByLabelText('My nickname'), { target: { value: 'Only one' } })
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter both nicknames.')
    expect((await runtime.settings.getSettings())?.onboardingCompleted).toBe(false)
    expect((await runtime.profiles.getProfile('user'))?.nickname).toBe('星星')
  })
})
