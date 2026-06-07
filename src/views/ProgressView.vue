<template>
  <AppLayout>
    <div class="space-y-4 animate-fade-in">
      <h1 class="text-xl font-bold text-gray-900">ความก้าวหน้า & AI วิเคราะห์</h1>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="card text-center">
          <div class="text-3xl font-bold text-primary-600">{{ masteredCount }}</div>
          <div class="text-xs text-gray-400 mt-1">คำที่เชี่ยวชาญ</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-yellow-500">{{ learningCount }}</div>
          <div class="text-xs text-gray-400 mt-1">กำลังเรียน</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-green-500">{{ Math.round(accuracyRate * 100) }}%</div>
          <div class="text-xs text-gray-400 mt-1">ความแม่นยำ</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-blue-500">{{ totalSessions }}</div>
          <div class="text-xs text-gray-400 mt-1">การทดสอบ</div>
        </div>
      </div>

      <!-- Level Assessment -->
      <div class="card">
        <h2 class="font-bold text-gray-800 mb-3">ระดับปัจจุบัน</h2>
        <div class="flex items-center gap-4 mb-4">
          <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold', levelBg(currentLevel)]">
            {{ currentLevel }}
          </div>
          <div>
            <div class="font-bold text-gray-900 text-lg">{{ levelToThai(currentLevel) }}</div>
            <div class="text-sm text-gray-500">สำหรับการสอบ TAS NIDA: ต้องการ B2+</div>
          </div>
        </div>
        <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-1000"
            :style="{ width: levelPercentage + '%' }"
          />
        </div>
        <div class="flex justify-between text-xs text-gray-400 mt-1">
          <span>A1</span><span>A2</span><span>B1</span><span>B2 🎯</span><span>C1</span><span>C2</span>
        </div>
      </div>

      <!-- AI Analysis -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-gray-800">🤖 AI วิเคราะห์</h2>
          <button
            @click="fetchAIAnalysis"
            :disabled="aiLoading"
            class="btn-secondary text-sm"
          >
            {{ aiLoading ? '⏳ กำลังวิเคราะห์...' : '🔄 วิเคราะห์ใหม่' }}
          </button>
        </div>

        <div v-if="aiAnalysis" class="space-y-4 animate-fade-in">
          <!-- Encouragement -->
          <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p class="text-blue-800 text-sm">{{ aiAnalysis.encouragement }}</p>
          </div>

          <!-- Strengths -->
          <div>
            <h3 class="text-sm font-semibold text-green-700 mb-2">✅ จุดแข็ง</h3>
            <ul class="space-y-1">
              <li v-for="s in aiAnalysis.strengths" :key="s" class="text-sm text-gray-700 flex gap-2">
                <span class="text-green-500">•</span> {{ s }}
              </li>
            </ul>
          </div>

          <!-- Weaknesses -->
          <div>
            <h3 class="text-sm font-semibold text-red-600 mb-2">⚠️ จุดที่ต้องพัฒนา</h3>
            <ul class="space-y-1">
              <li v-for="w in aiAnalysis.weaknesses" :key="w" class="text-sm text-gray-700 flex gap-2">
                <span class="text-red-400">•</span> {{ w }}
              </li>
            </ul>
          </div>

          <!-- Next Milestone -->
          <div class="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
            <p class="text-xs font-semibold text-yellow-700 mb-1">🎯 เป้าหมายถัดไป</p>
            <p class="text-sm text-yellow-800">{{ aiAnalysis.next_milestone }}</p>
          </div>

          <!-- Daily Goal -->
          <div class="text-center">
            <p class="text-sm text-gray-500">เป้าหมายรายวัน</p>
            <p class="text-2xl font-bold text-primary-600">{{ aiAnalysis.daily_goal }} คำ/วัน</p>
          </div>
        </div>

        <div v-else-if="!aiLoading" class="text-center py-6 text-gray-400">
          <p class="mb-3">กดปุ่มด้านบนเพื่อให้ AI วิเคราะห์ความก้าวหน้าของคุณ</p>
          <p class="text-xs">ต้องใช้ข้อมูลจากการเรียนของคุณ</p>
        </div>
      </div>

      <!-- Weekly Activity -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-gray-800">กิจกรรม 7 วันที่ผ่านมา</h2>
          <span class="text-sm font-bold text-orange-500">🔥 {{ streakStore.currentStreak }} วันติดต่อกัน</span>
        </div>
        <div class="flex items-end gap-1 h-16">
          <div
            v-for="day in weekDays"
            :key="day.label"
            class="flex-1 flex flex-col items-center gap-1"
          >
            <div
              class="w-full rounded-t transition-all duration-500"
              :class="day.words > 0 ? 'bg-primary-500' : 'bg-gray-200'"
              :style="{ height: Math.max(4, (day.words / maxDayWords) * 48) + 'px' }"
            />
            <span class="text-xs text-gray-400">{{ day.label }}</span>
          </div>
        </div>
        <p class="text-xs text-gray-400 mt-2 text-center">วันนี้เรียนแล้ว {{ streakStore.todayWordsStudied }} คำ</p>
      </div>

      <!-- Notification Settings -->
      <NotificationSettings />

      <!-- Quiz History Chart -->
      <div class="card">
        <h2 class="font-bold text-gray-800 mb-3">ประวัติการทดสอบ</h2>
        <div v-if="quizHistory.length > 0" class="space-y-2">
          <div v-for="s in quizHistory" :key="s.id" class="flex items-center gap-3">
            <div class="text-xs text-gray-400 w-20 shrink-0">{{ formatDate(s.created_at) }}</div>
            <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full flex items-center justify-end pr-2"
                :class="getScoreBarColor(s)"
                :style="{ width: Math.max(10, (s.correct_answers / s.total_questions) * 100) + '%' }"
              >
                <span class="text-xs font-bold text-white">{{ s.correct_answers }}/{{ s.total_questions }}</span>
              </div>
            </div>
            <span :class="['text-xs font-bold px-2 py-0.5 rounded-full shrink-0', levelToColor(s.level_assessed ?? 'B1')]">
              {{ s.level_assessed }}
            </span>
          </div>
        </div>
        <p v-else class="text-gray-400 text-sm text-center py-4">ยังไม่มีประวัติการทดสอบ</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import NotificationSettings from '@/components/NotificationSettings.vue'
import { useVocabularyStore } from '@/stores/vocabulary'
import { useStreakStore } from '@/stores/streak'
import { analyzeProgress, levelToThai, levelToColor } from '@/lib/ai'
import { supabase } from '@/lib/supabase'
import type { CEFRLevel, UserStats, AIAnalysis, QuizSession } from '@/types'

const vocabStore = useVocabularyStore()
const streakStore = useStreakStore()

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

const weekDays = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const activity = streakStore.weeklyActivity.find((a) => a.date === dateStr)
    days.push({ label: DAY_LABELS[d.getDay()], words: activity?.words ?? 0 })
  }
  return days
})

const maxDayWords = computed(() => Math.max(1, ...weekDays.value.map((d) => d.words)))

const aiAnalysis = ref<AIAnalysis | null>(null)
const aiLoading = ref(false)
const quizHistory = ref<QuizSession[]>([])

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const progress = computed(() => [...vocabStore.userProgress.values()])
const masteredCount = computed(() => progress.value.filter((p) => p.status === 'mastered').length)
const learningCount = computed(() => progress.value.filter((p) => p.status === 'learning' || p.status === 'reviewing').length)
const totalSeen = computed(() => progress.value.reduce((sum, p) => sum + p.times_seen, 0))
const totalCorrect = computed(() => progress.value.reduce((sum, p) => sum + p.times_correct, 0))
const accuracyRate = computed(() => totalSeen.value > 0 ? totalCorrect.value / totalSeen.value : 0)
const totalSessions = computed(() => quizHistory.value.length)

const currentLevel = computed((): CEFRLevel => {
  if (quizHistory.value.length > 0) {
    const latest = quizHistory.value[0]
    return (latest.level_assessed as CEFRLevel) ?? 'B1'
  }
  return masteredCount.value > 200 ? 'B2' : masteredCount.value > 100 ? 'B1' : 'A2'
})

const levelPercentage = computed(() => {
  const idx = CEFR_LEVELS.indexOf(currentLevel.value)
  return Math.round(((idx + 1) / CEFR_LEVELS.length) * 100)
})

function levelBg(level: CEFRLevel): string {
  const map: Record<CEFRLevel, string> = {
    A1: 'bg-green-100 text-green-700',
    A2: 'bg-teal-100 text-teal-700',
    B1: 'bg-blue-100 text-blue-700',
    B2: 'bg-indigo-100 text-indigo-700',
    C1: 'bg-purple-100 text-purple-700',
    C2: 'bg-red-100 text-red-700',
  }
  return map[level]
}

function getScoreBarColor(s: QuizSession): string {
  const pct = s.correct_answers / s.total_questions
  if (pct >= 0.8) return 'bg-green-500'
  if (pct >= 0.6) return 'bg-yellow-400'
  return 'bg-red-400'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })
}

async function fetchAIAnalysis() {
  aiLoading.value = true
  try {
    const stats: UserStats = {
      total_words_seen: totalSeen.value,
      words_mastered: masteredCount.value,
      words_learning: learningCount.value,
      current_level: currentLevel.value,
      streak_days: 0,
      total_study_minutes: 0,
      accuracy_rate: accuracyRate.value,
      level_progress: {
        A1: { total: 100, mastered: 0 },
        A2: { total: 200, mastered: 0 },
        B1: { total: 300, mastered: 0 },
        B2: { total: 300, mastered: 0 },
        C1: { total: 200, mastered: 0 },
        C2: { total: 100, mastered: 0 },
      },
    }
    aiAnalysis.value = await analyzeProgress(stats)
  } catch (e) {
    console.error('AI analysis error:', e)
  } finally {
    aiLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    vocabStore.fetchUserProgress(),
    streakStore.fetchStreak(),
    (async () => {
      const { data } = await supabase
        .from('quiz_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      quizHistory.value = (data ?? []) as QuizSession[]
    })(),
  ])
})
</script>
