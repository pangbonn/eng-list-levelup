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

  const authStore = useAuthStore()
  const vocabStore = useVocabularyStore()

  function buildChoices(correctWord: Word, allWords: Word[]): string[] {
    const distractors = allWords
      .filter((w) => w.id !== correctWord.id && w.level === correctWord.level)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.definition)
    return [...distractors, correctWord.definition].sort(() => Math.random() - 0.5)
  }

  async function startSession(type: QuizSession['session_type'], count = 10) {
    const studyWords = await vocabStore.getWordsForStudy(count)
    if (studyWords.length === 0) {
      await vocabStore.fetchWords()
    }
    const wordsToUse = studyWords.length > 0 ? studyWords : vocabStore.words.slice(0, count)

    questions.value = wordsToUse.map((word) => ({
      word,
      type: type === 'fill_blank' ? 'fill_blank' : 'multiple_choice',
      choices:
        type === 'multiple_choice' ? buildChoices(word, vocabStore.words) : undefined,
      correct_answer: word.definition,
    }))

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
    currentIndex.value++
  }

  async function finishSession(): Promise<QuizSession> {
    if (!authStore.user || !sessionStart.value) throw new Error('Not authenticated')

    const duration = Math.round((Date.now() - sessionStart.value.getTime()) / 1000)
    const correct = answers.value.filter((a) => a.isCorrect).length

    const accuracyByLevel: Record<string, { correct: number; total: number }> = {}
    for (let i = 0; i < answers.value.length; i++) {
      const q = questions.value[i]
      const level = q.word.level
      if (!accuracyByLevel[level]) accuracyByLevel[level] = { correct: 0, total: 0 }
      accuracyByLevel[level].total++
      if (answers.value[i].isCorrect) accuracyByLevel[level].correct++
    }

    let assessedLevel: CEFRLevel = 'B1'
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    for (const level of levels) {
      const stat = accuracyByLevel[level]
      if (stat && stat.correct / stat.total >= 0.7) {
        assessedLevel = level
      }
    }

    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: authStore.user.id,
        session_type: currentSession.value?.session_type ?? 'multiple_choice',
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
