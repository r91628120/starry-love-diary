export function advanceHeartPhraseRitual(currentPresses: number) {
  const nextPresses = currentPresses + 1
  return nextPresses >= 7 ? { accepted: true, nextPresses: 0 } : { accepted: false, nextPresses }
}
