import type { Locale } from './messages'

const keys = ['historyTitle', 'historyHeroCopy', 'historyEntry', 'historyHeading', 'historyEmptyTitle', 'historyEmptyBody', 'historyCustomLabel', 'historyDate', 'historyTime'] as const
type HistoryKey = typeof keys[number]

const values: Record<Locale, readonly string[]> = {
  'zh-TW': ['💕 心話歷史', '我們沒有留下答案，\n只留下曾經為彼此留過的時間。✨', '查看心話歷史', '曾一起點亮的心話', '還沒有點亮的心話', '等你們完成第一次心話後，這裡才會留下時間的足跡。', '✨ 自訂題目', '日期', '時間'],
  en: ['💕 Heart Talk History', 'We did not keep the answers,\nonly the time you set aside for each other. ✨', 'View Heart Talk history', 'Heart Talks you lit together', 'No Heart Talks lit yet', 'After your first completed Heart Talk, its time will leave a trace here.', '✨ Custom prompt', 'Date', 'Time'],
  ja: ['💕 心話の履歴', '答えは残さず、\nお互いのために作った時間だけを残します。✨', '心話の履歴を見る', 'ふたりで灯した心話', 'まだ灯した心話はありません', '初めての心話を終えたら、その時間の足跡がここに残ります。', '✨ 自分で作ったテーマ', '日付', '時間'],
  ko: ['💕 마음 대화 기록', '답은 남기지 않고,\n서로를 위해 남긴 시간만 기억해요. ✨', '마음 대화 기록 보기', '함께 밝힌 마음 대화', '아직 밝힌 마음 대화가 없어요', '첫 마음 대화를 마치면 그 시간의 흔적이 여기에 남아요.', '✨ 직접 만든 주제', '날짜', '시간'],
  es: ['💕 Historial de conversaciones', 'No guardamos las respuestas,\nsolo el tiempo que reservaron el uno para el otro. ✨', 'Ver historial de conversaciones', 'Conversaciones que encendieron juntos', 'Aún no hay conversaciones encendidas', 'Cuando completen su primera conversación, su tiempo dejará una huella aquí.', '✨ Pregunta personalizada', 'Fecha', 'Hora'],
  fr: ['💕 Historique des conversations', 'Nous ne gardons pas les réponses,\nseulement le temps que vous avez gardé l’un pour l’autre. ✨', 'Voir l’historique des conversations', 'Conversations illuminées ensemble', 'Aucune conversation illuminée pour le moment', 'Après votre première conversation terminée, son temps laissera une trace ici.', '✨ Sujet personnalisé', 'Date', 'Heure'],
}

export const starrySkyPhase2eMessages: Record<Locale, Record<`our.starrySky.${HistoryKey}`, string>> = Object.fromEntries((Object.keys(values) as Locale[]).map((locale) => [locale, Object.fromEntries(keys.map((key, index) => [`our.starrySky.${key}`, values[locale][index]]))])) as Record<Locale, Record<`our.starrySky.${HistoryKey}`, string>>
