import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Préfixe distinctif de toutes les données créées par les tests, pour ne
// jamais pouvoir être confondues avec les vraies données du projet Supabase
// de dev partagé contre lequel ces tests s'exécutent directement (pas de
// stack Supabase locale dans cet environnement).
export const TEST_PREFIX = "TEST_";

const PASSWORD = "Test-Passw0rd-Scolaris!";

export function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// Un client anon frais par utilisateur signé : signInWithPassword met à jour
// la session EN MÉMOIRE de cette instance (persistSession:false évite tout
// essai d'écriture dans un storage navigateur inexistant sous Node), donc les
// requêtes .from(...) suivantes sur ce client portent bien le JWT de CET
// utilisateur précis.
export function anonClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export type Role = "teacher" | "federation_admin" | "student" | "super_admin";

export interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient;
}

export interface TestFederation {
  id: string;
  name: string;
}

export interface TestSchool {
  id: string;
  name: string;
}

export interface TestClasse {
  id: string;
  name: string;
}

export interface TestStudent {
  id: string;
  full_name: string;
}

interface CreatedState {
  federationIds: Set<string>;
  schoolIds: Set<string>;
  classIds: Set<string>;
  studentIds: Set<string>;
  userIds: Set<string>;
}

export function newState(): CreatedState {
  return {
    federationIds: new Set(),
    schoolIds: new Set(),
    classIds: new Set(),
    studentIds: new Set(),
    userIds: new Set(),
  };
}

export async function createTestFederation(
  admin: SupabaseClient,
  state: CreatedState,
  label: string,
): Promise<TestFederation> {
  const suffix = randomUUID().slice(0, 8);
  const name = `${TEST_PREFIX}${label}_${suffix}`;
  const { data, error } = await admin
    .from("federations")
    .insert({ name, region: "Test" })
    .select("id, name")
    .single();
  if (error) throw new Error(`createTestFederation(${label}): ${error.message}`);
  state.federationIds.add(data.id);
  return data;
}

export async function createTestSchool(
  admin: SupabaseClient,
  state: CreatedState,
  federationId: string | null,
  label: string,
): Promise<TestSchool> {
  const suffix = randomUUID().slice(0, 8);
  const name = `${TEST_PREFIX}${label}_${suffix}`;
  const { data, error } = await admin
    .from("schools")
    .insert({ name, region: "Test", federation_id: federationId })
    .select("id, name")
    .single();
  if (error) throw new Error(`createTestSchool(${label}): ${error.message}`);
  state.schoolIds.add(data.id);
  return data;
}

// Crée un utilisateur auth.users + sa ligne public.profiles, et retourne un
// client Supabase déjà connecté en son nom : le JWT porte donc les vraies
// claims telles que le hook les calculerait en production, pas une valeur
// simulée côté test. Le rôle et son périmètre (school_id / federation_id /
// student_id) suivent la même contrainte `profile_scope` que la vraie app —
// voir supabase/migrations/0001_init.sql, 0005 et 0010.
export async function createTestUser(
  admin: SupabaseClient,
  state: CreatedState,
  opts: { role: Role; schoolId?: string | null; federationId?: string | null; studentId?: string | null; nom?: string },
): Promise<TestUser> {
  const email = `${TEST_PREFIX.toLowerCase()}${randomUUID()}@scolaris-tests.invalid`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    throw new Error(`createTestUser auth.admin.createUser(${opts.role}): ${createErr?.message}`);
  }
  const userId = created.user.id;
  state.userIds.add(userId);

  const { error: insertErr } = await admin.from("profiles").insert({
    id: userId,
    role: opts.role,
    full_name: opts.nom ?? `${TEST_PREFIX}${opts.role}`,
    school_id: opts.schoolId ?? null,
    federation_id: opts.federationId ?? null,
    student_id: opts.studentId ?? null,
  });
  if (insertErr) throw new Error(`createTestUser insert public.profiles(${opts.role}): ${insertErr.message}`);

  const client = anonClient();
  const { error: signInErr } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInErr) throw new Error(`createTestUser signInWithPassword(${opts.role}): ${signInErr.message}`);

  return { id: userId, email, client };
}

export async function createTestClasse(
  admin: SupabaseClient,
  state: CreatedState,
  schoolId: string,
  teacherId: string | null,
  label: string,
): Promise<TestClasse> {
  const suffix = randomUUID().slice(0, 8);
  const name = `${TEST_PREFIX}${label}_${suffix}`;
  const { data, error } = await admin
    .from("classes")
    .insert({ name, school_id: schoolId, teacher_id: teacherId })
    .select("id, name")
    .single();
  if (error) throw new Error(`createTestClasse(${label}): ${error.message}`);
  state.classIds.add(data.id);
  return data;
}

export async function createTestStudent(
  admin: SupabaseClient,
  state: CreatedState,
  schoolId: string,
  classId: string | null,
  label: string,
): Promise<TestStudent> {
  const suffix = randomUUID().slice(0, 8);
  const full_name = `${TEST_PREFIX}${label}_${suffix}`;
  const { data, error } = await admin
    .from("students")
    .insert({ full_name, school_id: schoolId, class_id: classId })
    .select("id, full_name")
    .single();
  if (error) throw new Error(`createTestStudent(${label}): ${error.message}`);
  state.studentIds.add(data.id);
  return data;
}

// Décode la partie payload d'un JWT (pas de vérification de signature : on
// fait confiance à Supabase qui vient de nous le fournir, on veut juste lire
// les claims).
export function decodeJwtPayload(accessToken: string): Record<string, unknown> {
  const payload = accessToken.split(".")[1];
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

// Ordre de nettoyage : les comptes auth.users d'abord (cascade automatique
// vers profiles, y compris les profils élève via profiles.student_id ->
// students on delete cascade — voir 0005), puis les students explicitement
// suivis (cascade vers memorization_progress/attendance/payments), puis
// classes, puis schools (cascade vers tout étudiant/classe restant non
// suivi explicitement), puis federations en dernier (schools.federation_id
// est en "on delete set null", donc l'ordre n'a pas d'importance ici, mais
// on la fait quand même en dernier par clarté).
export async function cleanupAll(admin: SupabaseClient, state: CreatedState) {
  for (const id of state.userIds) {
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
  for (const id of state.studentIds) {
    await admin.from("students").delete().eq("id", id);
  }
  for (const id of state.classIds) {
    await admin.from("classes").delete().eq("id", id);
  }
  for (const id of state.schoolIds) {
    await admin.from("schools").delete().eq("id", id);
  }
  for (const id of state.federationIds) {
    await admin.from("federations").delete().eq("id", id);
  }
}
