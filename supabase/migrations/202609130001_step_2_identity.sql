-- STEP 2 only. Apply once with Supabase migrations, in filename order.
begin;

create type public.character_class as enum ('Warrior', 'Scholar', 'Creator', 'Balanced');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 40 and display_name ~ '^[[:alnum:] ._''-]+$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  class public.character_class not null,
  level integer not null default 1 check (level >= 1),
  xp integer not null default 0 check (xp >= 0),
  credits integer not null default 0 check (credits >= 0),
  streak integer not null default 0 check (streak >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.attributes (
  character_id uuid primary key references public.characters(id) on delete cascade,
  strength integer not null default 0 check (strength between 0 and 100),
  intelligence integer not null default 0 check (intelligence between 0 and 100),
  focus integer not null default 0 check (focus between 0 and 100),
  discipline integer not null default 0 check (discipline between 0 and 100),
  vitality integer not null default 0 check (vitality between 0 and 100),
  charisma integer not null default 0 check (charisma between 0 and 100),
  updated_at timestamptz not null default now()
);
create table public.privacy_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  discoverable boolean not null default false,
  show_progress boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.attributes enable row level security;
alter table public.privacy_settings enable row level security;

-- RLS controls row ownership; privileges additionally lock progression columns.
revoke all on public.profiles, public.characters, public.attributes, public.privacy_settings from public, anon, authenticated;
grant select on public.profiles, public.characters, public.attributes, public.privacy_settings to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant update (discoverable, show_progress) on public.privacy_settings to authenticated;

create policy profiles_read_own on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy characters_read_own on public.characters for select to authenticated using (user_id = (select auth.uid()));
create policy attributes_read_own on public.attributes for select to authenticated using (
  exists (select 1 from public.characters c where c.id = attributes.character_id and c.user_id = (select auth.uid()))
);
create policy privacy_read_own on public.privacy_settings for select to authenticated using (user_id = (select auth.uid()));
create policy privacy_update_own on public.privacy_settings for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public, anon, authenticated;
create trigger profiles_updated before update on public.profiles for each row execute function private.touch_updated_at();
create trigger characters_updated before update on public.characters for each row execute function private.touch_updated_at();
create trigger attributes_updated before update on public.attributes for each row execute function private.touch_updated_at();
create trigger privacy_updated before update on public.privacy_settings for each row execute function private.touch_updated_at();

-- Single transaction; uid is derived from Supabase's verified request context.
-- The profile upsert serializes concurrent setup attempts for the same user.
create function public.complete_character_setup(p_display_name text, p_class public.character_class)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  saved_id uuid;
  saved_class public.character_class;
  clean_name text := btrim(p_display_name);
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_class is null or clean_name is null or char_length(clean_name) not between 2 and 40
     or clean_name !~ '^[[:alnum:] ._''-]+$' then
    raise exception 'Invalid character input' using errcode = '22023';
  end if;
  insert into public.profiles (id, display_name) values (owner_id, clean_name)
    on conflict (id) do update set display_name = excluded.display_name;
  select id, class into saved_id, saved_class from public.characters where user_id = owner_id for update;
  if saved_id is not null and saved_class <> p_class then
    raise exception 'A character path is already established' using errcode = '22023';
  end if;
  if saved_id is null then
    insert into public.characters (user_id, class) values (owner_id, p_class) returning id into saved_id;
  end if;
  -- Retry-safe: never reset existing attributes, XP, credits, level or streak.
  insert into public.attributes (character_id) values (saved_id) on conflict (character_id) do nothing;
  insert into public.privacy_settings (user_id) values (owner_id) on conflict (user_id) do nothing;
  return saved_id;
end;
$$;
revoke all on function public.complete_character_setup(text, public.character_class) from public, anon;
grant execute on function public.complete_character_setup(text, public.character_class) to authenticated;

comment on function public.complete_character_setup(text, public.character_class) is 'Step 2 owner-bound, atomic, idempotent onboarding. Does not accept progression or arbitrary owner IDs.';
commit;
