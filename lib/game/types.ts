export const categories = ['strength','intelligence','focus','discipline','vitality','charisma'] as const;
export type Category = typeof categories[number];
export type Quest = { verification_kind?:'gym'|'home_workout'|'running'|'coding'|'studying'|'reading'|null; id:string; user_id:string; template_key:string|null; title:string; description:string; category:Category; quest_type:'daily'|'custom'|'verified'|'focus'; recurrence:'daily'|'once'; difficulty:'easy'|'medium'|'hard'; duration_minutes:number; completion_condition:string; target_units:number; art_key:'gym'|'coding'|'study'|'running'|'reading'|'focus'; archived_at:string|null; created_at:string; updated_at:string };
export type QuestProgress = { id:string; quest_id:string; user_id:string; period:string; status:'in_progress'|'completed'; units:number; started_at:string; updated_at:string; completed_at:string|null };
export type Completion = { id:string; user_id:string; quest_id:string; progress_id:string; activity_day:string; completed_at:string; quest_snapshot:Quest; xp:number; credits:number; attribute_gains:Record<Category,number>; level_before:number; level_after:number };
export type Transaction = { id:string; user_id:string; completion_id:string; amount:number; balance_after:number; created_at:string };
export type Streak = { user_id:string; current_streak:number; longest_streak:number; last_activity_day:string|null; updated_at:string };
export type LevelState = { level:number; current_xp:number; next_level_xp:number; progress_percent:number; today:string; streak:number };
export type GameData = { ready:boolean; error?:string; quests:Quest[]; progress:QuestProgress[]; completions:Completion[]; xpTransactions:Transaction[]; creditTransactions:Transaction[]; level:LevelState|null };
export type GameActionState = { error?:string; message?:string; levelUp?:number; success?:boolean };

