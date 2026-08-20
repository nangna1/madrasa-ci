import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  cleanupAll,
  createTestClasse,
  createTestFederation,
  createTestSchool,
  createTestStudent,
  createTestUser,
  newState,
  type TestUser,
} from "../helpers/fixtures";

// Vérifie les frontières RLS réellement en vigueur (supabase/migrations
// 0001, 0002, 0005, 0010) : un enseignant ne voit que les élèves de SA
// CLASSE (pas toute son école — voir 0002_classes.sql, une régression ici
// exposerait les élèves d'un collègue), un admin fédération voit en lecture
// seule les écoles de sa fédération mais ne peut rien y écrire, un compte
// élève ne voit que sa propre fiche et n'écrit jamais nulle part.
const admin = adminClient();
const state = newState();

let fedX: { id: string };
let fedY: { id: string };
let schoolA: { id: string }; // dans fedX, deux classes
let schoolC: { id: string }; // dans fedY, école isolée
let classe1: { id: string };
let teacher1: TestUser; // classe1
let teacher2: TestUser; // classe2, même école que teacher1
let teacherOther: TestUser; // school C, autre fédération
let fedAdminX: TestUser;
let fedAdminY: TestUser;
let studentInClasse1: { id: string; full_name: string };
let studentAccount: TestUser;

beforeAll(async () => {
  fedX = await createTestFederation(admin, state, "fedX");
  fedY = await createTestFederation(admin, state, "fedY");
  schoolA = await createTestSchool(admin, state, fedX.id, "schoolA");
  schoolC = await createTestSchool(admin, state, fedY.id, "schoolC");

  teacher1 = await createTestUser(admin, state, { role: "teacher", schoolId: schoolA.id, nom: "Teacher1" });
  teacher2 = await createTestUser(admin, state, { role: "teacher", schoolId: schoolA.id, nom: "Teacher2" });
  teacherOther = await createTestUser(admin, state, { role: "teacher", schoolId: schoolC.id, nom: "TeacherOther" });
  fedAdminX = await createTestUser(admin, state, { role: "federation_admin", federationId: fedX.id, nom: "FedAdminX" });
  fedAdminY = await createTestUser(admin, state, { role: "federation_admin", federationId: fedY.id, nom: "FedAdminY" });

  classe1 = await createTestClasse(admin, state, schoolA.id, teacher1.id, "classe1");
  await createTestClasse(admin, state, schoolA.id, teacher2.id, "classe2");

  studentInClasse1 = await createTestStudent(admin, state, schoolA.id, classe1.id, "eleve1");

  studentAccount = await createTestUser(admin, state, {
    role: "student",
    schoolId: schoolA.id,
    studentId: studentInClasse1.id,
    nom: studentInClasse1.full_name,
  });
}, 30000);

afterAll(async () => {
  await cleanupAll(admin, state);
});

describe("isolation par classe (enseignant)", () => {
  it("un enseignant voit les élèves de sa propre classe", async () => {
    const { data, error } = await teacher1.client.from("students").select("id").eq("id", studentInClasse1.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("un collègue de la MÊME école mais d'une AUTRE classe ne voit pas cet élève", async () => {
    const { data, error } = await teacher2.client.from("students").select("id").eq("id", studentInClasse1.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("un enseignant d'une autre école ne le voit pas non plus", async () => {
    const { data, error } = await teacherOther.client.from("students").select("id").eq("id", studentInClasse1.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("un collègue d'une autre classe ne peut pas non plus l'écrire (ex. présence)", async () => {
    const { error } = await teacher2.client
      .from("attendance")
      .insert({ student_id: studentInClasse1.id, date: "2026-08-20", present: true });
    expect(error).not.toBeNull();
  });
});

describe("fédération : lecture seule, scopée à sa propre fédération", () => {
  it("l'admin de la fédération peut lire l'élève d'une école membre", async () => {
    const { data, error } = await fedAdminX.client.from("students").select("id").eq("id", studentInClasse1.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("l'admin d'une AUTRE fédération ne voit rien de cette école", async () => {
    const { data, error } = await fedAdminY.client.from("students").select("id").eq("id", studentInClasse1.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("l'admin fédération ne peut pas écrire l'élève (lecture seule, pas de policy INSERT/UPDATE)", async () => {
    const { error } = await fedAdminX.client
      .from("students")
      .update({ full_name: "Modifié par erreur" })
      .eq("id", studentInClasse1.id);
    // RLS bloque : soit une erreur explicite, soit un update silencieux sur
    // 0 ligne (comportement Postgres standard quand la policy USING exclut
    // la ligne) — on vérifie donc que la donnée n'a réellement pas changé,
    // plutôt que de supposer laquelle des deux formes l'échec prendra.
    const { data: check } = await admin.from("students").select("full_name").eq("id", studentInClasse1.id).single();
    expect(check?.full_name).toBe(studentInClasse1.full_name);
    void error;
  });
});

describe("compte élève : lecture seule de ses propres données", () => {
  it("l'élève voit sa propre fiche", async () => {
    const { data, error } = await studentAccount.client.from("students").select("id").eq("id", studentInClasse1.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("l'élève ne voit aucun autre élève, même de sa propre classe", async () => {
    const autre = await createTestStudent(admin, state, schoolA.id, classe1.id, "eleve2");
    const { data, error } = await studentAccount.client.from("students").select("id").eq("id", autre.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("l'élève ne peut rien écrire nulle part (ex. sa propre présence)", async () => {
    const { error } = await studentAccount.client
      .from("attendance")
      .insert({ student_id: studentInClasse1.id, date: "2026-08-20", present: true });
    expect(error).not.toBeNull();
  });
});
