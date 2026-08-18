# Madrasa CI

App de gestion pour les écoles coraniques et médersas de Côte d'Ivoire —
implémentation Next.js à partir des maquettes Claude Design du dossier
`../cr-ation-d-un-saas/` (conservé comme référence visuelle).

Trois interfaces dans une seule codebase :

- **App enseignant** (`/teacher`) — mobile-first : effectifs, appel, suivi
  de mémorisation sourate par sourate, mensualités, messages parents,
  matières et emploi du temps réels (catalogue de matières coraniques et
  programme national ivoirien, composé librement par classe), écran "Cours
  en direct" (présence + prochaine sourate par élève, en une seule page).
- **Espace élève** (`/eleve`) — lecture seule : progression Coran, présence
  du mois, statut de la mensualité. Compte créé par l'enseignant depuis la
  fiche élève (pas d'auto-inscription) et son code transmis par WhatsApp.
  Suit aussi la **lecture en direct** de la classe (texte libre, image,
  fichier ou message vocal publiés par l'enseignant depuis "Cours en
  direct") et peut **rejoindre l'audio en direct** de l'enseignant — même
  écran utilisable individuellement ou sur une tablette/écran partagé en
  salle.
- **Dashboard fédération** (`/federation`) — vue d'ensemble du réseau,
  écoles membres, dossier de plaidoyer d'intégration. Deux niveaux :
  `federation_admin` (scopé à sa fédération) et `super_admin` (toutes
  fédérations confondues, même tableau de bord mais sans filtre).

Un **guide d'utilisation** complet (`/guide`, accessible depuis les trois
espaces via l'icône "?") explique le fonctionnement de chaque écran.

## 1. Créer le projet Supabase

1. Créez un projet gratuit sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, exécutez dans l'ordre :
   - `supabase/migrations/0001_init.sql` (schéma + RLS)
   - `supabase/migrations/0002_classes.sql` (classes, emploi du temps, plusieurs enseignants par école)
   - `supabase/migrations/0003_subjects.sql` (catalogue de matières réelles — coraniques et programme national ivoirien)
   - `supabase/migrations/0004_payment_pending.sql` (statut "en attente" pour le cycle de paiement mobile money)
   - `supabase/migrations/0005_student_accounts.sql` (comptes élève en lecture seule)
   - `supabase/migrations/0006_fix_student_rls_recursion.sql` (correctif d'une récursion RLS introduite par 0005)
   - `supabase/migrations/0007_live_reading.sql` (lecture en direct, texte libre publié par l'enseignant — active aussi Supabase Realtime sur `class_live_reading`)
   - `supabase/migrations/0008_live_audio.sql` (indicateur "audio en cours" — le flux lui-même passe par LiveKit Cloud, voir plus bas)
   - `supabase/migrations/0009_live_attachment.sql` (image/fichier/message vocal joint à la lecture en direct — crée aussi le bucket Storage `live-content`)
   - `supabase/migrations/0010_super_admin.sql` (rôle super_admin — accès réseau, toutes fédérations)
   - `supabase/seed.sql` (données de démo : fédération OEECI, 10 écoles, 10 élèves à la Médersa An-Nour)
   - `supabase/seed_classes_followup.sql` (sur un projet déjà seedé avant 0002 : rattache le compte enseignant de démo à une classe)
3. Copiez `.env.example` vers `.env.local` et renseignez l'URL et la clé anonyme
   du projet (**Project Settings → API**). Ajoutez aussi `SUPABASE_SERVICE_ROLE_KEY`
   (même écran, secret "service_role") si vous voulez créer des accès élève —
   voir la section dédiée plus bas. Ne la partagez jamais : elle contourne
   totalement la RLS.

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

## Comptes élève

Depuis la fiche élève (`/teacher/students/[id]`), l'enseignant clique
"Créer un accès élève" : un code à 8 caractères est généré, un vrai compte
`auth.users` est créé côté serveur (`createStudentAccess`,
`src/app/actions/student-access.ts`, via la clé service_role — voir
`SUPABASE_SERVICE_ROLE_KEY` ci-dessus), et le code s'affiche **une seule
fois** avec un bouton "Envoyer par WhatsApp" (lien `wa.me` réel, pas le
provider de messagerie simulé). L'élève se connecte ensuite sur `/login`,
onglet "Élève", en tapant uniquement ce code — pas d'e-mail ni de mot de
passe à comprendre.

Techniquement, ce code *est* le mot de passe (un e-mail interne
`CODE@eleves.madrasa-ci.local` est fabriqué pour satisfaire Supabase Auth,
qui exige un identifiant, mais n'est ni affiché ni utilisé ailleurs).
Compromis assumé pour un compte à faible enjeu (lecture seule, aucune
donnée bancaire) partagé par WhatsApp à un enfant : un code égaré donne
seulement une vue en lecture de la progression Coran / présence /
mensualité de cet élève, jamais un accès en écriture (la RLS n'autorise que
`select`, aucune policy `insert`/`update`/`delete` pour ce rôle). Régénérer
le code (même bouton) invalide immédiatement l'ancien.

## Lecture en direct

Depuis "Cours en direct" (`/teacher/cours-en-direct`), l'enseignant tape ou
colle un titre + un contenu (verset, extrait de fiqh, leçon d'arabe...) et
clique "Publier en direct" : écrit dans `class_live_reading`, diffusé en
temps réel (Supabase Realtime, `postgres_changes`) à tous les comptes élève
de la classe, affiché tel quel sur `/eleve` — sans rien recharger. Texte
libre plutôt qu'une base de contenu préchargée : fonctionne pour n'importe
quelle matière, aucun fichier à importer. Pensé pour deux usages à la fois :
un écran/tablette partagé posé devant la classe, et/ou chaque élève équipé
qui suit sur son propre compte. "Arrêter le direct" vide le contenu et
masque la section chez les élèves.

## Audio en direct

Sur "Cours en direct", l'enseignant clique "Démarrer l'audio" : son micro
est publié dans une room [LiveKit Cloud](https://cloud.livekit.io) nommée
d'après l'ID de la classe. Côté élève, un bandeau "🔊 Audio en direct
disponible" apparaît (dès que `class_live_reading.audio_active` passe à
`true`, via le même canal Supabase Realtime que la lecture en direct) avec
un bouton "Rejoindre" — volontairement pas de lecture automatique, les
navigateurs bloquent l'audio sans geste explicite de l'utilisateur.

Audio seul (pas de vidéo) pour rester léger en données mobiles. Les jetons
d'accès sont émis côté serveur (`src/app/actions/live-audio.ts`, clé
`LIVEKIT_API_SECRET` jamais exposée au navigateur) après vérification que
l'appelant est bien l'enseignant titulaire (émission) ou un élève de la
classe (écoute seule, jamais de publication).

**Variables requises** (`.env.local`, [cloud.livekit.io](https://cloud.livekit.io) → *Settings → API keys*) :
```
NEXT_PUBLIC_LIVEKIT_URL=wss://votre-projet.livekit.cloud
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
```
Le plan gratuit LiveKit Cloud inclut 5 000 minutes WebRTC/mois (aucune carte
bancaire requise) — largement suffisant pour tester, mais à surveiller pour
un usage quotidien sur plusieurs classes (une heure de cours avec 15 élèves
consomme déjà ~960 minutes-participant).

## Pièce jointe (image, fichier, message vocal)

Sur "Cours en direct", l'enseignant peut joindre une image, un fichier
quelconque, ou enregistrer un message vocal au micro (bouton "🎙️ Message
vocal" — utilise l'API `MediaRecorder` du navigateur, aucun logiciel
externe) en plus ou à la place du texte. Stocké dans un bucket Supabase
Storage public nommé `live-content` (chemin `<class_id>/...`, dépôt
restreint par RLS à l'enseignant titulaire de la classe — voir
`0009_live_attachment.sql`), référencé dans `class_live_reading` et diffusé
par le même canal Realtime que le reste. Côté élève : une image s'affiche
directement, un message vocal se lit avec un lecteur audio intégré, un
autre type de fichier propose un lien de téléchargement.

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
