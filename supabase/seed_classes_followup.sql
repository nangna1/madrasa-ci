-- À exécuter une fois après 0002_classes.sql sur un projet déjà seedé (voir
-- seed.sql) : assigne le compte enseignant de démo existant à la classe
-- "Coran 2" de la Médersa An-Nour, et lui donne un emploi du temps
-- (lundi/mercredi/vendredi 15h-17h). Les classes "Coran 1" et "Coran 3" de
-- la même école existent déjà (migrées automatiquement depuis l'ancien
-- champ texte) mais n'ont pas encore d'enseignant assigné.

update public.classes
set teacher_id = (
  select id from public.profiles
  where role = 'teacher' and school_id = '00000000-0000-0000-0000-000000000101'
  limit 1
)
where school_id = '00000000-0000-0000-0000-000000000101' and name = 'Coran 2';

insert into public.class_schedule_slots (class_id, jour, heure_debut, heure_fin)
select c.id, slot.jour, slot.heure_debut, slot.heure_fin
from public.classes c
cross join (
  values (1, '15:00'::time, '17:00'::time), (3, '15:00'::time, '17:00'::time), (5, '15:00'::time, '17:00'::time)
) as slot(jour, heure_debut, heure_fin)
where c.school_id = '00000000-0000-0000-0000-000000000101' and c.name = 'Coran 2';
