-- PokéQuest schema for Supabase.
-- Run in the Supabase SQL editor (or `supabase db push`). Each auth user is a
-- parent account that owns exactly one family (families.id = auth.uid()).
--
-- Security model
--   * Row Level Security scopes every table to the signed-in parent's family.
--   * Clients can never write XP: xp_events has no insert/update policy, and
--     completion status can only change through review_completion(), a
--     SECURITY DEFINER function that awards XP and unlocks rewards atomically.
--   * The app server additionally requires a signed parent-PIN cookie before
--     calling review/admin functions, so kids on a shared device can't approve.

create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'My Family',
  timezone text not null default 'America/New_York',
  pin_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  creature text not null,
  color text not null default '#e8423f',
  created_at timestamptz not null default now()
);

create table if not exists public.chores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '',
  icon text not null default '⭐',
  xp int not null check (xp between 1 and 1000),
  frequency text not null check (frequency in ('daily', 'weekly')),
  child_ids uuid[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  chore_id uuid references public.chores (id) on delete set null,
  child_id uuid not null references public.children (id) on delete cascade,
  period_key text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  chore_title text not null,
  chore_icon text not null,
  xp int not null check (xp between 1 and 1000),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  note text
);

-- One live (pending/approved) turn-in per quest per child per period.
create unique index if not exists completions_one_per_period
  on public.completions (child_id, chore_id, period_key)
  where status <> 'rejected';

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '',
  image_url text not null default '',
  xp_cost int not null check (xp_cost between 1 and 100000),
  sort_order int not null default 0,
  status text not null default 'locked' check (status in ('locked', 'unlocked', 'delivered')),
  unlocked_at timestamptz,
  revealed_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.xp_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  amount int not null,
  reason text not null check (reason in ('chore', 'reward')),
  ref_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists completions_family_idx on public.completions (family_id, submitted_at desc);
create index if not exists xp_events_child_idx on public.xp_events (child_id);

-- Create the family row when a parent signs up.
create or replace function public.handle_new_parent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.families (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'family_name', 'My Family'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_parent();

-- ---------- Row Level Security ----------
alter table public.families enable row level security;
alter table public.children enable row level security;
alter table public.chores enable row level security;
alter table public.completions enable row level security;
alter table public.rewards enable row level security;
alter table public.xp_events enable row level security;

drop policy if exists "own family" on public.families;
create policy "own family" on public.families for all
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own children" on public.children;
create policy "own children" on public.children for all
  using (family_id = auth.uid()) with check (family_id = auth.uid());

drop policy if exists "own chores" on public.chores;
create policy "own chores" on public.chores for all
  using (family_id = auth.uid()) with check (family_id = auth.uid());

-- Completions: read all, insert only as pending, delete only pending. No direct updates.
drop policy if exists "read completions" on public.completions;
create policy "read completions" on public.completions for select using (family_id = auth.uid());
drop policy if exists "submit completions" on public.completions;
create policy "submit completions" on public.completions for insert
  with check (family_id = auth.uid() and status = 'pending' and reviewed_at is null);
drop policy if exists "delete pending completions" on public.completions;
create policy "delete pending completions" on public.completions for delete
  using (family_id = auth.uid() and status = 'pending');

-- Rewards: parents manage them, but status/unlock fields only move through functions.
drop policy if exists "read rewards" on public.rewards;
create policy "read rewards" on public.rewards for select using (family_id = auth.uid());
drop policy if exists "insert rewards" on public.rewards;
create policy "insert rewards" on public.rewards for insert
  with check (family_id = auth.uid() and status = 'locked' and unlocked_at is null);
drop policy if exists "update locked rewards" on public.rewards;
create policy "update locked rewards" on public.rewards for update
  using (family_id = auth.uid() and status = 'locked')
  with check (family_id = auth.uid() and status = 'locked' and unlocked_at is null);
drop policy if exists "delete locked rewards" on public.rewards;
create policy "delete locked rewards" on public.rewards for delete
  using (family_id = auth.uid() and status = 'locked');

drop policy if exists "read xp" on public.xp_events;
create policy "read xp" on public.xp_events for select using (family_id = auth.uid());

-- ---------- Server-side XP logic ----------

create or replace function public.settle_rewards(p_child uuid)
returns setof public.rewards language plpgsql security definer set search_path = public as $$
declare
  v_family uuid;
  v_balance int;
  v_goal public.rewards;
begin
  select family_id into v_family from public.children where id = p_child;
  if v_family is null or v_family <> auth.uid() then
    raise exception 'not allowed';
  end if;
  -- Serialize per child so two approvals can't double-spend.
  perform 1 from public.children where id = p_child for update;
  loop
    select coalesce(sum(amount), 0) into v_balance from public.xp_events where child_id = p_child;
    select * into v_goal from public.rewards
      where child_id = p_child and status = 'locked'
      order by sort_order, created_at limit 1;
    exit when v_goal.id is null or v_balance < v_goal.xp_cost;
    update public.rewards set status = 'unlocked', unlocked_at = now() where id = v_goal.id
      returning * into v_goal;
    insert into public.xp_events (family_id, child_id, amount, reason, ref_id)
      values (v_family, p_child, -v_goal.xp_cost, 'reward', v_goal.id);
    return next v_goal;
  end loop;
end $$;

create or replace function public.review_completion(p_completion uuid, p_approve boolean, p_note text default null)
returns setof public.rewards language plpgsql security definer set search_path = public as $$
declare
  v_row public.completions;
begin
  select * into v_row from public.completions where id = p_completion for update;
  if v_row.id is null or v_row.family_id <> auth.uid() then
    raise exception 'not allowed';
  end if;
  if v_row.status <> 'pending' then
    raise exception 'already reviewed';
  end if;
  update public.completions
    set status = case when p_approve then 'approved' else 'rejected' end,
        reviewed_at = now(),
        note = p_note
    where id = p_completion;
  if p_approve then
    insert into public.xp_events (family_id, child_id, amount, reason, ref_id)
      values (v_row.family_id, v_row.child_id, v_row.xp, 'chore', v_row.id);
    return query select * from public.settle_rewards(v_row.child_id);
  end if;
end $$;

create or replace function public.set_reward_flags(p_reward uuid, p_revealed boolean default null, p_delivered boolean default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.rewards where id = p_reward and family_id = auth.uid() and status <> 'locked') then
    raise exception 'not allowed';
  end if;
  if p_revealed then
    update public.rewards set revealed_at = coalesce(revealed_at, now()) where id = p_reward;
  end if;
  if p_delivered is not null then
    update public.rewards
      set status = case when p_delivered then 'delivered' else 'unlocked' end,
          delivered_at = case when p_delivered then now() else null end
      where id = p_reward;
  end if;
end $$;

-- Unlocked rewards keep their display fields editable.
create or replace function public.edit_unlocked_reward(p_reward uuid, p_title text, p_description text, p_image_url text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.rewards set title = p_title, description = p_description, image_url = p_image_url
    where id = p_reward and family_id = auth.uid();
end $$;

revoke all on function public.settle_rewards(uuid) from public, anon;
revoke all on function public.review_completion(uuid, boolean, text) from public, anon;
revoke all on function public.set_reward_flags(uuid, boolean, boolean) from public, anon;
revoke all on function public.edit_unlocked_reward(uuid, text, text, text) from public, anon;
grant execute on function public.settle_rewards(uuid) to authenticated;
grant execute on function public.review_completion(uuid, boolean, text) to authenticated;
grant execute on function public.set_reward_flags(uuid, boolean, boolean) to authenticated;
grant execute on function public.edit_unlocked_reward(uuid, text, text, text) to authenticated;
