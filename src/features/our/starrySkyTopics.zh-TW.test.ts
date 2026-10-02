import { describe, expect, it } from 'vitest'
import { starrySkyTopicsZhTw, type StarrySkyCategoryId } from './starrySkyTopics.zh-TW'

const categoryIds: StarrySkyCategoryId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const topicId = (number: number) => `Q${String(number).padStart(3, '0')}`

describe('official Starry Sky zh-TW topic source', () => {
  it('contains exactly the stable Q001–Q120 pool without gaps, duplicates, or extra IDs', () => {
    const ids = starrySkyTopicsZhTw.map((topic) => topic.id)
    expect(starrySkyTopicsZhTw).toHaveLength(120)
    expect(new Set(ids)).toHaveLength(120)
    expect(ids).toEqual(Array.from({ length: 120 }, (_, index) => topicId(index + 1)))
  })

  it('uses exactly the twelve approved categories with ten topics in each category range', () => {
    expect(new Set(starrySkyTopicsZhTw.map((topic) => topic.categoryId))).toEqual(new Set(categoryIds))
    categoryIds.forEach((categoryId, index) => {
      const categoryTopics = starrySkyTopicsZhTw.filter((topic) => topic.categoryId === categoryId)
      expect(categoryTopics).toHaveLength(10)
      expect(categoryTopics.map((topic) => topic.id)).toEqual(Array.from({ length: 10 }, (_, offset) => topicId(index * 10 + offset + 1)))
    })
  })

  it('keeps every official topic as non-empty Traditional Chinese source text', () => {
    starrySkyTopicsZhTw.forEach((topic) => {
      expect(topic.id).toMatch(/^Q(?:0[0-9]{2}|1[01][0-9]|120)$/u)
      expect(topic.categoryId).toBeTruthy()
      expect(topic.text.trim()).not.toHaveLength(0)
      expect(topic.text).toMatch(/[\u4E00-\u9FFF]/u)
    })
  })
})
