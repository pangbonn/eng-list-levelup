<template>
  <AppLayout>
    <div class="max-w-lg mx-auto space-y-4 animate-fade-in">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Flashcards</h1>
          <p class="text-sm text-gray-400">{{ currentIndex + 1 }} / {{ words.length }} คำ</p>
        </div>
        <div class="flex gap-2 text-sm">
          <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">✅ {{ correctCount }}</span>
          <span class="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">❌ {{ wrongCount }}</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary-500 rounded-full transition-all duration-500"
          :style="{ width: progressPercent + '%' }"
        />
      </div>

      <!-- Flashcard -->
      <div v-if="currentWord && !isFinished">
        <FlashCard :word="currentWord" @answer="handleAnswer" />
      </div>

      <!-- Loading -->
      <div v-else-if="vocabStore.loading" class="card text-center py-12 text-gray-400">
        กำลังโหลดคำศัพท์...
      </div>

      <!-- Finished -->
      <div v-else-if="isFinished" class="card text-center py-8 animate-slide-up">
        <div class="text-5xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">เสร็จแล้ว!</h2>
        <p class="text-gray-500 mb-6">
          ถูก {{ correctCount }} / {{ words.length }} คำ ({{ Math.round((correctCount/words.length)*100) }}%)
        </p>
        <div class="flex gap-3 justify-center">
          <button @click="restart" class="btn-secondary">ทำซ้ำ</button>
          <button @click="loadMore" class="btn-primary">คำถัดไป 10 คำ</button>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="card text-center py-12">
        <div class="text-5xl mb-4">🌟</div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">ยอดเยี่ยม!</h2>
        <p class="text-gray-500 mb-4">คุณทบทวนครบทุกคำแล้วสำหรับวันนี้</p>
        <button @click="loadMore" class="btn-primary">เรียนคำใหม่</button>
      </div>

      <!-- Settings -->
      <div v-if="!isFinished" class="flex gap-2 flex-wrap">
        <select v-model="selectedLevel" @change="loadWords" class="input-field text-sm flex-1">
          <option value="">ทุกระดับ</option>
          <option value="A1">A1 - เริ่มต้น</option>
          <option value="A2">A2 - พื้นฐาน</option>
          <option value="B1">B1 - กลาง</option>
          <option value="B2">B2 - กลาง-สูง</option>
          <option value="C1">C1 - สูง</option>
          <option value="C2">C2 - เชี่ยวชาญ</option>
        </select>
        <select v-model="selectedCategory" @change="loadWords" class="input-field text-sm flex-1">
          <option value="">ทุกหมวด</option>
          <option value="academic">Academic</option>
          <option value="general">General</option>
          <option value="business">Business</option>
          <option value="formal">Formal</option>
        </select>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import FlashCard from '@/components/FlashCard.vue'
import { useVocabularyStore } from '@/stores/vocabulary'
import { useStreakStore } from '@/stores/streak'
import type { Word, CEFRLevel, WordCategory } from '@/types'

const vocabStore = useVocabularyStore()
const streakStore = useStreakStore()

const words = ref<Word[]>([])
const currentIndex = ref(0)
const correctCount = ref(0)
const wrongCount = ref(0)
const selectedLevel = ref<CEFRLevel | ''>('')
const selectedCategory = ref<WordCategory | ''>('')

const currentWord = computed(() => words.value[currentIndex.value] ?? null)
const isFinished = computed(() => words.value.length > 0 && currentIndex.value >= words.value.length)
const progressPercent = computed(() =>
  words.value.length > 0 ? (currentIndex.value / words.value.length) * 100 : 0
)

async function loadWords() {
  await vocabStore.fetchWords(
    selectedLevel.value || undefined,
    selectedCategory.value || undefined,
    20
  )
  words.value = vocabStore.words.slice(0, 10)
  currentIndex.value = 0
  correctCount.value = 0
  wrongCount.value = 0
}

async function handleAnswer(isCorrect: boolean) {
  if (isCorrect) correctCount.value++
  else wrongCount.value++

  if (currentWord.value) {
    await vocabStore.recordAnswer(currentWord.value.id, isCorrect)
    await streakStore.recordActivity(1, 0)
  }

  setTimeout(() => {
    currentIndex.value++
  }, 400)
}

function restart() {
  currentIndex.value = 0
  correctCount.value = 0
  wrongCount.value = 0
}

async function loadMore() {
  await vocabStore.fetchWords(
    selectedLevel.value || undefined,
    selectedCategory.value || undefined,
    50
  )
  const already = new Set(words.value.map((w) => w.id))
  const next = vocabStore.words.filter((w) => !already.has(w.id)).slice(0, 10)
  words.value = next.length > 0 ? next : vocabStore.words.slice(0, 10)
  currentIndex.value = 0
  correctCount.value = 0
  wrongCount.value = 0
}

onMounted(loadWords)
</script>
