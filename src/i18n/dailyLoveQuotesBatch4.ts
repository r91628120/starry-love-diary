import { dailyLoveQuoteBatch4En } from './dailyLoveQuoteBatch4En'
import { dailyLoveQuoteBatch4Es } from './dailyLoveQuoteBatch4Es'
import { dailyLoveQuoteBatch4Fr } from './dailyLoveQuoteBatch4Fr'
import { dailyLoveQuoteBatch4Ja } from './dailyLoveQuoteBatch4Ja'
import { dailyLoveQuoteBatch4Ko } from './dailyLoveQuoteBatch4Ko'
import { dailyLoveQuoteBatch4ZhTw } from './dailyLoveQuoteBatch4ZhTw'

export {
  DAILY_LOVE_QUOTE_BATCH_4_KEYS,
  DAILY_LOVE_QUOTE_BATCH_4_LOCALES,
} from './dailyLoveQuoteBatch4Factory'

export const dailyLoveQuotesBatch4 = {
  'zh-TW': dailyLoveQuoteBatch4ZhTw,
  en: dailyLoveQuoteBatch4En,
  ja: dailyLoveQuoteBatch4Ja,
  ko: dailyLoveQuoteBatch4Ko,
  es: dailyLoveQuoteBatch4Es,
  fr: dailyLoveQuoteBatch4Fr,
} as const
