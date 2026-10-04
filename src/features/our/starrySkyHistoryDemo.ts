export type CompletedOfficialHeartTalk = {
  type: 'official'
  topicId: string
  date: string
  startTime: string
  endTime: string
}

export type CompletedCustomHeartTalk = {
  type: 'custom'
  label: '✨ 自訂題目'
  date: string
  startTime: string
  endTime: string
}

export type CompletedHeartTalk = CompletedOfficialHeartTalk | CompletedCustomHeartTalk

// Presentation-only fixtures: no answers, custom prompt text, or personal content are retained here.
export const starrySkyHistoryDemoRecords: readonly CompletedHeartTalk[] = [
  { type: 'official', topicId: 'Q002', date: '2026-12-22', startTime: '20:00', endTime: '20:30' },
  { type: 'custom', label: '✨ 自訂題目', date: '2026-12-22', startTime: '18:00', endTime: '18:30' },
  { type: 'official', topicId: 'Q015', date: '2026-11-03', startTime: '19:30', endTime: '20:00' },
  { type: 'official', topicId: 'Q071', date: '2026-11-02', startTime: '08:00', endTime: '08:30' },
]
