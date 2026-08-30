import { dailyLoveQuoteBatch5En } from './dailyLoveQuoteBatch5En'
import { dailyLoveQuoteBatch5Es } from './dailyLoveQuoteBatch5Es'
import { dailyLoveQuoteBatch5Fr } from './dailyLoveQuoteBatch5Fr'
import { dailyLoveQuoteBatch5Ja } from './dailyLoveQuoteBatch5Ja'
import { dailyLoveQuoteBatch5Ko } from './dailyLoveQuoteBatch5Ko'
import { dailyLoveQuoteBatch5ZhTw } from './dailyLoveQuoteBatch5ZhTw'

export {
  DAILY_LOVE_QUOTE_BATCH_5_KEYS,
  DAILY_LOVE_QUOTE_BATCH_5_LOCALES,
} from './dailyLoveQuoteBatch5Factory'

export const dailyLoveQuotesBatch5 = {
  'zh-TW': dailyLoveQuoteBatch5ZhTw,
  en: dailyLoveQuoteBatch5En,
  ja: dailyLoveQuoteBatch5Ja,
  ko: dailyLoveQuoteBatch5Ko,
  es: dailyLoveQuoteBatch5Es,
  fr: dailyLoveQuoteBatch5Fr,
} as const
