import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { supportedLocales, type Locale } from '../../i18n/messages'
import { SettingsInformationPage } from '../../pages/SettingsInformationPage'
import { HeartLineCard } from './HeartLineCard'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location-probe">{JSON.stringify({ pathname: location.pathname, state: location.state })}</output>
}

async function createRuntime() {
  return initializePersistence({ adapter: new MemoryStorageAdapter(createMemoryStorageBacking()), defaultLocale: 'zh-TW', localDate: '2026-09-01' })
}

function renderFlow(runtime: PersistenceRuntime, locale: Locale = 'zh-TW') {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale={locale}><MemoryRouter initialEntries={['/today']}><Routes>
    <Route path="/today" element={<HeartLineCard />} />
    <Route path="/settings/help" element={<SettingsInformationPage kind="help" />} />
    <Route path="/settings" element={<p>Settings</p>} />
  </Routes><LocationProbe /></MemoryRouter></I18nProvider></PersistenceProvider>)
}

afterEach(cleanup)

describe('Seven Heart Notes contextual help', () => {
  it.each([
    ['zh-TW', '查看七句心話使用說明'],
    ['en', 'View Seven Heart Notes instructions'],
    ['ja', '七つの心のことばの使い方を見る'],
    ['ko', '마음 일곱 문장 사용 방법 보기'],
    ['es', 'Ver instrucciones de las siete frases del corazón'],
    ['fr', 'Voir le mode d’emploi des sept phrases du cœur'],
  ] as Array<[Locale, string]>)('renders the localized contextual control in %s', async (locale, label) => {
    const runtime = await createRuntime()
    renderFlow(runtime, locale)
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
  })

  it('opens the existing Today guide, returns to Today, and keeps the temporary ritual work', async () => {
    const runtime = await createRuntime()
    renderFlow(runtime)
    const input = screen.getByRole('textbox', { name: '今天，有什麼話想留下？' })
    fireEvent.change(input, { target: { value: '需要先看看說明' } })
    const heart = screen.getByRole('button', { name: '收下這句心話' })
    fireEvent.click(heart)
    fireEvent.click(heart)
    fireEvent.click(heart)

    fireEvent.click(screen.getByRole('button', { name: '查看七句心話使用說明' }))
    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent('/settings/help'))
    expect(screen.getByTestId('location-probe')).toHaveTextContent('"guideTarget":"today"')
    const todayGuide = screen.getByText('今天').closest('details')
    expect(todayGuide).toHaveAttribute('open')
    await waitFor(() => expect(document.activeElement).toBe(todayGuide?.querySelector('summary')))

    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent('/today'))
    expect(screen.getByRole('textbox', { name: '今天，有什麼話想留下？' })).toHaveValue('需要先看看說明')
    expect(screen.getByTestId('heart-line-ritual-progress')).toHaveTextContent('第 3 / 7 次心意')

    for (let press = 0; press < 4; press += 1) fireEvent.click(screen.getByRole('button', { name: '收下這句心話' }))
    await waitFor(async () => expect(await runtime.heartPhrases.getHeartPhrases()).toHaveLength(1))
  })

  it('keeps the Today guide closed for normal Settings help navigation', () => {
    render(<I18nProvider initialLocale="zh-TW"><MemoryRouter initialEntries={['/settings/help']}><Routes><Route path="/settings/help" element={<SettingsInformationPage kind="help" />} /></Routes></MemoryRouter></I18nProvider>)
    expect(screen.getByText('今天').closest('details')).not.toHaveAttribute('open')
  })

  it('keeps all supported locales covered by the contextual label', () => {
    expect(supportedLocales).toEqual(['zh-TW', 'en', 'ja', 'ko', 'es', 'fr'])
  })
})
