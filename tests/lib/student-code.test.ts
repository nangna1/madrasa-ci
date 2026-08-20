import { describe, expect, it } from "vitest";
import { generateStudentCode, studentEmailFor, STUDENT_EMAIL_DOMAIN } from "@/lib/auth/student-code";

// Fonctions pures (aucune dépendance Supabase) — le code d'accès élève est
// la seule barrière de sécurité d'un compte à faible enjeu (lecture seule),
// donc son alphabet et son unicité pratique comptent vraiment.
describe("generateStudentCode", () => {
  it("génère un code de la longueur demandée", () => {
    expect(generateStudentCode(8)).toHaveLength(8);
    expect(generateStudentCode(4)).toHaveLength(4);
  });

  it("longueur par défaut de 8", () => {
    expect(generateStudentCode()).toHaveLength(8);
  });

  it("n'utilise jamais les caractères ambigus 0/O/1/I/L (recopiés à la main par un enfant)", () => {
    const ambigus = /[01OIL]/;
    for (let i = 0; i < 200; i++) {
      expect(generateStudentCode()).not.toMatch(ambigus);
    }
  });

  it("ne génère (quasiment) jamais deux fois le même code", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateStudentCode()));
    // 500 tirages sur un alphabet de 32^8 combinaisons : une collision
    // signalerait un vrai défaut d'aléatoire, pas juste la malchance.
    expect(codes.size).toBe(500);
  });
});

describe("studentEmailFor", () => {
  it("met le code en majuscules et l'associe au domaine interne", () => {
    expect(studentEmailFor("ab3d5f7h")).toBe(`AB3D5F7H@${STUDENT_EMAIL_DOMAIN}`);
  });

  it("retire les espaces autour du code (copié-collé depuis WhatsApp)", () => {
    expect(studentEmailFor("  AB3D5F7H  ")).toBe(`AB3D5F7H@${STUDENT_EMAIL_DOMAIN}`);
  });

  it("est stable : même code -> même email, quelle que soit la casse d'entrée", () => {
    expect(studentEmailFor("ab3d5f7h")).toBe(studentEmailFor("AB3D5F7H"));
  });
});
