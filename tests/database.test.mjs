import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Isolated PostgreSQL test harness, never used by the running application.
// Supabase supplies auth.users/auth.uid in production; only those platform
// contracts are represented here so the actual migration/RLS can execute.
test('Step 2 migration, ownership, privileges and atomic onboarding', async t => {
  const db = new PGlite();
  const users = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444', '55555555-5555-4555-8555-555555555555'];
  async function asUser(id, operation, role = 'authenticated') {
    return db.transaction(async tx => {
      await tx.exec(`set local role ${role}`);
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
      return operation(tx);
    });
  }
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;`);
    await db.exec(await readFile(new URL('../supabase/migrations/202609130001_step_2_identity.sql', import.meta.url), 'utf8'));
    for (const id of users) await db.query('insert into auth.users(id) values ($1)', [id]);
    await t.test('all four classes create complete private identities with neutral progression', async () => {
      for (const [i, path] of ['Warrior', 'Scholar', 'Creator', 'Balanced'].entries()) {
        await asUser(users[i], tx => tx.query('select public.complete_character_setup($1,$2)', [`Player ${i}`, path]));
        const result = await asUser(users[i], tx => tx.query('select * from public.characters'));
        assert.equal(result.rows.length, 1); assert.equal(result.rows[0].class, path);
        assert.equal(result.rows[0].level, 1);
        for (const key of ['xp', 'credits', 'streak']) assert.equal(result.rows[0][key], 0);
        const attrs = await asUser(users[i], tx => tx.query('select * from public.attributes'));
        assert.equal(attrs.rows.length, 1);
        for (const key of ['strength','intelligence','focus','discipline','vitality','charisma']) assert.equal(attrs.rows[0][key], 0);
        const privacy = await asUser(users[i], tx => tx.query('select * from public.privacy_settings'));
        assert.equal(privacy.rows.length, 1); assert.equal(privacy.rows[0].discoverable, false); assert.equal(privacy.rows[0].show_progress, false);
      }
    });
    await t.test('anonymous and missing-subject requests cannot read or create data', async () => {
      await assert.rejects(asUser('', tx => tx.query('select * from public.profiles'), 'anon'), /permission denied/);
      await assert.rejects(asUser('', tx => tx.query("select public.complete_character_setup('Intruder','Warrior')"), 'anon'), /permission denied/);
      await assert.rejects(asUser('', tx => tx.query("select public.complete_character_setup('Intruder','Warrior')")), /Authentication required/);
    });
    await t.test('RLS hides other users and blocks cross-user profile/privacy edits', async () => {
      for (const table of ['profiles','characters','attributes','privacy_settings']) {
        const rows = await asUser(users[0], tx => tx.query(`select * from public.${table}`)); assert.equal(rows.rows.length, 1);
      }
      const edit = await asUser(users[0], tx => tx.query("update public.profiles set display_name='Hijacked' where id=$1 returning id", [users[1]]));
      assert.equal(edit.rows.length, 0);
      const privacy = await asUser(users[0], tx => tx.query('update public.privacy_settings set discoverable=true where user_id=$1 returning user_id', [users[1]]));
      assert.equal(privacy.rows.length, 0);
    });
    await t.test('browser roles cannot insert records, transfer ownership or write progression', async () => {
      for (const sql of ["update public.characters set xp=999", "update public.characters set credits=999", "update public.characters set level=99", "update public.characters set streak=99", "update public.characters set class='Scholar'", "update public.attributes set strength=100", `update public.profiles set id='${users[4]}'`, `insert into public.characters(user_id,class) values ('${users[4]}','Warrior')`, 'delete from public.characters']) {
        await assert.rejects(asUser(users[0], tx => tx.exec(sql)), /permission denied/);
      }
    });
    await t.test('allowed owner updates work under RLS', async () => {
      const profile = await asUser(users[0], tx => tx.query("update public.profiles set display_name='Saved Name' where id=$1 returning display_name", [users[0]]));
      assert.equal(profile.rows[0].display_name, 'Saved Name');
      const privacy = await asUser(users[0], tx => tx.query('update public.privacy_settings set show_progress=true where user_id=$1 returning show_progress', [users[0]]));
      assert.equal(privacy.rows[0].show_progress, true);
    });
    await t.test('repeat onboarding is idempotent and cannot reset progression or change class', async () => {
      const before = (await db.query('select id from public.characters where user_id=$1', [users[0]])).rows[0].id;
      await db.query('update public.characters set level=8,xp=470,credits=11,streak=3 where id=$1', [before]);
      await db.query('update public.attributes set strength=25 where character_id=$1', [before]);
      for (let i=0;i<3;i++) await asUser(users[0], tx => tx.query("select public.complete_character_setup('Saved Name','Warrior')"));
      const after = (await asUser(users[0], tx => tx.query('select * from public.characters'))).rows[0];
      assert.deepEqual([after.id,after.level,after.xp,after.credits,after.streak], [before,8,470,11,3]);
      assert.equal((await asUser(users[0], tx => tx.query('select strength from public.attributes'))).rows[0].strength,25);
      await assert.rejects(asUser(users[0], tx => tx.query("select public.complete_character_setup('Bad Rename','Scholar')")), /already established/);
      assert.equal((await asUser(users[0], tx => tx.query('select display_name from public.profiles'))).rows[0].display_name,'Saved Name');
    });
    await t.test('invalid onboarding rolls back all records', async () => {
      for (const name of ['', 'x', '<script>', 'x'.repeat(41)]) await assert.rejects(asUser(users[4], tx => tx.query("select public.complete_character_setup($1,'Warrior')", [name])), /Invalid character input/);
      await assert.rejects(asUser(users[4], tx => tx.query("select public.complete_character_setup('Player','Administrator')")), /invalid input value for enum/);
      assert.equal((await db.query('select * from public.profiles where id=$1',[users[4]])).rows.length,0);
    });
    await t.test('every table has RLS and account deletion cascades', async () => {
      const tables = await db.query("select relname,relrowsecurity from pg_class where relname in ('profiles','characters','attributes','privacy_settings') and relnamespace='public'::regnamespace");
      assert.equal(tables.rows.length,4); assert.ok(tables.rows.every(row=>row.relrowsecurity));
      const characterId = (await db.query('select id from public.characters where user_id=$1',[users[3]])).rows[0].id;
      await db.query('delete from auth.users where id=$1',[users[3]]);
      assert.equal((await db.query('select * from public.attributes where character_id=$1',[characterId])).rows.length,0);
      for(const table of ['profiles','characters','privacy_settings']) assert.equal((await db.query(`select * from public.${table} where ${table==='profiles'?'id':'user_id'}=$1`,[users[3]])).rows.length,0);
    });
  } finally { await db.close(); }
});
