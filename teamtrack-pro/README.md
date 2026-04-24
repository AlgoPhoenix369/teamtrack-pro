# TeamTrack Pro

Internal Task & Job Application Tracking System for annotators, software taskers, and admins.

## Tech Stack

- **Frontend:** React (JSX) + Vite, Bootstrap 5, Tailwind CSS v4
- **Backend/Auth/DB:** Supabase (PostgreSQL, Supabase Auth, Realtime, Storage)
- **Charts:** Recharts
- **Drag & Drop:** @hello-pangea/dnd
- **Routing:** React Router v6
- **PWA:** vite-plugin-pwa

---

## Quick Setup

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com), create a new project, and note:
- **Project URL** (Settings → API → Project URL)
- **Anon/Public Key** (Settings → API → anon key)

### 2. Run the Schema

In your Supabase **SQL Editor**, paste and run the entire contents of:

```
supabase/schema.sql
```

This creates all tables, indexes, RLS policies, and seeds the team data.

### 3. Create Admin Auth Accounts

In Supabase → **Authentication → Users → Add User**, create these three accounts:

| Email | Name | Role |
|-------|------|------|
| vincent@teamtrack.pro | Vincent | super_admin |
| judy@teamtrack.pro | Judy | super_admin |
| harveel@teamtrack.pro | Harveel | view_admin |

Set passwords you choose. These users already exist in the `users` table via the seed.

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install & Run

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## Users & Login

### Admins (email + password)
- **Vincent** — `vincent@teamtrack.pro` — Super Admin (full CRUD)
- **Judy** — `judy@teamtrack.pro` — Super Admin (full CRUD)
- **Harveel** — `harveel@teamtrack.pro` — View-only Admin

### Taskers (name + PIN)
Select name from the login screen and enter PIN. Default PIN for all taskers is `1234`.

| Name | Team |
|------|------|
| Sharon | Team 1 |
| Ruth | Team 1 |
| Rose | Team 1 |
| Davis | Team 1 |
| Newton | Team 1 |
| Evans | Team 2 |

**Change PINs:** After first login as Vincent or Judy, go to **Admin Panel → Users → Reset PIN** for each tasker.

---

## Features

### Time Tracker
- Auto-starts timer on tasker login
- Pause/Resume/Stop session
- Log multiple activity entries per session (Annotation Task, Software Task, Review, etc.)
- Session description required before stopping (prevents empty sessions)
- Timer state persists in `localStorage` — refreshing the page resumes from where you left off
- Weekly bar chart, session history with expandable entries
- Admin: view all sessions across all users, filter, export CSV

### Job Application Tracker
- **Kanban Board** — drag & drop across pipeline stages (Wishlist → Offer)
- **List/Table View** — sortable, filterable
- Full application fields: company, role, job board, URL, salary, contact, persona used, follow-up date, tags, notes
- **Public share link** — `/applications/share/{id}` — no login required, copyable with one click
- Timeline log: every status change and note recorded with timestamp
- Overdue follow-up highlighting (red badges)
- Admin: view all applications across all users, filter by user/status/priority
- Export CSV

### Personas
- Create and assign professional identity accounts to taskers
- Only Vincent/Judy can create/edit/delete
- Taskers see only their assigned personas
- Resume file upload via Supabase Storage
- Personas appear in application form dropdown

### Admin Panel
- **Users tab:** create users, reset PINs, activate/deactivate
- **Teams tab:** visual view of Team 1 and Team 2
- **Audit Log tab:** every admin CUD action logged with who/what/when
- Harveel sees all tabs but all write actions are disabled with view-only tooltip

### Analytics
- Application status donut chart
- Applications over time (30-day line chart)
- Hours logged per day (bar chart)
- Per-member stats (admin only)
- Job board breakdown
- Offer rate, total hours, top board KPIs

---

## Supabase Storage Setup

For persona resume uploads, create a storage bucket:

1. Supabase → **Storage → New Bucket**
2. Name: `persona-files`
3. Enable **Public bucket** (or set custom RLS policies)

---

## PWA Installation

The app is configured as a PWA. When running on a device, users will see an "Install" prompt in the browser to add TeamTrack Pro to their home screen.

---

## Project Structure

```
src/
├── components/
│   ├── layout/      Sidebar, Navbar, Layout
│   ├── timer/       ActivityEntryForm, EntryFeed, SessionCard
│   ├── applications/ KanbanBoard, AppTable, AppForm, AppDetailModal, Timeline
│   ├── personas/    PersonaForm
│   ├── admin/       (via Admin page)
│   ├── analytics/   (via Analytics page)
│   └── ui/          Button, Modal, Badge, Skeleton, EmptyState, StatsCard
├── context/         AuthContext, TimerContext, AppContext
├── hooks/           (extend as needed)
├── pages/           Login, Dashboard, TimeTracker, Applications, ApplicationShare,
│                    Personas, Admin, Analytics, Settings
├── services/        supabase.js, authService, sessionService,
│                    applicationService, personaService, adminService
└── utils/           formatTime, roleGuard, exportCSV
supabase/
└── schema.sql       Full schema + RLS policies + seed data
```

---

## Security Notes

- Supabase RLS enforces all access control at the database level
- Tasker PINs are stored as plain text in dev — for production, hash via a Supabase Edge Function
- The public application share route bypasses auth by design; no private data is exposed
- All admin destructive actions are logged to `audit_log`
