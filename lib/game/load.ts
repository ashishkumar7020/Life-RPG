import 'server-only';
import { requireUser } from '../auth';
import { historyPage } from './history';
import type { GameData, LevelState } from './types';
export async function loadGame():Promise<GameData> {
 const {supabase}=await requireUser();
 const empty={ready:false,quests:[],progress:[],completions:[],xpTransactions:[],creditTransactions:[],level:null};
 const sync=await supabase.rpc('sync_daily_quests');
 if(sync.error) return {...empty,error:sync.error.code==='PGRST202'?'The core RPG database migration is required. Apply 202609130002_step_3_core_engine.sql.':'Unable to load progression. Retry shortly.'};
 const [quests,progress,history]=await Promise.all([
  supabase.from('quests').select('*').is('archived_at',null).order('created_at').order('id'),
  supabase.from('quest_progress').select('*').in('period',[(sync.data as unknown as LevelState).today,'1970-01-01']),
  historyPage(0),
 ]);
 if(quests.error||progress.error||history.error||!history.completions)return {...empty,error:'Unable to load quests and progression. Please retry.'};
 return {ready:true,quests:quests.data??[],progress:progress.data??[],completions:history.completions,xpTransactions:history.xpTransactions,creditTransactions:history.creditTransactions,level:sync.data as unknown as LevelState};
}
