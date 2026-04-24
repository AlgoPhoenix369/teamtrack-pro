// Seed data — mirrors the supabase/schema.sql seed

export const TEAMS = [
  { id: 'team-1', name: 'Team 1', led_by: 'user-vincent', created_at: '2024-01-01T00:00:00Z' },
  { id: 'team-2', name: 'Team 2', led_by: 'user-harveel', created_at: '2024-01-01T00:00:00Z' },
]

export const USERS = [
  { id: 'user-vincent', name: 'Vincent',  email: 'vincent@teamtrack.pro', role: 'super_admin', team_id: 'team-1', pin_hash: null,   is_active: true, teams: { name: 'Team 1' } },
  { id: 'user-judy',    name: 'Judy',     email: 'judy@teamtrack.pro',    role: 'super_admin', team_id: 'team-1', pin_hash: null,   is_active: true, teams: { name: 'Team 1' } },
  { id: 'user-harveel', name: 'Harveel',  email: 'harveel@teamtrack.pro', role: 'view_admin',  team_id: 'team-2', pin_hash: null,   is_active: true, teams: { name: 'Team 2' } },
  { id: 'user-sharon',  name: 'Sharon',   email: null,                    role: 'tasker',      team_id: 'team-1', pin_hash: '1234', is_active: true, teams: { name: 'Team 1' } },
  { id: 'user-ruth',    name: 'Ruth',     email: null,                    role: 'tasker',      team_id: 'team-1', pin_hash: '1234', is_active: true, teams: { name: 'Team 1' } },
  { id: 'user-rose',    name: 'Rose',     email: null,                    role: 'tasker',      team_id: 'team-1', pin_hash: '1234', is_active: true, teams: { name: 'Team 1' } },
  { id: 'user-davis',   name: 'Davis',    email: null,                    role: 'tasker',      team_id: 'team-1', pin_hash: '1234', is_active: true, teams: { name: 'Team 1' } },
  { id: 'user-newton',  name: 'Newton',   email: null,                    role: 'tasker',      team_id: 'team-1', pin_hash: '1234', is_active: true, teams: { name: 'Team 1' } },
  { id: 'user-evans',     name: 'Evans',     email: null, role: 'tasker', team_id: 'team-2', pin_hash: '1234', is_active: true, teams: { name: 'Team 2' } },
  { id: 'user-cliff',     name: 'Cliff',     email: null, role: 'tasker', team_id: 'team-2', pin_hash: '1234', is_active: true, teams: { name: 'Team 2' } },
  { id: 'user-brandon',   name: 'Brandon',   email: null, role: 'tasker', team_id: 'team-2', pin_hash: '1234', is_active: true, teams: { name: 'Team 2' } },
  { id: 'user-catherine', name: 'Catherine', email: null, role: 'tasker', team_id: 'team-2', pin_hash: '1234', is_active: true, teams: { name: 'Team 2' } },
]

const today = new Date().toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

export const SESSIONS = [
  {
    id: 'session-1', user_id: 'user-sharon', date: today,
    start_time: new Date(Date.now() - 5400000).toISOString(),
    end_time: new Date().toISOString(), total_seconds: 5400,
    description: 'Annotated dataset batch #12, completed 200 items', status: 'completed',
    created_at: new Date(Date.now() - 5400000).toISOString(),
    users: { name: 'Sharon', role: 'tasker', team_id: 'team-1' },
    activity_entries: [
      { id: 'ae-1', session_id: 'session-1', user_id: 'user-sharon', title: 'Annotated dataset batch #12', notes: '200 items completed', entry_type: 'Annotation Task', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'ae-2', session_id: 'session-1', user_id: 'user-sharon', title: 'Review quality check', notes: '', entry_type: 'Review', timestamp: new Date(Date.now() - 1800000).toISOString() },
    ],
  },
  {
    id: 'session-2', user_id: 'user-ruth', date: yesterday,
    start_time: new Date(Date.now() - 172800000).toISOString(),
    end_time: new Date(Date.now() - 165600000).toISOString(), total_seconds: 7200,
    description: 'Software tasking — reviewed PRs and completed tasking queue', status: 'completed',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    users: { name: 'Ruth', role: 'tasker', team_id: 'team-1' },
    activity_entries: [
      { id: 'ae-3', session_id: 'session-2', user_id: 'user-ruth', title: 'Reviewed PR queue', notes: '5 PRs reviewed', entry_type: 'Software Task', timestamp: new Date(Date.now() - 170000000).toISOString() },
    ],
  },
]

export const PERSONAS = [
  {
    id: 'persona-1', full_name: 'Sarah Johnson', email: 'sarah.j@promail.com',
    phone: '+1 555 010 1234', linkedin_url: 'https://linkedin.com/in/sarah-johnson-dev',
    location: 'New York, USA', headline: 'Senior Software Engineer',
    resume_url: null, notes: 'Use for US-based remote roles only',
    assigned_to: 'user-sharon', is_active: true, created_by: 'user-vincent',
    created_at: '2024-03-01T00:00:00Z', updated_at: '2024-03-01T00:00:00Z',
    users: { name: 'Sharon' },
  },
  {
    id: 'persona-2', full_name: 'Michael Osei', email: 'm.osei@careermail.io',
    phone: '+44 7700 900123', linkedin_url: 'https://linkedin.com/in/michael-osei',
    location: 'London, UK', headline: 'Data Analyst & ML Engineer',
    resume_url: null, notes: 'UK and EU roles',
    assigned_to: 'user-ruth', is_active: true, created_by: 'user-vincent',
    created_at: '2024-03-05T00:00:00Z', updated_at: '2024-03-05T00:00:00Z',
    users: { name: 'Ruth' },
  },
  {
    id: 'persona-3', full_name: 'Amara Diallo', email: 'amara.d@workmail.net',
    phone: '+1 555 020 5678', linkedin_url: null,
    location: 'Toronto, Canada', headline: 'Frontend Engineer — React & TypeScript',
    resume_url: null, notes: null,
    assigned_to: 'user-davis', is_active: true, created_by: 'user-judy',
    created_at: '2024-03-10T00:00:00Z', updated_at: '2024-03-10T00:00:00Z',
    users: { name: 'Davis' },
  },
]

export const SAVED_ACCOUNTS = []

export const MILESTONES = []

export const SKILLS = [
  { id: 'skill-1', user_id: 'user-sharon',   name: 'React',        category: 'Frontend', proficiency: 'Advanced',     years_exp: 3,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-2', user_id: 'user-sharon',   name: 'TypeScript',   category: 'Frontend', proficiency: 'Intermediate', years_exp: 2,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-3', user_id: 'user-sharon',   name: 'Node.js',      category: 'Backend',  proficiency: 'Intermediate', years_exp: 2,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-4', user_id: 'user-sharon',   name: 'PostgreSQL',   category: 'Database', proficiency: 'Beginner',     years_exp: 1,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-5', user_id: 'user-sharon',   name: 'Docker',       category: 'DevOps',   proficiency: 'Beginner',     years_exp: 0.5, notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-6', user_id: 'user-ruth',     name: 'Python',       category: 'Backend',  proficiency: 'Expert',       years_exp: 5,   notes: 'Django, FastAPI, data pipelines', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-7', user_id: 'user-ruth',     name: 'PostgreSQL',   category: 'Database', proficiency: 'Advanced',     years_exp: 4,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-8', user_id: 'user-ruth',     name: 'AWS',          category: 'Cloud',    proficiency: 'Intermediate', years_exp: 2,   notes: 'EC2, S3, Lambda, RDS', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-9', user_id: 'user-davis',    name: 'React',        category: 'Frontend', proficiency: 'Expert',       years_exp: 4,   notes: 'Next.js, Remix, React Native', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-10',user_id: 'user-davis',    name: 'TypeScript',   category: 'Frontend', proficiency: 'Expert',       years_exp: 3,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-11',user_id: 'user-davis',    name: 'Tailwind CSS', category: 'Frontend', proficiency: 'Advanced',     years_exp: 3,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-12',user_id: 'user-davis',    name: 'Node.js',      category: 'Backend',  proficiency: 'Advanced',     years_exp: 3,   notes: 'Express, REST APIs, WebSockets', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-13',user_id: 'user-davis',    name: 'Supabase',     category: 'Database', proficiency: 'Advanced',     years_exp: 1,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-14',user_id: 'user-newton',   name: 'Vue.js',       category: 'Frontend', proficiency: 'Advanced',     years_exp: 3,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-15',user_id: 'user-newton',   name: 'Go',           category: 'Backend',  proficiency: 'Intermediate', years_exp: 2,   notes: 'REST APIs, gRPC', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-16',user_id: 'user-newton',   name: 'MongoDB',      category: 'Database', proficiency: 'Intermediate', years_exp: 2,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-17',user_id: 'user-newton',   name: 'Jest',         category: 'Testing',  proficiency: 'Advanced',     years_exp: 3,   notes: 'Unit & integration tests', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-18',user_id: 'user-evans',    name: 'Java',         category: 'Backend',  proficiency: 'Expert',       years_exp: 6,   notes: 'Spring Boot, microservices', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-19',user_id: 'user-evans',    name: 'Kubernetes',   category: 'DevOps',   proficiency: 'Advanced',     years_exp: 3,   notes: '', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
  { id: 'skill-20',user_id: 'user-evans',    name: 'GCP',          category: 'Cloud',    proficiency: 'Advanced',     years_exp: 2,   notes: 'GKE, Cloud Run, BigQuery', created_at: '2024-01-10T00:00:00Z', updated_at: '2024-01-10T00:00:00Z' },
]

export const JOB_APPLICATIONS = [
  {
    id: 'app-1', owner_id: 'user-sharon', persona_id: 'persona-1',
    company_name: 'Google', job_title: 'Senior Software Engineer',
    job_board: 'LinkedIn', application_url: 'https://careers.google.com',
    application_date: today, status: 'Interview', priority: 'Dream Job',
    salary_range_min: 120000, salary_range_max: 180000, currency: 'USD',
    employment_type: 'Full-time', work_mode: 'Remote', location: 'Mountain View, CA',
    contact_name: 'Jane Recruiter', contact_email: 'jane@google.com', contact_linkedin: null,
    resume_version: 'sharon-v3-senior.pdf', cover_letter_used: true,
    notes: 'Strong interview — follow up Thursday', follow_up_date: today,
    tags: 'big-tech, senior, high-priority',
    created_at: today + 'T09:00:00Z', updated_at: today + 'T09:00:00Z',
    personas: { full_name: 'Sarah Johnson', email: 'sarah.j@promail.com' },
    users: { name: 'Sharon' },
  },
  {
    id: 'app-2', owner_id: 'user-sharon', persona_id: 'persona-1',
    company_name: 'Stripe', job_title: 'Full Stack Engineer',
    job_board: 'Company Website', application_url: 'https://stripe.com/jobs',
    application_date: yesterday, status: 'Applied', priority: 'High',
    salary_range_min: 110000, salary_range_max: 160000, currency: 'USD',
    employment_type: 'Full-time', work_mode: 'Remote', location: 'San Francisco, CA',
    contact_name: null, contact_email: null, contact_linkedin: null,
    resume_version: 'sharon-v3-senior.pdf', cover_letter_used: false,
    notes: '', follow_up_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    tags: 'fintech, startup',
    created_at: yesterday + 'T10:00:00Z', updated_at: yesterday + 'T10:00:00Z',
    personas: { full_name: 'Sarah Johnson', email: 'sarah.j@promail.com' },
    users: { name: 'Sharon' },
  },
  {
    id: 'app-3', owner_id: 'user-ruth', persona_id: 'persona-2',
    company_name: 'DeepMind', job_title: 'ML Research Engineer',
    job_board: 'LinkedIn', application_url: 'https://deepmind.com/careers',
    application_date: yesterday, status: 'Phone Screen', priority: 'Dream Job',
    salary_range_min: 90000, salary_range_max: 140000, currency: 'GBP',
    employment_type: 'Full-time', work_mode: 'Hybrid', location: 'London, UK',
    contact_name: 'Tom Harris', contact_email: 'tom@deepmind.com', contact_linkedin: null,
    resume_version: 'michael-ml-v2.pdf', cover_letter_used: true,
    notes: 'Phone screen scheduled for next Tuesday', follow_up_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    tags: 'ai, research, uk',
    created_at: yesterday + 'T08:00:00Z', updated_at: yesterday + 'T08:00:00Z',
    personas: { full_name: 'Michael Osei', email: 'm.osei@careermail.io' },
    users: { name: 'Ruth' },
  },
  {
    id: 'app-4', owner_id: 'user-davis', persona_id: 'persona-3',
    company_name: 'Shopify', job_title: 'Frontend Engineer',
    job_board: 'Indeed', application_url: 'https://shopify.com/careers',
    application_date: yesterday, status: 'Wishlist', priority: 'Medium',
    salary_range_min: 95000, salary_range_max: 130000, currency: 'CAD',
    employment_type: 'Full-time', work_mode: 'Remote', location: 'Toronto, Canada',
    contact_name: null, contact_email: null, contact_linkedin: null,
    resume_version: null, cover_letter_used: false,
    notes: '', follow_up_date: null, tags: 'ecommerce, react',
    created_at: yesterday + 'T11:00:00Z', updated_at: yesterday + 'T11:00:00Z',
    personas: { full_name: 'Amara Diallo', email: 'amara.d@workmail.net' },
    users: { name: 'Davis' },
  },
  {
    id: 'app-5', owner_id: 'user-sharon', persona_id: null,
    company_name: 'Meta', job_title: 'Software Engineer E5',
    job_board: 'LinkedIn', application_url: 'https://meta.com/careers',
    application_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    status: 'Rejected', priority: 'High',
    salary_range_min: 140000, salary_range_max: 200000, currency: 'USD',
    employment_type: 'Full-time', work_mode: 'Hybrid', location: 'Menlo Park, CA',
    contact_name: null, contact_email: null, contact_linkedin: null,
    resume_version: 'sharon-v2.pdf', cover_letter_used: false,
    notes: 'Rejected after technical round', follow_up_date: null, tags: 'big-tech',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    personas: null, users: { name: 'Sharon' },
  },
]

export const APPLICATION_TIMELINE = [
  { id: 'tl-1', application_id: 'app-1', user_id: 'user-sharon', event_type: 'created', old_value: null, new_value: 'Wishlist', note: 'Application created', created_at: today + 'T09:00:00Z', users: { name: 'Sharon' } },
  { id: 'tl-2', application_id: 'app-1', user_id: 'user-sharon', event_type: 'status_change', old_value: 'Wishlist', new_value: 'Applied', note: null, created_at: today + 'T10:00:00Z', users: { name: 'Sharon' } },
  { id: 'tl-3', application_id: 'app-1', user_id: 'user-sharon', event_type: 'status_change', old_value: 'Applied', new_value: 'Interview', note: null, created_at: today + 'T14:00:00Z', users: { name: 'Sharon' } },
]

export const AUDIT_LOG = [
  { id: 'al-1', user_id: 'user-vincent', action: 'create', table_name: 'personas', record_id: 'persona-1', old_data: null, new_data: { full_name: 'Sarah Johnson' }, created_at: '2024-03-01T00:00:00Z', users: { name: 'Vincent' } },
  { id: 'al-2', user_id: 'user-judy',    action: 'create', table_name: 'personas', record_id: 'persona-3', old_data: null, new_data: { full_name: 'Amara Diallo' },   created_at: '2024-03-10T00:00:00Z', users: { name: 'Judy' } },
]

// ── HELP QUERIES ─────────────────────────────────────────────────────────────
export const HELP_QUERIES = [
  {
    id: 'hq-1',
    from_user_id: 'user-sharon',
    to_user_id: 'user-vincent',
    subject: 'Persona assignment issue',
    message: 'Hi Vincent, I was assigned the Sarah Johnson persona but I cannot see it when logging an application. Can you check?',
    status: 'pending',
    priority: 'medium',
    category: 'Personas',
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: today + 'T08:30:00Z',
    updated_at: today + 'T08:30:00Z',
    from_user: { name: 'Sharon', role: 'tasker' },
    to_user: { name: 'Vincent', role: 'super_admin' },
    replies: [],
  },
  {
    id: 'hq-2',
    from_user_id: 'user-ruth',
    to_user_id: null,
    subject: 'How do I update my PIN?',
    message: 'Hi team, can someone guide me on how to change my login PIN? The settings page is not saving.',
    status: 'resolved',
    priority: 'low',
    category: 'Account',
    resolved_by: 'user-judy',
    resolved_at: yesterday + 'T15:00:00Z',
    resolution_note: 'Go to Settings → Change PIN. Enter your new PIN twice and click Update PIN. Issue was browser cache — cleared and confirmed working.',
    created_at: yesterday + 'T09:00:00Z',
    updated_at: yesterday + 'T15:00:00Z',
    from_user: { name: 'Ruth', role: 'tasker' },
    to_user: null,
    replies: [
      { id: 'r-1', from_user_id: 'user-judy', text: 'Hi Ruth, try clearing your browser cache first and retry. Let me know!', created_at: yesterday + 'T10:00:00Z', from_user: { name: 'Judy' } },
    ],
  },
  {
    id: 'hq-3',
    from_user_id: 'user-vincent',
    to_user_id: 'user-judy',
    subject: 'Team 2 capacity review',
    message: 'Judy, should we add another tasker to Team 2? Evans is handling everything solo. Let me know your thoughts.',
    status: 'pending',
    priority: 'high',
    category: 'Team',
    resolved_by: null,
    resolved_at: null,
    resolution_note: null,
    created_at: today + 'T07:00:00Z',
    updated_at: today + 'T07:00:00Z',
    from_user: { name: 'Vincent', role: 'super_admin' },
    to_user: { name: 'Judy', role: 'super_admin' },
    replies: [],
  },
]

// ── MEETINGS ─────────────────────────────────────────────────────────────────
const nowH = new Date()
const todayAt = (h, m = 0) => {
  const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString()
}
const tomorrowAt = (h, m = 0) => {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(h, m, 0, 0); return d.toISOString()
}

// ── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
export const ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    author_id: 'user-vincent',
    title: '🚀 Welcome to TeamTrack Pro!',
    body: 'Hey team — we have officially launched our internal tracking system. Use it to log your daily sessions, track job applications, and communicate with the admins. Reach out via Help Desk or Messages if you need support.',
    priority: 'important',
    pinned: true,
    reads: [],
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'ann-2',
    author_id: 'user-judy',
    title: 'Weekly target reminder',
    body: 'A reminder that our weekly application target is 30 per team member. Please ensure your sessions are logged daily so we can track progress accurately. The leaderboard is updated in real time.',
    priority: 'normal',
    pinned: false,
    reads: ['user-sharon', 'user-ruth', 'user-davis'],
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ann-3',
    author_id: 'user-vincent',
    title: '⚠️ System maintenance this weekend',
    body: 'We will be running maintenance on the system this Saturday from 10:00 PM to 12:00 AM. Please save your work and log out before then. No data will be lost.',
    priority: 'urgent',
    pinned: false,
    reads: [],
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

// ── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const NOTIFICATIONS = [
  { id: 'notif-1', user_id: 'user-vincent', type: 'message',   title: 'New message from Davis',   body: 'Vincent, I have a question about my persona — can we chat?', read: false, link: '/messages', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'notif-2', user_id: 'user-judy',    type: 'message',   title: 'New message from Harveel', body: 'Evans completed her first 50 applications.', read: false, link: '/messages', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'notif-3', user_id: 'user-vincent', type: 'help',      title: 'New help query from Sharon', body: 'Persona assignment issue — cannot see assigned persona.', read: false, link: '/help-desk', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'notif-4', user_id: 'user-judy',    type: 'help',      title: 'New help query from Ruth',   body: 'How do I update my PIN?', read: true,  link: '/help-desk', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'notif-5', user_id: 'user-sharon',  type: 'meeting',   title: 'Meeting tomorrow: Team 1 Weekly Standup', body: 'Starts at 09:00 — Google Meet link ready.', read: false, link: '/meetings', created_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'notif-6', user_id: 'user-ruth',    type: 'meeting',   title: 'Meeting tomorrow: Team 1 Weekly Standup', body: 'Starts at 09:00 — Google Meet link ready.', read: false, link: '/meetings', created_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'notif-7', user_id: 'user-vincent', type: 'meeting',   title: 'Meeting in 1 hour: Judy & Vincent — Admin Sync', body: 'Admin strategy discussion starts soon.', read: false, link: '/meetings', created_at: new Date(Date.now() - 300000).toISOString() },
  { id: 'notif-8', user_id: 'user-sharon',  type: 'message',   title: 'Message from Vincent',       body: 'Great work. Let me know if you hit any blockers.', read: true, link: '/messages', created_at: new Date(Date.now() - 172800000).toISOString() },
]

// ── DIRECT MESSAGES ──────────────────────────────────────────────────────────
// Rule: super_admin ↔ anyone. All other roles: only ↔ super_admin.
const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString()
const hoursAgo = n => new Date(Date.now() - n * 3600000).toISOString()
const minsAgo  = n => new Date(Date.now() - n * 60000).toISOString()

export const MESSAGES = [
  // Vincent ↔ Sharon
  { id: 'dm-1',  from_user_id: 'user-vincent', to_user_id: 'user-sharon', text: 'Hi Sharon, how is the annotation batch coming along?', read_by_recipient: true,  created_at: daysAgo(2) },
  { id: 'dm-2',  from_user_id: 'user-sharon',  to_user_id: 'user-vincent', text: 'Going well! Batch #12 is done, starting on #13 today.', read_by_recipient: true,  created_at: daysAgo(2) },
  { id: 'dm-3',  from_user_id: 'user-vincent', to_user_id: 'user-sharon', text: 'Great work. Let me know if you hit any blockers.', read_by_recipient: true,  created_at: daysAgo(2) },
  // Judy ↔ Ruth
  { id: 'dm-4',  from_user_id: 'user-judy',    to_user_id: 'user-ruth',   text: 'Ruth, can you check the applications flagged for review?', read_by_recipient: true,  created_at: daysAgo(1) },
  { id: 'dm-5',  from_user_id: 'user-ruth',    to_user_id: 'user-judy',   text: 'On it! Will have it sorted by end of day.', read_by_recipient: true,  created_at: daysAgo(1) },
  // Vincent ↔ Judy
  { id: 'dm-6',  from_user_id: 'user-vincent', to_user_id: 'user-judy',   text: 'Judy, have you reviewed the Team 2 metrics this week?', read_by_recipient: true,  created_at: hoursAgo(5) },
  { id: 'dm-7',  from_user_id: 'user-judy',    to_user_id: 'user-vincent', text: 'Yes — numbers look good overall. Harveel\'s team is ahead of target.', read_by_recipient: true,  created_at: hoursAgo(4) },
  { id: 'dm-8',  from_user_id: 'user-vincent', to_user_id: 'user-judy',   text: 'Perfect. Let\'s discuss in the admin sync later.', read_by_recipient: false, created_at: hoursAgo(3) },
  // Davis → Vincent (unread by Vincent)
  { id: 'dm-9',  from_user_id: 'user-davis',   to_user_id: 'user-vincent', text: 'Vincent, I have a question about my persona — can we chat?', read_by_recipient: false, created_at: hoursAgo(1) },
  // Harveel → Judy
  { id: 'dm-10', from_user_id: 'user-harveel', to_user_id: 'user-judy',   text: 'Hi Judy, just a heads up — Evans completed her first 50 applications.', read_by_recipient: false, created_at: minsAgo(30) },
]

export const MEETINGS = [
  {
    id: 'meet-1',
    title: 'Team 1 Weekly Standup',
    description: 'Weekly sync for Team 1 — review progress, blockers, and weekly goals.',
    organizer_id: 'user-vincent',
    meet_link: 'https://meet.google.com/abc-defg-hij',
    start_time: tomorrowAt(9, 0),
    end_time: tomorrowAt(9, 30),
    attendees: ['user-vincent', 'user-sharon', 'user-ruth', 'user-rose', 'user-davis', 'user-newton'],
    status: 'scheduled',
    color: '#1E40AF',
    created_at: today + 'T06:00:00Z',
    organizer: { name: 'Vincent' },
  },
  {
    id: 'meet-2',
    title: 'Sharon × Vincent — 1:1',
    description: 'Monthly one-on-one check-in.',
    organizer_id: 'user-vincent',
    meet_link: 'https://meet.google.com/xyz-1234-abc',
    start_time: tomorrowAt(11, 0),
    end_time: tomorrowAt(11, 30),
    attendees: ['user-vincent', 'user-sharon'],
    status: 'scheduled',
    color: '#7c3aed',
    created_at: today + 'T06:00:00Z',
    organizer: { name: 'Vincent' },
  },
  {
    id: 'meet-3',
    title: 'Judy & Vincent — Admin Sync',
    description: 'Admin strategy discussion: team capacity, persona allocations, new tasks.',
    organizer_id: 'user-judy',
    meet_link: 'https://meet.google.com/adm-sync-001',
    start_time: todayAt(nowH.getHours() + 1, 0),
    end_time: todayAt(nowH.getHours() + 2, 0),
    attendees: ['user-judy', 'user-vincent'],
    status: 'scheduled',
    color: '#059669',
    created_at: today + 'T05:00:00Z',
    organizer: { name: 'Judy' },
  },
]

// ── AI INTERVIEWS ─────────────────────────────────────────────────────────────
export const AI_INTERVIEWS = [
  {
    id: 'ai-1',
    application_id: 'app-1',
    user_id: 'user-sharon',
    platform: 'HireVue',
    status: 'completed',
    scheduled_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 3 * 86400000 + 2700000).toISOString(),
    duration_minutes: 45,
    score: 82,
    feedback: 'Strong problem-solving responses. Communication was clear. Minor hesitation on system design question.',
    link: 'https://hirevue.com/interview/abc123',
    prep_notes: 'Reviewed STAR method answers, practiced 3 behavioral questions',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'ai-2',
    application_id: 'app-2',
    user_id: 'user-sharon',
    platform: 'Karat',
    status: 'scheduled',
    scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    completed_at: null,
    duration_minutes: 60,
    score: null,
    feedback: null,
    link: 'https://karat.com/interview/xyz789',
    prep_notes: 'Need to brush up on React hooks and TypeScript generics',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ai-3',
    application_id: 'app-3',
    user_id: 'user-ruth',
    platform: 'Talview',
    status: 'completed',
    scheduled_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString(),
    duration_minutes: 60,
    score: 91,
    feedback: 'Excellent ML fundamentals. Impressive depth on transformer architecture. Recommended for next round.',
    link: 'https://talview.com/session/deepmind01',
    prep_notes: 'Revised attention mechanisms and RLHF papers',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'ai-4',
    application_id: 'app-4',
    user_id: 'user-davis',
    platform: 'Vervoe',
    status: 'failed',
    scheduled_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date(Date.now() - 86400000 + 1800000).toISOString(),
    duration_minutes: 30,
    score: 44,
    feedback: 'Did not meet the minimum threshold. CSS layout knowledge gaps. Suggest revisiting Flexbox and Grid.',
    link: 'https://vervoe.com/assessment/shopify99',
    prep_notes: '',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ai-5',
    application_id: 'app-1',
    user_id: 'user-sharon',
    platform: 'HireVue',
    status: 'pending_review',
    scheduled_at: new Date(Date.now() - 86400000).toISOString(),
    completed_at: new Date(Date.now() - 86400000 + 3300000).toISOString(),
    duration_minutes: 55,
    score: null,
    feedback: null,
    link: 'https://hirevue.com/interview/google02',
    prep_notes: 'LeetCode medium problems, system design: URL shortener',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
]
