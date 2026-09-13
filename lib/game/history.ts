import 'server-only';
import { requireUser } from '../auth';
import type { Completion } from './types';
export async function historyPage(offset:number) {
 const {supabase}=await requireUser();
 const completions=await supabase.from('quest_completions').select('*').order('completed_at',{ascending:false}).order('id').range(offset,offset+19);
 if(completions.error)return {error:'Unable to load history.'};
 const rows:Completion[]=completions.data??[];
 if(!rows.length)return {completions:[],xpTransactions:[],creditTransactions:[]};
 const ids=rows.map(c=>c.id);
 const [xp,credits]=await Promise.all([supabase.from('xp_transactions').select('*').in('completion_id',ids),supabase.from('credit_transactions').select('*').in('completion_id',ids)]);
 if(xp.error||credits.error)return {error:'Unable to load reward history.'};
 return {completions:rows,xpTransactions:xp.data??[],creditTransactions:credits.data??[]};
}
