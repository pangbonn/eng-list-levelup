<template>
  <div class="card space-y-4">
    <h3 class="font-bold text-gray-800">🔔 การแจ้งเตือน</h3>

    <div v-if="!supported" class="text-sm text-gray-400">
      บราวเซอร์นี้ไม่รองรับการแจ้งเตือน
    </div>

    <template v-else>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-700">แจ้งเตือนรายวัน</p>
          <p class="text-xs text-gray-400">{{ permission === 'granted' ? 'เปิดใช้งานอยู่' : 'ยังไม่ได้เปิดใช้งาน' }}</p>
        </div>
        <button
          v-if="permission !== 'granted'"
          @click="enable"
          class="btn-primary text-sm"
        >
          เปิดใช้งาน
        </button>
        <span v-else class="text-green-600 text-sm font-semibold">✅ เปิดอยู่</span>
      </div>

      <div v-if="permission === 'granted'" class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700 shrink-0">เวลาแจ้งเตือน</label>
        <input
          v-model="reminderTime"
          type="time"
          class="input-field"
          @change="saveTime"
        />
        <button @click="testNotif" class="btn-secondary text-sm whitespace-nowrap">ทดสอบ</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  isNotificationSupported,
  requestPermission,
  getReminderTime,
  setReminderTime,
  showReminder,
} from '@/lib/notifications'

const supported = ref(isNotificationSupported())
const permission = ref(Notification.permission)
const reminderTime = ref('09:00')

async function enable() {
  const granted = await requestPermission()
  if (granted) {
    permission.value = 'granted'
    setReminderTime(reminderTime.value)
  }
}

function saveTime() {
  setReminderTime(reminderTime.value)
}

function testNotif() {
  showReminder()
}

onMounted(() => {
  permission.value = Notification.permission
  reminderTime.value = getReminderTime()
})
</script>
