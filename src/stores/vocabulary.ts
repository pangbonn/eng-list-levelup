import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import type { Word, UserWordProgress, CEFRLevel, WordCategory } from '@/types'

export const useVocabularyStore = defineStore('vocabulary', () => {
  const words = ref<Word[]>([])
  const userProgress = ref<Map<string, UserWordProgress>>(new Map())
  const loading = ref(false)

  const authStore = useAuthStore()

  const dueForReview = computed(() => {
    const now = new Date().toISOString()
    return [...userProgress.value.values()].filter(
      (p) => p.status !== 'mastered' && (!p.next_review_at || p.next_review_at <= now)
    )
  })

  const masteredCount = computed(() =>
    [...userProgress.value.values()].filter((p) => p.status === 'mastered').length
  )

  async function fetchWords(level?: CEFRLevel, category?: WordCategory, limit = 50) {
    loading.value = true
    try {
      let query = supabase.from('words').select('*').order('frequency', { ascending: false })
      if (level) query = query.eq('level', level)
      if (category) query = query.eq('category', category)
      query = query.limit(limit)

      const { data, error } = await query
      if (error) throw error
      words.value = data ?? []
    } finally {
      loading.value = false
    }
  }

  async function fetchUserProgress() {
    if (!authStore.user) return
    const { data, error } = await supabase
      .from('user_word_progress')
      .select('*, word:words(*)')
      .eq('user_id', authStore.user.id)
    if (error) throw error
    const map = new Map<string, UserWordProgress>()
    for (const p of data ?? []) {
      map.set(p.word_id, p)
    }
    userProgress.value = map
  }

  async function recordAnswer(wordId: string, isCorrect: boolean) {
    if (!authStore.user) return

    const existing = userProgress.value.get(wordId)
    const now = new Date()

    let easeFactor = existing?.ease_factor ?? 2.5
    let intervalDays = existing?.interval_days ?? 1
    let timesSeen = (existing?.times_seen ?? 0) + 1
    let timesCorrect = (existing?.times_correct ?? 0) + (isCorrect ? 1 : 0)
    let timesWrong = (existing?.times_wrong ?? 0) + (isCorrect ? 0 : 1)

    // SM-2 spaced repetition algorithm
    if (isCorrect) {
      easeFactor = Math.max(1.3, easeFactor + 0.1)
      intervalDays = Math.round(intervalDays * easeFactor)
    } else {
      easeFactor = Math.max(1.3, easeFactor - 0.2)
      intervalDays = 1
    }

    const accuracy = timesCorrect / timesSeen
    const status =
      timesCorrect >= 5 && accuracy >= 0.8
        ? 'mastered'
        : timesSeen > 1
          ? 'reviewing'
          : 'learning'

    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)

    const progressData = {
      user_id: authStore.user.id,
      word_id: wordId,
      status,
      times_seen: timesSeen,
      times_correct: timesCorrect,
      times_wrong: timesWrong,
      last_seen_at: now.toISOString(),
      next_review_at: nextReview.toISOString(),
      ease_factor: easeFactor,
      interval_days: intervalDays,
    }

    const { data, error } = await supabase
      .from('user_word_progress')
      .upsert(progressData, { onConflict: 'user_id,word_id' })
      .select()
      .single()

    if (error) throw error
    if (data) userProgress.value.set(wordId, data)
  }

  async function getWordsForStudy(count = 10): Promise<Word[]> {
    await fetchWords()
    const due = dueForReview.value.map((p) => p.word_id)
    const newWords = words.value
      .filter((w) => !userProgress.value.has(w.id))
      .slice(0, Math.max(0, count - due.length))

    const dueWords = words.value.filter((w) => due.includes(w.id)).slice(0, count)
    return [...dueWords, ...newWords].slice(0, count)
  }

  return {
    words,
    userProgress,
    loading,
    dueForReview,
    masteredCount,
    fetchWords,
    fetchUserProgress,
    recordAnswer,
    getWordsForStudy,
  }
})
