-- ============================================================
-- TeamTrack Pro — Supabase Schema, RLS Policies & Seed Data
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────────

create table if not exists teams (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  led_by      uuid,
  created_at  timestamptz default now()
);

create table if not exists users (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text unique,
  role        text not null check (role in ('super_admin','view_admin','tasker')),
  team_id     uuid references teams(id),
  pin_hash    text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- Add FK for teams.led_by after users table exists
alter table teams add constraint fk_teams_led_by
  foreign key (led_by) references users(id) on delete set null;

create table if not exists sessions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  date            date not null default current_date,
  start_time      timestamptz not null default now(),
  end_time        timestamptz,
  total_seconds   integer default 0,
  description     text,
  status          text not null default 'active' check (status in ('active','paused','completed')),
  created_at      timestamptz default now()
);

create table if not exists activity_entries (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references sessions(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  title       text not null,
  notes       text,
  entry_type  text not null default 'Other'
    check (entry_type in ('Annotation Task','Software Task','Review','Communication','Research','Other')),
  timestamp   timestamptz default now()
);

create table if not exists personas (
  id            uuid primary key default uuid_generate_v4(),
  full_name     text not null,
  email         text,
  phone         text,
  linkedin_url  text,
  location      text,
  headline      text,
  resume_url    text,
  notes         text,
  assigned_to   uuid references users(id) on delete set null,
  is_active     boolean default true,
  created_by    uuid references users(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists job_applications (
  id                  uuid primary key default uuid_generate_v4(),
  owner_id            uuid not null references users(id) on delete cascade,
  persona_id          uuid references personas(id) on delete set null,
  company_name        text not null,
  job_title           text not null,
  job_board           text default 'Other'
    check (job_board in ('LinkedIn','Indeed','Glassdoor','Company Website','Referral','Other')),
  application_url     text not null,
  application_date    date default current_date,
  status              text not null default 'Wishlist'
    check (status in ('Wishlist','Applied','Phone Screen','Interview','Technical Test','Offer','Rejected','Withdrawn','Ghosted')),
  priority            text default 'Medium'
    check (priority in ('Low','Medium','High','Dream Job')),
  salary_range_min    numeric,
  salary_range_max    numeric,
  currency            text default 'USD',
  employment_type     text default 'Full-time'
    check (employment_type in ('Full-time','Part-time','Contract','Freelance','Internship')),
  work_mode           text default 'Remote'
    check (work_mode in ('Remote','Hybrid','On-site')),
  location            text,
  contact_name        text,
  contact_email       text,
  contact_linkedin    text,
  resume_version      text,
  cover_letter_used   boolean default false,
  notes               text,
  follow_up_date      date,
  tags                text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists application_timeline (
  id              uuid primary key default uuid_generate_v4(),
  application_id  uuid not null references job_applications(id) on delete cascade,
  user_id         uuid references users(id) on delete set null,
  event_type      text not null,
  old_value       text,
  new_value       text,
  note            text,
  created_at      timestamptz default now()
);

create table if not exists follow_ups (
  id              uuid primary key default uuid_generate_v4(),
  application_id  uuid not null references job_applications(id) on delete cascade,
  user_id         uuid references users(id) on delete cascade,
  due_date        date not null,
  is_completed    boolean default false,
  created_at      timestamptz default now()
);

create table if not exists audit_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references users(id) on delete set null,
  action      text not null,
  table_name  text not null,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz default now()
);

create table if not exists milestones (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  assigned_to uuid references users(id) on delete cascade,
  created_by  uuid references users(id) on delete set null,
  due_date    date,
  priority    text default 'medium'
    check (priority in ('low','medium','high','critical')),
  category    text default 'Other'
    check (category in ('Annotation','Research','Review','Communication','Application','Training','Software Engineering','Other')),
  status      text not null default 'pending'
    check (status in ('pending','in_progress','submitted','done')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists announcements (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  body        text,
  priority    text default 'normal' check (priority in ('normal','important','urgent')),
  pinned      boolean default false,
  created_by  uuid references users(id) on delete set null,
  reads       jsonb default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists messages (
  id          uuid primary key default uuid_generate_v4(),
  from_user   uuid not null references users(id) on delete cascade,
  to_user     uuid references users(id) on delete cascade,
  body        text not null,
  read        boolean default false,
  created_at  timestamptz default now()
);

create table if not exists meetings (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  description      text,
  scheduled_at     timestamptz,
  duration_minutes integer default 30,
  link             text,
  color            text default '#3B82F6',
  created_by       uuid references users(id) on delete set null,
  attendees        jsonb default '[]',
  status           text default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table if not exists help_queries (
  id              uuid primary key default uuid_generate_v4(),
  from_user_id    uuid not null references users(id) on delete cascade,
  to_user_id      uuid references users(id) on delete set null,
  question        text not null,
  subject         text,
  body            text,
  category        text default 'General',
  priority        text default 'medium',
  status          text default 'open' check (status in ('open','resolved')),
  replies         jsonb default '[]',
  resolved_by     uuid references users(id) on delete set null,
  resolved_at     timestamptz,
  resolution_note text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references users(id) on delete cascade,
  title      text not null,
  body       text,
  type       text default 'info',
  link       text,
  read       boolean default false,
  created_at timestamptz default now()
);

create table if not exists ai_interviews (
  id              uuid primary key default uuid_generate_v4(),
  application_id  uuid references job_applications(id) on delete set null,
  user_id         uuid not null references users(id) on delete cascade,
  platform        text not null,
  status          text default 'scheduled'
    check (status in ('scheduled','in_progress','completed','pending_review','failed','cancelled')),
  scheduled_at    timestamptz,
  completed_at    timestamptz,
  duration_minutes integer,
  score           numeric,
  feedback        text,
  link            text,
  prep_notes      text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists saved_accounts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  label       text not null,
  username    text,
  password_enc text,
  url         text,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists notepad (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  content     text default '',
  updated_at  timestamptz default now()
);

create table if not exists skills (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  name        text not null,
  category    text not null default 'Other'
    check (category in ('Frontend','Backend','Database','DevOps','Testing','Cloud','Tools','Other')),
  proficiency text not null default 'Intermediate'
    check (proficiency in ('Beginner','Intermediate','Advanced','Expert')),
  years_exp   numeric,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ──────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_date on sessions(date);
create index if not exists idx_sessions_status on sessions(status);
create index if not exists idx_activity_entries_session_id on activity_entries(session_id);
create index if not exists idx_activity_entries_user_id on activity_entries(user_id);
create index if not exists idx_job_applications_owner_id on job_applications(owner_id);
create index if not exists idx_job_applications_status on job_applications(status);
create index if not exists idx_job_applications_follow_up on job_applications(follow_up_date);
create index if not exists idx_personas_assigned_to on personas(assigned_to);
create index if not exists idx_timeline_application_id on application_timeline(application_id);
create index if not exists idx_audit_log_user_id on audit_log(user_id);
create index if not exists idx_audit_log_created_at on audit_log(created_at);
create index if not exists idx_milestones_assigned_to on milestones(assigned_to);
create index if not exists idx_milestones_status on milestones(status);
create index if not exists idx_messages_from_user on messages(from_user);
create index if not exists idx_messages_to_user on messages(to_user);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_ai_interviews_user_id on ai_interviews(user_id);
create index if not exists idx_saved_accounts_user_id on saved_accounts(user_id);
create index if not exists idx_skills_user_id on skills(user_id);
create index if not exists idx_skills_category on skills(category);

-- ──────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────
alter table users enable row level security;
alter table milestones enable row level security;
alter table announcements enable row level security;
alter table messages enable row level security;
alter table meetings enable row level security;
alter table help_queries enable row level security;
alter table notifications enable row level security;
alter table ai_interviews enable row level security;
alter table saved_accounts enable row level security;
alter table notepad enable row level security;
alter table skills enable row level security;
alter table teams enable row level security;
alter table sessions enable row level security;
alter table activity_entries enable row level security;
alter table personas enable row level security;
alter table job_applications enable row level security;
alter table application_timeline enable row level security;
alter table follow_ups enable row level security;
alter table audit_log enable row level security;

-- Helper function: get current user's role from users table
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from users
  where email = auth.jwt() ->> 'email'
     or id::text = auth.uid()::text
  limit 1;
$$;

create or replace function get_my_user_id()
returns uuid language sql security definer stable as $$
  select id from users
  where email = auth.jwt() ->> 'email'
  limit 1;
$$;

-- ── USERS ──
create policy "super_admins_all_users" on users
  for all using (get_my_role() = 'super_admin');

create policy "view_admin_read_users" on users
  for select using (get_my_role() = 'view_admin');

create policy "taskers_read_own" on users
  for select using (id = get_my_user_id());

-- ── TEAMS ──
create policy "admins_all_teams" on teams
  for all using (get_my_role() in ('super_admin','view_admin'));

create policy "taskers_read_teams" on teams
  for select using (true);

-- ── SESSIONS ──
create policy "super_admins_all_sessions" on sessions
  for all using (get_my_role() = 'super_admin');

create policy "view_admin_read_sessions" on sessions
  for select using (get_my_role() = 'view_admin');

create policy "taskers_own_sessions" on sessions
  for all using (user_id = get_my_user_id());

-- ── ACTIVITY ENTRIES ──
create policy "super_admins_all_entries" on activity_entries
  for all using (get_my_role() = 'super_admin');

create policy "view_admin_read_entries" on activity_entries
  for select using (get_my_role() = 'view_admin');

create policy "taskers_own_entries" on activity_entries
  for all using (user_id = get_my_user_id());

-- ── PERSONAS ──
create policy "super_admins_all_personas" on personas
  for all using (get_my_role() = 'super_admin');

create policy "view_admin_read_personas" on personas
  for select using (get_my_role() = 'view_admin');

create policy "taskers_read_assigned_personas" on personas
  for select using (assigned_to = get_my_user_id());

-- ── JOB APPLICATIONS ──
create policy "super_admins_all_applications" on job_applications
  for all using (get_my_role() = 'super_admin');

create policy "view_admin_read_applications" on job_applications
  for select using (get_my_role() = 'view_admin');

create policy "taskers_own_applications" on job_applications
  for all using (owner_id = get_my_user_id());

create policy "public_read_application_by_id" on job_applications
  for select using (true);

-- ── TIMELINE ──
create policy "admins_all_timeline" on application_timeline
  for all using (get_my_role() in ('super_admin','view_admin'));

create policy "taskers_own_timeline" on application_timeline
  for all using (
    application_id in (
      select id from job_applications where owner_id = get_my_user_id()
    )
  );

-- ── FOLLOW UPS ──
create policy "admins_all_followups" on follow_ups
  for all using (get_my_role() in ('super_admin','view_admin'));

create policy "taskers_own_followups" on follow_ups
  for all using (user_id = get_my_user_id());

-- ── AUDIT LOG ──
create policy "super_admins_read_audit" on audit_log
  for select using (get_my_role() = 'super_admin');

create policy "system_insert_audit" on audit_log
  for insert with check (true);

-- ── MILESTONES ──
create policy "super_admins_all_milestones" on milestones
  for all using (get_my_role() = 'super_admin');

create policy "view_admin_read_milestones" on milestones
  for select using (get_my_role() = 'view_admin');

create policy "taskers_own_milestones" on milestones
  for all using (assigned_to = get_my_user_id() or created_by = get_my_user_id());

-- ── ANNOUNCEMENTS ──
create policy "super_admins_all_announcements" on announcements
  for all using (get_my_role() = 'super_admin');

create policy "all_read_announcements" on announcements
  for select using (true);

-- ── MESSAGES ──
create policy "super_admins_all_messages" on messages
  for all using (get_my_role() = 'super_admin');

create policy "users_own_messages" on messages
  for all using (from_user = get_my_user_id() or to_user = get_my_user_id());

-- ── MEETINGS ──
create policy "super_admins_all_meetings" on meetings
  for all using (get_my_role() = 'super_admin');

create policy "all_read_meetings" on meetings
  for select using (true);

create policy "users_create_meetings" on meetings
  for insert with check (created_by = get_my_user_id());

-- ── HELP QUERIES ──
create policy "super_admins_all_help" on help_queries
  for all using (get_my_role() = 'super_admin');

create policy "users_own_help" on help_queries
  for all using (from_user_id = get_my_user_id() or to_user_id = get_my_user_id());

-- ── NOTIFICATIONS ──
create policy "super_admins_all_notifications" on notifications
  for all using (get_my_role() = 'super_admin');

create policy "users_own_notifications" on notifications
  for all using (user_id = get_my_user_id());

-- ── AI INTERVIEWS ──
create policy "super_admins_all_ai_interviews" on ai_interviews
  for all using (get_my_role() = 'super_admin');

create policy "view_admin_read_ai_interviews" on ai_interviews
  for select using (get_my_role() = 'view_admin');

create policy "taskers_own_ai_interviews" on ai_interviews
  for all using (user_id = get_my_user_id());

-- ── SAVED ACCOUNTS ──
create policy "super_admins_all_saved_accounts" on saved_accounts
  for all using (get_my_role() = 'super_admin');

create policy "users_own_saved_accounts" on saved_accounts
  for all using (user_id = get_my_user_id());

-- ── NOTEPAD ──
create policy "super_admins_all_notepad" on notepad
  for all using (get_my_role() = 'super_admin');

create policy "users_own_notepad" on notepad
  for all using (user_id = get_my_user_id());

-- ── SKILLS ──
create policy "super_admins_all_skills" on skills
  for all using (get_my_role() = 'super_admin');

create policy "view_admin_read_skills" on skills
  for select using (get_my_role() = 'view_admin');

create policy "users_own_skills" on skills
  for all using (user_id = get_my_user_id());

-- ──────────────────────────────────────────────
-- SEED DATA
-- ──────────────────────────────────────────────

-- Teams first (no led_by yet)
insert into teams (id, name) values
  ('11111111-0000-0000-0000-000000000001', 'Team 1'),
  ('11111111-0000-0000-0000-000000000002', 'Team 2')
on conflict do nothing;

-- Users
insert into users (id, name, email, role, team_id, pin_hash, is_active) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Vincent',  'vincent@teamtrack.pro',  'super_admin', '11111111-0000-0000-0000-000000000001', null,   true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Judy',     'judy@teamtrack.pro',     'super_admin', '11111111-0000-0000-0000-000000000001', null,   true),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Harveel',  'harveel@teamtrack.pro',  'view_admin',  '11111111-0000-0000-0000-000000000002', null,   true),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Sharon',   null,                     'tasker',      '11111111-0000-0000-0000-000000000001', '1234', true),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Ruth',     null,                     'tasker',      '11111111-0000-0000-0000-000000000001', '1234', true),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'Rose',     null,                     'tasker',      '11111111-0000-0000-0000-000000000001', '1234', true),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'Davis',    null,                     'tasker',      '11111111-0000-0000-0000-000000000001', '1234', true),
  ('aaaaaaaa-0000-0000-0000-000000000008', 'Newton',   null,                     'tasker',      '11111111-0000-0000-0000-000000000001', '1234', true),
  ('aaaaaaaa-0000-0000-0000-000000000009', 'Evans',    null,                     'tasker',      '11111111-0000-0000-0000-000000000002', '1234', true)
on conflict (id) do nothing;

-- Set team leaders
update teams set led_by = 'aaaaaaaa-0000-0000-0000-000000000001' where id = '11111111-0000-0000-0000-000000000001';
update teams set led_by = 'aaaaaaaa-0000-0000-0000-000000000003' where id = '11111111-0000-0000-0000-000000000002';

-- NOTE: After running this seed, create Supabase Auth accounts for admins:
-- vincent@teamtrack.pro, judy@teamtrack.pro, harveel@teamtrack.pro
-- via the Supabase Auth dashboard or CLI.
-- Taskers use PIN-based login (no Supabase Auth account needed).
-- Default tasker PIN is 1234 — change via Admin Panel after setup.
