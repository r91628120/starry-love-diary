import { describe, expect, it, vi } from 'vitest'
import { initializePersistence } from '../../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { messages, supportedLocales } from '../../i18n/messages'
import {
  getDailyLoveQuote,
  getDailyLoveQuoteDayIndex,
  getDailyLoveQuoteKey,
  formatDailyLoveQuoteDate,
  formatDailyLoveQuoteSharePayload,
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

  it('uses native Capacitor Share before Web Share or clipboard', async () => {
    const nativeShare = { canShare: vi.fn().mockResolvedValue({ value: true }), share: vi.fn().mockResolvedValue({}) }
    const webShare = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)

    await expect(shareDailyLoveQuote('native text', 'Native title', {
      nativePlatform: { isNativePlatform: () => true }, nativeShare, target: { share: webShare, clipboard: { writeText } },
    })).resolves.toBe('shared')
    expect(nativeShare.share).toHaveBeenCalledWith({ title: 'Native title', text: 'native text' })
    expect(webShare).not.toHaveBeenCalled()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('does not copy when native sharing is cancelled or fails after invocation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    await expect(shareDailyLoveQuote('text', 'title', {
      nativePlatform: { isNativePlatform: () => true },
      nativeShare: { canShare: vi.fn().mockResolvedValue({ value: true }), share: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')) },
      target: { clipboard: { writeText } },
    })).resolves.toBe('cancelled')
    await expect(shareDailyLoveQuote('text', 'title', {
      nativePlatform: { isNativePlatform: () => true },
      nativeShare: { canShare: vi.fn().mockResolvedValue({ value: true }), share: vi.fn().mockRejectedValue(new Error('native failure')) },
      target: { clipboard: { writeText } },
    })).resolves.toBe('error')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('uses Web Share then clipboard only when native sharing is unavailable', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const quote = getDailyLoveQuote('fr', 142)

    await expect(shareDailyLoveQuote(quote, 'Phrase du jour', { nativePlatform: { isNativePlatform: () => false }, target: { share } })).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({ title: 'Phrase du jour', text: quote })

    const writeText = vi.fn().mockResolvedValue(undefined)
    await expect(shareDailyLoveQuote(quote, 'Phrase du jour', {
      nativePlatform: { isNativePlatform: () => true }, nativeShare: { canShare: vi.fn().mockResolvedValue({ value: false }), share: vi.fn() }, target: { clipboard: { writeText } },
    })).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(quote)
  })

  it('uses the clipboard when native capability cannot be determined before opening a sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    await expect(shareDailyLoveQuote('text', 'title', {
      nativePlatform: { isNativePlatform: () => true },
      nativeShare: { canShare: vi.fn().mockRejectedValue(new Error('unavailable')), share: vi.fn() },
      target: { clipboard: { writeText } },
    })).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith('text')
  })

  it.each(supportedLocales)('builds a complete, private-safe %s payload from dynamic quote, date, and day values', (locale) => {
    const quote = getDailyLoveQuote(locale, 1)
    const payload = formatDailyLoveQuoteSharePayload({
      quote,
      title: messages[locale]['today.dailyQuote'],
      date: formatDailyLoveQuoteDate('2026-09-17', locale),
      dayNumber: messages[locale]['today.dayNumber'].replace('{day}', '1'),
      appName: messages[locale]['app.brand'],
    })
    expect(payload).toBe(`${quote}\n\n${messages[locale]['today.dailyQuote']}\n${formatDailyLoveQuoteDate('2026-09-17', locale)}｜${messages[locale]['today.dayNumber'].replace('{day}', '1')}\n${messages[locale]['app.brand']}`)
    expect(payload).not.toContain('nickname')
    expect(payload).not.toContain('diary')
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
