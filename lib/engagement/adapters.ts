import type {VerificationMethod} from './types';
export interface VerificationAdapter {
 method:VerificationMethod;
 requiredSignals:readonly string[];
 unavailableSignals:readonly string[];
 browserOutcome:'verified'|'focus'|'pending';
 explanation:string;
}
export const verificationAdapters:Record<VerificationMethod,VerificationAdapter>={
 gym:{method:'gym',requiredSignals:['accurate foreground GPS','continuous geofence dwell','server duration','random checkpoint','activity confirmation'],unavailableSignals:['biometric identity','independent workout measurement'],browserOutcome:'verified',explanation:'Saved locations are self-selected, not venue-certified. Browser location and activity reports can be spoofed; the confidence score is a rules score, not a probability of truth.'},
 focus:{method:'focus',requiredSignals:['foreground heartbeats','active server duration','random checkpoint','activity confirmation'],unavailableSignals:['OS app blocking','other-app activity'],browserOutcome:'focus',explanation:'Counts foreground check-ins only. Does not monitor or block other applications.'},
 home_workout:{method:'home_workout',requiredSignals:['duration','activity confirmation','reflection','checkpoint'],unavailableSignals:['independent exercise measurement'],browserOutcome:'pending',explanation:'Browser self-reports cannot independently establish physical exercise. Verified remains Pending; an Honor or Focus quest can record self-reported work.'},
 running:{method:'running',requiredSignals:['location samples','duration','activity confirmation','checkpoint'],unavailableSignals:['trusted route/activity attestation'],browserOutcome:'pending',explanation:'GPS samples are supported, but no trusted running/activity provider is configured. Raw route coordinates are not retained; Verified remains Pending.'},
 coding:{method:'coding',requiredSignals:['foreground duration','reflection','checkpoint'],unavailableSignals:['trusted repository or editor activity'],browserOutcome:'pending',explanation:'No editor/repository integration is configured. A reflection is a check-in, not proof of code. Use Focus for foreground work sessions.'},
 studying:{method:'studying',requiredSignals:['foreground duration','reflection','checkpoint'],unavailableSignals:['independent learning evidence'],browserOutcome:'pending',explanation:'Browser focus and reflection cannot prove learning. Verified remains Pending; Focus and Honor remain available.'},
 reading:{method:'reading',requiredSignals:['foreground duration','reflection','checkpoint'],unavailableSignals:['independent reading evidence'],browserOutcome:'pending',explanation:'A browser cannot establish that pages were read or understood. Verified remains Pending; Focus and Honor remain available.'},
};
