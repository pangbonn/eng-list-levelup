export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

export function speak(text: string) {
  if (!canSpeak) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.82
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}
