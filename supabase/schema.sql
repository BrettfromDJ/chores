-- PokéQuest schema for Supabase.
-- Run in the Supabase SQL editor (or `supabase db push`). Each auth user is a
-- parent account that owns exactly one family (families.id = auth.uid()).
--
-- Security model
--   * Row Level Security scopes every table to the signed-in parent's family.
--   * Clients can never write money directly: transactions has no insert/update
--     policy. Wallet changes only happen through SECURITY DEFINER functions
--     (review_completion, add_transaction) that lock the child row,
--     check the balance and write the ledger atomically.
--   * The app server additionally requires a signed parent-PIN cookie before
--     calling review/admin functions, so kids on a shared device can't approve.
--   * XP is money: 100 XP = $1, so every amount is stored as integer XP (= cents).

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
  amount_cents int not null check (amount_cents between 1 and 100000),
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
  amount_cents int not null check (amount_cents between 1 and 100000),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  note text
);

-- One live (pending/approved) turn-in per quest per child per period.
create unique index if not exists completions_one_per_period
  on public.completions (child_id, chore_id, period_key)
  where status <> 'rejected';

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  amount_cents int not null check (amount_cents <> 0),
  kind text not null,
  ref_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists completions_family_idx on public.completions (family_id, submitted_at desc);
create index if not exists transactions_child_idx on public.transactions (child_id);

-- Kept separate from the table so re-running this script upgrades older installs.
alter table public.transactions drop constraint if exists transactions_kind_check;
alter table public.transactions add constraint transactions_kind_check
  check (kind in ('earned', 'bonus', 'payout', 'level_up'));

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
alter table public.transactions enable row level security;

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

drop policy if exists "read transactions" on public.transactions;
create policy "read transactions" on public.transactions for select using (family_id = auth.uid());

-- ---------- Server-side wallet logic ----------

create or replace function public.child_balance(p_child uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce(sum(amount_cents), 0)::int from public.transactions where child_id = p_child;
$$;

-- Lock the child row (serializes wallet changes) and check ownership.
create or replace function public.lock_child(p_child uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_family uuid;
begin
  select family_id into v_family from public.children where id = p_child for update;
  if v_family is null or v_family <> auth.uid() then
    raise exception 'not allowed';
  end if;
  return v_family;
end $$;

-- $1 (100 XP) for every level reached but not yet paid. Levels count quest XP and
-- parent bonuses only, so the level-up bonus itself can't cascade.
-- Keep in sync with LEVEL_UP_BONUS / centsForLevel in src/lib/game.ts.
create or replace function public.pay_level_bonuses(p_child uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_family uuid;
  v_lifetime int;
  v_level int := 1;
  v_paid int;
  n int;
begin
  v_family := public.lock_child(p_child);
  select coalesce(sum(amount_cents), 0) into v_lifetime
    from public.transactions where child_id = p_child and kind in ('earned', 'bonus');
  while 250 * (v_level + 1) * v_level <= v_lifetime loop
    v_level := v_level + 1;
  end loop;
  select count(*) into v_paid from public.transactions where child_id = p_child and kind = 'level_up';
  for n in (v_paid + 2)..v_level loop
    insert into public.transactions (family_id, child_id, amount_cents, kind, note)
      values (v_family, p_child, 100, 'level_up', format('Reached level %s!', n));
  end loop;
end $$;

-- Return type changed across versions; drop first so the script can be re-run.
drop function if exists public.review_completion(uuid, boolean, text);
create or replace function public.review_completion(p_completion uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
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
  perform public.lock_child(v_row.child_id);
  update public.completions
    set status = case when p_approve then 'approved' else 'rejected' end,
        reviewed_at = now(),
        note = p_note
    where id = p_completion;
  if p_approve then
    insert into public.transactions (family_id, child_id, amount_cents, kind, ref_id)
      values (v_row.family_id, v_row.child_id, v_row.amount_cents, 'earned', v_row.id);
    perform public.pay_level_bonuses(v_row.child_id);
  end if;
end $$;

create or replace function public.add_transaction(p_child uuid, p_kind text, p_amount int, p_note text default null)
returns public.transactions language plpgsql security definer set search_path = public as $$
declare
  v_family uuid;
  v_tx public.transactions;
begin
  if p_kind not in ('bonus', 'payout') or p_amount is null or p_amount <= 0 then
    raise exception 'invalid amount';
  end if;
  v_family := public.lock_child(p_child);
  if p_kind = 'payout' and public.child_balance(p_child) < p_amount then
    raise exception 'That''s more than what''s in the wallet.';
  end if;
  insert into public.transactions (family_id, child_id, amount_cents, kind, note)
    values (v_family, p_child, case when p_kind = 'payout' then -p_amount else p_amount end, p_kind, p_note)
    returning * into v_tx;
  if p_kind = 'bonus' then
    perform public.pay_level_bonuses(p_child);
  end if;
  return v_tx;
end $$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'child_balance(uuid)', 'lock_child(uuid)', 'pay_level_bonuses(uuid)',
    'review_completion(uuid, boolean, text)', 'add_transaction(uuid, text, int, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
