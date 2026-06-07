<template>
  <div class="min-h-screen">
    <NotificationBanner />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NotificationBanner from '@/components/NotificationBanner.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.init()
})
</script>
