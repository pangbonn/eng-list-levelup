import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useStreakStore = defineStore('streak', () => {
  const currentStreak = ref(0)
  const todayWordsStudied = ref(0)
  const todayQuizCount = ref(0)
  const weeklyActivity = ref<{ date: string; words: number }[]>([])

  const authStore = useAuthStore()

  async function fetchStreak() {
    if (!authStore.user) return

    const { data, error } = await supabase.rpc('get_user_streak', {
      p_user_id: authStore.user.id,
    })
    if (!error && data !== null) currentStreak.value = data as number

    const today = new Date().toISOString().split('T')[0]
    const { data: todayData } = await supabase
      .from('user_daily_activity')
      .select('words_studied, quiz_count')
      .eq('user_id', authStore.user.id)
      .eq('activity_date', today)
      .single()

    if (todayData) {
      todayWordsStudied.value = todayData.words_studied
      todayQuizCount.value = todayData.quiz_count
    }

    // Last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const { data: weekData } = await supabase
      .from('user_daily_activity')
      .select('activity_date, words_studied')
      .eq('user_id', authStore.user.id)
      .gte('activity_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('activity_date')

    weeklyActivity.value = (weekData ?? []).map((d) => ({
      date: d.activity_date as string,
      words: d.words_studied as number,
    }))
  }

  async function recordActivity(wordsStudied: number, quizzes = 0) {
    if (!authStore.user) return
    await supabase.rpc('record_daily_activity', {
      p_user_id: authStore.user.id,
      p_words: wordsStudied,
      p_quizzes: quizzes,
    })
    todayWordsStudied.value += wordsStudied
    todayQuizCount.value += quizzes
    await fetchStreak()
  }

  return {
    currentStreak,
    todayWordsStudied,
    todayQuizCount,
    weeklyActivity,
    fetchStreak,
    recordActivity,
  }
})
