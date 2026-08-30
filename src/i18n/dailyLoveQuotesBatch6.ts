import { dailyLoveQuoteBatch6En } from './dailyLoveQuoteBatch6En'
import { dailyLoveQuoteBatch6Es } from './dailyLoveQuoteBatch6Es'
import { dailyLoveQuoteBatch6Fr } from './dailyLoveQuoteBatch6Fr'
import { dailyLoveQuoteBatch6Ja } from './dailyLoveQuoteBatch6Ja'
import { dailyLoveQuoteBatch6Ko } from './dailyLoveQuoteBatch6Ko'
import { dailyLoveQuoteBatch6ZhTw } from './dailyLoveQuoteBatch6ZhTw'

export {
  DAILY_LOVE_QUOTE_BATCH_6_KEYS,
  DAILY_LOVE_QUOTE_BATCH_6_LOCALES,
} from './dailyLoveQuoteBatch6Factory'

export const dailyLoveQuotesBatch6 = {
  'zh-TW': dailyLoveQuoteBatch6ZhTw,
  en: dailyLoveQuoteBatch6En,
  ja: dailyLoveQuoteBatch6Ja,
  ko: dailyLoveQuoteBatch6Ko,
  es: dailyLoveQuoteBatch6Es,
  fr: dailyLoveQuoteBatch6Fr,
} as const
