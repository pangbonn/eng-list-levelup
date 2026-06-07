<template>
  <AppLayout>
    <div class="max-w-lg mx-auto animate-fade-in">
      <!-- Setup Screen -->
      <div v-if="phase === 'setup'" class="space-y-4">
        <h1 class="text-xl font-bold text-gray-900">แบบทดสอบ</h1>
        <div class="card space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ประเภทคำถาม</label>
            <select v-model="quizType" class="input-field">
              <option value="multiple_choice">เลือกตอบ (Multiple Choice)</option>
              <option value="fill_blank">เติมคำ (Fill in the Blank)</option>
              <option value="placement">ทดสอบวัดระดับ (Placement)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">จำนวนคำถาม</label>
            <select v-model="questionCount" class="input-field">
              <option :value="5">5 ข้อ (เร็ว)</option>
              <option :value="10">10 ข้อ (ปกติ)</option>
              <option :value="20">20 ข้อ (เต็มรูปแบบ)</option>
            </select>
          </div>
          <button @click="startQuiz" :disabled="loading" class="btn-primary w-full py-3">
            {{ loading ? 'กำลังเตรียม...' : '▶ เริ่มแบบทดสอบ' }}
          </button>
        </div>

        <!-- Recent Results -->
        <div v-if="recentSessions.length > 0" class="card">
          <h3 class="font-bold text-gray-800 mb-3">ผลทดสอบล่าสุด</h3>
          <div class="space-y-2">
            <div v-for="s in recentSessions" :key="s.id" class="flex items-center justify-between text-sm">
              <span class="text-gray-500">{{ formatDate(s.created_at) }}</span>
              <span class="font-semibold">{{ s.correct_answers }}/{{ s.total_questions }}</span>
              <span :class="['px-2 py-0.5 rounded-full text-xs font-bold', levelToColor(s.level_assessed ?? 'B1')]">
                {{ s.level_assessed }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quiz Screen -->
      <div v-else-if="phase === 'quiz'" class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-400">ข้อ {{ quizStore.currentIndex + 1 }} / {{ quizStore.questions.length }}</p>
            <div class="h-1.5 w-48 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div
                class="h-full bg-primary-500 rounded-full transition-all"
                :style="{ width: quizProgress + '%' }"
              />
            </div>
          </div>
          <div class="text-right">
            <div class="font-bold text-2xl text-gray-900">{{ timerDisplay }}</div>
            <div class="text-xs text-gray-400">เวลา</div>
          </div>
        </div>

        <!-- Question -->
        <div v-if="currentQuestion" class="card space-y-5">
          <div>
            <p class="text-xs text-gray-400 mb-1">คำถาม</p>
            <h2 class="text-2xl font-bold text-gray-900">{{ currentQuestion.word.word }}</h2>
            <p class="text-sm text-gray-500 mt-1">{{ currentQuestion.word.part_of_speech }} · {{ currentQuestion.word.level }}</p>
          </div>

          <p class="text-gray-700 font-medium">คำนี้มีความหมายว่าอะไร?</p>

          <!-- Multiple Choice -->
          <div v-if="currentQuestion.type === 'multiple_choice'" class="space-y-2">
            <button
              v-for="(choice, i) in currentQuestion.choices"
              :key="i"
              @click="selectAnswer(choice)"
              :disabled="!!selectedAnswer"
              :class="[
                'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium',
                getChoiceClass(choice)
              ]"
            >
              {{ String.fromCharCode(65 + i) }}. {{ choice }}
            </button>
          </div>

          <!-- Fill in Blank -->
          <div v-else class="space-y-3">
            <input
              v-model="fillAnswer"
              type="text"
              class="input-field"
              placeholder="พิมพ์ความหมายภาษาอังกฤษ..."
              @keydown.enter="submitFill"
              :disabled="!!selectedAnswer"
            />
            <button
              v-if="!selectedAnswer"
              @click="submitFill"
              class="btn-primary w-full"
              :disabled="!fillAnswer"
            >
              ตรวจคำตอบ
            </button>
            <div v-else :class="['p-3 rounded-xl text-sm font-medium', isLastCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700']">
              {{ isLastCorrect ? '✅ ถูกต้อง!' : `❌ คำตอบที่ถูกต้อง: "${currentQuestion.correct_answer}"` }}
            </div>
          </div>

          <!-- Next Button -->
          <button
            v-if="selectedAnswer"
            @click="nextQuestion"
            class="btn-primary w-full"
          >
            {{ quizStore.currentIndex + 1 >= quizStore.questions.length ? 'ดูผลลัพธ์' : 'คำถามถัดไป →' }}
          </button>
        </div>
      </div>

      <!-- Result Screen -->
      <div v-else-if="phase === 'result'" class="space-y-4 text-center animate-slide-up">
        <div class="card py-8">
          <div class="text-6xl mb-4">{{ resultEmoji }}</div>
          <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ resultMessage }}</h2>
          <p class="text-gray-500 mb-6">
            ถูก {{ correctInSession }} / {{ quizStore.questions.length }} ข้อ
          </p>

          <!-- Score -->
          <div class="w-32 h-32 mx-auto relative mb-6">
            <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="10"/>
              <circle
                cx="50" cy="50" r="40" fill="none"
                :stroke="scorePercent >= 70 ? '#22c55e' : scorePercent >= 50 ? '#f59e0b' : '#ef4444'"
                stroke-width="10"
                stroke-dasharray="251.2"
                :stroke-dashoffset="251.2 * (1 - scorePercent / 100)"
                stroke-linecap="round"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl font-bold text-gray-900">{{ scorePercent }}%</span>
            </div>
          </div>

          <div v-if="session?.level_assessed" class="mb-6">
            <p class="text-sm text-gray-400">ระดับที่ประเมินได้</p>
            <span :class="['text-lg font-bold px-4 py-1 rounded-full', levelToColor(session.level_assessed)]">
              {{ session.level_assessed }} - {{ levelToThai(session.level_assessed) }}
            </span>
          </div>

          <div class="flex gap-3 justify-center">
            <button @click="resetToSetup" class="btn-secondary">ทำใหม่</button>
            <RouterLink to="/progress" class="btn-primary">ดูความก้าวหน้า</RouterLink>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useQuizStore } from '@/stores/quiz'
import { useStreakStore } from '@/stores/streak'
import { supabase } from '@/lib/supabase'
import { levelToColor, levelToThai } from '@/lib/ai'
import type { QuizSession } from '@/types'

const quizStore = useQuizStore()
const streakStore = useStreakStore()

type Phase = 'setup' | 'quiz' | 'result'
const phase = ref<Phase>('setup')
const quizType = ref<'multiple_choice' | 'fill_blank' | 'placement'>('multiple_choice')
const questionCount = ref(10)
const loading = ref(false)
const selectedAnswer = ref<string | null>(null)
const fillAnswer = ref('')
const isLastCorrect = ref(false)
const session = ref<QuizSession | null>(null)
const recentSessions = ref<QuizSession[]>([])
const timerSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null
const questionStartTime = ref(Date.now())
const correctInSession = computed(() =>
  quizStore.answers.filter((a) => a.isCorrect).length
)
const scorePercent = computed(() =>
  quizStore.questions.length > 0
    ? Math.round((correctInSession.value / quizStore.questions.length) * 100)
    : 0
)
const quizProgress = computed(() =>
  quizStore.questions.length > 0
    ? ((quizStore.currentIndex) / quizStore.questions.length) * 100
    : 0
)
const timerDisplay = computed(() => {
  const m = Math.floor(timerSeconds.value / 60)
  const s = timerSeconds.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})
const currentQuestion = computed(() => quizStore.questions[quizStore.currentIndex] ?? null)
const resultEmoji = computed(() => {
  if (scorePercent.value >= 80) return '🏆'
  if (scorePercent.value >= 60) return '👍'
  return '💪'
})
const resultMessage = computed(() => {
  if (scorePercent.value >= 80) return 'ยอดเยี่ยมมาก!'
  if (scorePercent.value >= 60) return 'ดีมาก ยังพัฒนาได้อีก!'
  return 'อย่าท้อ ฝึกต่อไปนะ!'
})

function getChoiceClass(choice: string): string {
  if (!selectedAnswer.value) return 'border-gray-200 hover:border-primary-400 hover:bg-primary-50'
  if (choice === currentQuestion.value?.correct_answer) return 'border-green-500 bg-green-50 text-green-800'
  if (choice === selectedAnswer.value && choice !== currentQuestion.value?.correct_answer)
    return 'border-red-400 bg-red-50 text-red-700'
  return 'border-gray-200 opacity-50'
}

async function startQuiz() {
  loading.value = true
  try {
    await quizStore.startSession(quizType.value, questionCount.value)
    phase.value = 'quiz'
    timerSeconds.value = 0
    timerInterval = setInterval(() => timerSeconds.value++, 1000)
    questionStartTime.value = Date.now()
  } finally {
    loading.value = false
  }
}

async function selectAnswer(choice: string) {
  if (selectedAnswer.value) return
  selectedAnswer.value = choice
  isLastCorrect.value = choice === currentQuestion.value?.correct_answer
  const ms = Date.now() - questionStartTime.value
  await quizStore.submitAnswer(choice, ms)
}

async function submitFill() {
  if (!fillAnswer.value || selectedAnswer.value) return
  selectedAnswer.value = fillAnswer.value
  isLastCorrect.value = fillAnswer.value.trim().toLowerCase() === currentQuestion.value?.correct_answer.toLowerCase()
  const ms = Date.now() - questionStartTime.value
  await quizStore.submitAnswer(fillAnswer.value, ms)
}

async function nextQuestion() {
  selectedAnswer.value = null
  fillAnswer.value = ''
  questionStartTime.value = Date.now()

  if (quizStore.currentIndex >= quizStore.questions.length) {
    if (timerInterval) clearInterval(timerInterval)
    session.value = await quizStore.finishSession()
    await streakStore.recordActivity(0, 1)
    phase.value = 'result'
  }
}

function resetToSetup() {
  phase.value = 'setup'
  selectedAnswer.value = null
  fillAnswer.value = ''
  session.value = null
  loadRecentSessions()
}

async function loadRecentSessions() {
  const { data } = await supabase
    .from('quiz_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  recentSessions.value = (data ?? []) as QuizSession[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(loadRecentSessions)
onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>
