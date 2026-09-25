export const MAX_HEART_PHRASE_CODE_POINTS = 80

export function heartPhraseCodePointLength(value: string) {
  return Array.from(value).length
}

export function truncateHeartPhrase(value: string) {
  return Array.from(value).slice(0, MAX_HEART_PHRASE_CODE_POINTS).join('')
}
