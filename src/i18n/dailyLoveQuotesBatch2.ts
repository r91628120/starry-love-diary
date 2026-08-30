import { dailyLoveQuoteBatch2En } from './dailyLoveQuoteBatch2En'
import { dailyLoveQuoteBatch2Es } from './dailyLoveQuoteBatch2Es'
import { dailyLoveQuoteBatch2Fr } from './dailyLoveQuoteBatch2Fr'
import { dailyLoveQuoteBatch2Ja } from './dailyLoveQuoteBatch2Ja'
import { dailyLoveQuoteBatch2Ko } from './dailyLoveQuoteBatch2Ko'
import { dailyLoveQuoteBatch2ZhTw } from './dailyLoveQuoteBatch2ZhTw'

export {
  DAILY_LOVE_QUOTE_BATCH_2_KEYS,
  DAILY_LOVE_QUOTE_BATCH_2_LOCALES,
} from './dailyLoveQuoteBatch2Factory'

export const dailyLoveQuotesBatch2 = {
  'zh-TW': dailyLoveQuoteBatch2ZhTw,
  en: dailyLoveQuoteBatch2En,
  ja: dailyLoveQuoteBatch2Ja,
  ko: dailyLoveQuoteBatch2Ko,
  es: dailyLoveQuoteBatch2Es,
  fr: dailyLoveQuoteBatch2Fr,
} as const
