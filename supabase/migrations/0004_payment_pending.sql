-- Madrasa CI — statut "en attente" pour les paiements mobile money
--
-- Jusqu'ici un encaissement passait directement à 'paid' dès que
-- l'enseignant cliquait "Encaisser" — il n'y avait aucune vraie demande
-- envoyée à un opérateur, juste un enregistrement manuel. Avec le vrai
-- flux mobile money (demande → confirmation), un paiement a maintenant
-- trois états : 'unpaid' (rien demandé), 'pending' (requête envoyée à
-- l'opérateur, argent pas encore confirmé), 'paid' (confirmé, reçu émis).

alter table public.payments drop constraint payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('paid', 'pending', 'unpaid'));
