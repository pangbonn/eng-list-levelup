<template>
  <div class="flashcard-scene w-full h-56 sm:h-72 cursor-pointer" @click="flip">
    <div class="flashcard-card" :class="{ 'is-flipped': isFlipped }">
      <!-- Front: English Word -->
      <div class="flashcard-face bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-6">
        <div :class="['text-xs font-semibold px-3 py-1 rounded-full mb-4', levelColor]">
          {{ word.level }} · {{ word.part_of_speech }}
        </div>
        <h2 class="text-4xl font-bold text-gray-900 text-center mb-1">{{ word.word }}</h2>
        <p v-if="word.phonetic" class="text-gray-400 text-sm font-mono mb-1">{{ word.phonetic }}</p>
        <button
          @click.stop="speakWord"
          class="mt-1 mb-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors text-sm flex items-center gap-1"
          title="ฟังการออกเสียง"
        >
          🔊 ออกเสียง
        </button>
        <p class="text-gray-400 text-sm">กดเพื่อดูความหมาย</p>
      </div>

      <!-- Back: Definition & Thai -->
      <div class="flashcard-face flashcard-back bg-primary-600 rounded-2xl shadow-lg flex flex-col p-6 text-white overflow-y-auto">
        <div class="mb-3">
          <div class="text-xs opacity-70 mb-1">ความหมาย</div>
          <p class="text-lg font-semibold leading-snug">{{ word.definition }}</p>
        </div>
        <div class="mb-3">
          <div class="text-xs opacity-70 mb-1">ความหมายภาษาไทย</div>
          <p class="text-lg font-bold">{{ word.thai_meaning }}</p>
        </div>
        <div v-if="word.example_sentence" class="mb-3">
          <div class="text-xs opacity-70 mb-1">ตัวอย่าง</div>
          <p class="text-sm italic opacity-90">{{ word.example_sentence }}</p>
        </div>
        <!-- Memory hint -->
        <div class="mt-auto pt-2 border-t border-white/20">
          <button
            v-if="!hint && !hintLoading"
            @click.stop="loadHint"
            class="text-xs opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
          >
            💡 ขอเทคนิคจำ
          </button>
          <p v-if="hintLoading" class="text-xs opacity-60">กำลังโหลดเทคนิค...</p>
          <div v-if="hint" class="bg-white/20 rounded-lg p-2 text-sm">
            <p class="text-xs opacity-70 mb-1">💡 เทคนิคจำ</p>
            <p>{{ hint }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Action Buttons (shown after flip) -->
  <Transition name="slide-up">
    <div v-if="isFlipped" class="flex gap-3 mt-4">
      <button
        @click.stop="$emit('answer', false)"
        class="flex-1 py-3 rounded-xl font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
      >
        😕 ยังไม่รู้
      </button>
      <button
        @click.stop="$emit('answer', true)"
        class="flex-1 py-3 rounded-xl font-semibold text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
      >
        ✅ รู้แล้ว!
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Word } from '@/types'
import { levelToColor, generateQuizHint } from '@/lib/ai'
import { speak } from '@/lib/speech'

const props = defineProps<{ word: Word }>()
defineEmits<{ answer: [isCorrect: boolean] }>()

const isFlipped = ref(false)
const hint = ref('')
const hintLoading = ref(false)
const levelColor = computed(() => levelToColor(props.word.level))

function flip() {
  isFlipped.value = !isFlipped.value
}

function speakWord() {
  speak(props.word.word)
}

async function loadHint() {
  hintLoading.value = true
  try {
    hint.value = await generateQuizHint(props.word)
  } catch {
    hint.value = 'ไม่สามารถโหลดเทคนิคจำได้ในขณะนี้'
  } finally {
    hintLoading.value = false
  }
}

watch(() => props.word, () => {
  isFlipped.value = false
  hint.value = ''
  hintLoading.value = false
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
