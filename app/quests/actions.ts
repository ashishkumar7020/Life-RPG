'use server';
import { revalidatePath } from 'next/cache';
import { historyPage } from '../../lib/game/history';
import { requireUser } from '../../lib/auth';
import { questSchema,questIdSchema,advanceSchema } from '../../lib/game/validation';
import type { GameActionState } from '../../lib/game/types';
function message(error:{message:string}):string {
 const allowed=['Choose a verification evidence type','Complete the required verification or focus session first','Quest unavailable','Started quests cannot be edited; archive and create a new quest','Finish or archive your active quest before starting another','Start this quest first','Invalid progress','Complete the required progress first','The required quest duration has not elapsed','Daily progression limit reached; resume tomorrow (UTC)','Verified completion is locked until the verification system is available','Archive a quest before creating more (50 active maximum)'];
 return allowed.includes(error.message)?error.message:'Unable to save your quest. Please retry; if this continues, check the database migration.';
}
export async function saveQuest(_previous:GameActionState,form:FormData):Promise<GameActionState> {
 const input=Object.fromEntries(['verification_kind','title','description','category','quest_type','recurrence','difficulty','duration_minutes','completion_condition','target_units'].map(k=>[k,form.get(k)]));
 const parsed=questSchema.safeParse(input); const id=form.get('id');
 if(!parsed.success) return {error:parsed.error.issues[0]?.message??'Check your quest details.'};
 if(id&&!questIdSchema.safeParse(id).success) return {error:'Invalid quest.'};
 const {supabase}=await requireUser();
 try {const {error}=await supabase.rpc('save_quest',{p_id:id?String(id):null,p_data:parsed.data});if(error)return {error:message(error)};}catch{return {error:'Unable to reach the realm. Please retry.'};}
 revalidatePath('/');return {success:true,message:id?'Quest updated.':'Quest created.'};
}
export async function archiveQuest(id:string):Promise<GameActionState> {
 if(!questIdSchema.safeParse(id).success)return {error:'Invalid quest.'};
 const {supabase}=await requireUser();
 try {const {error}=await supabase.rpc('archive_quest',{p_id:id});if(error)return {error:message(error)};}catch{return {error:'Unable to reach the realm. Please retry.'};}
 revalidatePath('/');return {success:true,message:'Quest removed from your tracker. History is preserved.'};
}
export async function advanceQuest(input:unknown):Promise<GameActionState> {
 const result=advanceSchema.safeParse(input);if(!result.success)return {error:'Invalid quest action.'};
 const {supabase}=await requireUser();
 try {
  const {error,data}=await supabase.rpc('advance_quest',{p_id:result.data.id,p_action:result.data.action,p_units:result.data.units});
  if(error)return {error:message(error)};
  const reward=data as {replayed?:boolean;xp?:number;credits?:number;level_up?:boolean;level?:number};
  revalidatePath('/');return {success:true,levelUp:reward.level_up?reward.level:undefined,message:reward.replayed?'Already completed. No duplicate rewards.':reward.xp?`Quest complete! +${reward.xp} XP · +${reward.credits} Credits`:result.data.action==='start'?'Quest started. Your progress is saved.':'Progress saved.'};
 }catch{return {error:'Unable to reach the realm. Retry safely; rewards cannot be duplicated.'};}
}

export async function readQuestHistory(offset:number) {
 if(!Number.isSafeInteger(offset)||offset<0||offset>1000000)return {error:'Invalid history page.'};
 return historyPage(offset);
}

