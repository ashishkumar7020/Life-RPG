# ⚔️ Life RPG

### Turn Real Life Into a Verifiable RPG

Life RPG is a full-stack gamified productivity and real-life progression platform that transforms everyday activities into RPG-style quests.

Instead of simply checking off tasks, users complete quests, earn XP and Credits, improve character attributes, maintain streaks, unlock achievements, collect cosmetics, and build a verifiable progression history.

> **Normal Productivity App:** “I completed my task.”
>
> **Life RPG:** “I completed my quest — and my progress has evidence.”

---

## 🏆 Hackathon Project

**Hackathon:** Tech Zephyr 4.0 Web Hackathon  
**Theme:** Life RPG  
**Repository:** https://github.com/ashishkumar7020/Life-RPG

---

## 🎮 What is Life RPG?

Life RPG turns real-world effort into measurable character progression.

Users can:

- Create and complete quests
- Earn XP and Credits
- Level up their character
- Develop RPG attributes
- Build daily streaks
- Provide proof of real-world activities
- Complete verified gym quests
- Use Focus Mode
- Unlock achievements
- Purchase cosmetic rewards
- Customize their RPG profile
- Add friends
- Compare progression
- Compete on leaderboards
- Track their progression history

The central idea is simple:

**Your real-life actions become your character's progression.**

---

# 💡 Problem We Solve

Traditional productivity applications mainly focus on:

- Task lists
- Checkboxes
- Deadlines
- Basic statistics

The problem is that completing a checkbox does not communicate:

- How meaningful the activity was
- Whether it actually happened
- How it contributes to long-term progression
- Whether the user is consistently improving

Life RPG addresses this by combining:

### Productivity
Real-world tasks become quests.

### Gamification
Quests provide XP, Credits, Attributes, Streaks and Achievements.

### Verification
Certain activities can require task-specific proof.

### Progression
XP and attribute growth create long-term character development.

### Social Competition
Verified progression can be compared through friends and leaderboards.

---

# 🚀 Key Differentiator

Life RPG is **not just a productivity dashboard with a game-like skin**.

The system is designed around a server-authoritative RPG progression engine.

```text
Real-world activity
        ↓
Quest
        ↓
Completion
        ↓
Verification / Proof
        ↓
Verification confidence
        ↓
Server-authoritative reward calculation
        ↓
XP + Credits + Attribute XP
        ↓
Level / Streak / Achievement
        ↓
Character progression
```

This makes progression meaningful instead of allowing users to freely assign themselves rewards.

---

# ✨ Core Features

## ⚔️ Quest System

Life RPG supports multiple quest types:

- Daily Quests
- Custom Quests
- Verified Quests
- Focus Quests

Users can:

- Create quests
- Start quests
- Track progress
- Complete quests
- View completion history

Custom quests do not allow users to arbitrarily assign unlimited XP or Credits.

Rewards are calculated by the server based on factors such as:

- Difficulty
- Duration
- Category
- Verification requirements

---

# 🧙 Character Progression

Users develop a real RPG character through their real-world actions.

### Attributes

Life RPG includes:

- 💪 Strength
- 🧠 Intelligence
- 🎯 Focus
- 🛡️ Discipline
- ❤️ Vitality
- 🗣️ Charisma

Attributes increase through relevant quest completion rather than being freely editable.

A single quest can contribute to multiple attributes.

Example:

```text
Gym Quest
   ↓
Strength XP
   +
Vitality XP
   +
Discipline XP
```

---

# ⭐ XP & Level System

XP is server-authoritative.

Users cannot directly manipulate their XP through the client.

The progression system uses a non-linear level requirement.

```text
XP required for Level N
=
BASE_XP × N^1.5
```

This allows early progression to feel accessible while making higher levels increasingly meaningful.

The UI displays:

- Current Level
- Current XP
- XP required for next level
- Recent XP gains
- Verified XP

---

# 🔥 Streak System

Consistent activity contributes to daily streak progression.

Streaks can unlock:

- Achievements
- Cosmetic rewards
- Status progression

Streak rewards are intentionally separated from unlimited XP generation to prevent simple reward farming.

---

# 🛡️ Proof of Action

One of the main differentiators of Life RPG is **Proof of Action**.

Not every quest needs the same type of verification.

Different activities can use different signals.

Examples:

- Identity / liveness
- Location
- Duration
- GPS / geofence
- Activity checkpoints
- Digital activity
- Focus sessions
- Reflection / confirmation

The system produces a verification confidence result rather than simply trusting a checkbox.

---

# 🏋️ Gym Verification — Flagship Flow

The Gym Quest is the primary Proof of Action experience.

```text
Choose Gym
   ↓
Save Gym Location
   ↓
Start Quest
   ↓
Identity / Liveness Check
   ↓
Travel / Arrival
   ↓
Geofence Validation
   ↓
Minimum Dwell Duration
   ↓
Random Checkpoint
   ↓
Final Check
   ↓
Verification Confidence
   ↓
XP + Credits + Strength Progression
```

### Important Design Principle

**Arrival alone is not considered proof of completion.**

The system combines multiple signals to make simple check-in abuse harder.

Verification states include:

- Passed
- Failed
- Pending

The interface also explains why a verification step succeeded or failed.

---

# 🔐 Verification Levels

Life RPG supports multiple verification levels:

### Honor
Self-confirmation.

### Focus
Timer and focus/check-in based evidence.

### Verified
Task-specific evidence.

### Strong Verified
Multiple independent signals.

The architecture allows verification strength to grow as more task-specific evidence becomes available.

---

# 🎯 Focus Mode

Focus Mode turns focused work into a quest.

It provides:

- Quest context
- Timer
- Progress
- Focus state
- Visibility detection
- Completion tracking
- Persistent session data

Focus Mode is designed to help users concentrate without attempting to take control of unrelated applications or provide unrealistic OS-level surveillance.

---

# 💰 Economy

Life RPG includes an in-game Credits economy.

Credits can be used for cosmetic/status items such as:

- Banners
- Profile Frames
- Titles
- Auras
- Themes
- Achievement Badges

There are no competitive pay-to-win power boosts.

---

# 🎒 Treasury & Inventory

Users can:

- View available rewards
- Preview cosmetics
- Purchase unlocked items
- View owned items
- Equip cosmetics
- View locked items

Inventory state is persisted in the backend.

---

# 🏆 Achievements

Life RPG includes achievement progression.

Examples include:

- First Quest
- 7 Day Streak
- Gym Veteran
- Code Master
- Scholar
- Legendary

Achievements provide additional long-term progression goals.

---

# 🤝 Fellowship

Users can connect with other players through the social system.

Features include:

- Friend discovery
- Friend requests
- Friend relationships
- Profile viewing
- Progress comparison
- Privacy controls

Social information is intentionally limited to appropriate progression data.

Sensitive verification evidence is not exposed through the social system.

---

# 🏅 Hall of Legends

Life RPG provides multiple leaderboards.

Supported leaderboard categories include:

- Weekly Verified XP
- Overall Verified XP
- Streak
- Strength
- Intelligence
- Focus
- Discipline

Verified XP is emphasized for competitive progression so that simple self-reported activity does not dominate the rankings.

---

# 👤 RPG Profile

Each player has a customizable RPG profile containing:

- Character
- Level
- XP
- Verified XP
- Attributes
- Streak
- Achievements
- Equipped Banner
- Profile Frame
- Title
- Aura
- Theme
- Featured Achievements

The profile acts as the player's persistent RPG identity.

---

# 🎨 Visual Design

Life RPG intentionally avoids the appearance of a traditional SaaS dashboard.

The visual language is inspired by:

- Dark fantasy
- System RPG interfaces
- Hunter-style HUDs
- Fantasy command halls
- Layered metal/stone panels
- Electric blue system effects
- Gold reward accents
- Atmospheric environments
- Tactile interactions

### Design Principles

- Dark blue / black foundation
- Cyan / electric blue progression indicators
- Gold for Credits and rewards
- Selective glow
- RPG-style framed panels
- Persistent player identity
- Quest tracker as the visual center
- Responsive layouts
- Strong visual hierarchy

The goal is to make the application feel like a **game world**, not a productivity spreadsheet.

---

# 🏗️ Technical Architecture

```text
┌──────────────────────────────┐
│          Next.js App         │
│      React + TypeScript      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Server Actions / API Routes  │
│ Validation + Game Logic      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│        Supabase Auth         │
│        PostgreSQL DB         │
│             RLS              │
└──────────────────────────────┘
```

The client is not treated as the authority for important progression values.

---

# 🧰 Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Lucide Icons

### Backend

- Next.js Server Actions
- Next.js Route Handlers
- Supabase

### Database

- PostgreSQL through Supabase

### Authentication

- Supabase Auth

### Validation

- Zod

### Testing

- Vitest
- Playwright

### Deployment

- Vercel

### Browser APIs

- Geolocation API
- Visibility Detection
- Timing / Session APIs

---

# 🗄️ Database & Persistence

Life RPG uses a remote PostgreSQL database rather than browser-only storage.

The architecture includes persistent data for:

- Profiles
- Characters
- Attributes
- Quests
- Quest Progress
- Quest Completions
- Verification Sessions
- Verification Signals
- Location Checkpoints
- XP Transactions
- Credit Transactions
- Streaks
- Achievements
- User Achievements
- Reward Items
- Inventory Items
- Friendships
- Focus Sessions
- Privacy Settings

Row Level Security (RLS) is used to protect user-owned data.

---

# 🔒 Security Principles

Security-sensitive game state is handled server-side.

The client should not be trusted to directly determine:

- XP
- Credits
- Attribute progression
- Inventory ownership
- Verification results
- Reward values

Conceptually:

```text
Client
  ↓
"I completed this quest"
  ↓
Backend
  ↓
Validate quest
  ↓
Validate completion
  ↓
Validate verification
  ↓
Calculate reward
  ↓
Create transactions
  ↓
Update progression
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Supabase service-role/secret credentials must never be exposed to the browser.

`.env` and `.env.local` are excluded from version control.

---

# 🔄 Quest Lifecycle

```text
CREATE
  ↓
START
  ↓
PROGRESS
  ↓
VERIFY (when required)
  ↓
COMPLETE
  ↓
SERVER REWARD CALCULATION
  ↓
XP TRANSACTION
  ↓
CREDIT TRANSACTION
  ↓
ATTRIBUTE PROGRESSION
  ↓
STREAK UPDATE
  ↓
ACHIEVEMENT CHECK
  ↓
UPDATED CHARACTER STATE
```

This makes progression traceable and persistent.

---

# 🧪 Testing & Validation

The project includes automated validation for important application areas.

Validation includes:

- TypeScript checks
- ESLint
- Production build
- Unit tests
- Application flows
- Database / RLS behavior
- Core RPG progression
- Verification flows
- Social functionality
- Inventory persistence

Run:

```bash
npm install
```

```bash
npm run lint
```

```bash
npm run build
```

---

# 💻 Local Development

## 1. Clone the Repository

```bash
git clone https://github.com/ashishkumar7020/Life-RPG.git
```

```bash
cd Life-RPG
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create:

```text
.env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## 4. Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 🗃️ Supabase Setup

Database migrations are available under:

```text
supabase/migrations/
```

Run the migrations against the Supabase PostgreSQL database in chronological order.

The database uses:

- PostgreSQL
- Supabase Auth
- Row Level Security
- Server-side game logic
- Persistent progression data

---

# 📁 Project Structure

```text
Life-RPG/
│
├── app/
│   ├── achievements/
│   ├── character/
│   ├── fellowship/
│   ├── quests/
│   ├── treasury/
│   ├── verification/
│   ├── profile/
│   ├── settings/
│   └── ...
│
├── components/
│   ├── dashboard/
│   ├── quests/
│   ├── character/
│   ├── profile/
│   ├── social/
│   └── ui/
│
├── lib/
│   ├── supabase/
│   ├── game/
│   ├── verification/
│   └── validation/
│
├── public/
│   └── assets/
│
├── supabase/
│   └── migrations/
│
├── docs/
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

# 🧭 Main Application Areas

| Area | Purpose |
|---|---|
| Command Hall | Main RPG dashboard |
| Quests | Browse, create and complete quests |
| Character | Character progression and attributes |
| Achievements | Achievement collection |
| Treasury | Cosmetic rewards and inventory |
| Fellowship | Friends and social progression |
| Hall of Legends | Leaderboards |
| Verification | Proof of Action flows |
| Profile | RPG identity and customization |
| Settings | Account and privacy controls |

---

# 📱 Responsive Experience

The application is designed for:

- Desktop
- Tablet
- Mobile

The desktop experience uses a persistent RPG shell with:

- Left navigation
- Top player HUD
- Center content area
- Player progression panel

The center content remains the primary scrollable area while persistent player information stays accessible.

---

# ♿ UX & Accessibility

The project considers:

- Keyboard interaction
- Focus states
- Semantic controls
- Responsive layouts
- Loading states
- Empty states
- Error states
- Mobile usability
- Reduced unnecessary motion
- Clear feedback after actions

---

# 🛡️ Privacy

Proof of Action can involve sensitive signals such as location or identity-related checks.

The system follows these principles:

- Request permissions explicitly
- Explain why verification is required
- Minimize retained evidence
- Prefer transient processing where practical
- Store verification results / metadata rather than unnecessary raw media
- Do not expose sensitive verification evidence socially
- Respect browser permission and accuracy limitations

Life RPG does not claim to completely eliminate cheating.

Instead, it increases confidence by combining appropriate evidence for the activity.

---

# 🌟 What Makes Life RPG Different?

### 1. Real-Life → RPG Progression

The game world is based on actual user activity.

### 2. Verifiable Progress

Important activities can have Proof of Action instead of relying only on checkboxes.

### 3. Server-Authoritative Economy

XP and Credits are calculated and persisted on the backend.

### 4. Attribute-Based Growth

Different real-life activities improve different character attributes.

### 5. Verification-Aware Competition

Leaderboards emphasize verified progression.

### 6. Cosmetic-Only Economy

Rewards provide identity and customization rather than pay-to-win competitive advantages.

### 7. Persistent RPG Identity

The user's profile, character, achievements, inventory and progression survive refreshes and sessions.

---

# 🎬 Recommended Demo Flow

```text
1. Sign Up / Log In
        ↓
2. Enter Command Hall
        ↓
3. Select a Quest
        ↓
4. Start Quest
        ↓
5. Complete Quest
        ↓
6. Show Proof / Verification
        ↓
7. Receive XP + Credits
        ↓
8. Show Level / Attribute Progression
        ↓
9. Refresh Page
        ↓
10. Show Persistent Progress
```

This demonstrates the core full-stack flow:

**Action → Backend → Database → Progression → Persistence**

---

# 📊 Project Status

### Core Platform

- [x] Authentication
- [x] Protected routes
- [x] Character setup
- [x] Quest CRUD
- [x] Quest completion
- [x] XP system
- [x] Level progression
- [x] Credits economy
- [x] Attributes
- [x] Streaks
- [x] Achievements
- [x] Inventory
- [x] Profile customization
- [x] Friends
- [x] Leaderboards
- [x] Focus Mode
- [x] Proof of Action architecture
- [x] Gym verification flow
- [x] Supabase persistence
- [x] Row Level Security
- [x] Responsive UI
- [x] Loading / error / empty states

---

# ⚠️ Platform Limitations

Some real-world verification capabilities depend on browser and device permissions.

Examples include:

- GPS accuracy
- Browser geolocation permissions
- Camera / liveness capabilities
- Visibility detection
- Mobile browser behavior
- Background execution restrictions

The implementation is designed to work within these platform limitations rather than pretending to have unrestricted device access.

---

# 🔮 Future Scope

Possible future extensions include:

- More verified activity types
- Running route verification
- Coding activity verification
- Study verification
- Reading verification
- More advanced anti-abuse signals
- More social systems
- Guilds
- Parties
- Seasonal progression
- Expanded achievements
- More cosmetic sets
- Richer RPG environments
- Advanced analytics
- Mobile / PWA enhancements

---

# 🏁 Philosophy

Life RPG is built around one idea:

> **Progress should feel earned.**

A task should not simply disappear after being checked off.

It should contribute to something larger:

```text
Action
  ↓
Quest
  ↓
Evidence
  ↓
Reward
  ↓
Progression
  ↓
Character
```

**Your real life becomes the game world.**

**Your effort becomes XP.**

**Your consistency becomes your streak.**

**Your achievements become your identity.**

**And your progression becomes something you can actually see.**

---

## 👥 Team

**Life RPG — Tech Zephyr 4.0 Web Hackathon**

Built as a full-stack RPG-inspired real-life progression platform.
