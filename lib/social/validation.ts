import {z} from 'zod';
export const privacySchema=z.object({profile_visibility:z.enum(['public','friends','private']),discoverable:z.boolean(),show_progress:z.boolean(),show_attributes:z.boolean(),show_streak:z.boolean(),show_achievements:z.boolean(),show_cosmetics:z.boolean(),leaderboard_opt_in:z.boolean()}).strict();
export const profileSchema=z.object({name:z.string().trim().min(2).max(40).regex(/^[\p{L}\p{N} ._'\-]+$/u),privacy:privacySchema,featured:z.array(z.string().min(1).max(80)).max(3).refine(a=>new Set(a).size===a.length)}).strict();
export const friendSchema=z.object({target:z.string().uuid(),action:z.enum(['send','accept','reject','cancel','remove'])}).strict();
export const searchSchema=z.object({query:z.string().trim().max(60),offset:z.number().int().min(0).max(10000)}).strict();
export const boardSchema=z.object({metric:z.enum(['weekly_verified_xp','overall_verified_xp','streak','strength','intelligence','focus','discipline']),offset:z.number().int().min(0).max(10000)}).strict();
export const idSchema=z.string().uuid();
