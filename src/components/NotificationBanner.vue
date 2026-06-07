<template>
  <Transition name="slide-down">
    <div v-if="show" class="fixed top-0 inset-x-0 z-50 bg-primary-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
      <div class="flex items-center gap-3">
        <span class="text-xl">🔔</span>
        <div>
          <p class="text-sm font-semibold">เปิดการแจ้งเตือนรายวัน</p>
          <p class="text-xs text-blue-200">รับการแจ้งเตือนทบทวนคำศัพท์ตรงเวลาทุกวัน</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button @click="allow" class="bg-white text-primary-600 font-semibold text-xs px-3 py-1.5 rounded-lg">
          เปิดใช้งาน
        </button>
        <button @click="dismiss" class="text-blue-200 hover:text-white text-xs">ไม่ใช่ตอนนี้</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { requestPermission, isNotificationSupported, hasPermission, initReminders } from '@/lib/notifications'

const show = ref(false)
const DISMISSED_KEY = 'notif_banner_dismissed'

async function allow() {
  const granted = await requestPermission()
  if (granted) {
    initReminders()
    show.value = false
  }
}

function dismiss() {
  localStorage.setItem(DISMISSED_KEY, '1')
  show.value = false
}

onMounted(() => {
  if (
    isNotificationSupported() &&
    !hasPermission() &&
    !localStorage.getItem(DISMISSED_KEY)
  ) {
    setTimeout(() => { show.value = true }, 2000)
  } else if (hasPermission()) {
    initReminders()
  }
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
