import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(url){const compiled=ts.transpileModule(fs.readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};new Function('require','module','exports',compiled)(name=>name.startsWith('.')?load(new URL(name+'.ts',url)):require(name),module,module.exports);return module.exports;}
const {questSchema,advanceSchema}=load(new URL('../lib/game/validation.ts',import.meta.url));
const valid={title:'Read a chapter',description:'Read and summarize',category:'intelligence',quest_type:'custom',recurrence:'once',difficulty:'easy',duration_minutes:5,completion_condition:'Finish one chapter',target_units:1};
test('quest Zod schema rejects malformed values and client-selected progression',()=>{
 assert.equal(questSchema.safeParse(valid).success,true);
 for(const change of [{duration_minutes:0},{duration_minutes:241},{duration_minutes:5.5},{target_units:0},{target_units:1001},{category:'admin'},{quest_type:'daily',recurrence:'once'},{title:' '},{completion_condition:'x'},{xp:9999},{credits:999},{user_id:'other'},{level:90},{attribute_gains:{strength:100}}])assert.equal(questSchema.safeParse({...valid,...change}).success,false,JSON.stringify(change));
 assert.equal(advanceSchema.safeParse({id:'11111111-1111-4111-8111-111111111111',action:'complete',units:null}).success,true);
 for(const change of [{id:'bad'},{action:'grant'},{xp:999},{units:-1},{started_at:'yesterday'}])assert.equal(advanceSchema.safeParse({id:'11111111-1111-4111-8111-111111111111',action:'complete',units:null,...change}).success,false);
});
