-- ============================================================
-- Aetheria Game — Supabase Setup SQL
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tạo bảng game_saves
create table if not exists public.game_saves (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  save_data  jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- 2. Auto-update updated_at khi upsert
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists game_saves_updated_at on public.game_saves;
create trigger game_saves_updated_at
  before update on public.game_saves
  for each row execute function public.update_updated_at();

-- 3. Row Level Security (mỗi user chỉ đọc/ghi save của chính mình)
alter table public.game_saves enable row level security;

-- Xóa policies cũ nếu có (để chạy lại file không bị lỗi)
drop policy if exists "Users can read own save"   on public.game_saves;
drop policy if exists "Users can insert own save"  on public.game_saves;
drop policy if exists "Users can update own save"  on public.game_saves;

create policy "Users can read own save"
  on public.game_saves for select
  using (auth.uid() = user_id);

create policy "Users can insert own save"
  on public.game_saves for insert
  with check (auth.uid() = user_id);

create policy "Users can update own save"
  on public.game_saves for update
  using (auth.uid() = user_id);

-- ============================================================
-- QUAN TRỌNG: Sau khi chạy SQL này, vào:
-- Authentication > Providers > Email
-- → Tắt "Confirm email" (vì game dùng email giả @aetheria.game)
-- ============================================================
