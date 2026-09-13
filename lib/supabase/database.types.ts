import type {Privacy} from '../social/types';
import type { GymLocation,VerificationSession,Achievement,Unlock,Cosmetic,InventoryItem,Purchase } from '../engagement/types';
import type { Quest, QuestProgress, Completion, Transaction, Streak } from '../game/types';
export type CharacterClass = 'Warrior' | 'Scholar' | 'Creator' | 'Balanced';
type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };
export type Profile = { id: string; display_name: string; created_at: string; updated_at: string };
export type Character = { id: string; user_id: string; class: CharacterClass; level: number; xp: number; credits: number; streak: number; created_at: string; updated_at: string };
export type Attributes = { character_id: string; strength: number; intelligence: number; focus: number; discipline: number; vitality: number; charisma: number; updated_at: string };
export type PrivacySettings = Privacy & { user_id: string; discoverable: boolean; show_progress: boolean; updated_at: string };
export type Database = {
  public: {
    Tables: { featured_achievements:Table<{user_id:string;achievement_id:string;position:number}>; gym_locations:Table<GymLocation>;verification_sessions:Table<VerificationSession>;achievement_definitions:Table<Achievement>;user_achievements:Table<Unlock>;cosmetic_items:Table<Cosmetic>;inventory:Table<InventoryItem>;cosmetic_purchases:Table<Purchase>;profiles: Table<Profile>; characters: Table<Character>; attributes: Table<Attributes>; privacy_settings: Table<PrivacySettings>; quests: Table<Quest>; quest_progress: Table<QuestProgress>; quest_completions: Table<Completion>; xp_transactions: Table<Transaction>; credit_transactions: Table<Transaction>; streaks: Table<Streak>; game_rules: Table<{id:boolean;base_xp:number;max_daily_xp:number;max_daily_credits:number;max_daily_completions:number}> };
    Views: Record<string, never>;
    Functions: { social_hall:{Args:{p_query:string;p_offset:number};Returns:Record<string,unknown>};rpg_profile:{Args:{p_target:string};Returns:Record<string,unknown>};rpg_leaderboard:{Args:{p_metric:string;p_offset:number};Returns:Record<string,unknown>};friend_action:{Args:{p_target:string;p_action:string};Returns:string};save_social_profile:{Args:{p_name:string;p_privacy:Record<string,unknown>;p_featured:string[]};Returns:string}; clear_evidence:{Args:{p_session:string};Returns:undefined};remove_gym:{Args:{p_gym:string};Returns:undefined};sync_engagement:{Args:Record<string,never>;Returns:undefined};save_gym:{Args:{p_name:string;p_lat:number;p_lon:number};Returns:string};start_verification:{Args:{p_quest:string;p_gym:string|null;p_strong:boolean};Returns:string};submit_verification:{Args:{p_session:string;p_request:string;p_kind:string;p_data:Record<string,unknown>};Returns:Record<string,unknown>};cosmetic_action:{Args:{p_item:string;p_action:string};Returns:Record<string,unknown>};sync_daily_quests: { Args: Record<string, never>; Returns: Record<string, unknown> }; save_quest: { Args: {p_id:string|null;p_data:Record<string,unknown>}; Returns:string }; archive_quest: {Args:{p_id:string};Returns:undefined}; advance_quest: {Args:{p_id:string;p_action:string;p_units:number|null};Returns:Record<string,unknown>}; complete_character_setup: { Args: { p_display_name: string; p_class: CharacterClass }; Returns: string } };
    Enums: { character_class: CharacterClass };
    CompositeTypes: Record<string, never>;
  };
};
export type PlayerData = { name: string; character: Character; attributes: Attributes };




