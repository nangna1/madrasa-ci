-- Madrasa CI — pièce jointe (image/fichier) sur la lecture en direct
--
-- L'enseignant peut joindre une image ou un fichier (photo d'une page de
-- livre, fiche d'exercice...) à la lecture en direct, stocké dans un bucket
-- Supabase Storage public (comme pour les photos GEB sur Cloudinary : le
-- contenu n'est pas sensible, seul le dépôt est restreint à l'enseignant
-- de la classe concernée — chemin `<class_id>/...`).

alter table public.class_live_reading add column attachment_path text;
alter table public.class_live_reading add column attachment_name text;
alter table public.class_live_reading add column attachment_type text;

insert into storage.buckets (id, name, public)
values ('live-content', 'live-content', true)
on conflict (id) do nothing;

create policy "live_content_teacher_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'live-content'
    and (storage.foldername(name))[1] in (select id::text from public.classes where teacher_id = auth.uid())
  );

create policy "live_content_teacher_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'live-content'
    and (storage.foldername(name))[1] in (select id::text from public.classes where teacher_id = auth.uid())
  );

create policy "live_content_teacher_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'live-content'
    and (storage.foldername(name))[1] in (select id::text from public.classes where teacher_id = auth.uid())
  );
