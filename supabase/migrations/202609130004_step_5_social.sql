-- Step 5. Re-runnable, additive migration; preserves Steps 2–4.
begin;
alter table public.privacy_settings add column if not exists profile_visibility text not null default 'private' check(profile_visibility in ('public','friends','private'));
alter table public.privacy_settings add column if not exists show_attributes boolean not null default false;
alter table public.privacy_settings add column if not exists show_streak boolean not null default false;
alter table public.privacy_settings add column if not exists show_achievements boolean not null default false;
alter table public.privacy_settings add column if not exists show_cosmetics boolean not null default false;
alter table public.privacy_settings add column if not exists leaderboard_opt_in boolean not null default false;
create table if not exists public.friendships (
 id uuid primary key default gen_random_uuid(), user_low uuid not null references public.profiles(id) on delete cascade, user_high uuid not null references public.profiles(id) on delete cascade,
 sender_id uuid not null references public.profiles(id), status text not null check(status in ('pending','accepted','rejected','cancelled','removed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(user_low<user_high), check(sender_id in (user_low,user_high)), unique(user_low,user_high));
create index if not exists friendships_high_status on public.friendships(user_high,status);
create index if not exists friendships_low_status on public.friendships(user_low,status);
create table if not exists public.featured_achievements(user_id uuid not null references public.profiles(id) on delete cascade,achievement_id text not null references public.achievement_definitions(id),position integer not null check(position between 1 and 3),primary key(user_id,achievement_id),unique(user_id,position),foreign key(user_id,achievement_id) references public.user_achievements(user_id,achievement_id) on delete cascade);
-- Immutable qualifying ledger, independent of later quest edits or evidence cleanup.
create table if not exists public.verified_progress(completion_id uuid primary key references public.quest_completions(id),user_id uuid not null references public.profiles(id) on delete cascade,xp integer not null check(xp>0),completed_at timestamptz not null);
create index if not exists verified_progress_week on public.verified_progress(completed_at,user_id) include(xp);
create index if not exists verified_progress_owner on public.verified_progress(user_id) include(xp,completed_at);
alter table public.friendships enable row level security;
alter table public.featured_achievements enable row level security;
alter table public.verified_progress enable row level security;
revoke all on public.friendships,public.featured_achievements,public.verified_progress from public,anon,authenticated;
grant select on public.friendships,public.featured_achievements,public.verified_progress to authenticated;
drop policy if exists friendship_participants on public.friendships;
create policy friendship_participants on public.friendships for select to authenticated using(auth.uid() in (user_low,user_high));
drop policy if exists featured_owner on public.featured_achievements;
create policy featured_owner on public.featured_achievements for select to authenticated using(user_id=(select auth.uid()));
drop policy if exists verified_progress_owner on public.verified_progress;
create policy verified_progress_owner on public.verified_progress for select to authenticated using(user_id=(select auth.uid()));
create or replace function private.record_verified_progress() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into public.verified_progress(completion_id,user_id,xp,completed_at) select new.id,new.user_id,new.xp,new.completed_at where exists(select 1 from public.verification_sessions s where s.progress_id=new.progress_id and s.user_id=new.user_id and s.status='passed' and s.verification_level in ('verified','strong_verified')) on conflict do nothing;return new;end;$$;
drop trigger if exists record_verified_progress on public.quest_completions;
create trigger record_verified_progress after insert on public.quest_completions for each row execute function private.record_verified_progress();
insert into public.verified_progress select c.id,c.user_id,c.xp,c.completed_at from public.quest_completions c where exists(select 1 from public.verification_sessions s where s.progress_id=c.progress_id and s.user_id=c.user_id and s.status='passed' and s.verification_level in ('verified','strong_verified')) on conflict do nothing;
create or replace function private.social_visible(target uuid,viewer uuid) returns boolean language sql stable set search_path='' as $$
 select viewer is not null and exists(select 1 from public.privacy_settings p where p.user_id=target and (target=viewer or p.profile_visibility='public' or (p.profile_visibility='friends' and exists(select 1 from public.friendships f where f.user_low=least(target,viewer) and f.user_high=greatest(target,viewer) and f.status='accepted'))));$$;
create or replace function public.friend_action(p_target uuid,p_action text) returns text language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid(); f public.friendships; lo uuid; hi uuid;
begin
 if owner is null then raise exception 'Authentication required';end if;
 if p_target is null or owner=p_target or p_action is null or p_action not in ('send','accept','reject','cancel','remove') then raise exception 'Invalid friendship action';end if;
 lo:=least(owner,p_target);hi:=greatest(owner,p_target);
 perform pg_advisory_xact_lock(hashtextextended(lo::text||hi::text,5));
 select * into f from public.friendships where user_low=lo and user_high=hi for update;
 if p_action='send' then
  if not exists(select 1 from public.privacy_settings where user_id=p_target and discoverable and profile_visibility='public') then raise exception 'Player unavailable for discovery';end if;
  if f.status in ('pending','accepted') then raise exception 'Relationship already exists';end if;
  if f.status='rejected' and f.updated_at>now()-interval '24 hours' then raise exception 'Please wait before sending another request';end if;
  insert into public.friendships(user_low,user_high,sender_id,status) values(lo,hi,owner,'pending') on conflict(user_low,user_high) do update set sender_id=owner,status='pending',updated_at=now();return 'Friend request sent';
 end if;
 if f.id is null then raise exception 'Relationship unavailable';end if;
 if p_action in ('accept','reject') and (f.status<>'pending' or f.sender_id=owner) then raise exception 'Only the recipient may respond to a pending request';end if;
 if p_action='cancel' and (f.status<>'pending' or f.sender_id<>owner) then raise exception 'Only the sender may cancel a pending request';end if;
 if p_action='remove' and f.status<>'accepted' then raise exception 'Friendship is not accepted';end if;
 update public.friendships set status=case p_action when 'accept' then 'accepted' when 'reject' then 'rejected' when 'cancel' then 'cancelled' else 'removed' end,updated_at=now() where id=f.id;
 return case p_action when 'accept' then 'Friend request accepted' when 'reject' then 'Friend request rejected' when 'cancel' then 'Friend request cancelled' else 'Friend removed' end;
end;$$;
create or replace function public.save_social_profile(p_name text,p_privacy jsonb,p_featured text[]) returns text language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid(); k text;begin
 if owner is null then raise exception 'Authentication required';end if;
 if p_name is null or char_length(btrim(p_name)) not between 2 and 40 or p_name !~ '^[[:alnum:] ._''-]+$' then raise exception 'Invalid display name';end if;
 if p_privacy is null or jsonb_typeof(p_privacy)<>'object' or (select count(*) from jsonb_object_keys(p_privacy))<>8 then raise exception 'Invalid privacy settings';end if;
 for k in select jsonb_object_keys(p_privacy) loop
  if k not in ('profile_visibility','discoverable','show_progress','show_attributes','show_streak','show_achievements','show_cosmetics','leaderboard_opt_in') then raise exception 'Invalid privacy field';end if;
  if k<>'profile_visibility' and jsonb_typeof(p_privacy->k)<>'boolean' then raise exception 'Invalid privacy value';end if;
 end loop;
 if (p_privacy->>'profile_visibility') not in ('public','friends','private') or jsonb_typeof(p_privacy->'profile_visibility')<>'string' then raise exception 'Invalid visibility';end if;
 if p_featured is null or cardinality(p_featured)>3 or (select count(distinct x) from unnest(p_featured) x)<>cardinality(p_featured) then raise exception 'Choose up to three different achievements';end if;
 perform 1 from public.profiles where id=owner for update;
 if not found then raise exception 'Character setup required';end if;
 if exists(select 1 from unnest(p_featured) x where not exists(select 1 from public.user_achievements where user_id=owner and achievement_id=x)) then raise exception 'Achievement not unlocked';end if;
 update public.profiles set display_name=btrim(p_name) where id=owner;
 update public.privacy_settings set profile_visibility=p_privacy->>'profile_visibility',discoverable=(p_privacy->>'discoverable')::boolean,show_progress=(p_privacy->>'show_progress')::boolean,show_attributes=(p_privacy->>'show_attributes')::boolean,show_streak=(p_privacy->>'show_streak')::boolean,show_achievements=(p_privacy->>'show_achievements')::boolean,show_cosmetics=(p_privacy->>'show_cosmetics')::boolean,leaderboard_opt_in=(p_privacy->>'leaderboard_opt_in')::boolean where user_id=owner;
 delete from public.featured_achievements where user_id=owner;
 insert into public.featured_achievements select owner,x,ord::integer from unnest(p_featured) with ordinality t(x,ord);
 return 'Profile and privacy updated';end;$$;
create or replace function public.rpg_profile(p_target uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare owner uuid:=auth.uid(); prefs public.privacy_settings; c public.characters; result jsonb; own boolean:=owner=p_target;begin
 if not private.social_visible(p_target,owner) then raise exception 'Profile unavailable or private';end if;
 select * into prefs from public.privacy_settings where user_id=p_target;select * into c from public.characters where user_id=p_target;
 result:=jsonb_build_object('id',p_target,'name',(select display_name from public.profiles where id=p_target),'class',c.class,'own',own);
 if own or prefs.show_progress then result:=result||jsonb_build_object('level',c.level,'xp',c.xp,'verified_xp',(select coalesce(sum(xp),0) from public.verified_progress where user_id=p_target),'progress',private.level_state(c.xp));end if;
 if own or prefs.show_attributes then result:=result||jsonb_build_object('attributes',(select jsonb_build_object('strength',strength,'intelligence',intelligence,'focus',focus,'discipline',discipline,'vitality',vitality,'charisma',charisma) from public.attributes where character_id=c.id));end if;
 if own or prefs.show_streak then result:=result||jsonb_build_object('streak',(select coalesce(max(case when last_activity_day>=(now() at time zone 'UTC')::date-1 then current_streak else 0 end),0) from public.streaks where user_id=p_target));end if;
 if own or prefs.show_achievements then result:=result||jsonb_build_object('achievements',(select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'name',d.title,'art_index',d.art_index,'unlocked_at',a.unlocked_at,'featured_position',f.position) order by f.position nulls last,d.art_index),'[]') from public.user_achievements a join public.achievement_definitions d on d.id=a.achievement_id left join public.featured_achievements f on f.user_id=a.user_id and f.achievement_id=a.achievement_id where a.user_id=p_target));end if;
 if own or prefs.show_cosmetics then result:=result||jsonb_build_object('cosmetics',(select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'name',i.name,'slot',i.slot,'art_index',i.art_index,'rarity',i.rarity) order by i.slot),'[]') from public.inventory inv join public.cosmetic_items i on i.id=inv.item_id where inv.user_id=p_target and inv.equipped));end if;
 return result;end;$$;
create or replace function public.social_hall(p_query text default '',p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare owner uuid:=auth.uid();begin
 if owner is null then raise exception 'Authentication required';end if;
 if p_query is null or length(p_query)>60 or p_offset is null or p_offset<0 or p_offset>10000 then raise exception 'Invalid search';end if;
 return jsonb_build_object('user_id',owner,'relationships',(select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'target',case when f.user_low=owner then f.user_high else f.user_low end,'name',case when private.social_visible(p.id,owner) then p.display_name else 'Private adventurer' end,'visible',private.social_visible(p.id,owner),'status',f.status,'incoming',f.sender_id<>owner,'updated_at',f.updated_at) order by f.updated_at desc),'[]') from public.friendships f join public.profiles p on p.id=case when f.user_low=owner then f.user_high else f.user_low end where owner in (f.user_low,f.user_high)),
 'results',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select p.id,p.display_name as name,c.class from public.profiles p join public.characters c on c.user_id=p.id join public.privacy_settings s on s.user_id=p.id where p.id<>owner and s.discoverable and s.profile_visibility='public' and (btrim(p_query)='' or position(lower(btrim(p_query)) in lower(p.display_name))>0) order by lower(p.display_name),p.id limit 20 offset p_offset) t));end;$$;
create or replace function public.rpg_leaderboard(p_metric text,p_offset integer default 0) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare owner uuid:=auth.uid(); start_week timestamptz:=date_trunc('week',now() at time zone 'UTC') at time zone 'UTC'; answer jsonb;begin
 if owner is null then raise exception 'Authentication required';end if;
 if p_metric is null or p_metric not in ('weekly_verified_xp','overall_verified_xp','streak','strength','intelligence','focus','discipline') or p_offset is null or p_offset<0 or p_offset>10000 then raise exception 'Invalid leaderboard';end if;
 with totals as (select user_id,sum(xp) overall,sum(xp) filter(where completed_at>=start_week and completed_at<start_week+interval '7 days') weekly from public.verified_progress group by user_id), eligible as (
 select p.id,p.display_name as name,c.class,case p_metric when 'weekly_verified_xp' then coalesce(v.weekly,0) when 'overall_verified_xp' then coalesce(v.overall,0) when 'streak' then case when s.last_activity_day>=(now() at time zone 'UTC')::date-1 then s.current_streak else 0 end when 'strength' then a.strength when 'intelligence' then a.intelligence when 'focus' then a.focus when 'discipline' then a.discipline end as value
 from public.profiles p join public.privacy_settings pref on pref.user_id=p.id join public.characters c on c.user_id=p.id join public.attributes a on a.character_id=c.id left join public.streaks s on s.user_id=p.id left join totals v on v.user_id=p.id
 where pref.profile_visibility='public' and pref.leaderboard_opt_in and case when p_metric in ('weekly_verified_xp','overall_verified_xp') then pref.show_progress when p_metric='streak' then pref.show_streak else pref.show_attributes end), ranked as (select *,rank() over(order by value desc) as rank from eligible), page as (select * from ranked order by rank,id limit 25 offset p_offset)
 select jsonb_build_object('metric',p_metric,'week_start',start_week,'week_end',start_week+interval '7 days','total',(select count(*) from ranked),'rows',(select coalesce(jsonb_agg(to_jsonb(page) order by rank,id),'[]') from page),'me',(select to_jsonb(r) from ranked r where id=owner)) into answer;
 return answer;end;$$;
-- Keep original profiles, attributes, characters and evidence owner-only. Shared RPCs return explicit allowlists.
revoke all on function private.record_verified_progress(),private.social_visible(uuid,uuid) from public,anon,authenticated;
revoke all on function public.friend_action(uuid,text),public.save_social_profile(text,jsonb,text[]),public.rpg_profile(uuid),public.social_hall(text,integer),public.rpg_leaderboard(text,integer) from public,anon,authenticated;
grant execute on function public.friend_action(uuid,text),public.save_social_profile(text,jsonb,text[]),public.rpg_profile(uuid),public.social_hall(text,integer),public.rpg_leaderboard(text,integer) to authenticated;
commit;

