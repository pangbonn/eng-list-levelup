<template>
  <AppLayout>
    <div class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Admin — คลังคำศัพท์</h1>
          <p class="text-sm text-gray-400">{{ totalWords }} คำในระบบ</p>
        </div>
        <div class="flex gap-2">
          <button @click="activeTab = 'add'" :class="tabClass('add')">+ เพิ่มคำ</button>
          <button @click="activeTab = 'ai'" :class="tabClass('ai')">🤖 AI สร้าง</button>
          <button @click="activeTab = 'list'" :class="tabClass('list')">📋 รายการ</button>
        </div>
      </div>

      <!-- TAB: Manual Add -->
      <div v-if="activeTab === 'add'" class="card space-y-4 animate-fade-in">
        <h2 class="font-bold text-gray-800">เพิ่มคำศัพท์ด้วยตนเอง</h2>

        <div class="grid grid-cols-2 gap-3">
          <div class="col-span-2">
            <label class="label">คำศัพท์ *</label>
            <div class="flex gap-2">
              <input v-model="form.word" class="input-field flex-1" placeholder="e.g. paradigm" />
              <button @click="enrichFromAI" :disabled="!form.word || enriching" class="btn-secondary whitespace-nowrap text-sm">
                {{ enriching ? '⏳' : '🤖 เติมให้' }}
              </button>
            </div>
          </div>

          <div class="col-span-2">
            <label class="label">ความหมาย (English) *</label>
            <textarea v-model="form.definition" class="input-field" rows="2" placeholder="Definition in English..." />
          </div>

          <div class="col-span-2">
            <label class="label">ความหมายภาษาไทย *</label>
            <input v-model="form.thai_meaning" class="input-field" placeholder="ความหมายภาษาไทย" />
          </div>

          <div class="col-span-2">
            <label class="label">ตัวอย่างประโยค</label>
            <textarea v-model="form.example_sentence" class="input-field" rows="2" placeholder="Example sentence..." />
          </div>

          <div>
            <label class="label">ชนิดคำ *</label>
            <select v-model="form.part_of_speech" class="input-field">
              <option value="noun">noun</option>
              <option value="verb">verb</option>
              <option value="adjective">adjective</option>
              <option value="adverb">adverb</option>
              <option value="preposition">preposition</option>
              <option value="conjunction">conjunction</option>
              <option value="phrase">phrase</option>
            </select>
          </div>

          <div>
            <label class="label">ระดับ CEFR *</label>
            <select v-model="form.level" class="input-field">
              <option v-for="l in cefrLevels" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>

          <div>
            <label class="label">หมวดหมู่ *</label>
            <select v-model="form.category" class="input-field">
              <option value="academic">Academic</option>
              <option value="general">General</option>
              <option value="business">Business</option>
              <option value="formal">Formal</option>
              <option value="science">Science</option>
              <option value="social">Social</option>
              <option value="idiom">Idiom</option>
            </select>
          </div>

          <div>
            <label class="label">คำพ้องความหมาย (คั่นด้วยลูกน้ำ)</label>
            <input v-model="synonymsInput" class="input-field" placeholder="e.g. model, pattern" />
          </div>
        </div>

        <div v-if="formError" class="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm">{{ formError }}</div>
        <div v-if="formSuccess" class="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm">{{ formSuccess }}</div>

        <div class="flex gap-2">
          <button @click="resetForm" class="btn-secondary">ล้างฟอร์ม</button>
          <button @click="submitWord" :disabled="saving" class="btn-primary flex-1">
            {{ saving ? 'กำลังบันทึก...' : '💾 บันทึกคำศัพท์' }}
          </button>
        </div>
      </div>

      <!-- TAB: AI Generate -->
      <div v-if="activeTab === 'ai'" class="space-y-4 animate-fade-in">
        <div class="card space-y-4">
          <h2 class="font-bold text-gray-800">🤖 ให้ AI สร้างคำศัพท์ใหม่</h2>
          <p class="text-sm text-gray-500">Claude จะสร้างคำศัพท์ที่เหมาะกับการสอบ NIDA โดยอัตโนมัติ</p>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="label">ระดับ CEFR</label>
              <select v-model="aiConfig.level" class="input-field">
                <option v-for="l in cefrLevels" :key="l" :value="l">{{ l }}</option>
              </select>
            </div>
            <div>
              <label class="label">หมวดหมู่</label>
              <select v-model="aiConfig.category" class="input-field">
                <option value="academic">Academic</option>
                <option value="formal">Formal</option>
                <option value="general">General</option>
                <option value="business">Business</option>
              </select>
            </div>
            <div>
              <label class="label">จำนวนคำ</label>
              <select v-model="aiConfig.count" class="input-field">
                <option :value="5">5 คำ</option>
                <option :value="10">10 คำ</option>
                <option :value="20">20 คำ</option>
              </select>
            </div>
          </div>

          <button
            @click="generateWords"
            :disabled="aiGenerating"
            class="btn-primary w-full py-3"
          >
            {{ aiGenerating ? '⏳ AI กำลังสร้างคำศัพท์...' : '✨ สร้างคำศัพท์ด้วย AI' }}
          </button>

          <div v-if="aiError" class="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm">
            ⚠️ {{ aiError }}
          </div>
        </div>

        <!-- Generated Words Preview -->
        <div v-if="generatedWords.length > 0" class="card space-y-4 animate-fade-in">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-gray-800">คำศัพท์ที่สร้างได้ ({{ generatedWords.length }} คำ)</h3>
            <div class="flex gap-2">
              <button @click="deselectAll" class="text-xs text-gray-400 hover:text-gray-600">ยกเลิกทั้งหมด</button>
              <button @click="selectAll" class="text-xs text-primary-600">เลือกทั้งหมด</button>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="(w, i) in generatedWords"
              :key="i"
              @click="toggleSelect(i)"
              :class="['border-2 rounded-xl p-3 cursor-pointer transition-colors', selectedGenerated.has(i) ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300']"
            >
              <div class="flex items-start gap-3">
                <div :class="['w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 shrink-0', selectedGenerated.has(i) ? 'bg-primary-600 border-primary-600' : 'border-gray-300']">
                  <span v-if="selectedGenerated.has(i)" class="text-white text-xs">✓</span>
                </div>
                <div class="flex-1">
                  <div class="font-bold text-gray-900">{{ w.word }}
                    <span class="text-xs font-normal text-gray-400 ml-1">{{ w.part_of_speech }}</span>
                  </div>
                  <div class="text-sm text-gray-600">{{ w.definition }}</div>
                  <div class="text-sm text-blue-500">{{ w.thai_meaning }}</div>
                  <div class="text-xs text-gray-400 italic mt-1">{{ w.example_sentence }}</div>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="saveGenerated"
            :disabled="selectedGenerated.size === 0 || savingGenerated"
            class="btn-primary w-full"
          >
            {{ savingGenerated ? 'กำลังบันทึก...' : `💾 บันทึก ${selectedGenerated.size} คำที่เลือก` }}
          </button>

          <div v-if="saveSuccess" class="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm">
            ✅ {{ saveSuccess }}
          </div>
        </div>
      </div>

      <!-- TAB: Word List -->
      <div v-if="activeTab === 'list'" class="space-y-3 animate-fade-in">
        <div class="flex gap-2">
          <input v-model="listSearch" class="input-field flex-1" placeholder="ค้นหา..." @input="filterWords" />
          <select v-model="listLevel" @change="filterWords" class="input-field w-28">
            <option value="">ทุกระดับ</option>
            <option v-for="l in cefrLevels" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>

        <div class="space-y-1">
          <div
            v-for="w in displayedWords"
            :key="w.id"
            class="card py-3 flex items-center gap-3"
          >
            <div class="flex-1">
              <span class="font-semibold text-gray-900">{{ w.word }}</span>
              <span class="text-xs text-gray-400 ml-2">{{ w.part_of_speech }}</span>
              <div class="text-xs text-gray-500 truncate">{{ w.thai_meaning }}</div>
            </div>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-bold shrink-0', levelToColor(w.level)]">{{ w.level }}</span>
            <button @click="editWord(w)" class="text-xs text-blue-500 hover:text-blue-700 shrink-0">แก้ไข</button>
            <button @click="deleteWord(w)" class="text-xs text-red-400 hover:text-red-600 shrink-0">ลบ</button>
          </div>
        </div>
        <p v-if="displayedWords.length === 0" class="text-center text-gray-400 py-8">ไม่พบคำศัพท์</p>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { supabase } from '@/lib/supabase'
import { generateVocabulary, enrichWord } from '@/lib/ai-generate'
import { levelToColor } from '@/lib/ai'
import type { Word, CEFRLevel, WordCategory, PartOfSpeech } from '@/types'
import type { GeneratedWord } from '@/lib/ai-generate'

const cefrLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const activeTab = ref<'add' | 'ai' | 'list'>('add')

// Manual form
const form = reactive({
  word: '',
  definition: '',
  thai_meaning: '',
  example_sentence: '',
  part_of_speech: 'noun' as PartOfSpeech,
  level: 'B1' as CEFRLevel,
  category: 'academic' as WordCategory,
})
const synonymsInput = ref('')
const saving = ref(false)
const enriching = ref(false)
const formError = ref('')
const formSuccess = ref('')

// AI Generate
const aiConfig = reactive({ level: 'B2' as CEFRLevel, category: 'academic' as WordCategory, count: 10 })
const aiGenerating = ref(false)
const aiError = ref('')
const generatedWords = ref<GeneratedWord[]>([])
const selectedGenerated = ref<Set<number>>(new Set())
const savingGenerated = ref(false)
const saveSuccess = ref('')

// Word list
const allWords = ref<Word[]>([])
const displayedWords = ref<Word[]>([])
const listSearch = ref('')
const listLevel = ref('')
const totalWords = computed(() => allWords.value.length)

function tabClass(tab: string) {
  return activeTab.value === tab
    ? 'btn-primary text-sm'
    : 'btn-secondary text-sm'
}

async function enrichFromAI() {
  if (!form.word) return
  enriching.value = true
  try {
    const data = await enrichWord(form.word)
    if (data.definition) form.definition = data.definition
    if (data.thai_meaning) form.thai_meaning = data.thai_meaning
    if (data.example_sentence) form.example_sentence = data.example_sentence
    if (data.part_of_speech) form.part_of_speech = data.part_of_speech as PartOfSpeech
    if (data.level) form.level = data.level as CEFRLevel
    if (data.synonyms) synonymsInput.value = data.synonyms.join(', ')
  } catch {
    formError.value = 'AI เติมข้อมูลไม่สำเร็จ กรุณากรอกเอง'
  } finally {
    enriching.value = false
  }
}

async function submitWord() {
  formError.value = ''
  formSuccess.value = ''
  if (!form.word || !form.definition || !form.thai_meaning) {
    formError.value = 'กรุณากรอก คำศัพท์, ความหมาย, และความหมายภาษาไทย'
    return
  }
  saving.value = true
  try {
    const synonyms = synonymsInput.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const { error } = await supabase.from('words').insert({
      ...form,
      synonyms,
      frequency: 50,
    })
    if (error) throw error
    formSuccess.value = `✅ เพิ่มคำ "${form.word}" สำเร็จแล้ว`
    resetForm()
    await loadWords()
  } catch (e: unknown) {
    formError.value = e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

function resetForm() {
  Object.assign(form, {
    word: '', definition: '', thai_meaning: '', example_sentence: '',
    part_of_speech: 'noun', level: 'B1', category: 'academic',
  })
  synonymsInput.value = ''
}

async function generateWords() {
  aiError.value = ''
  aiGenerating.value = true
  generatedWords.value = []
  selectedGenerated.value = new Set()
  try {
    const existing = allWords.value.map((w) => w.word)
    const words = await generateVocabulary(
      aiConfig.level, aiConfig.category, aiConfig.count, existing
    )
    generatedWords.value = words
    selectAll()
  } catch (e: unknown) {
    aiError.value = e instanceof Error ? e.message : 'AI สร้างคำไม่สำเร็จ ตรวจสอบ API key และ endpoint'
  } finally {
    aiGenerating.value = false
  }
}

function toggleSelect(i: number) {
  const s = new Set(selectedGenerated.value)
  if (s.has(i)) s.delete(i)
  else s.add(i)
  selectedGenerated.value = s
}

function selectAll() {
  selectedGenerated.value = new Set(generatedWords.value.map((_, i) => i))
}

function deselectAll() {
  selectedGenerated.value = new Set()
}

async function saveGenerated() {
  savingGenerated.value = true
  saveSuccess.value = ''
  try {
    const toSave = [...selectedGenerated.value].map((i) => ({
      ...generatedWords.value[i],
      level: aiConfig.level,
      category: aiConfig.category,
      frequency: 50,
    }))
    const { error } = await supabase.from('words').insert(toSave)
    if (error) throw error
    saveSuccess.value = `✅ บันทึก ${toSave.length} คำสำเร็จแล้ว`
    generatedWords.value = []
    selectedGenerated.value = new Set()
    await loadWords()
  } catch (e: unknown) {
    aiError.value = e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'
  } finally {
    savingGenerated.value = false
  }
}

function filterWords() {
  let list = allWords.value
  if (listSearch.value) {
    const q = listSearch.value.toLowerCase()
    list = list.filter((w) => w.word.includes(q) || w.thai_meaning.includes(q))
  }
  if (listLevel.value) list = list.filter((w) => w.level === listLevel.value)
  displayedWords.value = list
}

async function loadWords() {
  const { data } = await supabase.from('words').select('*').order('word')
  allWords.value = (data ?? []) as Word[]
  filterWords()
}

async function editWord(word: Word) {
  Object.assign(form, {
    word: word.word,
    definition: word.definition,
    thai_meaning: word.thai_meaning,
    example_sentence: word.example_sentence ?? '',
    part_of_speech: word.part_of_speech,
    level: word.level,
    category: word.category,
  })
  synonymsInput.value = (word.synonyms ?? []).join(', ')
  activeTab.value = 'add'
}

async function deleteWord(word: Word) {
  if (!confirm(`ลบคำ "${word.word}" ออกจากระบบ?`)) return
  await supabase.from('words').delete().eq('id', word.id)
  await loadWords()
}

onMounted(loadWords)
</script>

<style scoped>
.label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}
</style>
