import type { LoveBrainAssessment, LoveBrainV2Scores } from '../../data/clearTypes'

export type LoveBrainV2Dimension = keyof Omit<LoveBrainV2Scores, 'totalScore'>

export const LOVE_BRAIN_V2_DIMENSIONS: LoveBrainV2Dimension[] = [
  'rumination', 'messagePull', 'overInterpretation', 'checking', 'selfNeglect',
]

export const LOVE_BRAIN_V2_DIMENSION_KEYS: Record<LoveBrainV2Dimension, string> = {
  rumination: 'rumination',
  messagePull: 'message_dependency',
  overInterpretation: 'over_interpretation',
  checking: 'detective',
  selfNeglect: 'self_sacrifice',
}

/** These ranges choose supportive UI copy only; they are not clinical classifications. */
export function loveBrainV2ExplanationBand(score: number): 0 | 1 | 2 {
  if (score <= 5) return 0
  if (score <= 10) return 1
  return 2
}

export function getLoveBrainV2ResultSummary(record: LoveBrainAssessment) {
  if (record.quizVersion !== 2 || !record.v2Scores) return undefined
  return {
    totalScore: record.v2Scores.totalScore,
    noteToSay: record.noteToSay,
    dimensions: LOVE_BRAIN_V2_DIMENSIONS.map((dimension) => ({
      dimension,
      displayKey: `clear.brain.pattern.${LOVE_BRAIN_V2_DIMENSION_KEYS[dimension]}`,
      score: record.v2Scores![dimension],
      explanationKey: `clear.brain.v2.explanation.${dimension}.${loveBrainV2ExplanationBand(record.v2Scores![dimension])}`,
    })),
  }
}
