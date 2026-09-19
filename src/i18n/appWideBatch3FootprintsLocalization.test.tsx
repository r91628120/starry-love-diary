import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PersistenceProvider } from '../data/PersistenceContext'
import { usePersistence } from '../data/PersistenceStateContext'
import { initializePersistence } from '../data/persistence'
import { createMemoryStorageBacking, MemoryStorageAdapter } from '../data/storage/MemoryStorageAdapter'
import { FootprintsPage } from '../pages/FootprintsPage'
import { toLocalDate } from '../services/localDateService'
import { I18nProvider } from './I18nProvider'
import { useI18n } from './I18nContext'
import { messages, supportedLocales, type TranslationKey } from './messages'

const batch3Keys = [
  'footprints.title',
  'footprints.calendar.previousMonth', 'footprints.calendar.nextMonth', 'footprints.calendar.label', 'footprints.calendar.dayLabel',
  'footprints.stats.label', 'footprints.stats.monthlyDiary', 'footprints.stats.monthlyDiary.value', 'footprints.stats.moodDays', 'footprints.stats.moodDays.value', 'footprints.stats.topMood', 'footprints.stats.topMood.value', 'footprints.stats.monthlyHeartScore', 'footprints.stats.monthlyHeartScore.value', 'footprints.stats.itemAria',
  'footprints.stats.empty',
  'footprints.searchPlaceholder', 'footprints.search.empty',
  'footprints.todayDiary', 'footprints.editDiary', 'footprints.addDiary',
  'footprints.diary.placeholder', 'footprints.diary.maxLength', 'footprints.diary.save', 'footprints.diary.saveChanges', 'footprints.diary.delete', 'footprints.diary.saved', 'footprints.diary.updated', 'footprints.diary.deleted', 'footprints.diary.saveError', 'footprints.diary.deleteError', 'footprints.diary.deleteConfirmTitle', 'footprints.diary.deleteConfirmBody',
  'footprints.photo.alt', 'footprints.photo.groupLabel',
  'footprints.recentFootprints', 'footprints.recent.empty', 'footprints.recent.detail', 'footprints.recent.showRecent', 'footprints.recent.expandDiary', 'footprints.recent.collapseDiary', 'footprints.recent.group.count', 'footprints.recent.group.expand', 'footprints.recent.group.collapse', 'footprints.viewAll',
  'footprints.type.diary', 'footprints.type.mood', 'footprints.type.photo', 'footprints.type.clear',
] as const satisfies readonly TranslationKey[]

const scopedRuntimeFiles = [
  '../pages/FootprintsPage.tsx',
  '../features/footprints/CalendarCard.tsx',
  '../features/footprints/FootprintsHero.tsx',
  '../features/footprints/MonthlyStats.tsx',
  '../features/footprints/PhotoThumbnail.tsx',
  '../features/footprints/RecentFootprints.tsx',
  '../features/footprints/TodayDiaryCard.tsx',
] as const

function LocaleSwitch() {
  const { setLocale } = useI18n()
  const persistence = usePersistence()
  return <button type="button" onClick={async () => {
    await persistence?.updateSettings({ locale: 'en' })
    setLocale('en')
  }}>switch-locale</button>
}

function formatDate(localDate: string, locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(new Date(`${localDate}T00:00:00Z`))
}

afterEach(cleanup)

describe('Milestone 4C-3 Batch 3 Footprints localization', () => {
  it.each(supportedLocales)('has every non-empty Footprints UI key in %s', (locale) => {
    for (const key of batch3Keys) {
      expect(Object.prototype.hasOwnProperty.call(messages[locale], key), `${locale} missing ${key}`).toBe(true)
      expect(messages[locale][key].trim(), `${locale} empty ${key}`).not.toBe('')
    }
  })

  it('contains no hardcoded Han UI strings in the scoped runtime components', () => {
    for (const relativePath of scopedRuntimeFiles) {
      const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8')
      expect(source, relativePath).not.toMatch(/[\u3400-\u9fff]/u)
    }
  })

  it('preserves diary text, search, selected date, and month while locale-aware dates rerender', async () => {
    const backing = createMemoryStorageBacking()
    const first = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    await first.diaries.createDiary({ localDate: '2026-08-31', content: '使用者原始日記內容' })
    first.adapter.close()
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    const scoreBefore = await runtime.scores.getTotal()

    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/footprints']}>
            <FootprintsPage />
            <LocaleSwitch />
          </MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )

    const diary = screen.getByRole('textbox', { name: '今天的日記' })
    fireEvent.change(diary, { target: { value: '使用者尚未儲存的中文草稿' } })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(diary).toHaveValue('使用者尚未儲存的中文草稿')
    const search = screen.getByRole('searchbox', { name: '搜尋日記或心情' })
    fireEvent.change(search, { target: { value: '2026' } })
    fireEvent.click(screen.getByRole('button', { name: '下個月' }))
    const september15Zh = formatDate('2026-09-15', 'zh-TW', { dateStyle: 'long' })
    fireEvent.click(screen.getByRole('gridcell', { name: september15Zh }))
    fireEvent.click(screen.getByRole('button', { name: 'switch-locale' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Footprints' })).toBeInTheDocument())

    const septemberLabelEn = formatDate('2026-09-01', 'en', { month: 'long', year: 'numeric' })
    const september15En = formatDate('2026-09-15', 'en', { dateStyle: 'long' })
    expect(diary).toHaveValue('使用者尚未儲存的中文草稿')
    expect(search).toHaveValue('2026')
    expect(screen.getByRole('grid', { name: `${septemberLabelEn} calendar` })).toBeInTheDocument()
    expect(screen.getByRole('gridcell', { name: september15En })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(await screen.findByText('1 entries')).toBeInTheDocument()
    expect((await runtime.diaries.getDiaryByLocalDate('2026-08-31'))?.content).toBe('使用者原始日記內容')
    expect((await runtime.settings.getSettings())?.locale).toBe('en')
    expect(await runtime.scores.getTotal()).toBe(scoreBefore)
  })

  it('supports localized diary create, edit, and confirmed delete without changing repository rules', async () => {
    const localDate = toLocalDate()
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate })
    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/footprints']}><FootprintsPage /></MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )

    const diary = screen.getByRole('textbox', { name: '今天的日記' })
    fireEvent.change(diary, { target: { value: '使用者新增的日記' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存日記' }))
    expect(await screen.findByText('日記已儲存')).toBeInTheDocument()
    expect((await runtime.diaries.getDiaryByLocalDate(localDate))?.content).toBe('使用者新增的日記')

    fireEvent.click(await screen.findByRole('button', { name: /使用者新增的日記/ }))
    await screen.findByRole('button', { name: '儲存修改' })
    fireEvent.change(diary, { target: { value: '使用者修改後的日記' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存修改' }))
    expect(await screen.findByText('日記已更新')).toBeInTheDocument()
    expect((await runtime.diaries.getDiaryByLocalDate(localDate))?.content).toBe('使用者修改後的日記')

    fireEvent.click(await screen.findByRole('button', { name: /使用者修改後的日記/ }))
    await screen.findByRole('button', { name: '刪除日記' })
    fireEvent.click(screen.getByRole('button', { name: '刪除日記' }))
    const dialog = screen.getByRole('alertdialog', { name: '確定要刪除這篇日記嗎？' })
    expect(within(dialog).getByText('刪除後將無法復原。')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: '確認' }))
    expect(await screen.findByText('日記已刪除')).toBeInTheDocument()
    expect(await runtime.diaries.getDiaryByLocalDate(localDate)).toBeUndefined()
  })
})
