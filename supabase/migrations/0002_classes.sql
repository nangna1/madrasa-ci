-- Madrasa CI — gestion des classes
-- Une école peut avoir plusieurs classes (Coran 1, Coran 2...), chacune avec
-- son propre enseignant et son propre emploi du temps. Remplace le champ
-- texte libre students.classe par une vraie relation, et fait passer la
-- portée des données de l'enseignant de "toute l'école" à "sa classe".

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  teacher_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.classes (school_id);
create index on public.classes (teacher_id);

create table public.class_schedule_slots (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  jour smallint not null check (jour between 1 and 7), -- 1 = lundi ... 7 = dimanche (ISO 8601)
  heure_debut time not null,
  heure_fin time not null,
  check (heure_fin > heure_debut)
);
create index on public.class_schedule_slots (class_id);

alter table public.students add column class_id uuid references public.classes (id) on delete set null;

-- ─────────────────────────────────────────────────────────────────────────
-- Migration des données existantes : une classe par valeur distincte de
-- l'ancien champ texte "classe", par école, puis rattachement des élèves.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  r record;
  new_class_id uuid;
begin
  for r in
    select distinct school_id, classe from public.students where classe is not null and classe <> ''
  loop
    insert into public.classes (school_id, name) values (r.school_id, r.classe)
    returning id into new_class_id;

    update public.students
    set class_id = new_class_id
    where school_id = r.school_id and classe = r.classe;
  end loop;
end $$;

alter table public.students drop column classe;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS classes / class_schedule_slots — lecture seule côté app (création et
-- affectation d'un enseignant à une classe faites côté admin/SQL pour
-- l'instant, pas encore de rôle "directeur d'école" dans l'app).
-- ─────────────────────────────────────────────────────────────────────────
alter table public.classes enable row level security;
alter table public.class_schedule_slots enable row level security;

create policy "classes_teacher_own" on public.classes
  for select using (teacher_id = auth.uid());
create policy "classes_federation_read" on public.classes
  for select using (school_id in (
    select id from public.schools where federation_id = (select federation_id from public.current_profile())
  ));

create policy "schedule_teacher_own" on public.class_schedule_slots
  for select using (class_id in (select id from public.classes where teacher_id = auth.uid()));
create policy "schedule_federation_read" on public.class_schedule_slots
  for select using (class_id in (
    select c.id from public.classes c
    join public.schools s on s.id = c.school_id
    where s.federation_id = (select federation_id from public.current_profile())
  ));

grant select on public.classes to authenticated;
grant select on public.class_schedule_slots to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Policies enseignant réécrites : portée par CLASSE (via classes.teacher_id)
-- au lieu de par école entière. Les policies "*_federation_read" ne changent
-- pas (toujours via school_id sur students, non affectées par class_id).
-- ─────────────────────────────────────────────────────────────────────────

drop policy "students_teacher_all" on public.students;
create policy "students_teacher_all" on public.students
  for all using (
    class_id in (select id from public.classes where teacher_id = auth.uid())
  ) with check (
    class_id in (select id from public.classes where teacher_id = auth.uid())
  );

drop policy "memorization_teacher_all" on public.memorization_progress;
create policy "memorization_teacher_all" on public.memorization_progress
  for all using (
    student_id in (
      select st.id from public.students st
      join public.classes c on c.id = st.class_id
      where c.teacher_id = auth.uid()
    )
  ) with check (
    student_id in (
      select st.id from public.students st
      join public.classes c on c.id = st.class_id
      where c.teacher_id = auth.uid()
    )
  );

drop policy "attendance_teacher_all" on public.attendance;
create policy "attendance_teacher_all" on public.attendance
  for all using (
    student_id in (
      select st.id from public.students st
      join public.classes c on c.id = st.class_id
      where c.teacher_id = auth.uid()
    )
  ) with check (
    student_id in (
      select st.id from public.students st
      join public.classes c on c.id = st.class_id
      where c.teacher_id = auth.uid()
    )
  );

drop policy "payments_teacher_all" on public.payments;
create policy "payments_teacher_all" on public.payments
  for all using (
    student_id in (
      select st.id from public.students st
      join public.classes c on c.id = st.class_id
      where c.teacher_id = auth.uid()
    )
  ) with check (
    student_id in (
      select st.id from public.students st
      join public.classes c on c.id = st.class_id
      where c.teacher_id = auth.uid()
    )
  );

-- messages : un enseignant ne peut cibler que ses propres élèves (ou une
-- diffusion sans élève précis, student_id null) — avant ce changement,
-- n'importe quel student_id de la même école aurait été accepté.
drop policy "messages_teacher_all" on public.messages;
create policy "messages_teacher_all" on public.messages
  for all using (
    school_id = (select school_id from public.current_profile())
    and (student_id is null or student_id in (
      select st.id from public.students st
      join public.classes c on c.id = st.class_id
      where c.teacher_id = auth.uid()
    ))
  ) with check (
    school_id = (select school_id from public.current_profile())
    and (student_id is null or student_id in (
      select st.id from public.students st
      join public.classes c on c.id = st.class_id
      where c.teacher_id = auth.uid()
    ))
  );
