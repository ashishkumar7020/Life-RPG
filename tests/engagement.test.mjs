import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {randomUUID} from 'node:crypto';import {PGlite} from '@electric-sql/pglite';
test('Step 4 verification, focus and cosmetic authority',async t=>{
 const db=new PGlite();const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 const as=(id,fn,role='authenticated')=>db.transaction(async tx=>{await tx.exec(`set local role ${role}`);await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);return fn(tx);});
 const call=(sql,args=[],owner=a)=>as(owner,tx=>tx.query(sql,args));const sig=(id,kind,data={},request=randomUUID(),owner=a)=>call('select public.submit_verification($1,$2,$3,$4) r',[id,request,kind,data],owner);
 const create=async(type='verified',method='gym')=>(await call('select public.save_quest(null,$1) id',[{title:'Verification task',description:'Acceptance fixture',category:'strength',quest_type:type,recurrence:'once',difficulty:'easy',duration_minutes:5,completion_condition:'Complete the required test activity',target_units:1,verification_kind:type==='verified'?method:null}])).rows[0].id;
 let gym;
 const start=async(type='verified',method='gym',strong=false)=>{const q=await create(type,method);const id=(await call('select public.start_verification($1,$2,$3) id',[q,method==='gym'?gym:null,strong])).rows[0].id;await db.query("update public.quest_progress set started_at=now()-interval '1 hour' where quest_id=$1",[q]);return {q,id};};
 const archive=q=>call('select public.archive_quest($1)',[q]);
 const tick=async(id,kind='location',data={visible:true,latitude:19,longitude:72,accuracy:5})=>{await db.query("update public.verification_sessions set last_seen_at=now()-interval '30 seconds' where id=$1",[id]);return sig(id,kind,data);};
 const checkpoint=async id=>{await db.query("update public.verification_sessions set checkpoint_due=now()-interval '1 second',checkpoint_expires=now()+interval '2 minutes' where id=$1",[id]);const challenge=(await call('select challenge from public.verification_sessions where id=$1',[id])).rows[0].challenge;await sig(id,'checkpoint',{challenge});};
 const mature=async(id,kind='location')=>{for(let i=0;i<12;i++)await tick(id,kind,kind==='heartbeat'?{visible:true}:{visible:true,latitude:19,longitude:72,accuracy:5});await checkpoint(id);await sig(id,'activity',{confirmed:true});};
 try{
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 for(const file of ['202609130001_step_2_identity.sql','202609130002_step_3_core_engine.sql','202609130003_step_4_engagement.sql']){const sql=await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8');try{await db.exec(sql);}catch(e){throw new Error(e.message+' at '+e.position+' '+e.where+' '+sql.slice(Math.max(0,Number(e.position)-200),Number(e.position)+200));}}
 for(const id of[a,b]){await db.query('insert into auth.users values($1)',[id]);await call("select public.complete_character_setup('Player','Balanced')",[],id);}
 gym=(await call("select public.save_gym('Private gym',19,72) id")).rows[0].id;
 await t.test('gym permissions, GPS accuracy, geofence and insufficient duration remain pending',async()=>{
  const {q,id}=await start();await sig(id,'permission',{state:'denied'});assert.equal((await sig(id,'final')).rows[0].r.status,'pending');await sig(id,'permission',{state:'unavailable'});
  await tick(id,'location',{visible:true,latitude:19,longitude:72,accuracy:150});assert.equal((await call('select inside_area from public.verification_sessions where id=$1',[id])).rows[0].inside_area,false);
  await tick(id,'location',{visible:true,latitude:20,longitude:72,accuracy:5});assert.equal((await call('select inside_area from public.verification_sessions where id=$1',[id])).rows[0].inside_area,false);
  await tick(id);const state=(await call('select * from public.verification_sessions where id=$1',[id])).rows[0];assert.equal(state.inside_area,true);assert.equal(state.arrival_seen,true);assert.equal(state.travel_seen,true);
  assert.equal((await sig(id,'final')).rows[0].r.status,'pending');await assert.rejects(call("select public.advance_quest($1,'complete',null)",[q]));await archive(q);
 });
 await t.test('gym server checks pass and award exactly once; no raw media/coordinate signals retained',async()=>{
  const {q,id}=await start();await mature(id);const token=randomUUID();const result=(await sig(id,'final',{},token)).rows[0].r;assert.equal(result.status,'passed');assert.equal(result.confidence,80);assert.equal(result.reward.xp,10);
  assert.equal((await sig(id,'final',{},token)).rows[0].r.replayed,true);assert.equal((await sig(id,'final')).rows[0].r.replayed,true);
  assert.equal((await call('select count(*)::int n from public.quest_completions where quest_id=$1',[q])).rows[0].n,1);
  const metadata=(await call('select metadata from public.verification_signals where session_id=$1',[id])).rows;assert.ok(metadata.every(x=>!('latitude'in x.metadata)&&!('longitude'in x.metadata)&&!('media'in x.metadata)));
  assert.equal((await call("select count(*)::int n from public.user_achievements where achievement_id='first_quest'")).rows[0].n,1);
 });
 await t.test('missed random checkpoint fails; failed sessions can retry without reusing rewards',async()=>{
  const {q,id}=await start();await sig(id,'checkpoint',{challenge:randomUUID()});assert.equal((await call('select status from public.verification_sessions where id=$1',[id])).rows[0].status,'failed');
  const next=(await call('select public.start_verification($1,$2,false) id',[q,gym])).rows[0].id;assert.notEqual(next,id);await archive(q);
 });
 await t.test('Strong Verified remains pending without independent liveness',async()=>{
  const {q,id}=await start('verified','gym',true);await mature(id);await sig(id,'camera',{state:'local_preview'});const r=(await sig(id,'final')).rows[0].r;assert.equal(r.status,'pending');assert.ok(r.reasons.some(x=>x.includes('attestation')));await archive(q);
 });
 await t.test('focus session pauses, persists, rejects gaps and hidden time, then completes once',async()=>{
  const {q,id}=await start('focus','focus');await tick(id,'heartbeat',{visible:false});await tick(id,'heartbeat',{visible:true});assert.equal((await call('select active_seconds from public.verification_sessions where id=$1',[id])).rows[0].active_seconds,0);
  await sig(id,'pause');await tick(id,'heartbeat',{visible:true});assert.equal((await call('select active_seconds from public.verification_sessions where id=$1',[id])).rows[0].active_seconds,0);await sig(id,'resume');
  await db.query("update public.verification_sessions set last_seen_at=now()-interval '1 hour' where id=$1",[id]);await sig(id,'heartbeat',{visible:true});assert.equal((await call('select active_seconds from public.verification_sessions where id=$1',[id])).rows[0].active_seconds,0);
  await mature(id,'heartbeat');await assert.rejects(call("select public.advance_quest($1,'complete',null)",[q]));assert.equal((await sig(id,'final')).rows[0].r.status,'passed');assert.equal((await sig(id,'final')).rows[0].r.replayed,true);
 });
 await t.test('other task foundations accurately report unavailable independent evidence',async()=>{
  for(const method of ['home_workout','running','coding','studying','reading']){const {q,id}=await start('verified',method);if(method!=='running')await mature(id,'heartbeat');else{await checkpoint(id);await sig(id,'activity',{confirmed:true});}await sig(id,'reflection',{reflection:'A concise reflection of the completed activity.'});const r=(await sig(id,'final')).rows[0].r;assert.equal(r.status,'pending');assert.ok(r.reasons.some(x=>x.includes('independent evidence unavailable')));await archive(q);}
 });
 await t.test('cosmetics are owned server-side; locked/unowned equipment and duplicate charges prevented',async()=>{
  await call('select public.sync_engagement()');assert.ok((await call('select * from public.inventory')).rows.length>=7);
  await assert.rejects(call("select public.cosmetic_action('frames-1','equip')"));await assert.rejects(call("select public.cosmetic_action('frames-5','buy')"));await assert.rejects(call("select public.cosmetic_action('frames-1','buy')"));
  await db.query('update public.characters set credits=500 where user_id=$1',[a]);await call("select public.cosmetic_action('frames-1','buy')");await call("select public.cosmetic_action('frames-1','buy')");assert.equal((await call('select credits from public.characters')).rows[0].credits,350);
  await call("select public.cosmetic_action('frames-1','equip')");await call("select public.cosmetic_action('frames-0','equip')");assert.equal((await call("select count(*)::int n from public.inventory where slot='frames' and equipped")).rows[0].n,1);await call("select public.cosmetic_action('frames-0','unequip')");assert.equal((await call("select count(*)::int n from public.inventory where slot='frames' and equipped")).rows[0].n,0);
  const debit=(await call('select * from public.credit_transactions where purchase_id is not null')).rows;assert.equal(debit.length,1);assert.equal(debit[0].amount,-150);
 });
 await t.test('achievement conditions and unique unlocks',async()=>{
  await db.query('update public.streaks set longest_streak=7 where user_id=$1',[a]);await db.query('update public.characters set level=100 where user_id=$1',[a]);await call('select public.sync_engagement()');await call('select public.sync_engagement()');const unlocked=(await call('select achievement_id from public.user_achievements')).rows.map(x=>x.achievement_id);assert.ok(unlocked.includes('seven_day_streak'));assert.ok(unlocked.includes('legendary'));assert.equal(new Set(unlocked).size,unlocked.length);assert.ok(!unlocked.includes('gym_veteran'));assert.ok(!unlocked.includes('code_master'));assert.ok(!unlocked.includes('scholar'));
 });
 await t.test('Code Master, Scholar and Gym Veteran unlock only at their exact thresholds',async()=>{
  for(const [metric,total,achievement] of [['coding',50,'code_master'],['study',50,'scholar'],['gym',29,'gym_veteran']]){
   const q=await create('custom');await db.query('update public.quests set art_key=$2 where id=$1',[q,metric]);
   for(let i=1;i<=total;i++){
    const p=(await db.query("insert into public.quest_progress(quest_id,user_id,period,status,units,started_at,completed_at) values($1,$2,(now() at time zone 'UTC')::date-$3::integer,'completed',1,now()-interval '1 hour',now()) returning id",[q,a,i])).rows[0].id;
    if(metric==='gym')await db.query("insert into public.verification_sessions(user_id,quest_id,progress_id,method,verification_level,status,gym_id,required_seconds,checkpoint_due,checkpoint_expires) values($1,$2,$3,'gym','verified','passed',$4,300,now(),now()+interval '2 minutes')",[a,q,p,gym]);
    await db.query("insert into public.quest_completions(user_id,quest_id,progress_id,activity_day,quest_snapshot,xp,credits,attribute_gains,level_before,level_after) select $1,id,$2,(now() at time zone 'UTC')::date,to_jsonb(q),10,2,'{}',1,1 from public.quests q where id=$3",[a,p,q]);
    const unlocked=(await call('select * from public.user_achievements where achievement_id=$1',[achievement])).rows.length;
    assert.equal(unlocked,i===total?1:0,metric+' threshold '+i);
   }
  }
 });
 await t.test('owner evidence clearing ends pending sessions; details expire without deleting rewards',async()=>{
  const s=(await call("select id from public.verification_sessions where status='passed' limit 1")).rows[0].id;
  const count=(await call('select count(*)::int n from public.quest_completions')).rows[0].n;
  await assert.rejects(call('select public.clear_evidence($1)',[s],b));
  await call('select public.clear_evidence($1)',[s]);assert.equal((await call('select * from public.verification_signals where session_id=$1',[s])).rows.length,0);assert.equal((await call('select count(*)::int n from public.quest_completions')).rows[0].n,count);
  await db.exec("update public.verification_signals set received_at=now()-interval '8 days';update public.location_checkpoints set received_at=now()-interval '8 days'");await call('select public.sync_engagement()');assert.equal((await call('select * from public.location_checkpoints')).rows.length,0);
 });
 await t.test('evidence/inventory RLS, anonymous calls and client reward injection denied',async()=>{
  for(const table of ['gym_locations','verification_sessions','verification_signals','location_checkpoints','user_achievements','inventory','cosmetic_purchases']){assert.equal((await call(`select * from public.${table} where user_id=$1`,[a],b)).rows.length,0);await assert.rejects(call(`delete from public.${table}`));await assert.rejects(as('',tx=>tx.query(`select * from public.${table}`),'anon'));}
  const id=(await call('select id from public.verification_sessions limit 1')).rows[0].id;await assert.rejects(sig(id,'heartbeat',{visible:true},randomUUID(),b));await assert.rejects(sig(id,'heartbeat',{xp:99999}));await assert.rejects(call("update public.verification_sessions set status='passed'"));await assert.rejects(call('update public.inventory set equipped=true'));await assert.rejects(call('update public.cosmetic_items set price=0'));
  await assert.rejects(as('',tx=>tx.query("select public.cosmetic_action('frames-0','equip')"),'anon'));
 });
 }finally{await db.close();}
});



