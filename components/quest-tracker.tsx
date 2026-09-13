'use client';
import {useActionState,useEffect,useRef,useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {ChevronRight,Plus,X} from 'lucide-react';
import {Artwork,SheetRegion} from './artwork';
import {assets} from '../lib/assets';
import {categories,type GameData,type Quest,type QuestProgress,type GameActionState} from '../lib/game/types';
import {saveQuest,archiveQuest,advanceQuest} from '../app/quests/actions';
const label=(s:string)=>s.charAt(0).toUpperCase()+s.slice(1);
function QuestEditor({quest,close,onSaved}:{quest:Quest|null;close:()=>void;onSaved:(s:GameActionState)=>void}){
 const [state,action,pending]=useActionState(saveQuest,{});
 const [kind,setKind]=useState(quest?.quest_type??'custom');
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{dialog.current?.showModal();},[]);
 useEffect(()=>{if(state.success)onSaved(state);},[state,onSaved]);
 return <dialog className="rpg-dialog" ref={dialog} onCancel={close} aria-labelledby="quest-editor-title"><div className="dialog-body"><button className="icon-button close-button" onClick={close} aria-label="Close quest editor" disabled={pending}><X size={20}/></button><p className="eyebrow">YOUR NEXT CHAPTER</p><h2 id="quest-editor-title">{quest?'Edit Quest':'Create Quest'}</h2><form action={action} className="auth-form quest-editor">
 {quest&&<input type="hidden" name="id" value={quest.id}/>}
 <label>Quest title<input name="title" required minLength={2} maxLength={100} defaultValue={quest?.title}/></label>
 <label>Description<textarea name="description" maxLength={1000} defaultValue={quest?.description??''}/></label>
 <div className="quest-fields"><label>Category<select name="category" defaultValue={quest?.category??'discipline'}>{categories.map(c=><option key={c} value={c}>{label(c)}</option>)}</select></label><label>Type<select name="quest_type" value={kind} onChange={e=>setKind(e.target.value as Quest['quest_type'])}>{['custom','daily','verified','focus'].map(c=><option key={c}>{c}</option>)}</select></label><label>Difficulty<select name="difficulty" defaultValue={quest?.difficulty??'easy'}>{['easy','medium','hard'].map(c=><option key={c}>{c}</option>)}</select></label><label>Repeat<select name="recurrence" key={kind} defaultValue={kind==='daily'?'daily':quest?.recurrence??'once'}>{kind!=='daily'&&<option value="once">Once</option>}<option value="daily">Daily (UTC)</option></select></label><label>Duration (minutes)<input type="number" name="duration_minutes" min={5} max={240} required defaultValue={quest?.duration_minutes??25}/></label><label>Target units<input type="number" name="target_units" min={1} max={1000} required defaultValue={quest?.target_units??1}/></label></div>
 {kind==='verified'&&<label>Evidence type<select name="verification_kind" defaultValue={quest?.verification_kind??'gym'}>{['gym','home_workout','running','coding','studying','reading'].map(m=><option key={m}>{m}</option>)}</select></label>}
 <label>Completion condition<textarea name="completion_condition" required minLength={5} maxLength={500} defaultValue={quest?.completion_condition} placeholder="What will be finished? Define a clear, meaningful outcome."/></label>
 <p className="proof-note">Rewards are calculated by the System. Started quests cannot be edited. Verified quests use task-specific evidence; focus quests require a saved Focus session.</p>
 {state.error&&<p className="auth-message" role="alert">{state.error}</p>}<button type="submit" className="rpg-button" disabled={pending}>{pending?'Saving…':'Save Quest'}</button>
 </form></div></dialog>;
}
function LiveQuestCard({quest,progress,busy,act,edit,remove,evidence}:{quest:Quest;progress?:QuestProgress;busy:boolean;act:(action:'start'|'progress'|'complete',units?:number)=>void;edit:()=>void;remove:()=>void;evidence:()=>void}){
 const [units,setUnits]=useState(progress?.units??0);
 const [time,setTime]=useState<number|null>(null);
 useEffect(()=>setUnits(progress?.units??0),[progress?.units]);
 useEffect(()=>{const tick=()=>setTime(Date.now());tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);},[]);
 const gated=quest.quest_type==='verified'||quest.quest_type==='focus';
 const completed=progress?.status==='completed';
 const remaining=progress&&time!==null?Math.max(0,Math.ceil((Date.parse(progress.started_at)+quest.duration_minutes*60000-time)/1000)):null;
 const xp=Math.min(240,quest.duration_minutes*({easy:2,medium:3,hard:4}[quest.difficulty]));
 return <article className={`quest-card ${progress&&!completed?'quest-active':''}`}><div className="quest-image"><Artwork art={assets.quests[quest.art_key]}/><span className="quest-number">{label(quest.quest_type)} · {quest.recurrence==='daily'?'Daily':'One time'}</span><span className="quest-category">{label(quest.category)}</span></div><div className="quest-body"><h3>{quest.title}</h3><p>{quest.description}</p><div className="quest-values"><span>{quest.duration_minutes} min · {label(quest.difficulty)}</span><span className="cyan">+{xp} XP</span><span className="gold">+{Math.floor(xp/5)} Credits</span></div><p className="completion-condition">{quest.completion_condition}</p><div className="quest-status"><span className="status-dot"/>{completed?'Completed · rewards saved':progress?'In progress':'Available'}</div>
 {quest.quest_type==='verified'&&<p className="proof-note">Complete the required Proof of Action session to earn rewards.</p>}
 {progress&&!completed&&!gated&&<><label className="quest-progress-input">Completed units ({progress.units}/{quest.target_units})<input aria-label={`Progress for ${quest.title}`} type="number" min={progress.units} max={quest.target_units} value={units} onChange={e=>setUnits(Number(e.target.value))} disabled={busy}/></label><button className="rpg-button secondary" disabled={busy||!Number.isInteger(units)||units<=progress.units||units>quest.target_units} onClick={()=>act('progress',units)}>Save Progress</button><small className="quest-time">{remaining===null?'Checking duration…':remaining>0?`${Math.floor(remaining/60)}m ${remaining%60}s minimum duration remaining`:'Minimum duration met. Confirm your completion condition is satisfied.'}</small></>}
 {!completed&&gated&&<button className="rpg-button" onClick={evidence}>{quest.quest_type==='focus'?'Open Focus Mode':'Open Proof of Action'}</button>}
 {!completed&&!gated&&<button className="rpg-button" disabled={busy||!!progress&&(progress.units<quest.target_units||remaining===null||remaining>0||quest.quest_type==='verified')} onClick={()=>act(progress?'complete':'start')}>{busy?'Saving…':progress?'Confirm Completion':'Begin Quest'}<ChevronRight size={15}/></button>}
 <div className="quest-actions"><button type="button" className="text-link" disabled={busy||!!progress} onClick={edit}>Edit</button><button type="button" className="text-link" disabled={busy} onClick={remove}>Delete</button></div></div></article>;
}
export function QuestTracker({game,createSignal,onEvidence}:{game:GameData;createSignal:number;onEvidence:(id:string)=>void}){
 const router=useRouter();const [pending,startTransition]=useTransition();const [filter,setFilter]=useState('all');const [editor,setEditor]=useState<Quest|null|undefined>(undefined);const [result,setResult]=useState<GameActionState>({});const [remove,setRemove]=useState<Quest|null>(null);
 useEffect(()=>{if(createSignal>0)setEditor(null);},[createSignal]);
 const act=(q:Quest,action:'start'|'progress'|'complete',units?:number)=>{setResult({});startTransition(async()=>{try{const response=await advanceQuest({id:q.id,action,units:units??null});setResult(response);if(response.success)router.refresh();}catch{setResult({error:'Connection lost. Retry safely; rewards cannot be duplicated.'});}});};
 const visible=game.quests.filter(q=>filter==='all'||q.category===filter||q.quest_type===filter);
 if(!game.ready)return <section id="quests" className="rpg-panel quest-panel"><h2>Quest Tracker</h2><p role="alert" className="auth-message">{game.error}</p><button className="rpg-button" onClick={()=>router.refresh()}>Retry Connection</button></section>;
 return <section id="quests" className="rpg-panel quest-panel"><SheetRegion art={assets.decorativeUI.corner} className="panel-ornament" decorative/><div className="section-heading"><div><p className="eyebrow">ACTIVE DIRECTIVES</p><h2>Today&apos;s Quests</h2></div><span className="count-label">{visible.length} QUESTS</span></div><div className="filter-row" aria-label="Filter quests">{['all','daily','custom','verified','focus',...categories.filter(c=>c!=='focus')].map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{label(f)}</button>)}</div><p className="proof-note">Daily quests reset at 00:00 UTC. Complete meaningful work before confirming. Rewards have daily limits.</p><div aria-live="polite">{result.error&&<p className="auth-message" role="alert">{result.error}</p>}{result.message&&<p className="quest-feedback">{result.message}</p>}{result.levelUp&&<p className="level-up">LEVEL UP · {result.levelUp} — Your legend grows.</p>}</div><div className="quest-grid">{visible.map(q=><LiveQuestCard key={q.id} quest={q} progress={game.progress.find(p=>p.quest_id===q.id)} busy={pending} act={(a,n)=>act(q,a,n)} edit={()=>setEditor(q)} remove={()=>setRemove(q)} evidence={()=>onEvidence(q.id)}/>)}</div>{visible.length===0&&<p>No quests in this category. Create your next meaningful action.</p>}<button className="rpg-button secondary quest-create" onClick={()=>setEditor(null)} disabled={pending}><Plus size={16}/>Create Quest</button>
 {editor!==undefined&&<QuestEditor quest={editor} close={()=>setEditor(undefined)} onSaved={s=>{setResult(s);setEditor(undefined);router.refresh();}}/>}
 {remove&&<div className="delete-confirm" role="alert"><p>Delete “{remove.title}” from your tracker? Saved completion and reward history will remain.</p><button className="rpg-button secondary" disabled={pending} onClick={()=>setRemove(null)}>Keep Quest</button><button className="rpg-button" disabled={pending} onClick={()=>startTransition(async()=>{try{const response=await archiveQuest(remove.id);setResult(response);if(response.success){setRemove(null);router.refresh();}}catch{setResult({error:'Unable to remove quest. Retry shortly.'});}})}>Confirm Delete</button></div>}
 </section>;
}
export function RecentGains({game}:{game:GameData}){
 return <>{game.completions.slice(0,5).map(c=><div className="recent-gain" key={c.id}><strong>{c.quest_snapshot.title}</strong><span className="cyan">+{c.xp} XP</span><span className="gold">+{c.credits} Credits</span><small>{new Date(c.completed_at).toISOString().slice(0,16).replace('T',' ')} UTC</small></div>)}{game.completions.length===0&&<p>No recorded gains yet. Complete your first quest to begin.</p>}</>;
}
