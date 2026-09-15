import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { LOVE_BRAIN_KEYS } from '../../data/repositories/clearRepositories'
import { initializePersistence } from '../../data/persistence'
import { MemoryStorageAdapter, type MemoryStorageBacking } from '../../data/storage/MemoryStorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { LikeOrHabitFlow } from './LikeOrHabitFlow'
import { LoveBoatFlow } from './LoveBoatFlow'
import { LoveBrainFlow } from './LoveBrainFlow'
import { OrganizeFeelingsFlow } from './OrganizeFeelingsFlow'

afterEach(cleanup)

async function createRuntime(backing?: MemoryStorageBacking) {
  return initializePersistence({ adapter: new MemoryStorageAdapter(backing), defaultLocale: 'zh-TW', localDate: '2026-09-09' })
}

function withProviders(node: React.ReactNode, runtime: Awaited<ReturnType<typeof createRuntime>>) {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW">{node}</I18nProvider></PersistenceProvider>)
}

describe('Clear manual next navigation', () => {
  it('keeps an Organize Feelings trigger visibly selected until Next is clicked', async () => {
    const runtime = await createRuntime()
    withProviders(<OrganizeFeelingsFlow onDone={() => undefined} />, runtime)

    const trigger = screen.getByRole('radio', { name: '他沒有回訊息' })
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-checked', 'true')
    expect(trigger).toHaveClass('is-active')
    expect(screen.getByText('1 / 6')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一題' }))
    expect(await screen.findByText('2 / 6')).toBeInTheDocument()
  })

  it('keeps Love Boat A and B choices on their current questions until Next is clicked', async () => {
    const runtime = await createRuntime()
    const draft = await runtime.loveBoatAssessments.createDraft()
    withProviders(<LoveBoatFlow onDone={() => undefined} />, runtime)

    const aRadios = await screen.findAllByRole('radio')
    fireEvent.click(aRadios[1])
    await waitFor(() => expect(aRadios[1]).toHaveAttribute('aria-checked', 'true'))
    expect(screen.getByText('1 / 12')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '下一題' }))
    expect(await screen.findByText('2 / 12')).toBeInTheDocument()

    await runtime.loveBoatAssessments.updateDraft(draft.id, { currentSection: 'B', currentQuestionIndex: 0 })
    // Reopen to assert the persisted B branch, not a transient click state.
    cleanup()
    withProviders(<LoveBoatFlow onDone={() => undefined} />, runtime)
    const bRadios = await screen.findAllByRole('radio')
    fireEvent.click(bRadios[0])
    await waitFor(() => expect(bRadios[0]).toHaveAttribute('aria-checked', 'true'))
    expect(screen.getByText('1 / 10')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '下一題' }))
    expect(await screen.findByText('2 / 10')).toBeInTheDocument()
  })

  it('does not open Love Brain preview on the final selection; explicit View result opens it', async () => {
    const runtime = await createRuntime()
    const draft = await runtime.loveBrainAssessments.createDraft()
    const answers = Object.fromEntries(LOVE_BRAIN_KEYS.map((question) => [question, 1]))
    await runtime.loveBrainAssessments.updateDraft(draft.id, { answers, currentQuestionIndex: LOVE_BRAIN_KEYS.length - 1 })
    withProviders(<LoveBrainFlow onDone={() => undefined} />, runtime)

    const radios = await screen.findAllByRole('radio')
    fireEvent.click(radios[2])
    await waitFor(() => expect(radios[2]).toHaveAttribute('aria-checked', 'true'))
    expect(screen.getByText('25 / 25')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '完成這次檢測' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重新開始' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '查看結果' }))
    expect(await screen.findByRole('button', { name: '完成這次檢測' })).toBeInTheDocument()
  })

  it('does not expose an actionable View result CTA when the final page still has unanswered questions', async () => {
    const runtime = await createRuntime()
    const draft = await runtime.loveBrainAssessments.createDraft()
    await runtime.loveBrainAssessments.updateDraft(draft.id, { currentQuestionIndex: LOVE_BRAIN_KEYS.length - 1 })
    withProviders(<LoveBrainFlow onDone={() => undefined} />, runtime)

    expect(await screen.findByText('25 / 25')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '查看結果' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '下一題' })).toBeDisabled()
  })

  it('keeps Next on question 24 and exposes a complete Love Brain result flow only after View result', async () => {
    const runtime = await createRuntime()
    const draft = await runtime.loveBrainAssessments.createDraft()
    const answers = Object.fromEntries(LOVE_BRAIN_KEYS.map((question) => [question, 1]))
    await runtime.loveBrainAssessments.updateDraft(draft.id, { answers, currentQuestionIndex: LOVE_BRAIN_KEYS.length - 2 })
    withProviders(<LoveBrainFlow onDone={() => undefined} />, runtime)

    expect(await screen.findByText('24 / 25')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '下一題' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '查看結果' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一題' }))
    expect(await screen.findByText('25 / 25')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '查看結果' })).toHaveClass('button--primary')
    expect(screen.getByRole('button', { name: '重新開始' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '查看結果' }))
    expect(await screen.findByRole('button', { name: '完成這次檢測' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '完成這次檢測' }))

    expect(await screen.findByText('這次檢測已成為歷史紀錄。')).toBeInTheDocument()
    await waitFor(async () => {
      expect(await runtime.loveBrainAssessments.getActiveDraft()).toBeUndefined()
      expect(await runtime.loveBrainAssessments.getById(draft.id)).toMatchObject({ status: 'completed' })
    })
    expect((await runtime.adapter.getAll<{ awardType: string }>('scoreAwards')).filter((award) => award.awardType === 'clear_completed')).toEqual([])
    expect(await runtime.adapter.getAll('stars')).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: '存成清醒星星' }))
    await waitFor(async () => expect(await runtime.adapter.getAll('stars')).toHaveLength(1))
    expect((await runtime.loveBrainAssessments.saveAsClearMindStar(draft.id)).created).toBe(false)
    expect(await runtime.adapter.getAll('stars')).toHaveLength(1)

    await runtime.loveBrainAssessments.restartDraft()
    expect(await runtime.loveBrainAssessments.getById(draft.id)).toMatchObject({ status: 'completed' })
    expect(await runtime.adapter.getAll('stars')).toHaveLength(1)
  })

  it('keeps Like or Habit answers selected in place until its explicit section Next', async () => {
    const runtime = await createRuntime()
    await runtime.likeOrHabitReflections.createDraft()
    withProviders(<LikeOrHabitFlow onDone={() => undefined} />, runtime)

    const radio = (await screen.findAllByRole('radio'))[0]
    fireEvent.click(radio)
    await waitFor(() => expect(radio).toHaveAttribute('aria-checked', 'true'))
    expect(radio).toHaveClass('is-active')
    expect(screen.getByText('1 / 4')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '下一題' }))
    expect(await screen.findByText('2 / 4')).toBeInTheDocument()
  })
})
