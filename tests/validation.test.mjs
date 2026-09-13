import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function loadTs(file) {
  const compiled = ts.transpileModule(readFileSync(new URL(file, import.meta.url),'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} }; new Function('require','module','exports',compiled)(require,module,module.exports); return module.exports;
}
const { loginSchema,signupSchema,characterSchema } = loadTs('../lib/validation.ts');
test('input validation rejects malformed auth and extra progression fields are stripped', () => {
  assert.equal(signupSchema.safeParse({ displayName:'A',email:'invalid',password:'short' }).success,false);
  assert.equal(signupSchema.safeParse({ displayName:'<script>',email:'person@example.com',password:'a long test passphrase' }).success,false);
  const login = loginSchema.parse({email:' Person@Example.com ',password:' untrimmed password '});
  assert.equal(login.email,'person@example.com'); assert.equal(login.password,' untrimmed password ');
  assert.equal(characterSchema.safeParse({displayName:'Player',characterClass:'Admin'}).success,false);
  for(const characterClass of ['Warrior','Scholar','Creator','Balanced']) {
    const value=characterSchema.parse({displayName:' Player ',characterClass,xp:999,credits:999,user_id:'someone-else'});
    assert.deepEqual(value,{displayName:'Player',characterClass});
  }
});
test('missing or privileged public configuration is rejected', () => {
  const keys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  try {
    keys.forEach(k=>delete process.env[k]);
    const {getSupabaseConfig}=loadTs('../lib/supabase/config.ts');
    assert.equal(getSupabaseConfig(),null);
    process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_secret_disallowed';
    assert.equal(getSupabaseConfig(),null);
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='not-a-key';
    assert.equal(getSupabaseConfig(),null);
  } finally { for(const key of keys) { if(saved[key]===undefined) delete process.env[key];else process.env[key]=saved[key]; } }
});
