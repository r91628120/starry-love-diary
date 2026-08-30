import { dailyLoveQuoteBatch7En } from './dailyLoveQuoteBatch7En'
import { dailyLoveQuoteBatch7Es } from './dailyLoveQuoteBatch7Es'
import { dailyLoveQuoteBatch7Fr } from './dailyLoveQuoteBatch7Fr'
import { dailyLoveQuoteBatch7Ja } from './dailyLoveQuoteBatch7Ja'
import { dailyLoveQuoteBatch7Ko } from './dailyLoveQuoteBatch7Ko'
import { dailyLoveQuoteBatch7ZhTw } from './dailyLoveQuoteBatch7ZhTw'

export {
  DAILY_LOVE_QUOTE_BATCH_7_KEYS,
  DAILY_LOVE_QUOTE_BATCH_7_LOCALES,
} from './dailyLoveQuoteBatch7Factory'

export const dailyLoveQuotesBatch7 = {
  'zh-TW': dailyLoveQuoteBatch7ZhTw,
  en: dailyLoveQuoteBatch7En,
  ja: dailyLoveQuoteBatch7Ja,
  ko: dailyLoveQuoteBatch7Ko,
  es: dailyLoveQuoteBatch7Es,
  fr: dailyLoveQuoteBatch7Fr,
} as const
