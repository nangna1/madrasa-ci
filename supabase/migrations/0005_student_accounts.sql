-- Madrasa CI — comptes élève
--
-- Chaque élève peut avoir un compte réel (auth.users), créé par son
-- enseignant depuis la fiche élève et partagé par WhatsApp au numéro du
-- parent déjà enregistré (voir createStudentAccess côté app) — pas
-- d'auto-inscription. Accès strictement en LECTURE SEULE à ses propres
-- données (sa fiche, sa présence, sa progression Coran, ses paiements),
-- jamais d'écriture : aucune policy INSERT/UPDATE/DELETE n'est ajoutée
-- pour ce rôle, donc le GRANT large déjà posé en 0001 (nécessaire côté
-- Postgres) reste sans effet pratique pour un élève tant qu'aucune policy
-- ne l'autorise explicitement.

alter table public.profiles add column student_id uuid references public.students (id) on delete cascade;

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('teacher', 'federation_admin', 'student'));

alter table public.profiles drop constraint profile_scope;
alter table public.profiles add constraint profile_scope check (
  (role = 'teacher' and school_id is not null)
  or (role = 'federation_admin' and federation_id is not null)
  or (role = 'student' and school_id is not null and student_id is not null)
);

-- Ne modifie pas current_profile() (utilisée dans de nombreuses policies
-- existantes — changer son type de retour forcerait à la supprimer avec
-- CASCADE, ce qui emporterait ces policies). Fonction séparée à la place.
create function public.current_student_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select student_id from public.profiles where id = auth.uid()
$$;

grant execute on function public.current_student_id() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — lecture seule de ses propres données
-- ─────────────────────────────────────────────────────────────────────────

create policy "students_self_read" on public.students
  for select using (id = public.current_student_id());

create policy "memorization_self_read" on public.memorization_progress
  for select using (student_id = public.current_student_id());

create policy "attendance_self_read" on public.attendance
  for select using (student_id = public.current_student_id());

create policy "payments_self_read" on public.payments
  for select using (student_id = public.current_student_id());

create policy "classes_student_read" on public.classes
  for select using (id = (select class_id from public.students where id = public.current_student_id()));

create policy "schedule_student_read" on public.class_schedule_slots
  for select using (class_id = (select class_id from public.students where id = public.current_student_id()));

create policy "class_subjects_student_read" on public.class_subjects
  for select using (class_id = (select class_id from public.students where id = public.current_student_id()));

-- sourates et subjects sont déjà lisibles par tout utilisateur authentifié
-- (policies sourates_read / subjects_read, 0001 et 0003) — rien à ajouter.

-- L'enseignant doit pouvoir savoir si un élève de sa classe a déjà un
-- accès actif (pour proposer "Créer" ou "Régénérer" sur la fiche élève) —
-- sans cette policy, profiles_self (0001) ne laisse voir que sa propre
-- ligne. Aucune donnée sensible exposée ici : ni mot de passe, ni e-mail
-- (ils vivent dans auth.users, hors de portée de cette table).
create policy "profiles_teacher_read_students" on public.profiles
  for select using (
    role = 'student' and student_id in (
      select st.id from public.students st
      join public.classes c on c.id = st.class_id
      where c.teacher_id = auth.uid()
    )
  );
