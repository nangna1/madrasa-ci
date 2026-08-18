-- Madrasa CI — lecture/cours en direct
--
-- Diffusion en temps réel du contenu que l'enseignant est en train
-- d'exploiter en classe (texte libre : verset, extrait de fiqh, leçon
-- d'arabe...) à tous les comptes élève de la classe, via Supabase
-- Realtime — écran/tablette partagé en salle et/ou téléphone individuel.
-- L'enseignant tape ou colle son contenu, sans base de données à charger.
--
-- `drop ... if exists` : rend ce fichier sûr à rejouer tel quel même si une
-- version antérieure de cette migration (basée sur un texte coranique
-- pré-chargé, abandonnée) a déjà été exécutée sur ce projet.

drop table if exists public.ayat cascade;
drop table if exists public.class_live_reading cascade;

create table public.class_live_reading (
  class_id uuid primary key references public.classes (id) on delete cascade,
  title text,
  content text,
  updated_at timestamptz not null default now()
);

alter table public.class_live_reading enable row level security;

create policy "live_reading_teacher_all" on public.class_live_reading
  for all using (class_id in (select id from public.classes where teacher_id = auth.uid()))
  with check (class_id in (select id from public.classes where teacher_id = auth.uid()));

create policy "live_reading_student_read" on public.class_live_reading
  for select using (class_id = public.current_student_class_id());

create policy "live_reading_federation_read" on public.class_live_reading
  for select using (class_id in (
    select c.id from public.classes c
    join public.schools s on s.id = c.school_id
    where s.federation_id = (select federation_id from public.current_profile())
  ));

grant select, insert, update, delete on public.class_live_reading to authenticated;

-- Diffusion temps réel : sans ça, les clients ne reçoivent aucune
-- notification de changement.
alter publication supabase_realtime add table public.class_live_reading;
