-- Gabarit pour relier un compte Supabase Auth à un profil (enseignant ou
-- admin fédération). auth.users ne peut pas être peuplée par migration
-- (mots de passe hachés gérés par Supabase Auth) : créez d'abord le compte
-- via la page /login de l'app (inscription) ou le dashboard Supabase
-- (Authentication → Users → Add user), puis exécutez ceci en remplaçant
-- l'UUID par celui du compte créé (visible dans Authentication → Users).

-- Compte enseignant, rattaché à la Médersa An-Nour (école de démo) :
insert into public.profiles (id, role, full_name, phone, school_id)
values (
  'REMPLACER-PAR-UUID-AUTH-USER',
  'teacher',
  'Cheikh Ibrahim',
  '07 00 00 00',
  '00000000-0000-0000-0000-000000000101'
);

-- Compte admin fédération, rattaché à l'OEECI · Madrasa CI :
insert into public.profiles (id, role, full_name, phone, federation_id)
values (
  'REMPLACER-PAR-UUID-AUTH-USER',
  'federation_admin',
  'Responsable fédération',
  '07 00 00 00',
  '00000000-0000-0000-0000-000000000001'
);
