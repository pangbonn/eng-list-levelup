<template>
  <div class="flex flex-col min-h-screen">
    <!-- Top Nav -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10 pt-safe">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <RouterLink to="/dashboard" class="flex items-center gap-2 font-bold text-primary-600 text-lg">
          <span class="text-2xl">📚</span>
          <span class="hidden xs:inline">VocabMaster</span>
        </RouterLink>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 hidden sm:block truncate max-w-40">{{ authStore.user?.email }}</span>
          <button @click="authStore.signOut()" class="text-sm text-gray-500 hover:text-red-500 transition-colors whitespace-nowrap">
            ออกจากระบบ
          </button>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-24">
      <slot />
    </main>

    <!-- Bottom Nav -->
    <nav class="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10 pb-safe">
      <div class="max-w-5xl mx-auto flex">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors min-w-0"
          :class="$route.path === item.to ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'"
        >
          <span class="text-lg sm:text-xl">{{ item.icon }}</span>
          <span class="text-[10px] sm:text-xs truncate w-full text-center">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const $route = useRoute()

const navItems = [
  { to: '/dashboard', icon: '🏠', label: 'หน้าหลัก' },
  { to: '/flashcards', icon: '🃏', label: 'Flashcards' },
  { to: '/quiz', icon: '📝', label: 'แบบทดสอบ' },
  { to: '/vocabulary', icon: '📖', label: 'คำศัพท์' },
  { to: '/progress', icon: '📊', label: 'ความก้าวหน้า' },
  { to: '/admin', icon: '⚙️', label: 'Admin' },
]
</script>
