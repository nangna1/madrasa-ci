-- Madrasa CI — rôle super_admin (accès réseau, toutes fédérations)
--
-- Jusqu'ici un seul rôle "fédération" (federation_admin), scopé à UNE
-- fédération via profiles.federation_id. super_admin est un rôle
-- supplémentaire, non rattaché à une fédération en particulier
-- (federation_id peut rester nul), qui voit l'ensemble du réseau —
-- toutes les fédérations, écoles, élèves, paiements, etc.
--
-- Approche additive (comme current_student_class_id en 0006) : une
-- fonction SECURITY DEFINER + une nouvelle policy SELECT par table, sans
-- toucher aux policies existantes — élimine tout risque de régression sur
-- le fonctionnement actuel de federation_admin.

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('teacher', 'federation_admin', 'student', 'super_admin'));

alter table public.profiles drop constraint profile_scope;
alter table public.profiles add constraint profile_scope check (
  (role = 'teacher' and school_id is not null)
  or (role = 'federation_admin' and federation_id is not null)
  or (role = 'student' and school_id is not null and student_id is not null)
  or (role = 'super_admin')
);

create function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
$$;

grant execute on function public.is_super_admin() to authenticated;

create policy "federations_super_admin_read" on public.federations
  for select using (public.is_super_admin());
create policy "schools_super_admin_read" on public.schools
  for select using (public.is_super_admin());
create policy "students_super_admin_read" on public.students
  for select using (public.is_super_admin());
create policy "memorization_super_admin_read" on public.memorization_progress
  for select using (public.is_super_admin());
create policy "attendance_super_admin_read" on public.attendance
  for select using (public.is_super_admin());
create policy "payments_super_admin_read" on public.payments
  for select using (public.is_super_admin());
create policy "classes_super_admin_read" on public.classes
  for select using (public.is_super_admin());
create policy "schedule_super_admin_read" on public.class_schedule_slots
  for select using (public.is_super_admin());
create policy "class_subjects_super_admin_read" on public.class_subjects
  for select using (public.is_super_admin());
create policy "live_reading_super_admin_read" on public.class_live_reading
  for select using (public.is_super_admin());
