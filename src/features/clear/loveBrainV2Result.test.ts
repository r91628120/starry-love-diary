import { describe, expect, it } from 'vitest'
import { getLoveBrainV2ResultSummary, loveBrainV2ExplanationBand } from './loveBrainV2Result'
import type { LoveBrainAssessment } from '../../data/clearTypes'

const record: LoveBrainAssessment = {
  id: 'v2', status: 'completed', quizVersion: 2, answers: {}, currentQuestionIndex: 24,
  v2Scores: { rumination: 0, messagePull: 5, overInterpretation: 6, checking: 10, selfNeglect: 15, totalScore: 36 },
  localDate: '2026-09-27', timezone: 'Asia/Taipei', createdAt: '2026-09-27T00:00:00Z', updatedAt: '2026-09-27T00:00:00Z', completedAt: '2026-09-27T00:00:00Z',
}

describe('Love Brain V2 result data', () => {
  it('selects supportive explanation copy at every score boundary', () => {
    expect([0, 5, 6, 10, 11, 15].map(loveBrainV2ExplanationBand)).toEqual([0, 0, 1, 1, 2, 2])
  })

  it('returns all five V2 dimensions and never treats a V1 record as V2', () => {
    expect(getLoveBrainV2ResultSummary(record)?.dimensions.map((item) => [item.dimension, item.score])).toEqual([
      ['rumination', 0], ['messagePull', 5], ['overInterpretation', 6], ['checking', 10], ['selfNeglect', 15],
    ])
    expect(getLoveBrainV2ResultSummary({ ...record, quizVersion: 1 })).toBeUndefined()
  })
})
