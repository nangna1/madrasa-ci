-- Scolaris — création de comptes enseignant par un admin, suspension d'un
-- compte federation_admin par le super_admin (demande du 2026-08-20).
--
-- 1. `profiles.suspended` : miroir applicatif de l'état réel (le vrai
--    blocage de connexion se fait côté Supabase Auth via ban_duration, voir
--    src/app/actions/admin-management.ts) — sert uniquement à afficher
--    l'état correct dans la liste des comptes admin sans appeler l'API Auth
--    à chaque rendu.
-- 2. `profiles_super_admin_read` : jusqu'ici le super_admin n'avait AUCUNE
--    policy de lecture sur `profiles` (0010_super_admin.sql en ajoutait pour
--    federations/schools/students/... mais pas profiles) — sans ça,
--    listFederationAdmins() ne pouvait rien lire avec le client scopé de
--    l'appelant.

alter table public.profiles add column suspended boolean not null default false;

create policy "profiles_super_admin_read" on public.profiles
  for select using (public.is_super_admin());
