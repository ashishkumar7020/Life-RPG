import { z } from 'zod';
import { categories } from './types';
export const questSchema = z.object({
 verification_kind:z.enum(['gym','home_workout','running','coding','studying','reading']).nullable().optional(),
 title:z.string().trim().min(2).max(100), description:z.string().trim().max(1000),
 category:z.enum(categories), quest_type:z.enum(['daily','custom','verified','focus']),
 recurrence:z.enum(['daily','once']), difficulty:z.enum(['easy','medium','hard']),
 duration_minutes:z.coerce.number().int().min(5).max(240),
 completion_condition:z.string().trim().min(5).max(500), target_units:z.coerce.number().int().min(1).max(1000),
}).strict().refine(q=>q.quest_type!=='daily'||q.recurrence==='daily',{message:'Daily quests must repeat daily.'});
export const questIdSchema=z.string().uuid();
export const advanceSchema=z.object({id:questIdSchema,action:z.enum(['start','progress','complete']),units:z.number().int().min(0).max(1000).nullable()}).strict();

