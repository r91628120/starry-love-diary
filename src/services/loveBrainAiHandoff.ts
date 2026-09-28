import type { LoveBrainAssessment } from '../data/clearTypes'
import type { Locale } from '../i18n/messages'
import { getLoveBrainV2ResultSummary } from '../features/clear/loveBrainV2Result'
import { loveBrainAiPromptTranslations } from './loveBrainAiPromptTranslations'

export const EXTERNAL_AI_HANDOFF_CONSENT_VERSION = 1
export const EXTERNAL_AI_DESTINATIONS = {
  chatgpt: 'https://chatgpt.com/',
  gemini: 'https://gemini.google.com/',
} as const
export type ExternalAiDestination = keyof typeof EXTERNAL_AI_DESTINATIONS
export type ExternalAiOpenResult = 'opened' | 'unconfirmed' | 'failed'

const zhLabels = ['反芻', '訊息牽動', '過度解讀', '查找確認', '忽略自己']
const enLabels = ['Rumination', 'Message pull', 'Over-interpretation', 'Checking for certainty', 'Neglecting yourself']
const localeLabels = {
  ja: ['考え続けてしまうこと', 'メッセージに気持ちが揺れること', '深読み', '確かめたくなること', '自分を後回しにすること'],
  ko: ['반복해서 곱씹기', '메시지에 마음이 흔들림', '과하게 해석하기', '확인하려 하기', '나 자신을 뒤로 미루기'],
  es: ['Dar vueltas a los pensamientos', 'Impacto de los mensajes', 'Interpretar de más', 'Buscar confirmación', 'Dejarme de lado'],
  fr: ['Ruminer', 'Être affecté·e par les messages', 'Surinterpréter', 'Chercher à se rassurer', 'Me mettre de côté'],
} as const
const zhGuidance = `【想請你怎麼陪我聊】

我想和你聊聊這份結果。

請不要只重複分數，也不要直接替我貼上「戀愛腦」的標籤。

請先根據這五個面向，以及我有提供的「想說的話」，告訴我你看見我最近可能卡在哪裡。

如果資訊還不夠，請不要替對方猜測動機、心意或關係狀態。

請幫助我慢慢分清楚：
1. 我已經知道的事實
2. 我自己的猜測
3. 我的感受
4. 我真正需要的是什麼

接下來一次只問我一個問題，陪我慢慢整理。

如果我一直把注意力放在對方身上，請溫和地把問題帶回：
「那我自己呢？」

不要替我決定分手、繼續、告白或放棄。

當這次對話告一段落時，請幫我整理一小段「今天的我」，讓我可以決定要不要把這份心情寫回《星星戀愛日記》的「足跡」。`
const enGuidance = `【How I would like you to support this conversation】

I want to talk about this result. Please do not only repeat the scores or label me as “love-brained.”

Use these five dimensions and anything I wrote to help me notice where I may feel stuck lately. If information is incomplete, do not guess the other person's motives, feelings, or relationship status.

Help me slowly separate:
1. Facts I already know
2. My guesses
3. My feelings
4. What I truly need

Ask only one question at a time. If I keep focusing on the other person, gently bring me back to: “What about me?”

Do not decide for me whether to break up, continue, confess, or give up. When we finish, help me summarize a short “me today” that I can decide whether to write back into Starry Love Diary’s Footprints.`

/** Builds only this V2 record, its optional note, and fixed guidance; no DOM or other app data is read. */
export function buildLoveBrainAiHandoffText(record: LoveBrainAssessment, locale: Locale): string {
  const result = getLoveBrainV2ResultSummary(record)
  if (!result) throw new Error('Love Brain AI handoff requires a completed V2 result')
  const isChinese = locale === 'zh-TW'
  const labels = isChinese ? zhLabels : locale === 'en' ? enLabels : localeLabels[locale]
  const titles = { ja: '《星空恋愛日記｜気づきの結果》', ko: '《별빛 연애 일기 | 마음 정리 결과》', es: '《Diario de Amor Estrellado | Resultado de claridad》', fr: '《Journal d’amour étoilé | Résultat de clarté》' } as const
  const totals = { ja: '合計スコア', ko: '총점', es: 'Puntuación total', fr: 'Score total' } as const
  const notes = { ja: '【話したいこと】', ko: '【하고 싶은 말】', es: '【Lo que quiero decir】', fr: '【Ce que je veux dire】' } as const
  const title = isChinese ? '《星星戀愛日記｜清醒結果》' : locale === 'en' ? '《Starry Love Diary | Clarity result》' : titles[locale]
  const total = isChinese ? `總分：${result.totalScore} / 75` : locale === 'en' ? `Total score: ${result.totalScore} / 75` : `${totals[locale]}: ${result.totalScore} / 75`
  const scoreLines = result.dimensions.map((item, index) => `${labels[index]}：${item.score} / 15`)
  const note = record.noteToSay ? `\n\n${isChinese ? '【我想說的話】' : locale === 'en' ? '【What I want to say】' : notes[locale]}\n${record.noteToSay}` : ''
  const guidance = isChinese ? zhGuidance : locale === 'en' ? enGuidance : loveBrainAiPromptTranslations[locale]
  return `${title}\n\n${total}\n\n${scoreLines.join('\n')}${note}\n\n${guidance}`
}

export async function copyLoveBrainAiHandoffText(text: string, target: Pick<Navigator, 'clipboard'> = globalThis.navigator): Promise<boolean> {
  try { await target.clipboard?.writeText(text); return Boolean(target.clipboard) } catch { return false }
}

export function openExternalAiDestination(destination: ExternalAiDestination, opener: (url: string, target?: string, features?: string) => Window | null = window.open): ExternalAiOpenResult {
  try {
    return opener(EXTERNAL_AI_DESTINATIONS[destination], '_blank', 'noopener,noreferrer') === null ? 'unconfirmed' : 'opened'
  } catch {
    return 'failed'
  }
}
