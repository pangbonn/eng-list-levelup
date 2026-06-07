-- ==========================================
-- Streak & Notification Schema
-- Run in Supabase SQL Editor
-- ==========================================

-- Daily activity tracker
create table if not exists user_daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  activity_date date not null default current_date,
  words_studied int not null default 0,
  quiz_count int not null default 0,
  created_at timestamptz default now(),
  unique(user_id, activity_date)
);

create index idx_activity_user_date on user_daily_activity(user_id, activity_date desc);

alter table user_daily_activity enable row level security;
create policy "Users manage their own activity" on user_daily_activity
  for all using (auth.uid() = user_id);

-- Streak calculation function
create or replace function get_user_streak(p_user_id uuid)
returns int language plpgsql as $$
declare
  v_streak int := 0;
  v_date date := current_date;
  v_has_activity bool;
begin
  loop
    select exists(
      select 1 from user_daily_activity
      where user_id = p_user_id
        and activity_date = v_date
        and words_studied > 0
    ) into v_has_activity;

    exit when not v_has_activity;
    v_streak := v_streak + 1;
    v_date := v_date - 1;
  end loop;
  return v_streak;
end;
$$;

-- Function to record daily activity (upsert)
create or replace function record_daily_activity(p_user_id uuid, p_words int, p_quizzes int)
returns void language plpgsql as $$
begin
  insert into user_daily_activity (user_id, activity_date, words_studied, quiz_count)
  values (p_user_id, current_date, p_words, p_quizzes)
  on conflict (user_id, activity_date)
  do update set
    words_studied = user_daily_activity.words_studied + p_words,
    quiz_count = user_daily_activity.quiz_count + p_quizzes;
end;
$$;
