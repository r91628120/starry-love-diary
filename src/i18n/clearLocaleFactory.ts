import { clearMilestone4Messages } from './clearMilestone4Messages'

export type ClearMilestone4Key = keyof typeof clearMilestone4Messages
export type ClearMilestone4LocaleMessages = Record<ClearMilestone4Key, string>

export function defineClearLocale(
  locale: string,
  values: Partial<ClearMilestone4LocaleMessages>,
): ClearMilestone4LocaleMessages {
  const canonicalKeys = Object.keys(clearMilestone4Messages) as ClearMilestone4Key[]
  const missing = canonicalKeys.filter((key) => !values[key]?.trim())

  if (missing.length > 0) {
    throw new Error(`Clear locale ${locale} is missing: ${missing.join(', ')}`)
  }

  return Object.fromEntries(canonicalKeys.map((key) => [key, values[key]])) as ClearMilestone4LocaleMessages
}

export function entries<K extends string>(
  prefix: string,
  keys: readonly K[],
  values: readonly string[],
): Record<string, string> {
  if (keys.length !== values.length) {
    throw new Error(`Clear locale group ${prefix} has ${values.length}/${keys.length} values`)
  }

  return Object.fromEntries(keys.map((key, index) => [`${prefix}${key}`, values[index]]))
}

export const boatInvestmentKeys = ['investment_low', 'investment_mild', 'investment_high', 'investment_very_high'] as const
export const boatResponseKeys = ['low', 'mixed', 'good', 'high'] as const
export const boatCombinationKeys = boatInvestmentKeys.flatMap((investment) =>
  boatResponseKeys.map((response) => `${investment.replace('investment_', '')}_${response}`),
)
export const likeCombinationKeys = [
  'like_only', 'habit_only', 'fear_only', 'imagined_only',
  'like_habit', 'like_fear', 'like_imagined', 'habit_fear', 'habit_imagined', 'fear_imagined',
  'like_habit_fear', 'like_habit_imagined', 'like_fear_imagined', 'habit_fear_imagined', 'unclear',
] as const

export function boatResultBodies(
  investments: readonly string[],
  responses: readonly string[],
  closings: readonly string[],
): Record<string, string> {
  if (investments.length !== 4 || responses.length !== 4 || closings.length !== 3) {
    throw new Error('Boat result copy requires 4 investment, 4 response, and 3 closing phrases')
  }
  const result: Record<string, string> = {}
  boatCombinationKeys.forEach((combination, combinationIndex) => {
    const investmentIndex = Math.floor(combinationIndex / 4)
    const responseIndex = combinationIndex % 4
    closings.forEach((closing, variant) => {
      result[`clear.boat.resultBody.${combination}.${variant}`] =
        `${investments[investmentIndex]} ${responses[responseIndex]} ${closing}`
    })
  })
  return result
}

export function likeResults(
  titles: readonly string[],
  bodies: readonly string[],
  reflections: readonly string[],
): Record<string, string> {
  if (titles.length !== 15 || bodies.length !== 15 || reflections.length !== 15) {
    throw new Error('Like-or-habit result copy requires all 15 deterministic combinations')
  }
  const result: Record<string, string> = {}
  likeCombinationKeys.forEach((combination, index) => {
    result[`clear.like.result.${combination}.v1.title`] = titles[index]
    result[`clear.like.result.${combination}.v1.body`] = bodies[index]
    result[`clear.like.result.${combination}.v1.reflection`] = reflections[index]
  })
  return result
}
