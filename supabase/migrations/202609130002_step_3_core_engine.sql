-- Step 3: core RPG engine. Apply AFTER 202609130001_step_2_identity.sql.
begin;

create table public.game_rules (
  id boolean primary key default true check(id),
  base_xp integer not null default 100 check(base_xp > 0),
  max_daily_xp integer not null default 1500 check(max_daily_xp > 0),
  max_daily_credits integer not null default 300 check(max_daily_credits > 0),
  max_daily_completions integer not null default 20 check(max_daily_completions > 0)
);
insert into public.game_rules(id) values(true);
alter table public.game_rules enable row level security;
revoke all on public.game_rules from public, anon, authenticated;
grant select on public.game_rules to authenticated;
create policy game_rules_read on public.game_rules for select to authenticated using(true);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_key text,
  title text not null check(char_length(btrim(title)) between 2 and 100),
  description text not null default '' check(char_length(description)<=1000),
  category text not null check(category in ('strength','intelligence','focus','discipline','vitality','charisma')),
  quest_type text not null check(quest_type in ('daily','custom','verified','focus')),
  recurrence text not null check(recurrence in ('daily','once')),
  difficulty text not null check(difficulty in ('easy','medium','hard')),
  duration_minutes integer not null check(duration_minutes between 5 and 240),
  completion_condition text not null check(char_length(btrim(completion_condition)) between 5 and 500),
  target_units integer not null default 1 check(target_units between 1 and 1000),
  art_key text not null default 'focus' check(art_key in ('gym','coding','study','running','reading','focus')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,template_key), unique(id,user_id)
);
create index quests_owner_active on public.quests(user_id,created_at desc) where archived_at is null;
create trigger quests_updated before update on public.quests for each row execute function private.touch_updated_at();
create table public.quest_progress (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null,
  user_id uuid not null,
  period date not null,
  status text not null default 'in_progress' check(status in ('in_progress','completed')),
  units integer not null default 0 check(units>=0),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  foreign key(quest_id,user_id) references public.quests(id,user_id) on delete cascade,
  unique(quest_id,period), unique(id,user_id),
  check((status='completed')=(completed_at is not null))
);
create index quest_progress_owner on public.quest_progress(user_id,period desc);
create table public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_id uuid not null,
  progress_id uuid not null unique,
  activity_day date not null,
  completed_at timestamptz not null default now(),
  quest_snapshot jsonb not null,
  xp integer not null check(xp>0),
  credits integer not null check(credits>0),
  attribute_gains jsonb not null,
  level_before integer not null,
  level_after integer not null check(level_after>=level_before),
  foreign key(quest_id,user_id) references public.quests(id,user_id),
  foreign key(progress_id,user_id) references public.quest_progress(id,user_id),
  unique(id,user_id)
);
create index quest_completions_owner_day on public.quest_completions(user_id,activity_day,completed_at desc);
create table public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  completion_id uuid not null unique,
  amount integer not null check(amount>0),
  balance_after integer not null check(balance_after>=amount),
  created_at timestamptz not null default now(),
  foreign key(completion_id,user_id) references public.quest_completions(id,user_id)
);
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  completion_id uuid not null unique,
  amount integer not null check(amount>0),
  balance_after integer not null check(balance_after>=amount),
  created_at timestamptz not null default now(),
  foreign key(completion_id,user_id) references public.quest_completions(id,user_id)
);
create index xp_transactions_owner on public.xp_transactions(user_id,created_at desc);
create index credit_transactions_owner on public.credit_transactions(user_id,created_at desc);
create table public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0 check(current_streak>=0),
  longest_streak integer not null default 0 check(longest_streak>=current_streak),
  last_activity_day date,
  updated_at timestamptz not null default now()
);

alter table public.quests enable row level security;
alter table public.quest_progress enable row level security;
alter table public.quest_completions enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.streaks enable row level security;
revoke all on public.quests, public.quest_progress, public.quest_completions, public.xp_transactions, public.credit_transactions, public.streaks from public,anon,authenticated;
grant select on public.quests, public.quest_progress, public.quest_completions, public.xp_transactions, public.credit_transactions, public.streaks to authenticated;
create policy quests_owner_read on public.quests for select to authenticated using(user_id=(select auth.uid()));
create policy progress_owner_read on public.quest_progress for select to authenticated using(user_id=(select auth.uid()));
create policy completions_owner_read on public.quest_completions for select to authenticated using(user_id=(select auth.uid()));
create policy xp_owner_read on public.xp_transactions for select to authenticated using(user_id=(select auth.uid()));
create policy credits_owner_read on public.credit_transactions for select to authenticated using(user_id=(select auth.uid()));
create policy streaks_owner_read on public.streaks for select to authenticated using(user_id=(select auth.uid()));

-- Each cost is BASE_XP * N^1.5, rounded up, to advance from level N to N+1.
create function private.level_state(total integer) returns jsonb language plpgsql stable set search_path='' as $$
declare n integer:=1; remaining integer:=total; cost integer; base integer;
begin
 select base_xp into base from public.game_rules where id;
 loop
  cost:=ceil(base*power(n::numeric,1.5))::integer;
  exit when remaining<cost;
  remaining:=remaining-cost; n:=n+1;
 end loop;
 return jsonb_build_object('level',n,'current_xp',remaining,'next_level_xp',cost,'progress_percent',round(100.0*remaining/cost,2));
end; $$;
revoke all on function private.level_state(integer) from public,anon,authenticated;

create function public.sync_daily_quests() returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid(); today date:=(now() at time zone 'UTC')::date; c public.characters; s public.streaks; result jsonb;
begin
 if owner is null then raise exception 'Authentication required' using errcode='42501'; end if;
 select * into c from public.characters where user_id=owner for update;
 if not found then raise exception 'Create a character first'; end if;
 insert into public.quests(user_id,template_key,title,description,category,quest_type,recurrence,difficulty,duration_minutes,completion_condition,art_key)
 select owner,t.* from (values
 ('gym','Train at the Gym','Build strength. One deliberate rep at a time.','strength','verified','daily','hard',45,'Complete the workout and satisfy the future verification requirements.','gym'),
 ('coding','Deep Work Coding','Silence the noise. Build something that matters.','focus','focus','daily','medium',50,'Complete a defined coding task and confirm the work is finished.','coding'),
 ('study','Study DBMS','Turn a difficult concept into lasting knowledge.','intelligence','daily','daily','medium',60,'Study a database concept and write a short summary.','study'),
 ('running','Morning Run','Find your rhythm beyond the citadel walls.','vitality','daily','daily','easy',30,'Finish your planned run and confirm completion.','running'),
 ('reading','Read a New Chapter','A few pages today. A wider world tomorrow.','intelligence','daily','daily','easy',25,'Finish one chapter and record your main takeaway.','reading'),
 ('focus','Unbroken Focus','One task. Your full attention. No distractions.','discipline','focus','daily','easy',25,'Finish one uninterrupted work block and its chosen task.','focus')
 ) as t(template_key,title,description,category,quest_type,recurrence,difficulty,duration_minutes,completion_condition,art_key)
 on conflict(user_id,template_key) do nothing;
 insert into public.streaks(user_id) values(owner) on conflict do nothing;
 update public.streaks set current_streak=0,updated_at=now() where user_id=owner and (last_activity_day is null or last_activity_day<today-1);
 select * into s from public.streaks where user_id=owner;
 result:=private.level_state(c.xp);
 update public.characters set streak=s.current_streak,level=(result->>'level')::integer where id=c.id and (streak<>s.current_streak or level<>(result->>'level')::integer);
 return result||jsonb_build_object('today',today,'streak',s.current_streak);
end; $$;
revoke all on function public.sync_daily_quests() from public,anon;
grant execute on function public.sync_daily_quests() to authenticated;

create function public.save_quest(p_id uuid,p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid(); q public.quests; saved uuid; kind text; recurring text; chosen_category text; artwork text;
begin
 if owner is null then raise exception 'Authentication required' using errcode='42501'; end if;
 perform 1 from public.characters where user_id=owner for update;
 if not found then raise exception 'Create a character first'; end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Invalid quest'; end if;
 if exists(select 1 from jsonb_object_keys(p_data) k where k not in ('title','description','category','quest_type','recurrence','difficulty','duration_minutes','completion_condition','target_units')) then raise exception 'Unexpected quest fields'; end if;
 kind:=p_data->>'quest_type'; recurring:=p_data->>'recurrence'; chosen_category:=p_data->>'category';
 if kind='daily' and recurring<>'daily' then raise exception 'Daily quests must recur daily'; end if;
 artwork:=case chosen_category when 'strength' then 'gym' when 'intelligence' then 'study' when 'vitality' then 'running' when 'focus' then 'coding' else 'focus' end;
 if p_id is not null then
  select * into q from public.quests where id=p_id and user_id=owner and archived_at is null for update;
  if not found then raise exception 'Quest unavailable' using errcode='42501'; end if;
  if exists(select 1 from public.quest_progress where quest_id=p_id) then raise exception 'Started quests cannot be edited; archive and create a new quest'; end if;
  update public.quests set title=btrim(p_data->>'title'),description=coalesce(p_data->>'description',''),category=chosen_category,quest_type=kind,recurrence=recurring,difficulty=p_data->>'difficulty',duration_minutes=(p_data->>'duration_minutes')::integer,completion_condition=btrim(p_data->>'completion_condition'),target_units=(p_data->>'target_units')::integer,art_key=artwork where id=p_id returning id into saved;
 else
  if (select count(*) from public.quests where user_id=owner and archived_at is null)>=50 then raise exception 'Archive a quest before creating more (50 active maximum)'; end if;
  insert into public.quests(user_id,title,description,category,quest_type,recurrence,difficulty,duration_minutes,completion_condition,target_units,art_key) values(owner,btrim(p_data->>'title'),coalesce(p_data->>'description',''),chosen_category,kind,recurring,p_data->>'difficulty',(p_data->>'duration_minutes')::integer,btrim(p_data->>'completion_condition'),(p_data->>'target_units')::integer,artwork) returning id into saved;
 end if;
 return saved;
end; $$;
revoke all on function public.save_quest(uuid,jsonb) from public,anon;
grant execute on function public.save_quest(uuid,jsonb) to authenticated;

create function public.archive_quest(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid();
begin
 if owner is null then raise exception 'Authentication required' using errcode='42501'; end if;
 perform 1 from public.characters where user_id=owner for update;
 update public.quests set archived_at=coalesce(archived_at,now()) where id=p_id and user_id=owner;
 if not found then raise exception 'Quest unavailable' using errcode='42501'; end if;
end; $$;
revoke all on function public.archive_quest(uuid) from public,anon;
grant execute on function public.archive_quest(uuid) to authenticated;

create function public.advance_quest(p_id uuid,p_action text,p_units integer default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare
 owner uuid:=auth.uid(); today date:=(now() at time zone 'UTC')::date; occurrence date;
 c public.characters; q public.quests; p public.quest_progress; a public.attributes; s public.streaks; rules public.game_rules;
 reward_xp integer; reward_credits integer; multiplier integer; gains jsonb; after_attrs jsonb; completion uuid; level_info jsonb; next_streak integer;
 used_xp bigint; used_credits bigint; used_count bigint; delta integer;
begin
 if owner is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_action is null or p_action not in ('start','progress','complete') then raise exception 'Invalid action'; end if;
 -- Serialize all mutation/reward requests for this character, including different quests.
 select * into c from public.characters where user_id=owner for update;
 if not found then raise exception 'Create a character first'; end if;
 select * into q from public.quests where id=p_id and user_id=owner and archived_at is null for update;
 if not found then raise exception 'Quest unavailable' using errcode='42501'; end if;
 occurrence:=case when q.recurrence='daily' then today else date '1970-01-01' end;
 select * into p from public.quest_progress where quest_id=q.id and period=occurrence for update;
 if p_action='start' then
  if p.id is null then
   if exists(select 1 from public.quest_progress pr join public.quests qu on qu.id=pr.quest_id where pr.user_id=owner and pr.status='in_progress' and qu.archived_at is null and (qu.recurrence='once' or pr.period=today)) then raise exception 'Finish or archive your active quest before starting another'; end if;
   insert into public.quest_progress(quest_id,user_id,period) values(q.id,owner,occurrence) returning * into p;
  end if;
  return jsonb_build_object('status',p.status,'progress_id',p.id);
 end if;
 if p.id is null then raise exception 'Start this quest first'; end if;
 if p.status='completed' then return jsonb_build_object('status','completed','replayed',true); end if;
 if p_action='progress' then
  if p_units is null or p_units<p.units or p_units>q.target_units then raise exception 'Invalid progress'; end if;
  update public.quest_progress set units=p_units,updated_at=now() where id=p.id;
  return jsonb_build_object('status','in_progress','units',p_units);
 end if;
 if q.quest_type='verified' then raise exception 'Verified completion is locked until the verification system is available'; end if;
 if p.units<q.target_units then raise exception 'Complete the required progress first'; end if;
 if now()<p.started_at+make_interval(mins=>q.duration_minutes) then raise exception 'The required quest duration has not elapsed'; end if;
 select * into rules from public.game_rules where id;
 multiplier:=case q.difficulty when 'easy' then 2 when 'medium' then 3 else 4 end;
 reward_xp:=least(240,q.duration_minutes*multiplier); reward_credits:=greatest(1,reward_xp/5);
 select coalesce(sum(xp),0),coalesce(sum(credits),0),count(*) into used_xp,used_credits,used_count from public.quest_completions where user_id=owner and activity_day=today;
 if used_count>=rules.max_daily_completions or used_xp+reward_xp>rules.max_daily_xp or used_credits+reward_credits>rules.max_daily_credits then raise exception 'Daily progression limit reached; resume tomorrow (UTC)'; end if;
 select * into a from public.attributes where character_id=c.id for update;
 if not found then raise exception 'Character attributes are missing'; end if;
 delta:=multiplier-1;
 gains:=jsonb_build_object('strength',0,'intelligence',0,'focus',0,'discipline',0,'vitality',0,'charisma',0);
 gains:=jsonb_set(gains,array[q.category],to_jsonb(delta));
 -- Primary category plus a secondary trait; focus type also develops focus.
 if q.category in ('strength','vitality') then gains:=jsonb_set(gains,array[case q.category when 'strength' then 'vitality' else 'strength' end],to_jsonb(1));
 elsif q.category in ('intelligence','focus') then gains:=jsonb_set(gains,array[case q.category when 'intelligence' then 'focus' else 'intelligence' end],to_jsonb(1));
 elsif q.category='charisma' then gains:=jsonb_set(gains,'{discipline}',to_jsonb(1));
 else gains:=jsonb_set(gains,'{focus}',to_jsonb(1)); end if;
 if q.quest_type='focus' then gains:=jsonb_set(gains,'{focus}',to_jsonb(greatest(1,(gains->>'focus')::integer))); end if;
 after_attrs:=jsonb_build_object('strength',least(100,a.strength+(gains->>'strength')::integer),'intelligence',least(100,a.intelligence+(gains->>'intelligence')::integer),'focus',least(100,a.focus+(gains->>'focus')::integer),'discipline',least(100,a.discipline+(gains->>'discipline')::integer),'vitality',least(100,a.vitality+(gains->>'vitality')::integer),'charisma',least(100,a.charisma+(gains->>'charisma')::integer));
 select jsonb_object_agg(k,(after_attrs->>k)::integer-(to_jsonb(a)->>k)::integer) into gains from jsonb_object_keys(after_attrs) k;
 update public.attributes set strength=(after_attrs->>'strength')::integer,intelligence=(after_attrs->>'intelligence')::integer,focus=(after_attrs->>'focus')::integer,discipline=(after_attrs->>'discipline')::integer,vitality=(after_attrs->>'vitality')::integer,charisma=(after_attrs->>'charisma')::integer,updated_at=now() where character_id=c.id;
 level_info:=private.level_state(c.xp+reward_xp);
 insert into public.streaks(user_id) values(owner) on conflict do nothing;
 select * into s from public.streaks where user_id=owner for update;
 next_streak:=case when s.last_activity_day=today then s.current_streak when s.last_activity_day=today-1 then s.current_streak+1 else 1 end;
 update public.streaks set current_streak=next_streak,longest_streak=greatest(longest_streak,next_streak),last_activity_day=today,updated_at=now() where user_id=owner;
 update public.characters set xp=xp+reward_xp,credits=credits+reward_credits,level=(level_info->>'level')::integer,streak=next_streak where id=c.id;
 insert into public.quest_completions(user_id,quest_id,progress_id,activity_day,quest_snapshot,xp,credits,attribute_gains,level_before,level_after) values(owner,q.id,p.id,today,to_jsonb(q),reward_xp,reward_credits,gains,c.level,(level_info->>'level')::integer) returning id into completion;
 insert into public.xp_transactions(user_id,completion_id,amount,balance_after) values(owner,completion,reward_xp,c.xp+reward_xp);
 insert into public.credit_transactions(user_id,completion_id,amount,balance_after) values(owner,completion,reward_credits,c.credits+reward_credits);
 update public.quest_progress set status='completed',completed_at=now(),updated_at=now() where id=p.id;
 return level_info||jsonb_build_object('status','completed','xp',reward_xp,'credits',reward_credits,'attribute_gains',gains,'level_up',(level_info->>'level')::integer>c.level,'streak',next_streak,'completion_id',completion);
end; $$;
revoke all on function public.advance_quest(uuid,text,integer) from public,anon;
grant execute on function public.advance_quest(uuid,text,integer) to authenticated;
commit;

