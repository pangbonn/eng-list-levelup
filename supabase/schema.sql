-- ==========================================
-- VocabMaster NIDA - Supabase Schema
-- Run this in Supabase SQL Editor
-- ==========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- WORDS TABLE (คลังคำศัพท์)
-- ==========================================
create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  definition text not null,
  thai_meaning text not null,
  example_sentence text,
  example_sentence_th text,
  part_of_speech text not null check (part_of_speech in ('noun','verb','adjective','adverb','preposition','conjunction','phrase')),
  level text not null check (level in ('A1','A2','B1','B2','C1','C2')),
  category text not null check (category in ('academic','general','business','science','social','idiom','formal')),
  synonyms text[] default '{}',
  antonyms text[] default '{}',
  frequency int default 0,
  created_at timestamptz default now()
);

create index idx_words_level on words(level);
create index idx_words_category on words(category);
create index idx_words_frequency on words(frequency desc);

-- Row Level Security
alter table words enable row level security;
create policy "Words are readable by everyone" on words for select using (true);
create policy "Words are insertable by service role only" on words for insert to service_role with check (true);

-- ==========================================
-- USER WORD PROGRESS (ความก้าวหน้าต่อคำ)
-- ==========================================
create table if not exists user_word_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  word_id uuid references words not null,
  status text not null default 'new' check (status in ('new','learning','reviewing','mastered')),
  times_seen int not null default 0,
  times_correct int not null default 0,
  times_wrong int not null default 0,
  last_seen_at timestamptz,
  next_review_at timestamptz,
  ease_factor float not null default 2.5,
  interval_days int not null default 1,
  created_at timestamptz default now(),
  unique(user_id, word_id)
);

create index idx_progress_user on user_word_progress(user_id);
create index idx_progress_next_review on user_word_progress(user_id, next_review_at);
create index idx_progress_status on user_word_progress(user_id, status);

alter table user_word_progress enable row level security;
create policy "Users manage their own progress" on user_word_progress
  for all using (auth.uid() = user_id);

-- ==========================================
-- QUIZ SESSIONS (ประวัติการทดสอบ)
-- ==========================================
create table if not exists quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  session_type text not null check (session_type in ('flashcard','multiple_choice','fill_blank','placement')),
  total_questions int not null default 0,
  correct_answers int not null default 0,
  duration_seconds int not null default 0,
  level_assessed text check (level_assessed in ('A1','A2','B1','B2','C1','C2')),
  created_at timestamptz default now()
);

create index idx_sessions_user on quiz_sessions(user_id, created_at desc);

alter table quiz_sessions enable row level security;
create policy "Users manage their own sessions" on quiz_sessions
  for all using (auth.uid() = user_id);

-- ==========================================
-- SAMPLE VOCABULARY DATA (คำศัพท์ตัวอย่าง)
-- ==========================================
insert into words (word, definition, thai_meaning, example_sentence, part_of_speech, level, category, frequency) values
-- A2 Level
('analyze', 'to examine something carefully in order to understand it', 'วิเคราะห์', 'The researcher will analyze the data collected from the survey.', 'verb', 'A2', 'academic', 90),
('significant', 'important or large enough to have an effect', 'สำคัญ, มีนัยสำคัญ', 'There was a significant improvement in student performance.', 'adjective', 'A2', 'academic', 85),
('concept', 'an idea or principle that is connected with something abstract', 'แนวคิด, หลักการ', 'The concept of democracy has evolved over centuries.', 'noun', 'A2', 'academic', 88),

-- B1 Level
('hypothesis', 'an idea or explanation that has not yet been proved to be correct', 'สมมติฐาน', 'The scientist formed a hypothesis before conducting the experiment.', 'noun', 'B1', 'academic', 75),
('methodology', 'a system of methods used in a particular area of study', 'ระเบียบวิธีวิจัย', 'The research methodology was clearly explained in the paper.', 'noun', 'B1', 'academic', 72),
('empirical', 'based on what is experienced or seen rather than on theory', 'ที่อิงจากประสบการณ์จริง', 'The study provided empirical evidence for the theory.', 'adjective', 'B1', 'academic', 68),
('comprehensive', 'including all or almost all aspects of something', 'ครอบคลุม, ครบถ้วน', 'She conducted a comprehensive review of existing literature.', 'adjective', 'B1', 'academic', 70),
('framework', 'a system of rules or ideas which are used to plan or decide something', 'กรอบแนวคิด', 'The theoretical framework guides the research design.', 'noun', 'B1', 'academic', 78),

-- B2 Level
('paradigm', 'a model or example that shows how something works', 'กระบวนทัศน์, แบบจำลอง', 'This discovery caused a paradigm shift in modern physics.', 'noun', 'B2', 'academic', 60),
('inherent', 'existing as a natural or permanent feature of someone or something', 'โดยธรรมชาติ, โดยเนื้อแท้', 'There are inherent risks in any investment strategy.', 'adjective', 'B2', 'academic', 62),
('ambiguous', 'having more than one possible meaning or interpretation', 'คลุมเครือ, มีความหมายสองนัย', 'The instructions were ambiguous and led to confusion.', 'adjective', 'B2', 'academic', 58),
('pragmatic', 'dealing with things in a sensible and realistic way', 'ที่ปฏิบัติได้จริง, เชิงปฏิบัติ', 'We need a pragmatic approach to solve this problem.', 'adjective', 'B2', 'formal', 65),
('elicit', 'to succeed in getting information or a reaction from someone', 'ดึงข้อมูลออกมา, ก่อให้เกิด', 'The survey was designed to elicit honest responses.', 'verb', 'B2', 'academic', 55),
('dichotomy', 'the difference between two completely opposite ideas or things', 'ความแตกต่างที่ตรงข้ามกัน, ทวิภาวะ', 'There is a false dichotomy between tradition and progress.', 'noun', 'B2', 'academic', 48),

-- C1 Level
('epistemology', 'the part of philosophy that deals with the nature of knowledge', 'ญาณวิทยา, ทฤษฎีความรู้', 'Epistemology examines what we can know and how we know it.', 'noun', 'C1', 'academic', 35),
('hegemony', 'control by one country, organization, or person over others', 'อำนาจครอบงำ, อธิปไตย', 'The study examines cultural hegemony in modern societies.', 'noun', 'C1', 'academic', 40),
('ubiquitous', 'seeming to be everywhere at the same time', 'แพร่หลายทั่วไป, มีอยู่ทุกหนทุกแห่ง', 'Smartphones have become ubiquitous in modern life.', 'adjective', 'C1', 'general', 45),
('juxtapose', 'to put things or people next to each other especially in order to compare them', 'นำมาเปรียบเทียบ, วางเคียงกัน', 'The essay juxtaposes traditional and modern values.', 'verb', 'C1', 'formal', 30),
('nuanced', 'expressing or noting differences between things that are small but important', 'ละเอียดอ่อน, มีความซับซ้อน', 'Her analysis of the situation was nuanced and thoughtful.', 'adjective', 'C1', 'formal', 42),

-- C2 Level
('ontological', 'relating to the branch of philosophy dealing with the nature of existence', 'เกี่ยวกับอภิปรัชญาของความเป็นอยู่', 'The paper raises ontological questions about consciousness.', 'adjective', 'C2', 'academic', 20),
('equivocal', 'having or showing a doubtful meaning; open to more than one interpretation', 'คลุมเครือ, ไม่ชัดเจน', 'His equivocal response left the committee uncertain.', 'adjective', 'C2', 'formal', 18)
on conflict (word) do nothing;

-- ==========================================
-- HELPFUL VIEWS
-- ==========================================

-- User statistics view
create or replace view user_stats as
select
  u.id as user_id,
  count(p.id) filter (where p.status = 'mastered') as words_mastered,
  count(p.id) filter (where p.status in ('learning','reviewing')) as words_learning,
  count(p.id) as total_words_seen,
  coalesce(sum(p.times_correct)::float / nullif(sum(p.times_seen), 0), 0) as accuracy_rate
from auth.users u
left join user_word_progress p on p.user_id = u.id
group by u.id;
