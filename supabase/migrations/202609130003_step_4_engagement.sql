-- Step 4. Apply after Step 3; preserves existing progression and ledgers.
begin;
alter table public.quests add column verification_kind text check(verification_kind in ('gym','home_workout','running','coding','studying','reading'));
update public.quests set verification_kind='gym' where quest_type='verified' and art_key='gym';
create table public.gym_locations(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,name text not null check(char_length(btrim(name)) between 2 and 80),latitude double precision not null check(latitude between -90 and 90),longitude double precision not null check(longitude between -180 and 180),radius_m integer not null default 150 check(radius_m=150),created_at timestamptz not null default now(),unique(id,user_id));
create table public.verification_sessions(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,quest_id uuid not null,progress_id uuid not null,
 method text not null check(method in ('gym','home_workout','running','coding','studying','reading','focus')),verification_level text not null check(verification_level in ('honor','focus','verified','strong_verified')),
 status text not null default 'pending' check(status in ('pending','passed','failed')),confidence integer not null default 0 check(confidence between 0 and 100),reasons jsonb not null default '["Collecting evidence"]',
 gym_id uuid, required_seconds integer not null check(required_seconds between 300 and 14400),active_seconds integer not null default 0 check(active_seconds>=0),dwell_seconds integer not null default 0 check(dwell_seconds>=0),inside_area boolean not null default false,arrival_seen boolean not null default false,travel_seen boolean not null default false,
 paused boolean not null default false,foreground boolean not null default false,last_seen_at timestamptz,started_at timestamptz not null default now(),finished_at timestamptz,
 challenge uuid not null default gen_random_uuid(),checkpoint_due timestamptz not null,checkpoint_expires timestamptz not null,checkpoint_passed boolean not null default false,activity_confirmed boolean not null default false,reflection_received boolean not null default false,
 camera_state text not null default 'unavailable' check(camera_state in ('unavailable','denied','local_preview')),liveness_state text not null default 'unavailable' check(liveness_state='unavailable'),
 foreign key(quest_id,user_id) references public.quests(id,user_id),foreign key(progress_id,user_id) references public.quest_progress(id,user_id),foreign key(gym_id,user_id) references public.gym_locations(id,user_id),unique(id,user_id)
);
create unique index verification_one_live on public.verification_sessions(progress_id) where status in ('pending','passed');
create index verification_owner on public.verification_sessions(user_id,started_at desc);
create table public.verification_signals(id uuid primary key default gen_random_uuid(),session_id uuid not null,user_id uuid not null,request_id uuid not null,kind text not null check(kind in ('heartbeat','location','permission','camera','checkpoint','activity','reflection','pause','resume','exit','final')),received_at timestamptz not null default now(),metadata jsonb not null,foreign key(session_id,user_id) references public.verification_sessions(id,user_id) on delete cascade,unique(session_id,request_id));
create index verification_signals_session on public.verification_signals(session_id,received_at);
create table public.location_checkpoints(id uuid primary key default gen_random_uuid(),session_id uuid not null,user_id uuid not null,received_at timestamptz not null default now(),distance_m integer,accuracy_m integer not null check(accuracy_m>=0),inside_area boolean not null,foreign key(session_id,user_id) references public.verification_sessions(id,user_id) on delete cascade);
create index location_checkpoints_session on public.location_checkpoints(session_id,received_at);
create table public.achievement_definitions(id text primary key,title text not null,description text not null,art_index integer not null,metric text not null check(metric in ('quests','streak','gym','coding','studying','level')),target integer not null check(target>0));
insert into public.achievement_definitions values('first_quest','First Quest','Complete your first quest',0,'quests',1),('seven_day_streak','7 Day Streak','Maintain a seven day streak',1,'streak',7),('gym_veteran','Gym Veteran','Complete 30 passed gym verifications',2,'gym',30),('code_master','Code Master','Complete 50 coding quests',3,'coding',50),('scholar','Scholar','Complete 50 study quests',4,'studying',50),('legendary','Legendary','Reach level 100',5,'level',100);
create table public.user_achievements(user_id uuid not null references public.profiles(id) on delete cascade,achievement_id text not null references public.achievement_definitions(id),unlocked_at timestamptz not null default now(),primary key(user_id,achievement_id));
create table public.cosmetic_items(id text primary key,name text not null,slot text not null check(slot in ('banners','frames','titles','auras','themes','badges','miscellaneous')),art_index integer not null,price integer not null check(price>=0),min_level integer not null default 1 check(min_level>0),required_achievement text references public.achievement_definitions(id),rarity text not null check(rarity in ('common','rare','epic','legendary')));
create table public.inventory(user_id uuid not null references public.profiles(id) on delete cascade,item_id text not null references public.cosmetic_items(id),slot text not null check(slot in ('banners','frames','titles','auras','themes','badges','miscellaneous')),equipped boolean not null default false,acquired_at timestamptz not null default now(),primary key(user_id,item_id));
create unique index inventory_one_equipped_slot on public.inventory(user_id,slot) where equipped;
create table public.cosmetic_purchases(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,item_id text not null references public.cosmetic_items(id),price integer not null check(price>=0),created_at timestamptz not null default now(),unique(user_id,item_id),unique(id,user_id));
alter table public.credit_transactions alter column completion_id drop not null;
alter table public.credit_transactions add column purchase_id uuid unique;
alter table public.credit_transactions add foreign key(purchase_id,user_id) references public.cosmetic_purchases(id,user_id);
alter table public.credit_transactions drop constraint credit_transactions_amount_check;
do $$ declare c record; begin
 for c in select conname from pg_constraint where conrelid='public.credit_transactions'::regclass and contype='c' and pg_get_constraintdef(oid) like '%balance_after%' loop
  execute format('alter table public.credit_transactions drop constraint %I',c.conname);
 end loop;
end;$$;
alter table public.credit_transactions add check(balance_after>=0);
alter table public.credit_transactions add check((completion_id is not null and purchase_id is null and amount>0) or (completion_id is null and purchase_id is not null and amount<0));

-- Private owner evidence and inventory. Catalogs contain no personal evidence.
alter table public.gym_locations enable row level security;
alter table public.verification_sessions enable row level security;
alter table public.verification_signals enable row level security;
alter table public.location_checkpoints enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.cosmetic_items enable row level security;
alter table public.inventory enable row level security;
alter table public.cosmetic_purchases enable row level security;
revoke all on public.gym_locations,public.verification_sessions,public.verification_signals,public.location_checkpoints,public.achievement_definitions,public.user_achievements,public.cosmetic_items,public.inventory,public.cosmetic_purchases from public,anon,authenticated;
grant select on public.gym_locations,public.verification_sessions,public.verification_signals,public.location_checkpoints,public.achievement_definitions,public.user_achievements,public.cosmetic_items,public.inventory,public.cosmetic_purchases to authenticated;
create policy gym_owner on public.gym_locations for select to authenticated using(user_id=(select auth.uid()));
create policy verification_owner on public.verification_sessions for select to authenticated using(user_id=(select auth.uid()));
create policy signals_owner on public.verification_signals for select to authenticated using(user_id=(select auth.uid()));
create policy location_owner on public.location_checkpoints for select to authenticated using(user_id=(select auth.uid()));
create policy achievements_catalog on public.achievement_definitions for select to authenticated using(true);
create policy achievement_owner on public.user_achievements for select to authenticated using(user_id=(select auth.uid()));
create policy cosmetics_catalog on public.cosmetic_items for select to authenticated using(true);
create policy inventory_owner on public.inventory for select to authenticated using(user_id=(select auth.uid()));
create policy purchases_owner on public.cosmetic_purchases for select to authenticated using(user_id=(select auth.uid()));

-- Preserve the Step 3 calculation/atomic transaction, replace only its eligibility gate.
do $$ declare source text; begin
 source:=pg_get_functiondef('public.advance_quest(uuid,text,integer)'::regprocedure);
 source:=replace(source,'if q.quest_type=''verified'' then raise exception ''Verified completion is locked until the verification system is available''; end if;',
 'if q.quest_type in (''verified'',''focus'') and not exists(select 1 from public.verification_sessions v where v.progress_id=p.id and v.user_id=owner and v.status=''passed'') then raise exception ''Complete the required verification or focus session first''; end if;');
 if source not like '%Complete the required verification or focus session first%' then raise exception 'Unexpected Step 3 function version'; end if;
 execute source;
end; $$;
alter function public.advance_quest(uuid,text,integer) set schema private;
alter function private.advance_quest(uuid,text,integer) rename to core_advance_quest;
revoke all on function private.core_advance_quest(uuid,text,integer) from public,anon,authenticated;
create function public.advance_quest(p_id uuid,p_action text,p_units integer default null) returns jsonb language plpgsql security definer set search_path='' as $$ begin return private.core_advance_quest(p_id,p_action,p_units);end;$$;
revoke all on function public.advance_quest(uuid,text,integer) from public,anon;
grant execute on function public.advance_quest(uuid,text,integer) to authenticated;
alter function public.save_quest(uuid,jsonb) set schema private;
alter function private.save_quest(uuid,jsonb) rename to core_save_quest;
revoke all on function private.core_save_quest(uuid,jsonb) from public,anon,authenticated;
create function public.save_quest(p_id uuid,p_data jsonb) returns uuid language plpgsql security definer set search_path='' as $$ declare saved uuid; method text; begin
 method:=nullif(p_data->>'verification_kind','');
 if p_data->>'quest_type'='verified' and (method is null or method not in ('gym','home_workout','running','coding','studying','reading')) then raise exception 'Choose a verification evidence type';end if;
 saved:=private.core_save_quest(p_id,p_data-'verification_kind');
 update public.quests set verification_kind=case when quest_type='verified' then method else null end where id=saved and user_id=auth.uid();return saved;
end;$$;
revoke all on function public.save_quest(uuid,jsonb) from public,anon;
grant execute on function public.save_quest(uuid,jsonb) to authenticated;

create function private.unlock_achievements(owner uuid) returns void language plpgsql set search_path='' as $$
declare d public.achievement_definitions; n integer;
begin
 for d in select * from public.achievement_definitions loop
  n:=case d.metric
  when 'quests' then (select count(*) from public.quest_completions where user_id=owner)
  when 'streak' then coalesce((select longest_streak from public.streaks where user_id=owner),0)
  when 'gym' then (select count(*) from public.verification_sessions v join public.quest_completions c on c.progress_id=v.progress_id where v.user_id=owner and v.method='gym' and v.status='passed')
  when 'coding' then (select count(*) from public.quest_completions where user_id=owner and quest_snapshot->>'art_key'='coding')
  when 'studying' then (select count(*) from public.quest_completions where user_id=owner and quest_snapshot->>'art_key'='study')
  when 'level' then (select level from public.characters where user_id=owner) else 0 end;
  if n>=d.target then insert into public.user_achievements values(owner,d.id,now()) on conflict do nothing;end if;
 end loop;
 insert into public.inventory(user_id,item_id,slot) select owner,i.id,i.slot from public.cosmetic_items i where i.price=0 and i.min_level<=(select level from public.characters where user_id=owner) and (i.required_achievement is null or exists(select 1 from public.user_achievements where user_id=owner and achievement_id=i.required_achievement)) on conflict do nothing;
end;$$;
revoke all on function private.unlock_achievements(uuid) from public,anon,authenticated;
create function private.completion_unlocks() returns trigger language plpgsql security definer set search_path='' as $$begin perform private.unlock_achievements(new.user_id);return new;end;$$;
revoke all on function private.completion_unlocks() from public,anon,authenticated;
create trigger completion_achievements after insert on public.quest_completions for each row execute function private.completion_unlocks();
create function public.sync_engagement() returns void language plpgsql security definer set search_path='' as $$declare owner uuid:=auth.uid();begin
 if owner is null then raise exception 'Authentication required' using errcode='42501';end if;
 perform 1 from public.characters where user_id=owner for update;if not found then raise exception 'Character required';end if;
 perform private.unlock_achievements(owner);
 -- Retain no raw media or coordinates in signals; discard detailed evidence after seven days.
 delete from public.verification_signals where user_id=owner and received_at<now()-interval '7 days';
 delete from public.location_checkpoints where user_id=owner and received_at<now()-interval '7 days';
end;$$;
revoke all on function public.sync_engagement() from public,anon;
grant execute on function public.sync_engagement() to authenticated;
create function public.cosmetic_action(p_item text,p_action text) returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid();c public.characters;i public.cosmetic_items; purchase uuid;
begin
 if owner is null then raise exception 'Authentication required' using errcode='42501';end if;
 select * into c from public.characters where user_id=owner for update;if not found then raise exception 'Character required';end if;
 perform private.unlock_achievements(owner);select * into i from public.cosmetic_items where id=p_item;if not found then raise exception 'Item unavailable';end if;
 if p_action='unequip' then update public.inventory set equipped=false where user_id=owner and item_id=i.id;return jsonb_build_object('message','Unequipped');end if;
 if p_action not in ('buy','equip') or p_action is null then raise exception 'Invalid action';end if;
 if c.level<i.min_level or (i.required_achievement is not null and not exists(select 1 from public.user_achievements where user_id=owner and achievement_id=i.required_achievement)) then raise exception 'Item is locked';end if;
 if p_action='buy' then
  if exists(select 1 from public.inventory where user_id=owner and item_id=i.id) then return jsonb_build_object('message','Already owned');end if;
  if c.credits<i.price then raise exception 'Not enough credits';end if;
  insert into public.cosmetic_purchases(user_id,item_id,price) values(owner,i.id,i.price) returning id into purchase;
  update public.characters set credits=credits-i.price where id=c.id;
  if i.price>0 then insert into public.credit_transactions(user_id,purchase_id,amount,balance_after) values(owner,purchase,-i.price,c.credits-i.price);end if;
  insert into public.inventory(user_id,item_id,slot) values(owner,i.id,i.slot);return jsonb_build_object('message','Cosmetic added to inventory');
 end if;
 if not exists(select 1 from public.inventory where user_id=owner and item_id=i.id) then raise exception 'Own this item before equipping';end if;
 update public.inventory set equipped=false where user_id=owner and slot=i.slot;
 update public.inventory set equipped=true where user_id=owner and item_id=i.id;return jsonb_build_object('message','Equipped');
end;$$;
revoke all on function public.cosmetic_action(text,text) from public,anon;
grant execute on function public.cosmetic_action(text,text) to authenticated;

create function public.save_gym(p_name text,p_lat double precision,p_lon double precision) returns uuid language plpgsql security definer set search_path='' as $$declare owner uuid:=auth.uid();saved uuid;begin
 if owner is null then raise exception 'Authentication required' using errcode='42501';end if;
 perform 1 from public.characters where user_id=owner for update;if not found then raise exception 'Character required';end if;
 if (select count(*) from public.gym_locations where user_id=owner)>=10 then raise exception 'Maximum 10 saved locations';end if;
 insert into public.gym_locations(user_id,name,latitude,longitude) values(owner,btrim(p_name),p_lat,p_lon) returning id into saved;return saved;
end;$$;
revoke all on function public.save_gym(text,double precision,double precision) from public,anon;
grant execute on function public.save_gym(text,double precision,double precision) to authenticated;
create function public.start_verification(p_quest uuid,p_gym uuid default null,p_strong boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid();q public.quests;p public.quest_progress;existing uuid;method text;due timestamptz;
begin
 if owner is null then raise exception 'Authentication required' using errcode='42501';end if;
 perform 1 from public.characters where user_id=owner for update;
 select * into q from public.quests where id=p_quest and user_id=owner and archived_at is null;if not found then raise exception 'Quest unavailable';end if;
 method:=case when q.quest_type='focus' then 'focus' else q.verification_kind end;
 if method is null or q.quest_type not in ('verified','focus') then raise exception 'This quest uses Honor completion';end if;
 if method='gym' and not exists(select 1 from public.gym_locations where id=p_gym and user_id=owner) then raise exception 'Choose your saved gym';end if;
 perform private.core_advance_quest(p_quest,'start',null);
 select * into p from public.quest_progress where quest_id=p_quest and period=case when q.recurrence='daily' then (now() at time zone 'UTC')::date else date '1970-01-01' end;
 select id into existing from public.verification_sessions where progress_id=p.id and status in ('pending','passed');
 if existing is not null then return existing;end if;
 if p.status='completed' then raise exception 'Quest already completed';end if;
 if (select count(*) from public.verification_sessions where progress_id=p.id)>=3 then raise exception 'Maximum three session attempts per occurrence';end if;
 due:=now()+make_interval(secs=>floor(q.duration_minutes*60*(0.35+random()*0.25))::integer);
 insert into public.verification_sessions(user_id,quest_id,progress_id,method,verification_level,gym_id,required_seconds,checkpoint_due,checkpoint_expires)
 values(owner,q.id,p.id,method,case when p_strong then 'strong_verified' when method='focus' then 'focus' else 'verified' end,case when method='gym' then p_gym else null end,q.duration_minutes*60,due,due+interval '2 minutes') returning id into existing;return existing;
end;$$;
revoke all on function public.start_verification(uuid,uuid,boolean) from public,anon;
grant execute on function public.start_verification(uuid,uuid,boolean) to authenticated;

create function public.submit_verification(p_session uuid,p_request uuid,p_kind text,p_data jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid();s public.verification_sessions;g public.gym_locations;q public.quests;dt integer:=0;distance double precision;accuracy double precision;inside boolean:=false;good boolean:=false;meta jsonb:='{}';issues jsonb:='[]';reward jsonb;ref text;
begin
 if owner is null then raise exception 'Authentication required' using errcode='42501';end if;
 perform 1 from public.characters where user_id=owner for update;
 select * into s from public.verification_sessions where id=p_session and user_id=owner for update;if not found then raise exception 'Session unavailable' using errcode='42501';end if;
 if p_request is null or p_kind is null or p_kind not in ('heartbeat','location','permission','camera','checkpoint','activity','reflection','pause','resume','exit','final') then raise exception 'Invalid signal';end if;
 if p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>2000 then raise exception 'Invalid evidence';end if;
 if exists(select 1 from jsonb_object_keys(p_data) k where k not in ('visible','latitude','longitude','accuracy','state','challenge','confirmed','reflection')) then raise exception 'Unexpected evidence fields';end if;
 if exists(select 1 from public.verification_signals where session_id=s.id and request_id=p_request) then return jsonb_build_object('status',s.status,'replayed',true);end if;
 if s.status<>'pending' then return jsonb_build_object('status',s.status,'confidence',s.confidence,'reasons',s.reasons,'replayed',true);end if;
 select * into q from public.quests where id=s.quest_id and user_id=owner;
 if q.archived_at is not null then raise exception 'Quest archived';end if;
 if s.started_at<now()-interval '24 hours' then update public.verification_sessions set status='failed',reasons='["Session expired after 24 hours"]',finished_at=now() where id=s.id;return jsonb_build_object('status','failed','reasons',jsonb_build_array('Session expired'));end if;
 if (select count(*) from public.verification_signals where session_id=s.id)>=2000 then raise exception 'Session signal limit reached';end if;
 if s.last_seen_at is not null then dt:=greatest(0,floor(extract(epoch from now()-s.last_seen_at))::integer);end if;
 if p_kind in ('heartbeat','location') and s.last_seen_at is not null and dt<3 then return jsonb_build_object('status','pending','message','Sample received too soon');end if;
 if p_kind='location' then
  if s.method not in ('gym','running') then raise exception 'Location not required for this method';end if;
  accuracy:=(p_data->>'accuracy')::double precision;
  if accuracy is null or not (accuracy between 0 and 10000) or not ((p_data->>'latitude')::double precision between -90 and 90) or not ((p_data->>'longitude')::double precision between -180 and 180) or p_data->>'latitude' is null or p_data->>'longitude' is null then raise exception 'Invalid location';end if;
  if s.method='gym' then
   select * into g from public.gym_locations where id=s.gym_id and user_id=owner;
   distance:=6371000*2*asin(sqrt(least(1,power(sin(radians((p_data->>'latitude')::double precision-g.latitude)/2),2)+cos(radians(g.latitude))*cos(radians((p_data->>'latitude')::double precision))*power(sin(radians((p_data->>'longitude')::double precision-g.longitude)/2),2))));
   inside:=accuracy<=50 and distance+accuracy<=g.radius_m;
  end if;
  good:=inside and coalesce((p_data->>'visible')::boolean,false);
  update public.verification_sessions set dwell_seconds=case when good and s.inside_area and not s.paused and dt between 3 and 45 then dwell_seconds+least(dt,30) when not good or dt>45 then 0 else dwell_seconds end,active_seconds=active_seconds+case when good and s.inside_area and not s.paused and dt between 3 and 45 then least(dt,30) else 0 end,inside_area=good,arrival_seen=arrival_seen or inside,travel_seen=travel_seen or (accuracy<=50 and distance>g.radius_m),last_seen_at=now() where id=s.id;
  insert into public.location_checkpoints(session_id,user_id,distance_m,accuracy_m,inside_area) values(s.id,owner,round(distance)::integer,ceil(accuracy)::integer,inside);
  meta:=jsonb_build_object('accuracy_m',ceil(accuracy),'inside_area',inside,'distance_m',round(distance),'state',case when accuracy>50 then 'inaccurate' when inside then 'inside' else 'outside_or_uncertain' end);
 elsif p_kind='heartbeat' then
  if s.method in ('gym','running') then raise exception 'Location sample required for this method';end if;
  good:=coalesce((p_data->>'visible')::boolean,false);
  update public.verification_sessions set active_seconds=active_seconds+case when s.method in ('focus','coding','studying','reading','home_workout') and good and s.foreground and not s.paused and dt between 3 and 45 then least(dt,30) else 0 end,foreground=good,last_seen_at=now() where id=s.id;
  meta:=jsonb_build_object('visible',good,'credited_seconds',case when good and s.foreground and not s.paused and dt between 3 and 45 then least(dt,30) else 0 end);
 elsif p_kind='permission' then
  if p_data->>'state' not in ('denied','unavailable','inaccurate') or p_data->>'state' is null then raise exception 'Invalid permission state';end if;
  update public.verification_sessions set inside_area=false,dwell_seconds=0,last_seen_at=null,reasons=jsonb_build_array('Permission or GPS '||(p_data->>'state')) where id=s.id;meta:=jsonb_build_object('state',p_data->>'state');
 elsif p_kind='camera' then
  if p_data->>'state' not in ('unavailable','denied','local_preview') or p_data->>'state' is null then raise exception 'Invalid camera state';end if;
  update public.verification_sessions set camera_state=p_data->>'state' where id=s.id;meta:=jsonb_build_object('state',p_data->>'state','liveness','unavailable');
 elsif p_kind='checkpoint' then
  if p_data->>'challenge' is distinct from s.challenge::text or now()<s.checkpoint_due or now()>s.checkpoint_expires then
   update public.verification_sessions set status='failed',reasons='["Invalid or missed random checkpoint"]',finished_at=now() where id=s.id;
  else update public.verification_sessions set checkpoint_passed=true where id=s.id;end if;
  meta:=jsonb_build_object('in_window',now() between s.checkpoint_due and s.checkpoint_expires);
 elsif p_kind='activity' then
  if coalesce((p_data->>'confirmed')::boolean,false) is not true then raise exception 'Confirm completed activity';end if;
  update public.verification_sessions set activity_confirmed=true where id=s.id;meta:='{"self_reported":true}';
 elsif p_kind='reflection' then
  ref:=btrim(p_data->>'reflection');if ref is null or char_length(ref) not between 20 and 1000 then raise exception 'Reflection must be 20 to 1000 characters';end if;
  update public.verification_sessions set reflection_received=true where id=s.id;meta:=jsonb_build_object('received',true,'characters',char_length(ref));
 elsif p_kind in ('pause','resume') then
  update public.verification_sessions set paused=p_kind='pause',foreground=false,last_seen_at=null,inside_area=false,dwell_seconds=case when p_kind='pause' then 0 else dwell_seconds end where id=s.id;meta:=jsonb_build_object('paused',p_kind='pause');
 elsif p_kind='exit' then update public.verification_sessions set status='failed',reasons='["Session exited; no rewards awarded"]',finished_at=now() where id=s.id;
 elsif p_kind='final' then
  if s.paused then issues:=issues||jsonb_build_array('Session is paused');end if;
  if s.active_seconds<s.required_seconds then issues:=issues||jsonb_build_array('Insufficient active duration');end if;
  if s.last_seen_at is null or now()-s.last_seen_at>interval '45 seconds' then issues:=issues||jsonb_build_array('A fresh foreground signal is required');end if;
  if not s.checkpoint_passed then issues:=issues||jsonb_build_array('Random checkpoint not completed');end if;
  if not s.activity_confirmed then issues:=issues||jsonb_build_array('Activity confirmation missing');end if;
  if s.method='gym' and (not s.inside_area or s.dwell_seconds<least(600,s.required_seconds)) then issues:=issues||jsonb_build_array('Geofence or continuous dwell requirement not met');end if;
  if s.method in ('coding','studying','reading','home_workout') and not s.reflection_received then issues:=issues||jsonb_build_array('Reflection/check-in missing');end if;
  if s.method in ('home_workout','running','coding','studying','reading') then issues:=issues||jsonb_build_array('Task-specific independent evidence unavailable in this browser; use a Focus or Honor quest for self-reported work');end if;
  if s.verification_level='strong_verified' then issues:=issues||jsonb_build_array('Independent identity/liveness attestation unavailable; Strong Verified remains pending');end if;
  if not s.checkpoint_passed and now()>s.checkpoint_expires then
   update public.verification_sessions set status='failed',confidence=0,reasons=issues||jsonb_build_array('Random checkpoint expired'),finished_at=now() where id=s.id;
  elsif jsonb_array_length(issues)>0 then update public.verification_sessions set confidence=least(60,(case when s.arrival_seen then 10 else 0 end)+(case when s.checkpoint_passed then 20 else 0 end)+(case when s.active_seconds>=s.required_seconds then 30 else 0 end)),reasons=issues where id=s.id;
  else
   update public.verification_sessions set status='passed',confidence=case when s.method='gym' then 80 else 65 end,reasons=jsonb_build_array('Server duration and random checkpoint passed',case when s.method='gym' then 'Accurate foreground geofence and dwell signals passed; browser GPS can be spoofed' else 'Foreground timer/check-ins passed; other applications are not monitored' end,'Activity is self-confirmed; biometric identity is unavailable'),finished_at=now() where id=s.id;
   update public.quest_progress set units=q.target_units where id=s.progress_id;
   reward:=private.core_advance_quest(s.quest_id,'complete',null);
  end if;
 end if;
 insert into public.verification_signals(session_id,user_id,request_id,kind,metadata) values(s.id,owner,p_request,p_kind,meta);
 select * into s from public.verification_sessions where id=s.id;
 return jsonb_build_object('status',s.status,'confidence',s.confidence,'reasons',s.reasons,'reward',reward);
end;$$;
revoke all on function public.submit_verification(uuid,uuid,text,jsonb) from public,anon;
grant execute on function public.submit_verification(uuid,uuid,text,jsonb) to authenticated;
-- Catalog inserted below; all items are cosmetic, including the gems illustration.

insert into public.cosmetic_items values('banners-0','Discipline Builds Freedom','banners',0,0,1,null,'common');
insert into public.cosmetic_items values('banners-1','Better Habits Brighter You','banners',1,150,1,null,'rare');
insert into public.cosmetic_items values('banners-2','Small Steps Big Changes','banners',2,250,6,null,'rare');
insert into public.cosmetic_items values('banners-3','Same Person Stronger Tomorrow','banners',3,350,9,'legendary','legendary');
insert into public.cosmetic_items values('frames-0','Default frame','frames',0,0,1,null,'common');
insert into public.cosmetic_items values('frames-1','Bronze frame','frames',1,150,1,null,'rare');
insert into public.cosmetic_items values('frames-2','Silver frame','frames',2,250,6,null,'rare');
insert into public.cosmetic_items values('frames-3','Gold frame','frames',3,350,9,null,'epic');
insert into public.cosmetic_items values('frames-4','Platinum frame','frames',4,450,12,null,'epic');
insert into public.cosmetic_items values('frames-5','Diamond frame','frames',5,550,15,'legendary','legendary');
insert into public.cosmetic_items values('titles-0','Habit Builder','titles',0,0,1,null,'common');
insert into public.cosmetic_items values('titles-1','Focus Master','titles',1,150,1,null,'rare');
insert into public.cosmetic_items values('titles-2','Consistent','titles',2,250,6,null,'rare');
insert into public.cosmetic_items values('titles-3','Quest Champion','titles',3,350,9,'legendary','legendary');
insert into public.cosmetic_items values('auras-0','Calm aura','auras',0,0,1,null,'common');
insert into public.cosmetic_items values('auras-1','Focused aura','auras',1,150,1,null,'rare');
insert into public.cosmetic_items values('auras-2','Legendary aura','auras',2,250,6,'legendary','legendary');
insert into public.cosmetic_items values('themes-0','Night Citadel','themes',0,0,1,null,'common');
insert into public.cosmetic_items values('themes-1','Forest Sanctuary','themes',1,150,1,null,'rare');
insert into public.cosmetic_items values('themes-2','Void Realm','themes',2,250,6,null,'rare');
insert into public.cosmetic_items values('themes-3','Sunset Peaks','themes',3,350,9,null,'epic');
insert into public.cosmetic_items values('themes-4','Cyber City','themes',4,450,12,null,'epic');
insert into public.cosmetic_items values('themes-5','Ancient Ruins','themes',5,550,15,'legendary','legendary');
insert into public.cosmetic_items values('miscellaneous-0','Gems','miscellaneous',0,0,1,null,'common');
insert into public.cosmetic_items values('miscellaneous-1','Chest','miscellaneous',1,150,1,null,'rare');
insert into public.cosmetic_items values('miscellaneous-2','Scroll','miscellaneous',2,250,6,null,'rare');
insert into public.cosmetic_items values('miscellaneous-3','Time Boost','miscellaneous',3,350,9,null,'epic');
insert into public.cosmetic_items values('miscellaneous-4','Growth','miscellaneous',4,450,12,null,'epic');
insert into public.cosmetic_items values('miscellaneous-5','Companion','miscellaneous',5,550,15,null,'epic');
insert into public.cosmetic_items values('miscellaneous-6','Knowledge','miscellaneous',6,650,18,null,'epic');
insert into public.cosmetic_items values('miscellaneous-7','Emote','miscellaneous',7,750,21,null,'epic');
insert into public.cosmetic_items values('miscellaneous-8','Lantern','miscellaneous',8,850,24,null,'epic');
insert into public.cosmetic_items values('miscellaneous-9','Flag','miscellaneous',9,950,27,'legendary','legendary');
insert into public.cosmetic_items values('badges-0','First Quest','badges',0,0,1,'first_quest','common');
insert into public.cosmetic_items values('badges-1','7 Day Streak','badges',1,0,1,'seven_day_streak','legendary');
insert into public.cosmetic_items values('badges-2','Gym Veteran','badges',2,0,1,'gym_veteran','legendary');
insert into public.cosmetic_items values('badges-3','Code Master','badges',3,0,1,'code_master','legendary');
insert into public.cosmetic_items values('badges-4','Scholar','badges',4,0,1,'scholar','legendary');
insert into public.cosmetic_items values('badges-5','Legendary','badges',5,0,1,'legendary','legendary');

create function public.clear_evidence(p_session uuid) returns void language plpgsql security definer set search_path='' as $$declare owner uuid:=auth.uid();begin
 if owner is null then raise exception 'Authentication required' using errcode='42501';end if;
 perform 1 from public.characters where user_id=owner for update;
 perform 1 from public.verification_sessions where id=p_session and user_id=owner for update;if not found then raise exception 'Session unavailable' using errcode='42501';end if;
 update public.verification_sessions set status=case when status='pending' then 'failed' else status end,reasons=jsonb_build_array('Detailed evidence removed by owner; reward history retained'),finished_at=coalesce(finished_at,now()) where id=p_session;
 delete from public.verification_signals where session_id=p_session and user_id=owner;
 delete from public.location_checkpoints where session_id=p_session and user_id=owner;
end;$$;
revoke all on function public.clear_evidence(uuid) from public,anon;
grant execute on function public.clear_evidence(uuid) to authenticated;
create function public.remove_gym(p_gym uuid) returns void language plpgsql security definer set search_path='' as $$declare owner uuid:=auth.uid();begin
 if owner is null then raise exception 'Authentication required' using errcode='42501';end if;
 perform 1 from public.characters where user_id=owner for update;
 if exists(select 1 from public.verification_sessions where user_id=owner and gym_id=p_gym and status='pending') then raise exception 'Exit the active gym session before removing its location';end if;
 update public.verification_sessions set gym_id=null where user_id=owner and gym_id=p_gym;
 delete from public.gym_locations where id=p_gym and user_id=owner;if not found then raise exception 'Gym unavailable';end if;
end;$$;
revoke all on function public.remove_gym(uuid) from public,anon;
grant execute on function public.remove_gym(uuid) to authenticated;
commit;




