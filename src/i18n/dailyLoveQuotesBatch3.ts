import { dailyLoveQuoteBatch3En } from './dailyLoveQuoteBatch3En'
import { dailyLoveQuoteBatch3Es } from './dailyLoveQuoteBatch3Es'
import { dailyLoveQuoteBatch3Fr } from './dailyLoveQuoteBatch3Fr'
import { dailyLoveQuoteBatch3Ja } from './dailyLoveQuoteBatch3Ja'
import { dailyLoveQuoteBatch3Ko } from './dailyLoveQuoteBatch3Ko'
import { dailyLoveQuoteBatch3ZhTw } from './dailyLoveQuoteBatch3ZhTw'

export {
  DAILY_LOVE_QUOTE_BATCH_3_KEYS,
  DAILY_LOVE_QUOTE_BATCH_3_LOCALES,
} from './dailyLoveQuoteBatch3Factory'

export const dailyLoveQuotesBatch3 = {
  'zh-TW': dailyLoveQuoteBatch3ZhTw,
  en: dailyLoveQuoteBatch3En,
  ja: dailyLoveQuoteBatch3Ja,
  ko: dailyLoveQuoteBatch3Ko,
  es: dailyLoveQuoteBatch3Es,
  fr: dailyLoveQuoteBatch3Fr,
} as const
