import { dailyLoveQuoteBatch1En } from './dailyLoveQuoteBatch1En'
import { dailyLoveQuoteBatch1Es } from './dailyLoveQuoteBatch1Es'
import { dailyLoveQuoteBatch1Fr } from './dailyLoveQuoteBatch1Fr'
import { dailyLoveQuoteBatch1Ja } from './dailyLoveQuoteBatch1Ja'
import { dailyLoveQuoteBatch1Ko } from './dailyLoveQuoteBatch1Ko'
import { dailyLoveQuoteBatch1ZhTw } from './dailyLoveQuoteBatch1ZhTw'

export {
  DAILY_LOVE_QUOTE_BATCH_1_KEYS,
  DAILY_LOVE_QUOTE_BATCH_1_LOCALES,
} from './dailyLoveQuoteBatch1Factory'

export const dailyLoveQuotesBatch1 = {
  'zh-TW': dailyLoveQuoteBatch1ZhTw,
  en: dailyLoveQuoteBatch1En,
  ja: dailyLoveQuoteBatch1Ja,
  ko: dailyLoveQuoteBatch1Ko,
  es: dailyLoveQuoteBatch1Es,
  fr: dailyLoveQuoteBatch1Fr,
} as const
