import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  anonClient,
  cleanupAll,
  createTestFederation,
  createTestSchool,
  createTestUser,
  newState,
  type TestUser,
} from "../helpers/fixtures";

// Les server actions createTeacherAccount / setAdminSuspended (src/app/
// actions/teacher-access.ts, admin-management.ts) ne sont pas testables
// directement ici : elles utilisent le client Supabase lié aux cookies de
// la requête (next/headers), indisponible hors d'un vrai contexte Next.js.
// On teste donc directement les deux mécanismes dont leur autorisation
// dépend réellement : la visibilité RLS des écoles par fédération (ce sur
// quoi createTeacherAccount s'appuie pour vérifier le périmètre de
// l'appelant) et la policy profiles_super_admin_read + le bannissement
// Supabase Auth (ce sur quoi setAdminSuspended s'appuie).
const admin = adminClient();
const state = newState();

let fedX: { id: string };
let fedY: { id: string };
let schoolInFedX: { id: string };
let fedAdminX: TestUser;
let fedAdminY: TestUser;
let superAdmin: TestUser;

beforeAll(async () => {
  fedX = await createTestFederation(admin, state, "fedX");
  fedY = await createTestFederation(admin, state, "fedY");
  schoolInFedX = await createTestSchool(admin, state, fedX.id, "school");

  fedAdminX = await createTestUser(admin, state, { role: "federation_admin", federationId: fedX.id, nom: "FedAdminX" });
  fedAdminY = await createTestUser(admin, state, { role: "federation_admin", federationId: fedY.id, nom: "FedAdminY" });
  superAdmin = await createTestUser(admin, state, { role: "super_admin", nom: "SuperAdmin" });
}, 30000);

afterAll(async () => {
  await cleanupAll(admin, state);
});

describe("visibilité des écoles par fédération (base de l'autorisation de createTeacherAccount)", () => {
  it("l'admin de la bonne fédération voit l'école -> pourrait y créer un enseignant", async () => {
    const { data, error } = await fedAdminX.client.from("schools").select("id").eq("id", schoolInFedX.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("l'admin d'une AUTRE fédération ne voit pas l'école -> createTeacherAccount la refuserait", async () => {
    const { data, error } = await fedAdminY.client.from("schools").select("id").eq("id", schoolInFedX.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("le super_admin voit l'école quelle que soit sa fédération", async () => {
    const { data, error } = await superAdmin.client.from("schools").select("id").eq("id", schoolInFedX.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});

describe("profiles_super_admin_read (base de listFederationAdmins)", () => {
  it("le super_admin peut lire le profil d'un autre admin", async () => {
    const { data, error } = await superAdmin.client.from("profiles").select("id").eq("id", fedAdminX.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("un federation_admin ne peut PAS lire le profil d'un autre admin (seulement le sien, profiles_self)", async () => {
    const { data, error } = await fedAdminX.client.from("profiles").select("id").eq("id", fedAdminY.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });
});

describe("bannissement Supabase Auth (base réelle de la suspension)", () => {
  it("un compte banni (ban_duration) ne peut plus se connecter, et redevient utilisable après levée du ban", async () => {
    const target = await createTestUser(admin, state, { role: "federation_admin", federationId: fedX.id, nom: "ASuspendre" });

    const { error: banErr } = await admin.auth.admin.updateUserById(target.id, { ban_duration: "876000h" });
    expect(banErr).toBeNull();

    // Le token déjà émis peut rester valable jusqu'à expiration, mais une
    // NOUVELLE tentative de connexion doit être refusée -- c'est le vrai
    // comportement que setAdminSuspended garantit pour un compte suspendu.
    const freshClient = anonClient(); // client anon frais, pas de session en mémoire
    const { error: signInErr } = await freshClient.auth.signInWithPassword({
      email: target.email,
      password: "Test-Passw0rd-Scolaris!",
    });
    expect(signInErr).not.toBeNull();

    const { error: unbanErr } = await admin.auth.admin.updateUserById(target.id, { ban_duration: "none" });
    expect(unbanErr).toBeNull();

    const { error: signInAgainErr } = await freshClient.auth.signInWithPassword({
      email: target.email,
      password: "Test-Passw0rd-Scolaris!",
    });
    expect(signInAgainErr).toBeNull();
  });
});
