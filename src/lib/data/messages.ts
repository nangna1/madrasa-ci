import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { consoleMessagingProvider } from "@/lib/providers/messaging-provider";

export const MESSAGE_TEMPLATES = [
  {
    label: "Rappel de cours",
    text: "As-salamu alaykum. Rappel : reprise des cours demain à 15h. Merci de veiller à la présence de votre enfant.",
  },
  {
    label: "Mensualité",
    text: "As-salamu alaykum. La mensualité du mois peut être réglée par Orange Money, MTN Money ou Wave depuis le lien envoyé. Barakallahu fikum.",
  },
  {
    label: "Progrès Coran",
    text: "As-salamu alaykum. Votre enfant a validé une nouvelle sourate cette semaine, qu'Allah lui facilite. Détail dans le suivi joint.",
  },
  {
    label: "Absence",
    text: "As-salamu alaykum. Votre enfant était absent au cours d'aujourd'hui. Merci de nous informer en cas d'empêchement.",
  },
] as const;

export async function sendParentMessage(
  supabase: SupabaseClient<Database>,
  params: {
    schoolId: string;
    studentId?: string | null;
    body: string;
    template?: string;
    toPhone: string;
  },
): Promise<void> {
  const result = await consoleMessagingProvider.send({
    toPhone: params.toPhone,
    body: params.body,
  });

  const { error } = await supabase.from("messages").insert({
    school_id: params.schoolId,
    student_id: params.studentId ?? null,
    channel: "whatsapp",
    template: params.template,
    body: params.body,
    status: result.ok ? "sent" : "failed",
    sent_at: result.ok ? new Date().toISOString() : null,
  });
  if (error) throw error;
}
