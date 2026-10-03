import { shareText, type ShareTextResult, type ShareTextTarget } from './shareText'

export const formatStarrySkyTopicShare = (topicText: string) => `${topicText}\n\n——《星星戀愛日記》\n🌙 來自「我們的星空」`

export function shareStarrySkyTopic(topicText: string, target?: ShareTextTarget): Promise<ShareTextResult> {
  return shareText(formatStarrySkyTopicShare(topicText), '星星戀愛日記', target)
}
