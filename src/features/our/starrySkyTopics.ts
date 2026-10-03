import { starrySkyTopicsZhTw, type StarrySkyCategoryId } from './starrySkyTopics.zh-TW'

export const starrySkyCategoryIds: StarrySkyCategoryId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
export const featuredStarrySkyTopic = starrySkyTopicsZhTw[0]

export function starrySkyTopicById(topicId: string | null | undefined) {
  return starrySkyTopicsZhTw.find((topic) => topic.id === topicId)
}

export function starrySkyTopicsForCategory(categoryId: StarrySkyCategoryId) {
  return starrySkyTopicsZhTw.filter((topic) => topic.categoryId === categoryId)
}
