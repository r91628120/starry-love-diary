import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ClearToolSourceType } from '../../data/clearTypes'
import { PersistenceProvider } from '../../data/PersistenceContext'
import { initializePersistence, type PersistenceRuntime } from '../../data/persistence'
import { MemoryStorageAdapter } from '../../data/storage/MemoryStorageAdapter'
import type { StoreName } from '../../data/storage/StorageAdapter'
import { I18nProvider } from '../../i18n/I18nProvider'
import { ClearHistoryAiHandoff } from './ClearContent'
import { clearHistoryAiHandoffIdentity } from './clearHistoryAiHandoff'

afterEach(cleanup)

type Source = ClearToolSourceType
type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void }
function deferred<T>(): Deferred<T> { let resolve!: (value: T) => void; return { promise: new Promise<T>((done) => { resolve = done }), resolve } }

async function seededRuntime() {
  const adapter = new MemoryStorageAdapter()
  const runtime = await initializePersistence({ adapter, defaultLocale: 'zh-TW', localDate: '2026-09-28' })
  const stamp = '2026-09-28T00:00:00.000Z'
  await Promise.all([
    adapter.put('clearRecords', { id: 'organize-1', triggerText: '整理來源', facts: '原始整理結果', emotions: ['anxious'], emotionIntensity: 3, localDate: '2026-09-28', timezone: 'Asia/Taipei', createdAt: stamp, updatedAt: stamp, completedAt: stamp }),
    adapter.put('loveBoatAssessments', { id: 'boat-1', status: 'completed', currentSection: 'result', currentQuestionIndex: 21, aAnswers: {}, bAnswers: {}, crossResultKey: 'low_low', localDate: '2026-09-28', timezone: 'Asia/Taipei', createdAt: stamp, updatedAt: stamp, completedAt: stamp }),
    adapter.put('loveBrainAssessments', { id: 'brain-1', status: 'completed', currentQuestionIndex: 24, answers: {}, isLowOverall: true, localDate: '2026-09-28', timezone: 'Asia/Taipei', createdAt: stamp, updatedAt: stamp, completedAt: stamp }),
    adapter.put('likeOrHabitReflections', { id: 'like-1', status: 'completed', currentSection: 'result', answers: {}, resultVariantKey: 'unclear.v1', localDate: '2026-09-28', timezone: 'Asia/Taipei', createdAt: stamp, updatedAt: stamp, completedAt: stamp }),
    adapter.put('clearFreeTalkRecords', { id: 'free-1', text: '自由聊聊來源', status: 'completed', localDate: '2026-09-28', timezone: 'Asia/Taipei', createdAt: stamp, updatedAt: stamp }),
  ])
  return runtime
}

const sourceRecords: Array<[Source, string, string]> = [
  ['clear_record', 'organize-1', 'clearRecords'],
  ['love_boat_code', 'boat-1', 'loveBoatAssessments'],
  ['love_brain_assessment', 'brain-1', 'loveBrainAssessments'],
  ['like_or_habit', 'like-1', 'likeOrHabitReflections'],
  ['free_talk', 'free-1', 'clearFreeTalkRecords'],
]
const aiHandoffStores: StoreName[] = ['clearRecords', 'loveBoatAssessments', 'loveBrainAssessments', 'likeOrHabitReflections', 'clearFreeTalkRecords']

function Detail({ sourceType, recordId }: { sourceType: Source | string; recordId: string }) {
  return <><output data-testid="identity">{clearHistoryAiHandoffIdentity(sourceType, recordId)}</output><ClearHistoryAiHandoff key={clearHistoryAiHandoffIdentity(sourceType, recordId)} sourceType={sourceType} recordId={recordId} onUpdated={async () => undefined} /></>
}

function renderDetail(runtime: PersistenceRuntime, sourceType: Source | string, recordId: string) {
  return render(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><Detail sourceType={sourceType} recordId={recordId} /></I18nProvider></PersistenceProvider>)
}

async function saveField(buttonName: string, textboxName: string, value: string) {
  fireEvent.click(await screen.findByRole('button', { name: buttonName }))
  fireEvent.change(screen.getByRole('textbox', { name: textboxName }), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  await waitFor(() => expect(screen.queryByRole('textbox', { name: textboxName })).not.toBeInTheDocument())
}

describe('Clear history AI handoff identity', () => {
  it.each(sourceRecords)('%s saves both fields on its original record without touching another store', async (sourceType, recordId, store) => {
    const runtime = await seededRuntime()
    const before = await Promise.all(aiHandoffStores.map((storeName) => runtime.adapter.getAll(storeName)))
    renderDetail(runtime, sourceType, recordId)
    await saveField('＋ 貼上想留下的 AI 回覆', 'AI 回覆精選', `${sourceType}-response`)
    expect(screen.getByTestId('identity')).toHaveTextContent(`${sourceType}:${recordId}`)
    await saveField('＋ 寫下我的整理', '聊完後，我現在怎麼想？', `${sourceType}-reflection`)
    expect(screen.getByTestId('identity')).toHaveTextContent(`${sourceType}:${recordId}`)
    const updated = await runtime.adapter.get(store as never, recordId) as Record<string, unknown>
    expect(updated).toMatchObject({ id: recordId, aiResponseExcerpt: `${sourceType}-response`, postChatReflection: `${sourceType}-reflection`, localDate: '2026-09-28', createdAt: '2026-09-28T00:00:00.000Z' })
    const after = await Promise.all(aiHandoffStores.map((storeName) => runtime.adapter.getAll(storeName)))
    expect(after.map((records) => records.length)).toEqual(before.map((records) => records.length))
  })

  it.each([
    ['love_boat_code', 'boat-1', 'like_or_habit', 'like-1', 'boat-request', 'like-request'],
    ['like_or_habit', 'like-1', 'love_boat_code', 'boat-1', 'like-request', 'boat-request'],
  ] as const)('ignores an older %s request after switching to %s', async (firstSource, firstId, secondSource, secondId, firstValue, secondValue) => {
    const runtime = await seededRuntime()
    const firstDeferred = deferred<Record<string, unknown> | undefined>()
    const firstRepository = firstSource === 'love_boat_code' ? runtime.loveBoatAssessments : runtime.likeOrHabitReflections
    const secondRepository = secondSource === 'love_boat_code' ? runtime.loveBoatAssessments : runtime.likeOrHabitReflections
    const firstGet = vi.spyOn(firstRepository, 'getById').mockImplementation(() => firstDeferred.promise as never)
    vi.spyOn(secondRepository, 'getById').mockResolvedValue({ ...(await secondRepository.getById(secondId))!, aiResponseExcerpt: secondValue } as never)
    const view = renderDetail(runtime, firstSource, firstId)
    await waitFor(() => expect(firstGet).toHaveBeenCalledWith(firstId))
    view.rerender(<PersistenceProvider runtime={runtime}><I18nProvider initialLocale="zh-TW"><Detail sourceType={secondSource} recordId={secondId} /></I18nProvider></PersistenceProvider>)
    expect(screen.queryByText(firstValue)).not.toBeInTheDocument()
    expect(await screen.findByText(secondValue)).toBeInTheDocument()
    firstDeferred.resolve({ ...(await runtime.adapter.get(firstSource === 'love_boat_code' ? 'loveBoatAssessments' : 'likeOrHabitReflections', firstId))!, aiResponseExcerpt: firstValue })
    await act(async () => { await Promise.resolve() })
    expect(screen.getByTestId('identity')).toHaveTextContent(`${secondSource}:${secondId}`)
    expect(screen.getByText(secondValue)).toBeInTheDocument()
    expect(screen.queryByText(firstValue)).not.toBeInTheDocument()
  })

  it('does not read, display, or save for an unknown sourceType', async () => {
    const runtime = await seededRuntime()
    const reads = [
      vi.spyOn(runtime.clearRecords, 'getById'), vi.spyOn(runtime.clearFreeTalkRecords, 'getById'), vi.spyOn(runtime.loveBoatAssessments, 'getById'), vi.spyOn(runtime.loveBrainAssessments, 'getById'), vi.spyOn(runtime.likeOrHabitReflections, 'getById'),
    ]
    renderDetail(runtime, 'unknown_source', 'unknown-id')
    await act(async () => { await Promise.resolve() })
    expect(reads.every((read) => read.mock.calls.length === 0)).toBe(true)
    expect(screen.queryByText('AI 回覆精選')).not.toBeInTheDocument()
    expect(await runtime.adapter.getAll('clearRecords')).toHaveLength(1)
    expect(await runtime.adapter.getAll('loveBoatAssessments')).toHaveLength(1)
    expect(await runtime.adapter.getAll('loveBrainAssessments')).toHaveLength(1)
    expect(await runtime.adapter.getAll('likeOrHabitReflections')).toHaveLength(1)
    expect(await runtime.adapter.getAll('clearFreeTalkRecords')).toHaveLength(1)
  })
})
