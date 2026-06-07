<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
          <span class="text-3xl">📚</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">VocabMaster</h1>
        <p class="text-gray-500 mt-1">เตรียมสอบ TAS NIDA อย่างมีระบบ</p>
      </div>

      <div class="card">
        <!-- Tab Switch -->
        <div class="flex border-b border-gray-200 mb-6">
          <button
            @click="mode = 'login'"
            :class="['flex-1 py-2 text-sm font-semibold transition-colors', mode === 'login' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400']"
          >
            เข้าสู่ระบบ
          </button>
          <button
            @click="mode = 'register'"
            :class="['flex-1 py-2 text-sm font-semibold transition-colors', mode === 'register' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400']"
          >
            สมัครสมาชิก
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input v-model="email" type="email" required class="input-field" placeholder="your@email.com" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input v-model="password" type="password" required class="input-field" placeholder="••••••••" />
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {{ error }}
          </div>

          <button type="submit" :disabled="loading" class="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ loading ? 'กำลังโหลด...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก' }}
          </button>
        </form>

        <p v-if="mode === 'register'" class="text-xs text-gray-500 text-center mt-4">
          เมื่อสมัครสมาชิก คุณตกลงที่จะใช้งานแอปนี้เพื่อการศึกษา
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await authStore.signInWithEmail(email.value, password.value)
    } else {
      await authStore.signUpWithEmail(email.value, password.value)
    }
    router.push('/dashboard')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่'
  } finally {
    loading.value = false
  }
}
</script>
