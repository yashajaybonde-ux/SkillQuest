-- ============================================================================
-- SkillQuest schema. Run the whole file in Supabase > SQL Editor > New query.
-- Safe to re-run. All writes to XP, badges, certificates and quests go through
-- the backend (service role); students can only edit their own profile fields.
-- ============================================================================
create extension if not exists pgcrypto;

-- ---------- Tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https?://'),
  bio text not null default '' check (char_length(bio) <= 300),
  skills text[] not null default '{}',
  role text not null default 'student' check (role in ('student','admin')),
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  wallet_address text unique check (wallet_address is null or wallet_address ~ '^0x[a-f0-9]{40}$'),
  is_public boolean not null default true,
  show_certificates boolean not null default true,
  show_badges boolean not null default true,
  show_skills boolean not null default true,
  show_progress boolean not null default true,
  show_on_leaderboard boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists profiles_xp_idx on public.profiles (xp desc);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '',
  instructions text not null default '',
  category text not null check (category in ('javascript','html_css','programming','blockchain','web_dev')),
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  xp_reward integer not null check (xp_reward between 5 and 1000),
  type text not null check (type in ('quiz','code','html')),
  challenge jsonb not null default '{}'::jsonb,   -- public: questions, starter code, visible examples
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quests_active_idx on public.quests (is_active, category, difficulty);

-- Answer keys live in their own table with RLS enabled and NO policies,
-- so they can never be read through the public API. Only the backend reads them.
create table if not exists public.quest_answers (
  quest_id uuid primary key references public.quests(id) on delete cascade,
  answer_key jsonb not null
);

create table if not exists public.quest_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  answer jsonb,
  passed boolean not null,
  score integer not null check (score between 0 and 100),
  created_at timestamptz not null default now()
);
create index if not exists submissions_user_idx on public.quest_submissions (user_id, created_at desc);
create index if not exists submissions_quest_idx on public.quest_submissions (quest_id);

-- One row per (student, quest). The primary key is what prevents duplicate XP.
create table if not exists public.user_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  xp_awarded integer not null check (xp_awarded >= 0),
  completed_at timestamptz not null default now(),
  primary key (user_id, quest_id)
);
create index if not exists progress_completed_idx on public.user_progress (completed_at desc);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  icon text not null default 'award',
  color text not null default 'violet' check (color in ('violet','blue','cyan','amber')),
  condition_type text not null check (condition_type in ('quests_completed','category_count','quest_slug','level','all_quests')),
  condition_value integer not null default 1,
  condition_category text,          -- comma separated categories for category_count
  condition_slug text,              -- quest slug for quest_slug
  issues_certificate boolean not null default false,
  skills text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Achievement history: which student earned which badge, and when.
create table if not exists public.achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete set null,
  public_id text unique check (public_id is null or public_id ~ '^SQ-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$'),
  title text not null,
  milestone text not null default '',
  skills text[] not null default '{}',
  status text not null default 'eligible' check (status in ('eligible','issuing','issued','revoked')),
  credential jsonb,                 -- off-chain credential (contains the student's name)
  credential_hash text,             -- keccak256(canonical credential), also stored on-chain
  tx_hash text,
  block_number bigint,
  chain_id integer,
  recipient_wallet text,
  created_at timestamptz not null default now(),
  issued_at timestamptz,
  unique (user_id, badge_id)
);
create index if not exists certificates_user_idx on public.certificates (user_id);

create table if not exists public.wallet_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  address text not null check (address ~ '^0x[a-f0-9]{40}$'),
  linked_at timestamptz not null default now(),
  unlinked_at timestamptz
);
create unique index if not exists wallet_active_unique on public.wallet_connections (address) where unlinked_at is null;
create index if not exists wallet_user_idx on public.wallet_connections (user_id);

create table if not exists public.verification_logs (
  id bigserial primary key,
  public_id text not null,
  result text not null check (result in ('valid','revoked','not_found','tampered','authentic','modified')),
  source text not null default 'lookup' check (source in ('lookup','check')),
  created_at timestamptz not null default now()
);
create index if not exists verification_logs_idx on public.verification_logs (created_at desc);

-- ---------- Profile auto-creation on sign-up ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare base text; uname text;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 then base := base || 'user'; end if;
  uname := left(base, 14);
  if exists (select 1 from public.profiles where username = uname) then
    uname := uname || substr(md5(random()::text), 1, 5);
  end if;
  insert into public.profiles (id, username, full_name)
  values (new.id, uname, coalesce(left(new.raw_user_meta_data->>'full_name', 80), ''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Atomic XP + level update (backend only) ----------
-- level = floor(sqrt(xp / 100)) + 1   (must match server/src/lib/xp.js)
create or replace function public.add_xp(p_user uuid, p_xp integer)
returns table (xp integer, level integer) language sql security definer set search_path = public as $$
  update public.profiles
     set xp = profiles.xp + greatest(p_xp, 0),
         level = floor(sqrt((profiles.xp + greatest(p_xp, 0))::numeric / 100))::int + 1
   where id = p_user
  returning profiles.xp, profiles.level;
$$;

create or replace function public.leaderboard(p_period text default 'all', p_limit integer default 50)
returns table (user_id uuid, username text, full_name text, avatar_url text, level integer,
               xp bigint, quests_completed bigint, badges_count bigint)
language sql stable security definer set search_path = public as $$
  select * from (
    select p.id as user_id, p.username, p.full_name, p.avatar_url, p.level,
      (case when p_period = 'weekly'
        then coalesce((select sum(up.xp_awarded) from public.user_progress up
                       where up.user_id = p.id and up.completed_at >= now() - interval '7 days'), 0)
        else p.xp end)::bigint as xp,
      (select count(*) from public.user_progress up where up.user_id = p.id) as quests_completed,
      (select count(*) from public.achievements a where a.user_id = p.id) as badges_count
    from public.profiles p
    where p.show_on_leaderboard
  ) t
  where t.xp > 0
  order by t.xp desc, t.quests_completed desc, t.username asc
  limit least(greatest(p_limit, 1), 100);
$$;

revoke all on function public.add_xp(uuid, integer) from public, anon, authenticated;
revoke all on function public.leaderboard(text, integer) from public, anon, authenticated;
grant execute on function public.add_xp(uuid, integer) to service_role;
grant execute on function public.leaderboard(text, integer) to service_role;

-- ---------- Row Level Security ----------
alter table public.profiles           enable row level security;
alter table public.quests             enable row level security;
alter table public.quest_answers      enable row level security;
alter table public.quest_submissions  enable row level security;
alter table public.user_progress      enable row level security;
alter table public.badges             enable row level security;
alter table public.achievements       enable row level security;
alter table public.certificates       enable row level security;
alter table public.wallet_connections enable row level security;
alter table public.verification_logs  enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "quests read active" on public.quests;
create policy "quests read active" on public.quests for select to anon, authenticated using (is_active);

drop policy if exists "badges read all" on public.badges;
create policy "badges read all" on public.badges for select to anon, authenticated using (true);

drop policy if exists "submissions read own" on public.quest_submissions;
create policy "submissions read own" on public.quest_submissions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "progress read own" on public.user_progress;
create policy "progress read own" on public.user_progress for select to authenticated using (auth.uid() = user_id);
drop policy if exists "achievements read own" on public.achievements;
create policy "achievements read own" on public.achievements for select to authenticated using (auth.uid() = user_id);
drop policy if exists "certificates read own" on public.certificates;
create policy "certificates read own" on public.certificates for select to authenticated using (auth.uid() = user_id);
drop policy if exists "wallets read own" on public.wallet_connections;
create policy "wallets read own" on public.wallet_connections for select to authenticated using (auth.uid() = user_id);
-- quest_answers and verification_logs: RLS on, no policies => unreachable from the browser.

-- ---------- Column-level privileges (the part RLS alone cannot do) ----------
-- Browser clients can never insert/delete anything, and can only update
-- harmless profile columns. xp, level, role and wallet_address are backend-only.
revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
grant update (username, full_name, avatar_url, bio, skills, is_public, show_certificates,
              show_badges, show_skills, show_progress, show_on_leaderboard)
  on public.profiles to authenticated;

-- ---------- First admin ----------
-- After registering your account in the app, run (replace the username):
--   update public.profiles set role = 'admin' where username = 'your_username';
