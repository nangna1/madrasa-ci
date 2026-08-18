-- Madrasa CI — texte du Coran + lecture en direct
--
-- Deux ajouts liés :
--   1. `ayat` : le texte arabe complet du Coran, verset par verset
--      (référentiel public, comme `sourates` — voir supabase/ayat_seed.sql
--      pour les 6236 lignes, généré depuis une source fiable, à exécuter
--      juste après cette migration).
--   2. `class_live_reading` : la position de lecture actuelle d'une classe
--      (quelle sourate, quel verset), mise à jour par l'enseignant depuis
--      "Cours en direct" et diffusée en temps réel (Supabase Realtime) à
--      tous les comptes élève de la classe — écran partagé en salle ou
--      téléphone individuel, la classe suit le même texte affiché en même
--      temps que le maître le lit.

create table public.ayat (
  sourate_id smallint not null references public.sourates (id),
  num smallint not null,
  text_ar text not null,
  primary key (sourate_id, num)
);

alter table public.ayat enable row level security;
create policy "ayat_read" on public.ayat
  for select using (auth.role() = 'authenticated');
grant select on public.ayat to authenticated;

create table public.class_live_reading (
  class_id uuid primary key references public.classes (id) on delete cascade,
  sourate_id smallint references public.sourates (id),
  ayah_num smallint,
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
-- notification de changement, seule la RLS ci-dessus resterait active pour
-- des lectures classiques (polling), pas pour un vrai direct.
alter publication supabase_realtime add table public.class_live_reading;
