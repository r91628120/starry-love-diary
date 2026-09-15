import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import type { DiaryEntry, MoodRecord, ScoreAward } from '../../data/types'
import { I18nProvider } from '../../i18n/I18nProvider'
import { ClearPage } from '../../pages/ClearPage'
import { FootprintsPage } from '../../pages/FootprintsPage'
import { deriveMonthlyFootprintStats, sortRecentFootprints, type RecentFootprintEntry } from './footprintsData'
import { DiaryPhotoGrid } from './TodayDiaryCard'

const timestamp = '2026-08-01T10:00:00.000Z'
const diary = (id: string, localDate: string): DiaryEntry => ({ id, localDate, content: id, savedAsStar: false, timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp })
const mood = (id: string, localDate: string, value: MoodRecord['mood'], updatedAt = timestamp): MoodRecord => ({ id, localDate, mood: value, timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt })
const award = (id: string, localDate: string, points: number): ScoreAward => ({ id, localDate, awardType: 'daily_open', points, timezone: 'Asia/Taipei', createdAt: timestamp, updatedAt: timestamp })

afterEach(cleanup)

describe('Footprints Runtime Fix Batch 1', () => {
  it('derives monthly diary count, unique mood days, tie-broken top mood, and score award sum', () => {
    const result = deriveMonthlyFootprintStats(
      '2026-08-31',
      [diary('aug-one', '2026-08-01'), diary('aug-two', '2026-08-30'), diary('july', '2026-07-31')],
      [
        mood('happy-one', '2026-08-01', 'happy'),
        mood('miss-one', '2026-08-02', 'miss'),
        mood('happy-two', '2026-08-03', 'happy'),
        mood('miss-two', '2026-08-04', 'miss'),
        mood('same-day-update', '2026-08-04', 'miss', '2026-08-04T12:00:00.000Z'),
        mood('outside', '2026-07-31', 'flutter'),
      ],
      [award('aug-a', '2026-08-01', 2), award('aug-b', '2026-08-20', 7), award('outside', '2026-07-31', 50)],
    )

    expect(result).toEqual({ diaryCount: 2, moodDayCount: 4, topMood: 'miss', monthlyScore: 9 })
  })

  it('uses the most recently occurring mood when monthly counts are tied', () => {
    const result = deriveMonthlyFootprintStats('2026-08-31', [], [
      mood('happy-one', '2026-08-02', 'happy'),
      mood('miss-one', '2026-08-03', 'miss'),
      mood('happy-two', '2026-08-04', 'happy'),
      mood('miss-two', '2026-08-05', 'miss'),
    ], [])
    expect(result.topMood).toBe('miss')
  })

  it('returns an empty top mood when the month has no mood records', () => {
    expect(deriveMonthlyFootprintStats('2026-08-31', [], [mood('outside', '2026-07-31', 'happy')], []).topMood).toBeUndefined()
  })

  it('sorts real recent entries by local date and then actual timestamp', () => {
    const entries: RecentFootprintEntry[] = [
      { id: 'old', recordId: 'old', type: 'diary', localDate: '2026-08-01', occurredAt: '2026-08-01T20:00:00Z', summary: 'old' },
      { id: 'same-early', recordId: 'same-early', type: 'mood', localDate: '2026-08-03', occurredAt: '2026-08-03T08:00:00Z', summary: 'early' },
      { id: 'same-late', recordId: 'same-late', type: 'clear', localDate: '2026-08-03', occurredAt: '2026-08-03T20:00:00Z', summary: 'late' },
    ]
    expect(sortRecentFootprints(entries).map((entry) => entry.id)).toEqual(['same-late', 'same-early', 'old'])
  })

  it('shows a real empty state with no fixed demo records or diary photo placeholders', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/footprints']}><FootprintsPage /></MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )

    expect(await screen.findByText('還沒有足跡紀錄')).toBeInTheDocument()
    for (const retired of ['今天也有一點想你。', '一起吃晚餐，是今天最溫柔的片刻。', '先把不知道的事，留在不知道。']) expect(screen.queryByText(retired)).not.toBeInTheDocument()
    expect(document.querySelector('.today-diary-card__photos')).not.toBeInTheDocument()
    const todayDiarySource = readFileSync('src/features/footprints/TodayDiaryCard.tsx', 'utf8')
    expect(todayDiarySource).not.toContain('PhotoThumbnail')
  })

  it('keeps the future photo grid hidden at zero and caps rendered photos at three', () => {
    const empty = render(<I18nProvider initialLocale="en"><DiaryPhotoGrid photos={[]} /></I18nProvider>)
    expect(empty.container.firstChild).toBeNull()
    empty.unmount()
    render(<I18nProvider initialLocale="en"><DiaryPhotoGrid photos={['one.jpg', 'two.jpg', 'three.jpg', 'four.jpg']} /></I18nProvider>)
    expect(screen.getAllByRole('img')).toHaveLength(3)
  })

  it('renders the newest three real records, expands all, opens diary detail, and routes Clear to its real history record', async () => {
    const runtime = await initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-08-31' })
    await runtime.diaries.createDiary({ localDate: '2026-08-05', content: '最新真實日記' })
    await runtime.clearRecords.complete({ localDate: '2026-08-04', triggerType: 'waiting_response', facts: '真實清醒紀錄', emotions: ['anxious'], emotionIntensity: 3, nextActionType: 'take_a_walk' })
    await runtime.moods.setMood('peaceful', '2026-08-03')
    await runtime.diaries.createDiary({ localDate: '2026-08-02', content: '較早真實日記' })
    await runtime.loveBoatAssessments.createDraft()

    render(
      <PersistenceProvider runtime={runtime}>
        <I18nProvider initialLocale="zh-TW">
          <MemoryRouter initialEntries={['/footprints']}>
            <Routes>
              <Route path="/footprints" element={<FootprintsPage />} />
              <Route path="/clear" element={<ClearPage />} />
            </Routes>
          </MemoryRouter>
        </I18nProvider>
      </PersistenceProvider>,
    )

    const list = document.querySelector('.recent-footprints__list') as HTMLElement
    await waitFor(() => expect(within(list).getAllByRole('button')).toHaveLength(3))
    const initialButtons = within(list).getAllByRole('button')
    expect(initialButtons[0]).toHaveTextContent('最新真實日記')
    expect(initialButtons[1]).toHaveTextContent('真實清醒紀錄')
    expect(initialButtons[2]).toHaveTextContent('安心')
    expect(screen.queryByText('較早真實日記')).not.toBeInTheDocument()

    fireEvent.click(initialButtons[0])
    expect(await screen.findByRole('article', { name: '選取的足跡' })).toHaveTextContent('最新真實日記')

    fireEvent.click(screen.getByRole('button', { name: '查看全部足跡' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '收合 2026' })).toHaveAttribute('aria-expanded', 'true'))
    expect(screen.getByText('較早真實日記')).toBeInTheDocument()

    fireEvent.click(screen.getByText('真實清醒紀錄').closest('button') as HTMLButtonElement)
    expect(await screen.findByRole('heading', { level: 1, name: '清醒' })).toBeInTheDocument()
    expect((await screen.findAllByText('真實清醒紀錄')).length).toBeGreaterThan(0)
  })
})
