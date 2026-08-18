# Madrasa CI

App de gestion pour les écoles coraniques et médersas de Côte d'Ivoire —
implémentation Next.js à partir des maquettes Claude Design du dossier
`../cr-ation-d-un-saas/` (conservé comme référence visuelle).

Deux interfaces dans une seule codebase :

- **App enseignant** (`/teacher`) — mobile-first : effectifs, appel, suivi
  de mémorisation sourate par sourate, mensualités, messages parents,
  matières et emploi du temps réels (catalogue de matières coraniques et
  programme national ivoirien, composé librement par classe).
- **Dashboard fédération** (`/federation`) — vue d'ensemble du réseau,
  écoles membres, dossier de plaidoyer d'intégration.

## 1. Créer le projet Supabase

1. Créez un projet gratuit sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécutez dans l'ordre :
   - `supabase/migrations/0001_init.sql` (schéma + RLS)
   - `supabase/migrations/0002_classes.sql` (classes, emploi du temps, plusieurs enseignants par école)
   - `supabase/migrations/0003_subjects.sql` (catalogue de matières réelles — coraniques et programme national ivoirien)
   - `supabase/migrations/0004_payment_pending.sql` (statut "en attente" pour le cycle de paiement mobile money)
   - `supabase/seed.sql` (données de démo : fédération OEECI, 10 écoles, 10 élèves à la Médersa An-Nour)
   - `supabase/seed_classes_followup.sql` (sur un projet déjà seedé avant 0002 : rattache le compte enseignant de démo à une classe)
3. Copiez `.env.example` vers `.env.local` et renseignez l'URL et la clé anonyme
   du projet (**Project Settings → API**).

## 2. Créer vos comptes de connexion

`auth.users` ne peut pas être peuplée par migration (mots de passe gérés par
Supabase Auth). Pour chaque compte de test :

1. **Authentication → Users → Add user** dans le dashboard Supabase (email + mot de passe).
2. Copiez l'UUID généré.
3. Adaptez et exécutez `supabase/seed_profiles.example.sql` (dans le SQL Editor) pour relier ce
   compte à un rôle (`teacher` rattaché à la Médersa An-Nour, ou `federation_admin`
   rattaché à l'OEECI · Madrasa CI).

## 3. Lancer l'app

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) — vous serez redirigé vers `/login`,
puis vers `/teacher` ou `/federation` selon le rôle du compte connecté.

**Important** : sans projet Supabase configuré (étapes 1-2), l'app ne rend rien —
l'authentification est vérifiée sur chaque requête (`src/proxy.ts`), y compris `/login`.

## Mode hors-ligne (app enseignant)

L'app enseignant est une PWA installable (`public/manifest.json`, scope
`/teacher`) avec file d'attente réelle :

- Présence, validation de sourate, confirmation de paiement et messages
  WhatsApp fonctionnent hors-ligne : l'action est appliquée localement tout
  de suite, puis mise en file dans IndexedDB (`src/lib/offline/`) si le
  réseau est indisponible ou si l'appel Supabase échoue. Seule l'envoi
  d'une *demande* de paiement mobile money exige d'être en ligne (voir
  ci-dessous) : contrairement aux autres actions, ce n'est pas une simple
  écriture qu'il serait utile de rejouer plus tard.
- L'en-tête affiche l'état réel (`En ligne`/`Hors ligne`, via
  `navigator.onLine` + événements `online`/`offline`) et le nombre d'actions
  en attente, avec synchronisation automatique au retour du réseau ou
  manuelle via le bouton "Synchroniser".
- `public/sw.js` met en cache les assets statiques et les pages `/teacher/*`
  déjà visitées (network-first, repli cache) pour que l'app se recharge hors
  ligne — portée volontairement limitée à "les pages déjà vues en ligne au
  moins une fois", pas à un support hors-ligne complet dès la première
  installation.
- Cas particulier des paiements : générer un numéro de reçu séquentiel
  nécessite le réseau (`next_receipt_no` côté Supabase). Une confirmation de
  paiement prise hors-ligne affiche donc "Payé (à synchroniser)" sans reçu
  jusqu'à la synchronisation, plutôt que d'inventer un faux numéro.

## Ce qui n'est pas encore branché

- **Mobile money (Orange Money, MTN Money, Wave)** : le vrai cycle de
  paiement est en place — demande envoyée (`requestMobileMoneyPayment`,
  statut `pending`), confirmation qui génère le reçu (`confirmPayment`,
  statut `paid`), écran distinguant "Dû" / "En attente" / "Payé" — mais
  l'appel réel à l'opérateur est un stub qui journalise en console
  (`src/lib/providers/payment-provider.ts`) plutôt que d'envoyer un vrai
  push USSD, et c'est l'enseignant qui confirme manuellement la réception de
  l'argent (au lieu d'un webhook opérateur). Une fois les comptes marchands
  obtenus, deux choses à brancher, sans toucher au reste de l'app :
  1. remplacer `consolePaymentProvider` par un vrai appel API par opérateur ;
  2. ajouter une route webhook qui appelle `confirmPayment()` automatiquement
     à la confirmation de l'opérateur, au lieu du bouton manuel.
  La demande de paiement exige une connexion (elle est désactivée hors ligne
  dans l'UI) — contrairement au reste de l'app, ce n'est pas une simple
  écriture qu'il est utile de rejouer plus tard.
- **WhatsApp** : même chose pour l'envoi de messages
  (`src/lib/providers/messaging-provider.ts`) — un compte WhatsApp Business API
  (Meta) est nécessaire.
- **Export PDF du dossier de plaidoyer** : fonctionne réellement via une vue
  imprimable (`/print/plaidoyer`) et l'impression navigateur (Ctrl+P →
  Enregistrer en PDF), plutôt qu'une génération de PDF côté serveur.

## Structure

- `src/lib/data/` — couche d'accès aux données (une fonction typée par
  opération : `getStudents`, `markAttendance`, `recordPayment`, …), utilisée à
  la fois côté serveur et côté client.
- `src/lib/providers/` — interfaces `PaymentProvider` / `MessagingProvider`,
  isolant les futures intégrations réelles.
- `src/lib/supabase/` — clients Supabase (browser/server) + types `Database`
  écrits à la main en miroir du schéma SQL (à régénérer avec
  `supabase gen types typescript` une fois le projet créé).
- `supabase/migrations/0001_init.sql` — schéma complet + RLS.
- `supabase/seed.sql` — données de démo reprises des prototypes.
