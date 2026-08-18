-- Madrasa CI — enregistrements du direct
--
-- Un élève à l'écoute du direct (audio-listen.tsx) peut lancer un
-- enregistrement de ce qu'il entend — utile pour réviser plus tard, ou pour
-- les absents. Contrairement à class_live_reading (une seule ligne par
-- classe, écrasée à chaque publication), les enregistrements s'accumulent :
-- table dédiée, comme pour les actualités GEB.
--
-- Réutilise le bucket Storage 'live-content' déjà créé (0009) — un élève ne
-- pouvait jusqu'ici qu'y LIRE (bucket public), pas y écrire ; cette
-- migration ajoute le droit d'upload, mais seulement sous le dossier de sa
-- propre classe.

create table public.class_recordings (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  storage_path text not null,
  recorded_by_name text,
  created_at timestamptz not null default now()
);

alter table public.class_recordings enable row level security;

create policy "recordings_teacher_all" on public.class_recordings
  for all using (class_id in (select id from public.classes where teacher_id = auth.uid()))
  with check (class_id in (select id from public.classes where teacher_id = auth.uid()));

create policy "recordings_student_read" on public.class_recordings
  for select using (class_id = public.current_student_class_id());

create policy "recordings_student_insert" on public.class_recordings
  for insert to authenticated
  with check (class_id = public.current_student_class_id());

grant select, insert, update, delete on public.class_recordings to authenticated;

-- Un élève peut désormais déposer un fichier dans 'live-content', mais
-- seulement dans le dossier de sa propre classe (même garde-fou que pour
-- l'enseignant, voir live_content_teacher_write en 0009).
create policy "live_content_student_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'live-content'
    and (storage.foldername(name))[1] = public.current_student_class_id()::text
  );
