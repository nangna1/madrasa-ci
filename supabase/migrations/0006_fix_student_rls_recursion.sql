-- Madrasa CI — correctif : récursion RLS infinie introduite par 0005
--
-- classes_student_read / schedule_student_read / class_subjects_student_read
-- (0005) lisaient students.class_id par une simple sous-requête sur
-- "students". Or students_teacher_all (0002) lit à son tour "classes" par
-- une simple sous-requête — et classes_student_read lit "students". Boucle :
-- students -> classes (via students_teacher_all) -> students (via
-- classes_student_read) -> ... Postgres la détecte et rejette la requête
-- ("infinite recursion detected in policy for relation students"), ce qui
-- cassait la connexion de TOUS les comptes (la policy profiles_teacher_read_
-- students, elle-même évaluée à chaque lecture de profiles, déclenchait la
-- boucle même pour un enseignant qui lit juste sa propre ligne).
--
-- Correctif : même remède que pour profiles/current_profile() à l'origine
-- du projet — passer par une fonction SECURITY DEFINER, qui contourne la
-- RLS de la table qu'elle interroge en interne au lieu de redéclencher ses
-- policies.

create function public.current_student_class_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select class_id from public.students where id = public.current_student_id()
$$;

grant execute on function public.current_student_class_id() to authenticated;

drop policy "classes_student_read" on public.classes;
create policy "classes_student_read" on public.classes
  for select using (id = public.current_student_class_id());

drop policy "schedule_student_read" on public.class_schedule_slots;
create policy "schedule_student_read" on public.class_schedule_slots
  for select using (class_id = public.current_student_class_id());

drop policy "class_subjects_student_read" on public.class_subjects;
create policy "class_subjects_student_read" on public.class_subjects
  for select using (class_id = public.current_student_class_id());
