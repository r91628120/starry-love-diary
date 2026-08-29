export type ClearToolSourceType = 'clear_record' | 'love_boat_code' | 'love_brain_assessment' | 'like_or_habit'
export type AssessmentStatus = 'draft' | 'completed'

export type ClearTriggerType = 'no_reply' | 'attitude_changed' | 'social_media' | 'argument' | 'missing_them' | 'waiting_response' | 'overthinking' | 'other'
export type ClearEmotion = 'missing' | 'anxious' | 'sad' | 'hurt' | 'angry' | 'jealous' | 'afraid' | 'lost' | 'confused' | 'hopeful'
export type BodySensation = 'chest_tight' | 'heart_racing' | 'stomach_uncomfortable' | 'restless' | 'tired' | 'sleepless' | 'want_to_cry' | 'none' | 'other'
export type ClearObservationKey = 'initiates_contact' | 'makes_time' | 'keeps_promises' | 'listens' | 'mutual_effort' | 'words_match_actions'
export type ClearObservationAnswer = 'yes' | 'no' | 'unknown'
export type ClearNeed = 'reassurance' | 'understanding' | 'respect' | 'company' | 'space' | 'clarity' | 'boundaries' | 'rest' | 'return_to_life' | 'unknown'
export type ClearActionType = 'put_phone_down' | 'stop_checking_social' | 'shower_or_rest' | 'take_a_walk' | 'continue_own_plan' | 'talk_to_trusted_person' | 'reply_when_calm' | 'decide_tomorrow' | 'write_diary' | 'custom'

export interface ClearRecord {
  id: string
  triggerType?: ClearTriggerType
  triggerText?: string
  facts?: string
  interpretation?: string
  unknown?: string
  emotions: ClearEmotion[]
  emotionIntensity: 1 | 2 | 3 | 4 | 5
  bodySensations?: BodySensation[]
  observations?: Partial<Record<ClearObservationKey, ClearObservationAnswer>>
  needs?: ClearNeed[]
  nextActionType?: ClearActionType
  nextActionText?: string
  clearMindStarId?: string
  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
  completedAt: string
}

export type BoatInvestmentQuestionKey = 'a01' | 'a02' | 'a03' | 'a04' | 'a05' | 'a06' | 'a07' | 'a08' | 'a09' | 'a10' | 'a11' | 'a12'
export type BoatResponseQuestionKey = 'b01' | 'b02' | 'b03' | 'b04' | 'b05' | 'b06' | 'b07' | 'b08' | 'b09' | 'b10'
export type BoatInvestmentAnswer = 0 | 1 | 2 | 3
export type BoatResponseAnswer = 0 | 1 | 2 | 'unknown'
export type InvestmentLevel = 'investment_low' | 'investment_mild' | 'investment_high' | 'investment_very_high'
export type ResponseLevel = 'response_insufficient_observation' | 'response_low' | 'response_mixed' | 'response_good' | 'response_high'
export type BoatCrossResultKey =
  | 'low_low' | 'low_mixed' | 'low_good' | 'low_high'
  | 'mild_low' | 'mild_mixed' | 'mild_good' | 'mild_high'
  | 'high_low' | 'high_mixed' | 'high_good' | 'high_high'
  | 'very_high_low' | 'very_high_mixed' | 'very_high_good' | 'very_high_high'

export interface LoveBoatAssessment {
  id: string
  status: AssessmentStatus
  currentSection: 'A' | 'B' | 'result'
  currentQuestionIndex: number
  aAnswers: Partial<Record<BoatInvestmentQuestionKey, BoatInvestmentAnswer>>
  bAnswers: Partial<Record<BoatResponseQuestionKey, BoatResponseAnswer>>
  aScore?: number
  aLevel?: InvestmentLevel
  bAnsweredItems?: number
  bEarnedScore?: number
  bMaxPossibleScore?: number
  bResponseRatio?: number
  bLevel?: ResponseLevel
  crossResultKey?: BoatCrossResultKey
  resultVariantIndex?: number
  clearMindStarId?: string
  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type LoveBrainPattern = 'rumination' | 'message_dependency' | 'over_interpretation' | 'detective' | 'self_sacrifice'
export type LoveBrainQuestionKey =
  | 'rumination_01' | 'rumination_02' | 'rumination_03' | 'rumination_04' | 'rumination_05'
  | 'message_dependency_01' | 'message_dependency_02' | 'message_dependency_03' | 'message_dependency_04' | 'message_dependency_05'
  | 'over_interpretation_01' | 'over_interpretation_02' | 'over_interpretation_03' | 'over_interpretation_04' | 'over_interpretation_05'
  | 'detective_01' | 'detective_02' | 'detective_03' | 'detective_04' | 'detective_05'
  | 'self_sacrifice_01' | 'self_sacrifice_02' | 'self_sacrifice_03' | 'self_sacrifice_04' | 'self_sacrifice_05'
export type LoveBrainAnswer = 0 | 1 | 2 | 3

export interface LoveBrainScores {
  rumination: number
  messageDependency: number
  overInterpretation: number
  detective: number
  selfSacrifice: number
  total: number
}

export interface LoveBrainAssessment {
  id: string
  status: AssessmentStatus
  answers: Partial<Record<LoveBrainQuestionKey, LoveBrainAnswer>>
  currentQuestionIndex: number
  scores?: LoveBrainScores
  primaryPattern?: LoveBrainPattern
  primaryPatterns?: LoveBrainPattern[]
  secondaryPattern?: LoveBrainPattern
  isLowOverall?: boolean
  resultVariantIndex?: number
  resultVariantKey?: LoveBrainResultVariantKey
  clearMindStarId?: string
  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}
export type LoveBrainResultVariantKey = 'low_overall.v1' | 'tie.v1' | `${LoveBrainPattern}.v1`

export type LikeOrHabitDimension = 'real_person' | 'habit' | 'fear_of_loss' | 'imagined_relationship'
export type LikeOrHabitSection = LikeOrHabitDimension | 'result'
export type LikeOrHabitQuestionKey =
  | 'real_person_three_real_traits'
  | 'real_person_without_romantic_expectation'
  | 'real_person_present_vs_future_version'
  | 'habit_expect_regular_contact'
  | 'habit_absence_feels_like_missing_routine'
  | 'habit_missing_the_routine'
  | 'fear_of_loss_hardest_part'
  | 'fear_of_loss_person_vs_feeling'
  | 'fear_of_loss_avoiding_discomfort'
  | 'imagined_relationship_future_more_than_reality'
  | 'imagined_relationship_future_fills_present_gap'
  | 'imagined_relationship_reality_description'
export type FearOfLossOption = 'lose_this_person' | 'lose_daily_companionship' | 'lose_feeling_cared_for' | 'be_alone' | 'investment_feels_wasted' | 'no_result' | 'uncertainty' | 'other'
export type LikeOrHabitCombinationKey =
  | 'like_only' | 'habit_only' | 'fear_only' | 'imagined_only'
  | 'like_habit' | 'like_fear' | 'like_imagined' | 'habit_fear' | 'habit_imagined' | 'fear_imagined'
  | 'like_habit_fear' | 'like_habit_imagined' | 'like_fear_imagined' | 'habit_fear_imagined'
  | 'unclear'
export type LikeOrHabitResultVariantKey = `${LikeOrHabitCombinationKey}.v1`
export interface LikeOrHabitAnswers {
  realPerson?: {
    real_person_three_real_traits?: 'yes' | 'some' | 'not_really' | 'not_sure'
    real_person_without_romantic_expectation?: 'yes' | 'probably_yes' | 'probably_no' | 'not_sure'
    real_person_present_vs_future_version?: 'mostly_present' | 'both' | 'mostly_future' | 'not_sure'
  }
  habit?: {
    habit_expect_regular_contact?: 'often' | 'sometimes' | 'rarely' | 'not_sure'
    habit_absence_feels_like_missing_routine?: 'yes' | 'somewhat' | 'no' | 'not_sure'
    habit_missing_the_routine?: 'yes' | 'maybe' | 'no' | 'not_sure'
  }
  fearOfLoss?: {
    fear_of_loss_hardest_part?: FearOfLossOption[]
    otherText?: string
    fear_of_loss_person_vs_feeling?: 'mostly_person' | 'both' | 'mostly_feeling' | 'not_sure'
    fear_of_loss_avoiding_discomfort?: 'yes' | 'sometimes' | 'no' | 'not_sure'
  }
  imaginedRelationship?: {
    imagined_relationship_future_more_than_reality?: 'often' | 'sometimes' | 'rarely' | 'not_sure'
    imagined_relationship_future_fills_present_gap?: 'often' | 'sometimes' | 'rarely' | 'not_sure'
    imagined_relationship_reality_description?: string
  }
}

export interface LikeOrHabitReflection {
  id: string
  status: AssessmentStatus
  currentSection: LikeOrHabitSection
  answers: LikeOrHabitAnswers
  realPersonNote?: string
  habitNote?: string
  activeResultModules?: LikeOrHabitDimension[]
  resultCombinationKey?: LikeOrHabitCombinationKey
  resultVariantKey?: LikeOrHabitResultVariantKey
  clearMindStarId?: string
  localDate: string
  timezone: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface ClearHistoryItem {
  id: string
  sourceType: ClearToolSourceType
  localDate: string
  titleKey: string
  subtitleKey?: string
  createdAt: string
}
