import 'server-only';
import {requireUser} from '../auth';
import type {EngagementData} from './types';
export async function loadEngagement(progressIds:string[]=[]):Promise<EngagementData>{
 const {supabase}=await requireUser();const empty={ready:false,gyms:[],sessions:[],achievements:[],unlocks:[],catalog:[],inventory:[],purchases:[]};
 const {error}=await supabase.rpc('sync_engagement');if(error)return {...empty,error:error.code==='PGRST202'?'Apply the Step 4 engagement migration to connect Proof of Action and inventory.':'Unable to load engagement data. Please retry.'};
 const [gyms,sessions,current,achievements,unlocks,catalog,inventory,purchases]=await Promise.all([supabase.from('gym_locations').select('*').order('created_at'),supabase.from('verification_sessions').select('*').order('started_at',{ascending:false}).limit(50),supabase.from('verification_sessions').select('*').in('progress_id',progressIds.length?progressIds:['00000000-0000-4000-8000-000000000000']).order('started_at',{ascending:false}),supabase.from('achievement_definitions').select('*').order('art_index'),supabase.from('user_achievements').select('*'),supabase.from('cosmetic_items').select('*').order('slot').order('art_index'),supabase.from('inventory').select('*'),supabase.from('cosmetic_purchases').select('*').order('created_at',{ascending:false}).limit(30)]);
 if([gyms,sessions,current,achievements,unlocks,catalog,inventory,purchases].some(r=>r.error))return {...empty,error:'Unable to read verification and inventory data.'};
 return {ready:true,gyms:gyms.data??[],sessions:Array.from(new Map([...(current.data??[]),...(sessions.data??[])].map(s=>[s.id,s])).values()).sort((a,b)=>b.started_at.localeCompare(a.started_at)),achievements:achievements.data??[],unlocks:unlocks.data??[],catalog:catalog.data??[],inventory:inventory.data??[],purchases:purchases.data??[]};
}

