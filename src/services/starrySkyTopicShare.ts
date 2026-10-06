import { shareNativeText, type NativeTextShareOptions } from './nativeTextShare'
import type { ShareTextResult } from './shareText'
import { starrySkyShareMessages } from '../i18n/starrySkyShareMessages'
import type { Locale } from '../i18n/messages'

export const formatStarrySkyTopicShare = (topicText: string, locale: Locale = 'zh-TW') => `${topicText}\n\n${starrySkyShareMessages[locale].attribution}`

export function shareStarrySkyTopic(topicText: string, locale: Locale = 'zh-TW', options?: NativeTextShareOptions): Promise<ShareTextResult> {
  return shareNativeText(formatStarrySkyTopicShare(topicText, locale), starrySkyShareMessages[locale].title, options)
}
