-- Madrasa CI — schéma initial
-- Fédérations, écoles, profils (enseignant / admin fédération), élèves,
-- suivi de mémorisation, présence, mensualités, messages.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────

create table public.federations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  region text,
  created_at timestamptz not null default now()
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  federation_id uuid references public.federations (id) on delete set null,
  name text not null,
  name_ar text,
  region text not null,
  status text not null default 'non_integree'
    check (status in ('non_integree', 'en_cours', 'integree')),
  contact_name text,
  contact_phone text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'federation_admin')),
  full_name text not null,
  phone text,
  school_id uuid references public.schools (id) on delete set null,
  federation_id uuid references public.federations (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint profile_scope check (
    (role = 'teacher' and school_id is not null)
    or (role = 'federation_admin' and federation_id is not null)
  )
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  full_name text not null,
  name_ar text,
  age int,
  classe text,
  parent_name text,
  parent_phone text,
  created_at timestamptz not null default now()
);

create table public.sourates (
  id smallint primary key,
  num smallint not null unique,
  name text not null,
  name_ar text not null
);

create table public.memorization_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  sourate_id smallint not null references public.sourates (id),
  status text not null default 'todo' check (status in ('todo', 'wip', 'ok')),
  validated_at timestamptz,
  unique (student_id, sourate_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  date date not null,
  present boolean,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  period text not null, -- ex. '2026-08'
  amount int not null,
  status text not null default 'unpaid' check (status in ('paid', 'unpaid')),
  method text, -- 'Orange Money' | 'MTN Money' | 'Wave'
  receipt_no text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (student_id, period)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  student_id uuid references public.students (id) on delete set null,
  channel text not null default 'whatsapp',
  template text,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index on public.students (school_id);
create index on public.memorization_progress (student_id);
create index on public.attendance (student_id, date);
create index on public.payments (student_id, period);
create index on public.messages (school_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Helper: current user's scope, bypassing RLS recursion on profiles
-- ─────────────────────────────────────────────────────────────────────────

create function public.current_profile()
returns table (role text, school_id uuid, federation_id uuid)
language sql
security definer
set search_path = public
stable
as $$
  select role, school_id, federation_id
  from public.profiles
  where id = auth.uid()
$$;

grant execute on function public.current_profile() to authenticated;

-- Numérotation séquentielle des reçus de paiement (ex. "Reçu N° 0142 / 2026")
create sequence public.receipt_seq start with 150;

create function public.next_receipt_no()
returns text
language sql
security definer
as $$
  select 'Reçu N° ' || lpad(nextval('public.receipt_seq')::text, 4, '0') || ' / ' || to_char(now(), 'YYYY')
$$;

grant execute on function public.next_receipt_no() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────

alter table public.federations enable row level security;
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.sourates enable row level security;
alter table public.memorization_progress enable row level security;
alter table public.attendance enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;

-- profiles: chacun ne voit / modifie que sa propre ligne
create policy "profiles_self" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid());

-- sourates: référentiel public en lecture pour tout utilisateur authentifié
create policy "sourates_read" on public.sourates
  for select using (auth.role() = 'authenticated');

-- federations: un admin voit sa fédération, un enseignant voit celle de son école
create policy "federations_read" on public.federations
  for select using (
    id = (select federation_id from public.current_profile())
    or id = (
      select federation_id from public.schools
      where id = (select school_id from public.current_profile())
    )
  );

-- schools: l'enseignant voit son école, l'admin fédération voit les écoles membres
create policy "schools_read" on public.schools
  for select using (
    id = (select school_id from public.current_profile())
    or federation_id = (select federation_id from public.current_profile())
  );
create policy "schools_update_own" on public.schools
  for update using (id = (select school_id from public.current_profile()));

-- students: lecture/écriture par l'enseignant de l'école, lecture par la fédération
create policy "students_teacher_all" on public.students
  for all using (school_id = (select school_id from public.current_profile()))
  with check (school_id = (select school_id from public.current_profile()));
create policy "students_federation_read" on public.students
  for select using (
    school_id in (
      select id from public.schools
      where federation_id = (select federation_id from public.current_profile())
    )
  );

-- memorization_progress / attendance / payments: même règle, via le student parent
create policy "memorization_teacher_all" on public.memorization_progress
  for all using (
    student_id in (select id from public.students where school_id = (select school_id from public.current_profile()))
  ) with check (
    student_id in (select id from public.students where school_id = (select school_id from public.current_profile()))
  );
create policy "memorization_federation_read" on public.memorization_progress
  for select using (
    student_id in (
      select st.id from public.students st
      join public.schools sc on sc.id = st.school_id
      where sc.federation_id = (select federation_id from public.current_profile())
    )
  );

create policy "attendance_teacher_all" on public.attendance
  for all using (
    student_id in (select id from public.students where school_id = (select school_id from public.current_profile()))
  ) with check (
    student_id in (select id from public.students where school_id = (select school_id from public.current_profile()))
  );
create policy "attendance_federation_read" on public.attendance
  for select using (
    student_id in (
      select st.id from public.students st
      join public.schools sc on sc.id = st.school_id
      where sc.federation_id = (select federation_id from public.current_profile())
    )
  );

create policy "payments_teacher_all" on public.payments
  for all using (
    student_id in (select id from public.students where school_id = (select school_id from public.current_profile()))
  ) with check (
    student_id in (select id from public.students where school_id = (select school_id from public.current_profile()))
  );
create policy "payments_federation_read" on public.payments
  for select using (
    student_id in (
      select st.id from public.students st
      join public.schools sc on sc.id = st.school_id
      where sc.federation_id = (select federation_id from public.current_profile())
    )
  );

-- messages: propres à l'école de l'enseignant
create policy "messages_teacher_all" on public.messages
  for all using (school_id = (select school_id from public.current_profile()))
  with check (school_id = (select school_id from public.current_profile()));

-- ─────────────────────────────────────────────────────────────────────────
-- Privilèges de base (indépendants du réglage "Automatically expose new
-- tables" du dashboard) : la RLS ci-dessus filtre les lignes, mais Postgres
-- exige en plus ces GRANTs pour que le rôle authenticated (utilisé par
-- l'API Supabase une fois connecté) puisse seulement tenter d'accéder aux
-- tables. Aucun accès n'est donné au rôle anon : toute l'app exige d'être
-- connecté (voir src/proxy.ts).
-- ─────────────────────────────────────────────────────────────────────────

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
