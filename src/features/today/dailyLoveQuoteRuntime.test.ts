import { describe, expect, it, vi } from 'vitest'
import { initializePersistence } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { messages, supportedLocales } from '../../i18n/messages'
import {
  getDailyLoveQuote,
  getDailyLoveQuoteDayIndex,
  getDailyLoveQuoteKey,
  shareDailyLoveQuote,
} from './dailyLoveQuoteRuntime'

describe('daily love quote runtime', () => {
  it('uses activation day as Day 1 and the next local day as Day 2', () => {
    expect(getDailyLoveQuoteDayIndex('2026-08-30', '2026-08-30')).toBe(1)
    expect(getDailyLoveQuoteDayIndex('2026-08-30', '2026-08-31')).toBe(2)
  })

  it('skips unopened calendar days without issuing catch-up quotes', () => {
    expect(getDailyLoveQuoteDayIndex('2026-08-01', '2026-08-11')).toBe(11)
  })

  it('cycles from Day 365 back to Day 1', () => {
    expect(getDailyLoveQuoteDayIndex('2025-01-01', '2025-12-31')).toBe(365)
    expect(getDailyLoveQuoteDayIndex('2025-01-01', '2026-01-01')).toBe(1)
  })

  it('keeps the Day identity stable across locale changes and has no stale locale text', () => {
    const dayIndex = getDailyLoveQuoteDayIndex('2026-01-01', '2026-05-22')
    const key = getDailyLoveQuoteKey(dayIndex)
    const rendered = supportedLocales.map((locale) => getDailyLoveQuote(locale, dayIndex))

    expect(new Set(rendered).size).toBe(supportedLocales.length)
    for (const [index, locale] of supportedLocales.entries()) {
      expect(rendered[index]).toBe((messages[locale] as Record<string, string>)[key])
      expect(getDailyLoveQuoteDayIndex('2026-01-01', '2026-05-22')).toBe(dayIndex)
    }
  })

  it('shares exactly the supplied current-locale quote', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const quote = getDailyLoveQuote('fr', 142)

    await expect(shareDailyLoveQuote(quote, 'Phrase du jour', { share })).resolves.toBe(true)
    expect(share).toHaveBeenCalledWith({ title: 'Phrase du jour', text: quote })
  })

  it('preserves activation and progression after storage reopen', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({
      adapter: new MemoryStorageAdapter(backing),
      defaultLocale: 'zh-TW',
      localDate: '2026-01-01',
    })
    expect(first.initial.settings.dailyLoveQuoteActivationDate).toBe('2026-01-01')
    first.adapter.close()

    const reopened = await initializePersistence({
      adapter: new MemoryStorageAdapter(backing),
      defaultLocale: 'en',
      localDate: '2026-01-11',
    })
    expect(reopened.initial.settings.dailyLoveQuoteActivationDate).toBe('2026-01-01')
    expect(getDailyLoveQuoteDayIndex(reopened.initial.settings.dailyLoveQuoteActivationDate, reopened.initial.currentLocalDate)).toBe(11)
  })

  it('derives activation from the existing first-initialization timestamp for legacy v4 settings', async () => {
    const backing = createMemoryStorageBacking()
    backing.set('settings', new Map([['settings', {
      id: 'settings',
      locale: 'zh-TW',
      loveQuoteReminderEnabled: true,
      importantDateReminderEnabled: true,
      reminderTime: '20:00',
      schemaVersion: 4,
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-01T12:00:00.000Z',
    }]]))

    const runtime = await initializePersistence({
      adapter: new MemoryStorageAdapter(backing),
      defaultLocale: 'zh-TW',
      localDate: '2026-02-01',
    })
    expect(runtime.initial.settings.dailyLoveQuoteActivationDate).toBe('2026-01-01')
  })
})
