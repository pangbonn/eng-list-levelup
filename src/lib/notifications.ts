const STORAGE_KEY = 'vocab_reminder_time'

export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

export async function requestPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function hasPermission(): boolean {
  return isNotificationSupported() && Notification.permission === 'granted'
}

export function getReminderTime(): string {
  return localStorage.getItem(STORAGE_KEY) ?? '09:00'
}

export function setReminderTime(time: string): void {
  localStorage.setItem(STORAGE_KEY, time)
  scheduleNextReminder(time)
}

export function scheduleNextReminder(time: string): void {
  if (!hasPermission()) return

  const [hours, minutes] = time.split(':').map(Number)
  const now = new Date()
  const next = new Date()
  next.setHours(hours, minutes ?? 0, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)

  const delay = next.getTime() - now.getTime()
  const existingId = localStorage.getItem('vocab_reminder_timer_id')
  if (existingId) clearTimeout(Number(existingId))

  const id = setTimeout(() => {
    showReminder()
    scheduleNextReminder(time)
  }, delay)

  localStorage.setItem('vocab_reminder_timer_id', String(id))
}

export function showReminder(): void {
  if (!hasPermission()) return
  new Notification('VocabMaster NIDA 📚', {
    body: 'ถึงเวลาทบทวนคำศัพท์แล้ว! มาเรียนกันเถอะ 🎯',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'vocab-reminder',
  })
}

export function checkAndShowDueReminder(dueCount: number): void {
  if (!hasPermission() || dueCount === 0) return
  new Notification('VocabMaster NIDA 📚', {
    body: `มี ${dueCount} คำรอทบทวนวันนี้ มาเรียนกันเถอะ!`,
    icon: '/favicon.ico',
    tag: 'vocab-due',
  })
}

export function initReminders(): void {
  const saved = getReminderTime()
  if (hasPermission() && saved) scheduleNextReminder(saved)
}
