import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  confirmPayment,
  currentPeriod,
  formatFcfa,
  requestMobileMoneyPayment,
} from "@/lib/data/payments";
import type { PaymentProvider } from "@/lib/providers/payment-provider";
import {
  adminClient,
  cleanupAll,
  createTestClasse,
  createTestSchool,
  createTestStudent,
  createTestUser,
  newState,
  type TestUser,
} from "../helpers/fixtures";

describe("formatFcfa / currentPeriod (fonctions pures)", () => {
  it("formatFcfa sépare les milliers et ajoute le suffixe FCFA", () => {
    expect(formatFcfa(3000)).toBe("3 000 FCFA");
    expect(formatFcfa(150000)).toBe("150 000 FCFA");
    expect(formatFcfa(0)).toBe("0 FCFA");
  });

  it("currentPeriod renvoie le format AAAA-MM du mois en cours", () => {
    const period = currentPeriod();
    expect(period).toMatch(/^\d{4}-\d{2}$/);
    const now = new Date();
    expect(period).toBe(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  });
});

// Cycle réel demande -> confirmation, contre le vrai schéma/RLS (voir
// supabase/migrations/0001_init.sql pour payments_status_check et
// 0004_payment_pending.sql pour l'ajout du statut 'pending'). C'est le
// chemin le plus sensible de l'app (argent réel, même si l'appel opérateur
// est encore un stub — voir src/lib/providers/payment-provider.ts).
const admin = adminClient();
const state = newState();
let teacher: TestUser;
let studentId: string;

const alwaysOk: PaymentProvider = { async requestPayment() { return { ok: true }; } };
const alwaysFails: PaymentProvider = { async requestPayment() { return { ok: false, error: "Opérateur injoignable (test)" }; } };

beforeAll(async () => {
  const school = await createTestSchool(admin, state, null, "school-pay");
  teacher = await createTestUser(admin, state, { role: "teacher", schoolId: school.id, nom: "TeacherPay" });
  const classe = await createTestClasse(admin, state, school.id, teacher.id, "classe-pay");
  const student = await createTestStudent(admin, state, school.id, classe.id, "eleve-pay");
  studentId = student.id;
}, 30000);

afterAll(async () => {
  await cleanupAll(admin, state);
});

describe("requestMobileMoneyPayment", () => {
  it("enregistre le paiement en 'pending' quand l'opérateur accepte la demande", async () => {
    const period = "2026-01";
    const payment = await requestMobileMoneyPayment(teacher.client, alwaysOk, {
      studentId,
      period,
      operator: "Orange Money",
      parentPhone: "0700000000",
      amount: 3000,
    });
    expect(payment.status).toBe("pending");
    expect(payment.method).toBe("Orange Money");
    expect(payment.paid_at).toBeNull();
  });

  it("n'écrit rien en base si l'opérateur refuse la demande", async () => {
    const period = "2026-02";
    await expect(
      requestMobileMoneyPayment(teacher.client, alwaysFails, {
        studentId,
        period,
        operator: "MTN Money",
        parentPhone: "0700000000",
        amount: 3000,
      }),
    ).rejects.toThrow("Opérateur injoignable");

    const { data } = await admin.from("payments").select("id").eq("student_id", studentId).eq("period", period);
    expect(data).toHaveLength(0);
  });

  it("une deuxième demande pour la même période met à jour la ligne existante plutôt que d'en créer une deuxième (upsert)", async () => {
    const period = "2026-03";
    await requestMobileMoneyPayment(teacher.client, alwaysOk, {
      studentId,
      period,
      operator: "Orange Money",
      parentPhone: "0700000000",
      amount: 3000,
    });
    await requestMobileMoneyPayment(teacher.client, alwaysOk, {
      studentId,
      period,
      operator: "Wave",
      parentPhone: "0700000000",
      amount: 3000,
    });

    const { data } = await admin.from("payments").select("*").eq("student_id", studentId).eq("period", period);
    expect(data).toHaveLength(1);
    expect(data![0].method).toBe("Wave");
  });
});

describe("confirmPayment", () => {
  it("fait passer un paiement 'pending' à 'paid' avec un numéro de reçu et une date", async () => {
    const period = "2026-04";
    await requestMobileMoneyPayment(teacher.client, alwaysOk, {
      studentId,
      period,
      operator: "Orange Money",
      parentPhone: "0700000000",
      amount: 3000,
    });

    const confirmed = await confirmPayment(teacher.client, studentId, period);
    expect(confirmed.status).toBe("paid");
    expect(confirmed.receipt_no).toMatch(/^Reçu N° \d{4} \/ \d{4}$/);
    expect(confirmed.paid_at).not.toBeNull();
  });

  it("deux confirmations successives génèrent deux numéros de reçu distincts (séquence, pas de réutilisation)", async () => {
    const periodA = "2026-05";
    const periodB = "2026-06";
    await requestMobileMoneyPayment(teacher.client, alwaysOk, {
      studentId,
      period: periodA,
      operator: "Orange Money",
      parentPhone: "0700000000",
      amount: 3000,
    });
    await requestMobileMoneyPayment(teacher.client, alwaysOk, {
      studentId,
      period: periodB,
      operator: "Orange Money",
      parentPhone: "0700000000",
      amount: 3000,
    });

    const a = await confirmPayment(teacher.client, studentId, periodA);
    const b = await confirmPayment(teacher.client, studentId, periodB);
    expect(a.receipt_no).not.toBe(b.receipt_no);
  });
});
