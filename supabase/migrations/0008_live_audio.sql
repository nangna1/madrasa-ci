-- Madrasa CI — audio en direct
--
-- Réutilise class_live_reading (déjà diffusée en temps réel) pour porter un
-- simple indicateur "audio en cours" par classe. Le flux audio lui-même
-- passe par LiveKit Cloud (WebRTC, room = class_id) — voir
-- src/app/actions/live-audio.ts pour l'émission des jetons d'accès. Cette
-- colonne ne sert qu'à savoir, côté élève, s'il y a quelque chose à
-- rejoindre en ce moment, sans avoir à interroger LiveKit directement.

alter table public.class_live_reading add column audio_active boolean not null default false;
