# VocabMaster NIDA — สถานะโปรเจค

อัปเดตล่าสุด: 2026-06-07

---

## ✅ สิ่งที่ทำเสร็จแล้ว

### Infrastructure
- [x] Vue 3 + Vite + TypeScript + Pinia + Vue Router
- [x] Tailwind CSS (custom design tokens, flashcard flip animation)
- [x] Supabase client (`src/lib/supabase.ts`)
- [x] Build ผ่าน production (`npm run build`) ไม่มี error

### Authentication
- [x] สมัครสมาชิก / เข้าสู่ระบบ ด้วย Email + Password
- [x] Route guard (ถ้าไม่ login จะถูก redirect ไป `/login`)
- [x] Auto-detect session จาก Supabase

### Flashcards (`/flashcards`)
- [x] พลิกการ์ด (flip animation) แสดงคำ → ความหมาย
- [x] ปุ่ม "รู้แล้ว" / "ยังไม่รู้"
- [x] **Spaced Repetition SM-2** — คำที่ตอบผิดวนมาเร็ว, ตอบถูกนานขึ้น
- [x] กรองตาม Level (A1–C2) และหมวดหมู่
- [x] บันทึก streak activity เมื่อเรียนแต่ละคำ

### Quiz / แบบทดสอบ (`/quiz`)
- [x] Multiple Choice (4 ตัวเลือก, สร้าง distractors อัตโนมัติ)
- [x] Fill in the Blank (พิมพ์ความหมายเอง)
- [x] Placement Test (วัดระดับ CEFR)
- [x] จับเวลาแต่ละ session
- [x] แสดงผลคะแนน + วงกลม progress
- [x] **ประเมินระดับ CEFR** จากผลตอบ บันทึกลง Supabase
- [x] ประวัติผลทดสอบล่าสุด

### คลังคำศัพท์ (`/vocabulary`)
- [x] ค้นหาคำ (keyword ไทย/อังกฤษ)
- [x] กรองตาม Level, หมวด, สถานะ (ใหม่/กำลังเรียน/เชี่ยวชาญ)
- [x] Modal รายละเอียดคำ: ความหมาย, ภาษาไทย, ตัวอย่าง, คำพ้อง
- [x] **150+ คำเฉพาะ NIDA TAS** ครอบคลุม B1–C2

### Progress & AI วิเคราะห์ (`/progress`)
- [x] Stats: คำที่ mastered, กำลังเรียน, ความแม่นยำ, จำนวน quiz
- [x] **ระดับ CEFR ปัจจุบัน** + progress bar A1→C2
- [x] **Weekly Activity Chart** — กราฟบาร์ 7 วันย้อนหลัง
- [x] **AI วิเคราะห์** (Claude) — จุดแข็ง, จุดอ่อน, daily goal, milestone
- [x] ประวัติ quiz แบบ bar chart พร้อม level badge
- [x] Notification Settings (ตั้งเวลาแจ้งเตือน)

### Streak Tracking
- [x] ตาราง `user_daily_activity` บันทึกรายวัน
- [x] Function `get_user_streak` คำนวณ streak จาก DB
- [x] บันทึกอัตโนมัติเมื่อทำ Flashcard หรือ Quiz
- [x] Dashboard แสดง streak จริง

### Notifications
- [x] Banner ขออนุญาต browser notification หลังเข้าแอป
- [x] ตั้งเวลาแจ้งเตือนรายวัน (local schedule)
- [x] ปุ่มทดสอบ notification
- [x] จำการตั้งค่าใน localStorage

### Admin Panel (`/admin`)
- [x] เพิ่มคำศัพท์ด้วยตนเอง (manual form)
- [x] **AI เติมข้อมูลให้** — กรอกชื่อคำ กด "🤖 เติมให้" Claude เติม definition, ภาษาไทย, ตัวอย่าง
- [x] **AI Auto-Generate** — เลือก Level + หมวด + จำนวน Claude สร้างคำใหม่
- [x] Preview + เลือกคำก่อนบันทึก
- [x] แก้ไข / ลบคำ
- [x] ค้นหาและกรองคำทั้งหมด

### Database (Supabase)
- [x] `words` — คลังคำศัพท์
- [x] `user_word_progress` — progress รายคำต่อ user (SM-2)
- [x] `quiz_sessions` — ประวัติ quiz
- [x] `user_daily_activity` — streak รายวัน
- [x] Row Level Security ทุกตาราง
- [x] Edge Function `ai-analyze` รองรับ: analyze, explain, hint, generate_vocab, enrich_word

---

## 🔲 ยังต้องทำ (Backlog)

### Setup ที่ยังต้องทำก่อนใช้งาน
- [ ] Run SQL ใน Supabase: `schema.sql` → `nida-vocabulary.sql` → `streak-schema.sql`
- [ ] ตั้งค่า `.env` ใส่ Supabase URL + Anon Key
- [ ] Deploy Edge Function + ตั้ง `ANTHROPIC_API_KEY` secret
- [ ] ตั้ง `VITE_AI_ENDPOINT` ให้ชี้ Edge Function URL

### Features ที่ยังไม่มี
- [ ] **Admin Role Guard** — ตอนนี้ทุกคนเข้า `/admin` ได้ ควร restrict เฉพาะ admin
- [ ] **ค้นหาคำ in Flashcard** — เลือก Session เฉพาะ "คำที่ยังไม่ mastered"
- [ ] **Word of the Day** — คำศัพท์ประจำวันบน Dashboard
- [ ] **Export progress** — download สรุปเป็น PDF/CSV
- [ ] **Dark Mode**
- [ ] **เพิ่มคำศัพท์จาก past papers** — scrape/import จาก NIDA ข้อสอบเก่า
- [ ] **Listening mode** — Text-to-Speech ออกเสียงคำ
- [ ] **PWA / offline mode** — ใช้งานได้แม้ไม่มีเน็ต

---

## 📁 โครงสร้างไฟล์

```
eng-card/
├── src/
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── DashboardView.vue
│   │   ├── FlashcardsView.vue
│   │   ├── QuizView.vue
│   │   ├── VocabularyView.vue
│   │   ├── ProgressView.vue
│   │   └── AdminView.vue
│   ├── components/
│   │   ├── AppLayout.vue
│   │   ├── FlashCard.vue
│   │   ├── NotificationBanner.vue
│   │   └── NotificationSettings.vue
│   ├── stores/
│   │   ├── auth.ts
│   │   ├── vocabulary.ts
│   │   ├── quiz.ts
│   │   └── streak.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── ai.ts
│   │   ├── ai-generate.ts
│   │   └── notifications.ts
│   ├── types/index.ts
│   └── router/index.ts
├── supabase/
│   ├── schema.sql              ← run ก่อน
│   ├── nida-vocabulary.sql     ← run 2nd
│   ├── streak-schema.sql       ← run 3rd
│   └── edge-functions/
│       └── ai-analyze/index.ts ← deploy to Supabase
├── .env.example
├── SETUP.md
└── STATUS.md                   ← ไฟล์นี้
```

---

## 🚀 วิธีรัน

```bash
npm install
cp .env.example .env   # ใส่ Supabase keys
npm run dev            # http://localhost:5173
```
