import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { useVocabularyStore } from './vocabulary'
import type { QuizQuestion, QuizSession, Word, CEFRLevel } from '@/types'

export const useQuizStore = defineStore('quiz', () => {
  const currentSession = ref<QuizSession | null>(null)
  const questions = ref<QuizQuestion[]>([])
  const currentIndex = ref(0)
  const answers = ref<{ wordId: string; isCorrect: boolean; responseMs: number }[]>([])
  const sessionStart = ref<Date | null>(null)
  const currentSessionType = ref<QuizSession['session_type']>('multiple_choice')

  const authStore = useAuthStore()
  const vocabStore = useVocabularyStore()

  // definition choices for multiple_choice / fill_blank
  function buildChoices(correctWord: Word, allWords: Word[]): string[] {
    const pool = allWords.filter((w) => w.id !== correctWord.id && w.level === correctWord.level)
    const distractors = (pool.length >= 3 ? pool : allWords.filter((w) => w.id !== correctWord.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.definition)
    return [...distractors, correctWord.definition].sort(() => Math.random() - 0.5)
  }

  // English word choices for reverse / cloze
  function buildWordChoices(correctWord: Word, allWords: Word[]): string[] {
    const pool = allWords.filter((w) => w.id !== correctWord.id && w.level === correctWord.level)
    const distractors = (pool.length >= 3 ? pool : allWords.filter((w) => w.id !== correctWord.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.word)
    return [...distractors, correctWord.word].sort(() => Math.random() - 0.5)
  }

  // Replace the target word with blanks in its example sentence
  function buildClozeSentence(word: Word): string {
    if (!word.example_sentence) return ''
    const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    let regex = new RegExp(`\\b${escaped}\\b`, 'gi')
    let result = word.example_sentence.replace(regex, '______')
    if (result !== word.example_sentence) return result
    regex = new RegExp(`\\b${escaped}\\w*\\b`, 'gi')
    return word.example_sentence.replace(regex, '______')
  }

  // 50/50 correct vs. wrong sentence context for usage judgment
  function buildUsageData(word: Word, allWords: Word[]): { sentence: string; isCorrectUsage: boolean } {
    if (!word.example_sentence) return { sentence: '', isCorrectUsage: true }
    if (Math.random() < 0.5) return { sentence: word.example_sentence, isCorrectUsage: true }
    const candidates = allWords.filter(
      (w) => w.id !== word.id && w.example_sentence && w.level === word.level,
    )
    if (!candidates.length) return { sentence: word.example_sentence, isCorrectUsage: true }
    const other = candidates[Math.floor(Math.random() * candidates.length)]
    return { sentence: other.example_sentence!, isCorrectUsage: false }
  }

  async function startSession(type: QuizSession['session_type'], count = 10) {
    const studyWords = await vocabStore.getWordsForStudy(count)
    if (studyWords.length === 0) await vocabStore.fetchWords()
    let wordsToUse = studyWords.length > 0 ? studyWords : vocabStore.words.slice(0, count)

    // cloze / usage require example sentences — prefer words that have them
    if (type === 'cloze' || type === 'usage') {
      const withSentences = wordsToUse.filter((w) => w.example_sentence)
      if (withSentences.length >= Math.min(count, 3)) wordsToUse = withSentences
    }

    currentSessionType.value = type

    questions.value = wordsToUse.map((word): QuizQuestion => {
      if (type === 'reverse') {
        return {
          word,
          type: 'reverse',
          choices: buildWordChoices(word, vocabStore.words),
          correct_answer: word.word,
        }
      }
      if (type === 'cloze') {
        return {
          word,
          type: 'cloze',
          choices: buildWordChoices(word, vocabStore.words),
          correct_answer: word.word,
          sentence: buildClozeSentence(word),
        }
      }
      if (type === 'usage') {
        const { sentence, isCorrectUsage } = buildUsageData(word, vocabStore.words)
        return {
          word,
          type: 'usage',
          choices: ['correct', 'incorrect'],
          correct_answer: isCorrectUsage ? 'correct' : 'incorrect',
          sentence,
          isCorrectUsage,
        }
      }
      // multiple_choice, fill_blank, placement
      return {
        word,
        type: type === 'fill_blank' ? 'fill_blank' : 'multiple_choice',
        choices: type !== 'fill_blank' ? buildChoices(word, vocabStore.words) : undefined,
        correct_answer: word.definition,
      }
    })

    currentIndex.value = 0
    answers.value = []
    sessionStart.value = new Date()
    currentSession.value = null
  }

  async function submitAnswer(userAnswer: string, responseMs: number) {
    const question = questions.value[currentIndex.value]
    if (!question) return

    const isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.toLowerCase()
    answers.value.push({ wordId: question.word.id, isCorrect, responseMs })

    await vocabStore.recordAnswer(question.word.id, isCorrect)
  }

  async function finishSession(): Promise<QuizSession> {
    if (!authStore.user || !sessionStart.value) throw new Error('Not authenticated')

    const duration = Math.round((Date.now() - sessionStart.value.getTime()) / 1000)
    const correct = answers.value.filter((a) => a.isCorrect).length

    const accuracyByLevel: Record<string, { correct: number; total: number }> = {}
    for (let i = 0; i < answers.value.length; i++) {
      const level = questions.value[i].word.level
      if (!accuracyByLevel[level]) accuracyByLevel[level] = { correct: 0, total: 0 }
      accuracyByLevel[level].total++
      if (answers.value[i].isCorrect) accuracyByLevel[level].correct++
    }

    let assessedLevel: CEFRLevel = 'B1'
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    for (const level of levels) {
      const stat = accuracyByLevel[level]
      if (stat && stat.correct / stat.total >= 0.7) assessedLevel = level
    }

    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: authStore.user.id,
        session_type: currentSessionType.value,
        total_questions: questions.value.length,
        correct_answers: correct,
        duration_seconds: duration,
        level_assessed: assessedLevel,
      })
      .select()
      .single()

    if (error) throw error
    currentSession.value = data
    return data
  }

  return {
    currentSession,
    questions,
    currentIndex,
    answers,
    startSession,
    submitAnswer,
    finishSession,
  }
})
