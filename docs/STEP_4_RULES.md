# Step 4: proof, focus and cosmetics

This implements the user-specified Step 4 scope on the existing architecture. The original PRD and related source documentation were not present; explicit defaults below are implementation choices, not claims about unavailable source documents.

## Verification contract

Honor remains Step 3 self-confirmed completion. Focus requires a persisted foreground timer, randomized check-in and activity confirmation. Verified requires task-specific evidence. Strong Verified requires independent attestations and remains Pending because no trusted identity/activity provider is configured. `lib/engagement/adapters.ts` defines the reusable method capability interface; generic server actions and SQL signals share the same session lifecycle.

Gym uses a privately saved, self-selected location (not a certified venue), fixed 150m geofence and reported GPS accuracy of at most 50m. A fix passes only when distance plus accuracy fits entirely within the fence. An outside-area sample and arrival are recorded separately; arrival alone never earns rewards. No raw sampled coordinates or route are retained.

Foreground samples arrive roughly every 15 seconds. The server credits at most 30 seconds per sample, only for gaps of 3–45 seconds and consecutive good signals. Gym requires continuous dwell of min(10 minutes, required quest duration), total active time equal to the quest duration, a fresh final location sample, the randomized checkpoint and self-confirmed activity. Leaving, inaccurate GPS or a long gap resets continuous dwell. These signals do not independently establish exercise.

The checkpoint opens randomly at 35–60% of the session's required duration and stays open for two minutes. Invalid or missed checkpoints fail the session. Pausing stops accrual and resets continuous gym dwell; it does not move the checkpoint window. Exit fails the attempt without rewards. Sessions expire after 24 hours; at most three attempts may exist per quest occurrence. A unique live/passed session index and the Step 3 unique completion ledger prevent replay rewards.

Permission denial, GPS unavailability, poor accuracy, insufficient time/dwell, missing activity or unavailable evidence remain Pending with reasons unless an explicit terminal failure occurs. Gym can pass at confidence 80 and Focus at 65 when their browser-compatible checks pass. These are rules scores, not calibrated probabilities. Strong Verified stays Pending without independent attestation. The browser cannot make cheating impossible.

## Identity, camera and other methods

The account is authenticated. Optional camera preview is explicitly requested, local-only, audio-free and stoppable. No media is uploaded or stored. Availability and user-observed movement are not biometric identity/liveness; `liveness_state` remains unavailable and camera preview grants no confidence points.

Home Workout, Running, Coding, Studying and Reading have session adapters, duration/activity/checkpoint and appropriate reflection or location inputs. Their Verified result stays Pending without independent activity, repository/editor, learning or route attestation. A reflection's presence/length is stored; its text is not retained. Focus and Honor quests remain the honest way to record self-reported work.

Focus counts only server-timed foreground heartbeats; hidden time, long gaps and paused time are not credited. Refresh retains accrued time but requires explicitly re-enabling signals. No OS blocking, other-app monitoring or background execution guarantee is claimed.

## Achievements and inventory

Automatic completion-triggered and retry-safe unlocks: First Quest=1 completion; 7 Day Streak=7 longest streak; Gym Veteran=30 passed gym completions; Code Master=50 coding-art/category-mapped quests; Scholar=50 study quests; Legendary=level 100. Definitions are data-driven. Unlocks also grant their free cosmetic badges. Existing eligible history is recognized on engagement synchronization.

The catalog contains 39 supplied-art items: banners, frames, titles, auras, themes, miscellaneous illustrations and six achievement badges. First items in the six non-badge categories are free defaults; badges require their achievements. Other items use server prices, level requirements and, for selected highest-rarity items, Legendary. Prices and requirements are stored in the catalog and never accepted from the client. Gems, Time Boost and Growth are cosmetic illustrations, not currencies or stat modifiers. Credits remain the earned currency.

Buying locks the character, verifies eligibility and balance, inserts unique ownership/purchase rows and appends a negative credit transaction atomically. Repeat purchases cannot charge twice. Equipping verifies ownership/eligibility and permits one item per slot. Frames, titles, aura and theme selections affect the existing HUD/hero; other equipped artwork is displayed in the identity panel. Unequip and reload are persistent. No cosmetic affects XP, attributes or competitive power.

## Privacy and security

All nine new tables have RLS. Catalogs are shared read-only; evidence, locations, inventory, purchases and unlocks are owner-only. Authenticated clients have SELECT only. All mutations use server actions with validation and owner-derived SQL RPCs, empty search paths and anonymous execution revocation. The original reward calculation is private and cannot be called directly by client roles; public completion enforces the passed-session gate for Focus and Verified quests.

Detailed signals and distance/accuracy checkpoints are removed after seven days on the owner's next synchronization; this is not a scheduled purge guarantee. Owners can clear detailed evidence immediately, ending a pending attempt, while retaining minimal outcome and reward history. Saved gym locations can be removed after pending sessions end. No evidence is exposed through social surfaces. No service-role key or localStorage persistence is introduced.

No Step 5 friends, requests, social profiles, leaderboards or social privacy features were implemented.
