import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('Step 3 authoritative core RPG engine',async t=>{
 const db=new PGlite();const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 const as=(id,fn,role='authenticated')=>db.transaction(async tx=>{await tx.exec(`set local role ${role}`);await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);return fn(tx);});
 const call=(id,sql,args=[])=>as(id,tx=>tx.query(sql,args));
 const data=(extra={})=>({title:'Meaningful task',description:'Test task',category:'intelligence',quest_type:'custom',recurrence:'once',difficulty:'easy',duration_minutes:5,completion_condition:'Finish the defined task',target_units:1,...extra});
 const create=async(extra={},owner=a)=>(await call(owner,'select public.save_quest(null,$1) id',[data(extra)])).rows[0].id;
 const advance=(id,action,units=null,owner=a)=>call(owner,'select public.advance_quest($1,$2,$3) result',[id,action,units]);
 const mature=id=>db.query("update public.quest_progress set started_at=now()-interval '5 hours' where quest_id=$1",[id]);
 const finish=async id=>{await advance(id,'start');await advance(id,'progress',1);await mature(id);return (await advance(id,'complete')).rows[0].result;};
 try {
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
  for(const name of ['202609130001_step_2_identity.sql','202609130002_step_3_core_engine.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
  for(const id of [a,b]){await db.query('insert into auth.users values($1)',[id]);await call(id,"select public.complete_character_setup('Player','Balanced')");}
  await t.test('daily seeding is idempotent and does not reset Step 2 data',async()=>{
   await call(a,'select public.sync_daily_quests()');await call(a,'select public.sync_daily_quests()');
   assert.equal((await call(a,'select * from public.quests')).rows.length,6);
   assert.equal((await db.query('select xp from public.characters where user_id=$1',[a])).rows[0].xp,0);
  });
  let quest;
  await t.test('custom CRUD and ownership, rejected client rewards',async()=>{
   quest=await create();await call(a,'select public.save_quest($1,$2)',[quest,data({title:'Edited task'})]);
   assert.equal((await call(a,'select title from public.quests where id=$1',[quest])).rows[0].title,'Edited task');
   assert.equal((await call(b,'select * from public.quests where id=$1',[quest])).rows.length,0);
   await assert.rejects(call(b,'select public.save_quest($1,$2)',[quest,data()]));
   await assert.rejects(call(b,'select public.archive_quest($1)',[quest]));
   await assert.rejects(advance(quest,'start',null,b));
   await assert.rejects(call(a,'select public.save_quest(null,$1)',[{...data(),xp:99999}]));
   const removed=await create();await call(a,'select public.archive_quest($1)',[removed]);await assert.rejects(advance(removed,'start'));
  });
  await t.test('start and monotonic progress persist; duration and conditions gate completion',async()=>{
   await advance(quest,'start');await advance(quest,'start');
   const other=await create();await assert.rejects(advance(other,'start'));
   await assert.rejects(call(a,'select public.save_quest($1,$2)',[quest,data({difficulty:'hard'})]));
   await assert.rejects(advance(quest,'complete'));await assert.rejects(advance(quest,'progress',2));
   await advance(quest,'progress',1);await assert.rejects(advance(quest,'progress',0));await assert.rejects(advance(quest,'complete'));
   assert.equal((await call(a,'select units from public.quest_progress where quest_id=$1',[quest])).rows[0].units,1);
   await mature(quest);
  });
  await t.test('completion commits XP, credits, attributes, history, streak exactly once',async()=>{
   const reward=(await advance(quest,'complete')).rows[0].result;
   assert.equal(reward.xp,10);assert.equal(reward.credits,2);assert.equal(reward.streak,1);
   assert.equal(reward.attribute_gains.intelligence,1);assert.equal(reward.attribute_gains.focus,1);
   assert.equal((await advance(quest,'complete')).rows[0].result.replayed,true);
   assert.equal((await call(a,'select * from public.quest_completions')).rows.length,1);
   assert.equal((await call(a,'select * from public.xp_transactions')).rows.length,1);
   assert.equal((await call(a,'select * from public.credit_transactions')).rows.length,1);
   await call(a,'select public.archive_quest($1)',[quest]);assert.equal((await call(a,'select * from public.quest_completions')).rows.length,1);
  });
  await t.test('nonlinear levels and same-day streak are authoritative',async()=>{
   const q=await create({difficulty:'hard',duration_minutes:60,category:'strength'});const r=await finish(q);
   assert.equal(r.xp,240);assert.equal(r.credits,48);assert.equal(r.level,2);assert.equal(r.current_xp,150);assert.equal(r.next_level_xp,283);assert.equal(r.level_up,true);assert.equal(r.streak,1);
   const state=(await db.query('select private.level_state(383) state')).rows[0].state;assert.equal(state.level,3);assert.equal(state.current_xp,0);assert.equal(state.next_level_xp,520);
  });
  await t.test('consecutive UTC days increment; gaps reset; stale HUD streak clears',async()=>{
   await db.query("update public.streaks set last_activity_day=(now() at time zone 'UTC')::date-1,current_streak=4,longest_streak=4 where user_id=$1",[a]);
   assert.equal((await finish(await create())).streak,5);
   await db.query("update public.streaks set last_activity_day=(now() at time zone 'UTC')::date-3 where user_id=$1",[a]);
   assert.equal((await call(a,'select public.sync_daily_quests() state')).rows[0].state.streak,0);
   assert.equal((await finish(await create())).streak,1);
   assert.equal((await db.query('select longest_streak from public.streaks where user_id=$1',[a])).rows[0].longest_streak,5);
  });
  await t.test('verified type cannot bypass future proof; focus foundation works',async()=>{
   const v=await create({quest_type:'verified'});await advance(v,'start');await advance(v,'progress',1);await mature(v);await assert.rejects(advance(v,'complete'));
   await call(a,'select public.archive_quest($1)',[v]);
   assert.ok((await finish(await create({quest_type:'focus'}))).attribute_gains.focus>0);
  });
  await t.test('daily period uniqueness and expired starts',async()=>{
   const q=await create({quest_type:'daily',recurrence:'daily'});await advance(q,'start');
   await db.query("update public.quest_progress set period=period-1 where quest_id=$1",[q]);await assert.rejects(advance(q,'complete'));
   await advance(q,'start');await advance(q,'progress',1);await mature(q);await advance(q,'complete');
   assert.equal((await advance(q,'complete')).rows[0].result.replayed,true);
   assert.equal((await db.query('select count(*)::int n from public.quest_progress where quest_id=$1',[q])).rows[0].n,2);
  });
  await t.test('RLS, table grants and RPC authorization protect every new ledger',async()=>{
   for(const table of ['quests','quest_progress','quest_completions','xp_transactions','credit_transactions','streaks']){
    assert.equal((await call(b,`select * from public.${table} where user_id=$1`,[a])).rows.length,0);
    await assert.rejects(as('',tx=>tx.query(`select * from public.${table}`),'anon'));
    await assert.rejects(call(a,`delete from public.${table}`));
   }
   for(const sql of ["update public.characters set xp=999999","update public.characters set credits=999999","update public.attributes set strength=100","update public.quest_progress set units=999","update public.quests set difficulty='hard'","update public.xp_transactions set amount=999","update public.streaks set current_streak=999"]){await assert.rejects(call(a,sql));}
   await assert.rejects(as('',tx=>tx.query('select public.sync_daily_quests()'),'anon'));
   await assert.rejects(call('','select public.sync_daily_quests()'));
  });
  await t.test('late ledger failure rolls back rewards, attributes, streak and completion together',async()=>{
   const q=await create({category:'charisma'});await advance(q,'start');await advance(q,'progress',1);await mature(q);
   const snapshot=async()=>({character:(await db.query('select * from public.characters where user_id=$1',[a])).rows,attributes:(await db.query('select * from public.attributes where character_id=(select id from public.characters where user_id=$1)',[a])).rows,streak:(await db.query('select * from public.streaks where user_id=$1',[a])).rows,history:(await db.query('select count(*)::int n from public.quest_completions')).rows});
   const before=await snapshot();
   await db.exec("create function private.test_fail_credit() returns trigger language plpgsql as $$begin raise exception 'injected ledger failure';end;$$; create trigger test_credit_failure before insert on public.credit_transactions for each row execute function private.test_fail_credit();");
   await assert.rejects(advance(q,'complete'));assert.deepEqual(await snapshot(),before);
   await db.exec('drop trigger test_credit_failure on public.credit_transactions;drop function private.test_fail_credit()');
   const result=await advance(q,'complete');assert.equal(result.rows[0].result.attribute_gains.charisma,1);
   const retries=await Promise.all([advance(q,'complete'),advance(q,'complete')]);assert.ok(retries.every(r=>r.rows[0].result.replayed===true));
  });
  await t.test('attribute cap preserves actual recorded deltas',async()=>{
   await db.query('update public.attributes set vitality=99,strength=100 where character_id=(select id from public.characters where user_id=$1)',[a]);
   const r=await finish(await create({category:'vitality',difficulty:'hard'}));assert.equal(r.attribute_gains.vitality,1);assert.equal(r.attribute_gains.strength,0);
  });
  await t.test('daily caps reject atomically without partial attribute or ledger changes',async()=>{
   await db.exec('update public.game_rules set max_daily_completions=1');const q=await create();await advance(q,'start');await advance(q,'progress',1);await mature(q);
   const before=(await db.query('select xp,credits from public.characters where user_id=$1',[a])).rows[0];
   await assert.rejects(advance(q,'complete'));assert.deepEqual((await db.query('select xp,credits from public.characters where user_id=$1',[a])).rows[0],before);
   assert.equal((await db.query('select status from public.quest_progress where quest_id=$1',[q])).rows[0].status,'in_progress');
  });
 }finally{await db.close();}
});

