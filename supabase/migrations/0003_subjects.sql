-- Madrasa CI — matières (programme réel)
--
-- Jusqu'ici la seule "matière" suivie était le Coran (mémorisation
-- sourate par sourate, déjà en place). Cette migration ajoute un vrai
-- catalogue de matières et permet à chaque classe de composer son propre
-- programme à partir de deux familles :
--   - "coranique"  : matières classiques des médersas ivoiriennes (au-delà
--                    du seul Coran) — tajwid, tafsir, fiqh, tawhid, sira,
--                    hadith, nahw (grammaire arabe), sarf (conjugaison
--                    arabe), langue arabe. Sourcé sur la structure réelle
--                    des médersas réformées de Côte d'Ivoire (cycle
--                    "Kitabou kalan" : disciplines annexes du Coran).
--   - "national"   : programme national ivoirien du primaire (écoles
--                    franco-arabes qui, contrairement aux écoles
--                    coraniques classiques, couplent l'enseignement
--                    islamique à un vrai cursus francophone) — français,
--                    mathématiques, anglais, EDHC, AEC, EPS, découverte du
--                    monde (histoire-géographie-sciences).
-- Catalogue volontairement fixe (comme "sourates") : ce n'est pas à chaque
-- école d'inventer ses propres intitulés de matières, mais chaque classe
-- choisit librement lesquelles s'appliquent à elle (une médersa purement
-- coranique n'active aucune matière "national", une franco-arabe active
-- les deux familles).

create table public.subjects (
  code text primary key,
  name text not null,
  name_ar text,
  category text not null check (category in ('coranique', 'national')),
  sort_order smallint not null
);

insert into public.subjects (code, name, name_ar, category, sort_order) values
  ('coran', 'Coran (lecture et mémorisation)', 'القرآن الكريم', 'coranique', 1),
  ('tajwid', 'Tajwid (psalmodie)', 'التجويد', 'coranique', 2),
  ('tafsir', 'Tafsir (exégèse du Coran)', 'التفسير', 'coranique', 3),
  ('hadith', 'Hadith (tradition prophétique)', 'الحديث', 'coranique', 4),
  ('fiqh', 'Fiqh (jurisprudence islamique)', 'الفقه', 'coranique', 5),
  ('tawhid', 'Tawhid (théologie)', 'التوحيد', 'coranique', 6),
  ('sira', 'Sira (biographie du Prophète)', 'السيرة النبوية', 'coranique', 7),
  ('nahw', 'Nahw (grammaire arabe)', 'النحو', 'coranique', 8),
  ('sarf', 'Sarf (conjugaison arabe)', 'الصرف', 'coranique', 9),
  ('arabe', 'Langue arabe (expression et lecture)', 'اللغة العربية', 'coranique', 10),
  ('francais', 'Français', null, 'national', 11),
  ('maths', 'Mathématiques', null, 'national', 12),
  ('anglais', 'Anglais', null, 'national', 13),
  ('decouverte_monde', 'Découverte du monde (histoire, géographie, sciences)', null, 'national', 14),
  ('edhc', 'EDHC (Éducation aux droits de l''Homme et à la citoyenneté)', null, 'national', 15),
  ('aec', 'AEC (Arts éducatifs et culturels)', null, 'national', 16),
  ('eps', 'EPS (Éducation physique et sportive)', null, 'national', 17);

-- Matières activées pour une classe donnée, avec un enseignant potentiellement
-- différent de l'enseignant "titulaire" de la classe (ex. un spécialiste
-- d'arabe qui intervient dans plusieurs classes) — teacher_id nul signifie
-- "l'enseignant titulaire de la classe", résolu côté app.
create table public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  subject_code text not null references public.subjects (code),
  teacher_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (class_id, subject_code)
);
create index on public.class_subjects (class_id);

-- L'emploi du temps se précise : chaque créneau peut désormais porter une
-- matière (nullable pour ne pas casser les créneaux déjà seedés sans
-- matière — voir seed_classes_followup.sql).
alter table public.class_schedule_slots add column subject_code text references public.subjects (code);

-- ─────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────

alter table public.subjects enable row level security;
create policy "subjects_read" on public.subjects
  for select using (auth.role() = 'authenticated');
grant select on public.subjects to authenticated;

alter table public.class_subjects enable row level security;
create policy "class_subjects_teacher_all" on public.class_subjects
  for all using (class_id in (select id from public.classes where teacher_id = auth.uid()))
  with check (class_id in (select id from public.classes where teacher_id = auth.uid()));
create policy "class_subjects_federation_read" on public.class_subjects
  for select using (class_id in (
    select c.id from public.classes c
    join public.schools s on s.id = c.school_id
    where s.federation_id = (select federation_id from public.current_profile())
  ));
grant select, insert, update, delete on public.class_subjects to authenticated;

-- L'emploi du temps était jusqu'ici en lecture seule côté app (créneaux
-- créés à la main en SQL) : l'enseignant peut désormais composer son propre
-- emploi du temps, matière par matière.
drop policy "schedule_teacher_own" on public.class_schedule_slots;
create policy "schedule_teacher_own" on public.class_schedule_slots
  for all using (class_id in (select id from public.classes where teacher_id = auth.uid()))
  with check (class_id in (select id from public.classes where teacher_id = auth.uid()));
grant insert, update, delete on public.class_schedule_slots to authenticated;
