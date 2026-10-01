import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { LikeOrHabitAnswers } from '../../data/clearTypes'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { ClearContent } from './ClearContent'

afterEach(cleanup)

async function createRuntime() {
  return initializePersistence({ adapter: new MemoryStorageAdapter(), defaultLocale: 'zh-TW', localDate: '2026-09-30' })
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.pathname + location.search}</output>
}

function show(runtime: Awaited<ReturnType<typeof createRuntime>>, route = '/clear') {
  return render(<PersistenceProvider runtime={runtime}><MemoryRouter initialEntries={[route]}><I18nProvider initialLocale="zh-TW"><ClearContent /><LocationProbe /></I18nProvider></MemoryRouter></PersistenceProvider>)
}

const completeLikeAnswers: LikeOrHabitAnswers = {
  realPerson: {
    real_person_three_real_traits: 'yes',
    real_person_without_romantic_expectation: 'yes',
    real_person_present_vs_future_version: 'mostly_present',
  },
  habit: {
    habit_expect_regular_contact: 'often',
    habit_absence_feels_like_missing_routine: 'yes',
    habit_missing_the_routine: 'yes',
  },
  fearOfLoss: {
    fear_of_loss_person_vs_feeling: 'mostly_person',
    fear_of_loss_avoiding_discomfort: 'no',
    fear_of_loss_hardest_part: ['lose_this_person'],
  },
  imaginedRelationship: {
    imagined_relationship_future_more_than_reality: 'rarely',
    imagined_relationship_future_fills_present_gap: 'rarely',
    imagined_relationship_reality_description: '我們有真實相處。',
  },
}

describe('Clear completed-save behavior', () => {
  it('keeps the Love Boat result active after saving and exits only through Finish and return home', async () => {
    const runtime = await createRuntime()
    const draft = await runtime.loveBoatAssessments.createDraft()
    await runtime.loveBoatAssessments.updateDraft(draft.id, {
      aAnswers: Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`a${String(index + 1).padStart(2, '0')}`, 2])),
      bAnswers: Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`b${String(index + 1).padStart(2, '0')}`, 1])),
      currentSection: 'result',
      currentQuestionIndex: 9,
    })
    show(runtime)

    fireEvent.click(await screen.findByRole('button', { name: /暈船法典/ }))
    fireEvent.click(await screen.findByRole('button', { name: /完成這次暈船法典/ }))
    expect(document.querySelector('.clear-result')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: '存成清醒星星' }))

    expect(document.querySelector('.clear-result')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: '已存成清醒星星' })).toBeDisabled())
    expect(screen.queryByRole('region', { name: '清醒工具' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '喜歡？習慣？' })).not.toBeInTheDocument()
    expect(await runtime.loveBoatAssessments.list()).toHaveLength(1)
    expect(await runtime.loveBoatAssessments.getActiveDraft()).toBeUndefined()
    expect(await runtime.adapter.getAll('stars')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: '完成並回首頁' }))
    await waitFor(() => expect(screen.getByRole('region', { name: '清醒工具' })).toBeInTheDocument())
  })

  it('keeps the Like or Habit result active after saving and exits only through Finish and return home', async () => {
    const runtime = await createRuntime()
    const draft = await runtime.likeOrHabitReflections.createDraft()
    await runtime.likeOrHabitReflections.updateDraft(draft.id, { answers: completeLikeAnswers, currentSection: 'result' })
    show(runtime)

    fireEvent.click(await screen.findByRole('button', { name: /喜歡？習慣？/ }))
    fireEvent.click(await screen.findByRole('button', { name: '看看整理結果' }))
    fireEvent.click(await screen.findByRole('button', { name: /完成這次/ }))
    expect(await screen.findByText('這次整理已成為歷史紀錄。')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: '存成清醒星星' }))

    expect(await screen.findByText('這次整理已成為歷史紀錄。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '已存成清醒星星' })).toBeDisabled()
    expect(screen.queryByRole('region', { name: '清醒工具' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '暈船法典' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '開始整理心情' })).not.toBeInTheDocument()
    expect(await runtime.likeOrHabitReflections.list()).toHaveLength(1)
    expect(await runtime.likeOrHabitReflections.getActiveDraft()).toBeUndefined()
    expect(await runtime.adapter.getAll('stars')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: '完成並回首頁' }))
    await waitFor(() => expect(screen.getByRole('region', { name: '清醒工具' })).toBeInTheDocument())
  })

  it('clears a stale history deep link only when an active Love Boat result explicitly exits', async () => {
    const runtime = await createRuntime()
    const historyDraft = await runtime.likeOrHabitReflections.createDraft()
    await runtime.likeOrHabitReflections.updateDraft(historyDraft.id, { answers: completeLikeAnswers, currentSection: 'result' })
    const historyRecord = await runtime.likeOrHabitReflections.complete(historyDraft.id)
    const activeDraft = await runtime.loveBoatAssessments.createDraft()
    await runtime.loveBoatAssessments.updateDraft(activeDraft.id, {
      aAnswers: Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`a${String(index + 1).padStart(2, '0')}`, 2])),
      bAnswers: Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`b${String(index + 1).padStart(2, '0')}`, 1])),
      currentSection: 'result',
      currentQuestionIndex: 9,
    })
    show(runtime, `/clear?sourceType=like_or_habit&recordId=${historyRecord.id}&returnTo=footprints`)

    fireEvent.click(await screen.findByRole('button', { name: '回到清醒首頁' }))
    fireEvent.click(await screen.findByRole('button', { name: /暈船法典/ }))
    fireEvent.click(await screen.findByRole('button', { name: /完成這次暈船法典/ }))
    fireEvent.click(await screen.findByRole('button', { name: '存成清醒星星' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '已存成清醒星星' })).toBeDisabled())
    expect(screen.queryByRole('region', { name: '清醒工具' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '完成並回首頁' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/clear'))
    expect(screen.getByRole('region', { name: '清醒工具' })).toBeInTheDocument()
    expect(screen.queryByText('這次整理已成為歷史紀錄。')).not.toBeInTheDocument()
  })
})
