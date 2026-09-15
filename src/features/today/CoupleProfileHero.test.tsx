import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { todayAssets } from '../../assets/uiAssets'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { useI18n } from '../../i18n/I18nContext'
import { I18nProvider } from '../../i18n/I18nProvider'
import { messages, supportedLocales, type Locale } from '../../i18n/messages'
import { CoupleProfileHero } from './CoupleProfileHero'

async function createRuntime() {
  const runtime = await initializePersistence({
    adapter: new MemoryStorageAdapter(createMemoryStorageBacking()),
    defaultLocale: 'zh-TW',
    localDate: '2026-09-09',
  })
  runtime.initial.starHeartTotal = 105
  return runtime
}

function LocaleSwitch() {
  const { setLocale } = useI18n()
  return <button type="button" onClick={() => setLocale('fr')}>switch-to-french</button>
}

function renderHero(runtime: PersistenceRuntime, locale: Locale, withSwitch = false) {
  return render(
    <PersistenceProvider runtime={runtime}>
      <I18nProvider initialLocale={locale}>
        <CoupleProfileHero />
        {withSwitch ? <LocaleSwitch /> : null}
      </I18nProvider>
    </PersistenceProvider>,
  )
}

afterEach(cleanup)

describe('CoupleProfileHero localized star-heart label', () => {
  it.each(supportedLocales)('renders the localized score label and unchanged score for %s', async (locale) => {
    const runtime = await createRuntime()
    renderHero(runtime, locale)

    expect(screen.getByText(messages[locale]['today.starHeartValue'])).toBeInTheDocument()
    expect(screen.getByText(new Intl.NumberFormat(locale).format(105))).toBeInTheDocument()
  })

  it('switches only the localized label while retaining the score value', async () => {
    const runtime = await createRuntime()
    renderHero(runtime, 'zh-TW', true)

    expect(screen.getByText(messages['zh-TW']['today.starHeartValue'])).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'switch-to-french' }))

    expect(await screen.findByText(messages.fr['today.starHeartValue'])).toBeInTheDocument()
    expect(screen.getByText(new Intl.NumberFormat('fr').format(105))).toBeInTheDocument()
  })

  it('keeps the crown asset decorative and exposes the localized score as text', async () => {
    const runtime = await createRuntime()
    const { container } = renderHero(runtime, 'en')
    const artwork = container.querySelector('.star-heart__art')
    const score = container.querySelector('.star-heart')

    expect(artwork).toHaveAttribute('src', todayAssets.starHeart)
    expect(artwork).toHaveAttribute('alt', '')
    expect(artwork).toHaveAttribute('aria-hidden', 'true')
    expect(score).toHaveAttribute('aria-label', messages.en['today.starHeartAria'].replace('{score}', '105'))
    expect(score).toHaveTextContent(messages.en['today.starHeartValue'])
    expect(score).toHaveTextContent('105')
  })
})
