<template>
  <AppLayout>
    <div class="space-y-6 animate-fade-in">
      <!-- Greeting -->
      <div class="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 class="text-2xl font-bold mb-1">สวัสดี! 👋</h1>
        <p class="text-blue-100 text-sm">{{ greeting }}</p>
        <div class="mt-4 flex gap-4">
          <div class="text-center">
            <div class="text-3xl font-bold">{{ stats.words_mastered }}</div>
            <div class="text-xs text-blue-200">คำที่เชี่ยวชาญ</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold">{{ stats.streak_days }}</div>
            <div class="text-xs text-blue-200">วันติดต่อกัน 🔥</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold">{{ Math.round(stats.accuracy_rate * 100) }}%</div>
            <div class="text-xs text-blue-200">ความแม่นยำ</div>
          </div>
        </div>
      </div>

      <!-- Current Level -->
      <div class="card">
        <h2 class="font-bold text-gray-800 mb-3">ระดับปัจจุบันของคุณ</h2>
        <div class="flex items-center gap-4">
          <div :class="['px-4 py-2 rounded-xl font-bold text-lg', levelColor]">
            {{ stats.current_level }}
          </div>
          <div>
            <div class="font-semibold text-gray-700">{{ levelToThai(stats.current_level) }}</div>
            <div class="text-xs text-gray-400">{{ dueCount }} คำรอการทบทวน</div>
          </div>
          <RouterLink to="/quiz?type=placement" class="ml-auto btn-secondary text-sm">
            ทดสอบระดับ
          </RouterLink>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 gap-4">
        <RouterLink to="/flashcards" class="card hover:shadow-lg transition-shadow cursor-pointer text-center group">
          <div class="text-4xl mb-2 group-hover:scale-110 transition-transform">🃏</div>
          <div class="font-bold text-gray-800">Flashcards</div>
          <div class="text-xs text-gray-400 mt-1">{{ dueCount }} คำรอทบทวน</div>
        </RouterLink>
        <RouterLink to="/quiz" class="card hover:shadow-lg transition-shadow cursor-pointer text-center group">
          <div class="text-4xl mb-2 group-hover:scale-110 transition-transform">📝</div>
          <div class="font-bold text-gray-800">แบบทดสอบ</div>
          <div class="text-xs text-gray-400 mt-1">ทดสอบความรู้</div>
        </RouterLink>
        <RouterLink to="/vocabulary" class="card hover:shadow-lg transition-shadow cursor-pointer text-center group">
          <div class="text-4xl mb-2 group-hover:scale-110 transition-transform">📖</div>
          <div class="font-bold text-gray-800">คลังคำศัพท์</div>
          <div class="text-xs text-gray-400 mt-1">ค้นหาและเรียนรู้</div>
        </RouterLink>
        <RouterLink to="/progress" class="card hover:shadow-lg transition-shadow cursor-pointer text-center group">
          <div class="text-4xl mb-2 group-hover:scale-110 transition-transform">📊</div>
          <div class="font-bold text-gray-800">ความก้าวหน้า</div>
          <div class="text-xs text-gray-400 mt-1">AI วิเคราะห์</div>
        </RouterLink>
      </div>

      <!-- CEFR Progress -->
      <div class="card">
        <h2 class="font-bold text-gray-800 mb-4">ความก้าวหน้าตาม CEFR</h2>
        <div class="space-y-3">
          <div v-for="level in cefrLevels" :key="level" class="flex items-center gap-3">
            <div class="w-8 text-xs font-bold text-gray-500">{{ level }}</div>
            <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="levelBarColor(level)"
                :style="{ width: levelProgress(level) + '%' }"
              />
            </div>
            <div class="text-xs text-gray-400 w-16 text-right">
              {{ stats.level_progress[level]?.mastered ?? 0 }}/{{ stats.level_progress[level]?.total ?? 0 }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useVocabularyStore } from '@/stores/vocabulary'
import { useStreakStore } from '@/stores/streak'
import { levelToThai, levelToColor } from '@/lib/ai'
import type { CEFRLevel, UserStats } from '@/types'

const vocabStore = useVocabularyStore()
const streakStore = useStreakStore()

const cefrLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const stats = ref<UserStats>({
  total_words_seen: 0,
  words_mastered: 0,
  words_learning: 0,
  current_level: 'B1',
  streak_days: 0,
  total_study_minutes: 0,
  accuracy_rate: 0,
  level_progress: {
    A1: { total: 100, mastered: 0 },
    A2: { total: 200, mastered: 0 },
    B1: { total: 300, mastered: 0 },
    B2: { total: 300, mastered: 0 },
    C1: { total: 200, mastered: 0 },
    C2: { total: 100, mastered: 0 },
  },
})

const dueCount = computed(() => vocabStore.dueForReview.length)
const levelColor = computed(() => levelToColor(stats.value.current_level))

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'ช่วงเช้าที่ดี มาฝึกภาษาอังกฤษกันเถอะ!'
  if (hour < 17) return 'ช่วงบ่าย อย่าลืมทบทวนคำศัพท์นะ!'
  return 'ช่วงเย็น มาทบทวนก่อนนอนกันเถอะ!'
})

function levelProgress(level: CEFRLevel): number {
  const p = stats.value.level_progress[level]
  if (!p || p.total === 0) return 0
  return Math.round((p.mastered / p.total) * 100)
}

function levelBarColor(level: CEFRLevel): string {
  const map: Record<CEFRLevel, string> = {
    A1: 'bg-green-400',
    A2: 'bg-teal-400',
    B1: 'bg-blue-400',
    B2: 'bg-indigo-400',
    C1: 'bg-purple-400',
    C2: 'bg-red-400',
  }
  return map[level]
}

onMounted(async () => {
  await Promise.all([vocabStore.fetchUserProgress(), streakStore.fetchStreak()])

  const progress = [...vocabStore.userProgress.values()]
  const mastered = progress.filter((p) => p.status === 'mastered').length
  const learning = progress.filter((p) => p.status === 'learning' || p.status === 'reviewing').length
  const totalSeen = progress.reduce((sum, p) => sum + p.times_seen, 0)
  const totalCorrect = progress.reduce((sum, p) => sum + p.times_correct, 0)

  stats.value.words_mastered = mastered
  stats.value.words_learning = learning
  stats.value.total_words_seen = totalSeen
  stats.value.accuracy_rate = totalSeen > 0 ? totalCorrect / totalSeen : 0
  stats.value.streak_days = streakStore.currentStreak
})
</script>
