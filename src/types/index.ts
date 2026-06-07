export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'phrase'

export type WordCategory =
  | 'academic'
  | 'general'
  | 'business'
  | 'science'
  | 'social'
  | 'idiom'
  | 'formal'

export interface Word {
  id: string
  word: string
  definition: string
  thai_meaning: string
  example_sentence: string
  example_sentence_th?: string
  part_of_speech: PartOfSpeech
  level: CEFRLevel
  category: WordCategory
  phonetic?: string
  synonyms?: string[]
  antonyms?: string[]
  frequency: number
  created_at: string
}

export interface UserWordProgress {
  id: string
  user_id: string
  word_id: string
  word?: Word
  status: 'new' | 'learning' | 'reviewing' | 'mastered'
  times_seen: number
  times_correct: number
  times_wrong: number
  last_seen_at: string | null
  next_review_at: string | null
  ease_factor: number
  interval_days: number
  created_at: string
}

export interface QuizSession {
  id: string
  user_id: string
  session_type: 'flashcard' | 'multiple_choice' | 'fill_blank' | 'placement' | 'reverse' | 'cloze' | 'usage'
  total_questions: number
  correct_answers: number
  duration_seconds: number
  level_assessed?: CEFRLevel
  created_at: string
}

export interface QuizQuestion {
  word: Word
  type: 'multiple_choice' | 'fill_blank' | 'reverse' | 'cloze' | 'usage'
  choices?: string[]
  correct_answer: string
  sentence?: string
  isCorrectUsage?: boolean
}

export interface UserStats {
  total_words_seen: number
  words_mastered: number
  words_learning: number
  current_level: CEFRLevel
  streak_days: number
  total_study_minutes: number
  accuracy_rate: number
  level_progress: Record<CEFRLevel, { total: number; mastered: number }>
}

export interface AIAnalysis {
  current_level: CEFRLevel
  strengths: string[]
  weaknesses: string[]
  recommended_focus: WordCategory[]
  daily_goal: number
  encouragement: string
  next_milestone: string
}
