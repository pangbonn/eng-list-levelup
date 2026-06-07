<template>
  <AppLayout>
    <div class="space-y-4 animate-fade-in">
      <h1 class="text-xl font-bold text-gray-900">คลังคำศัพท์</h1>

      <!-- Search + Filters -->
      <div class="card space-y-3">
        <input
          v-model="searchQuery"
          type="text"
          class="input-field"
          placeholder="ค้นหาคำศัพท์..."
          @input="debounceSearch"
        />
        <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            v-for="level in ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']"
            :key="level"
            @click="filterLevel = level; loadWords()"
            :class="['px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0', filterLevel === level ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200']"
          >
            {{ level || 'ทั้งหมด' }}
          </button>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <select v-model="filterCategory" @change="loadWords" class="input-field text-sm">
            <option value="">ทุกหมวด</option>
            <option value="academic">Academic</option>
            <option value="general">General</option>
            <option value="business">Business</option>
            <option value="formal">Formal</option>
            <option value="idiom">Idiom</option>
          </select>
          <select v-model="filterStatus" @change="applyStatusFilter" class="input-field text-sm">
            <option value="">ทุกสถานะ</option>
            <option value="new">ยังไม่เรียน</option>
            <option value="learning">กำลังเรียน</option>
            <option value="mastered">เชี่ยวชาญแล้ว</option>
          </select>
        </div>
      </div>

      <!-- Word Count -->
      <p class="text-sm text-gray-500">{{ filteredWords.length }} คำ</p>

      <!-- Word List -->
      <div class="space-y-2">
        <div
          v-for="word in filteredWords"
          :key="word.id"
          @click="selectedWord = word"
          class="card cursor-pointer hover:shadow-md transition-shadow py-4"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold text-gray-900">{{ word.word }}</span>
                <span class="text-xs text-gray-400">{{ word.part_of_speech }}</span>
                <span v-if="word.phonetic" class="text-xs text-gray-400 font-mono">{{ word.phonetic }}</span>
                <button @click.stop="speak(word.word)" class="text-primary-500 hover:text-primary-700 text-sm leading-none" title="ฟังการออกเสียง">🔊</button>
              </div>
              <p class="text-sm text-gray-600 line-clamp-2">{{ word.definition }}</p>
              <p class="text-sm text-blue-500 mt-0.5">{{ word.thai_meaning }}</p>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <span :class="['text-xs px-2 py-0.5 rounded-full font-semibold', levelToColor(word.level)]">
                {{ word.level }}
              </span>
              <span v-if="getStatus(word.id)" :class="['text-xs px-2 py-0.5 rounded-full', statusClass(getStatus(word.id)!)]">
                {{ statusLabel(getStatus(word.id)!) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center text-gray-400 py-8">กำลังโหลด...</div>
      <div v-else-if="filteredWords.length === 0" class="text-center text-gray-400 py-8">ไม่พบคำศัพท์</div>

      <!-- Word Detail Modal -->
      <Teleport to="body">
        <div v-if="selectedWord" class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" @click.self="selectedWord = null">
          <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div class="flex items-start justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-2xl font-bold text-gray-900">{{ selectedWord.word }}</h2>
                  <button @click="speak(selectedWord.word)" class="text-primary-500 hover:text-primary-700 text-xl" title="ฟังการออกเสียง">🔊</button>
                </div>
                <p v-if="selectedWord.phonetic" class="text-gray-400 text-sm font-mono mt-0.5">{{ selectedWord.phonetic }}</p>
                <div class="flex gap-2 mt-1">
                  <span :class="['text-xs px-2 py-0.5 rounded-full font-semibold', levelToColor(selectedWord.level)]">{{ selectedWord.level }}</span>
                  <span class="text-xs text-gray-400">{{ selectedWord.part_of_speech }}</span>
                  <span class="text-xs text-gray-400 capitalize">{{ selectedWord.category }}</span>
                </div>
              </div>
              <button @click="selectedWord = null" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div class="space-y-3">
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">ความหมาย</p>
                <p class="text-gray-900 mt-1">{{ selectedWord.definition }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">ความหมายภาษาไทย</p>
                <p class="text-blue-600 font-semibold mt-1">{{ selectedWord.thai_meaning }}</p>
              </div>
              <div v-if="selectedWord.example_sentence">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">ตัวอย่างประโยค</p>
                <p class="text-gray-700 italic mt-1">{{ selectedWord.example_sentence }}</p>
              </div>
              <div v-if="selectedWord.synonyms?.length">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">คำพ้องความหมาย</p>
                <div class="flex flex-wrap gap-1 mt-1">
                  <span v-for="s in selectedWord.synonyms" :key="s" class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{{ s }}</span>
                </div>
              </div>
            </div>

            <div class="flex gap-2 pt-2">
              <button @click="studyWord(selectedWord)" class="btn-primary flex-1">
                📚 เพิ่มในการเรียน
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { useVocabularyStore } from '@/stores/vocabulary'
import { levelToColor } from '@/lib/ai'
import { speak } from '@/lib/speech'
import type { Word, CEFRLevel, WordCategory } from '@/types'

const vocabStore = useVocabularyStore()

const searchQuery = ref('')
const filterLevel = ref('')
const filterCategory = ref<WordCategory | ''>('')
const filterStatus = ref('')
const selectedWord = ref<Word | null>(null)
const loading = ref(false)
let debounceTimer: ReturnType<typeof setTimeout>

const filteredWords = computed(() => {
  let list = vocabStore.words
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q) ||
        w.thai_meaning.toLowerCase().includes(q)
    )
  }
  if (filterStatus.value) {
    const statusFilter = filterStatus.value
    list = list.filter((w) => {
      const p = vocabStore.userProgress.get(w.id)
      return statusFilter === 'new' ? !p : p?.status === statusFilter
    })
  }
  return list
})

function getStatus(wordId: string) {
  return vocabStore.userProgress.get(wordId)?.status
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-gray-100 text-gray-500',
    learning: 'bg-yellow-100 text-yellow-700',
    reviewing: 'bg-blue-100 text-blue-700',
    mastered: 'bg-green-100 text-green-700',
  }
  return map[status] ?? ''
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: 'ใหม่',
    learning: 'กำลังเรียน',
    reviewing: 'ทบทวน',
    mastered: '✓ เชี่ยวชาญ',
  }
  return map[status] ?? status
}

function debounceSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadWords(), 400)
}

async function loadWords() {
  loading.value = true
  try {
    await vocabStore.fetchWords(
      filterLevel.value as CEFRLevel || undefined,
      filterCategory.value || undefined,
      100
    )
  } finally {
    loading.value = false
  }
}

async function applyStatusFilter() {
  // status filter is client-side
}

async function studyWord(word: Word) {
  await vocabStore.recordAnswer(word.id, false)
  selectedWord.value = null
}

onMounted(async () => {
  await Promise.all([loadWords(), vocabStore.fetchUserProgress()])
})
</script>
