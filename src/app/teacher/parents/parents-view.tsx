"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendParentMessage } from "@/lib/data/messages";
import { useOffline } from "@/lib/offline/offline-context";
import { useLocale } from "@/components/locale-provider";

interface Template {
  label: string;
  text: string;
}

export default function ParentsView({
  schoolId,
  recipients,
  templates,
  initialTemplateIndex,
}: {
  schoolId: string;
  recipients: { studentId: string; phone: string }[];
  templates: readonly Template[];
  initialTemplateIndex: number;
}) {
  const { runOrQueue } = useOffline();
  const { t } = useLocale();
  const [draft, setDraft] = useState(templates[initialTemplateIndex]?.text ?? "");
  const [activeTemplate, setActiveTemplate] = useState(templates[initialTemplateIndex]?.label);
  const [audio, setAudio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setSent(null);

    const results = await Promise.all(
      recipients.map((r) =>
        runOrQueue(
          {
            kind: "message",
            label: `${t("Message")} · ${r.phone}`,
            payload: { schoolId, studentId: r.studentId, toPhone: r.phone, body: draft, template: activeTemplate },
          },
          async () => {
            const supabase = createClient();
            await sendParentMessage(supabase, {
              schoolId,
              studentId: r.studentId,
              toPhone: r.phone,
              body: draft,
              template: activeTemplate,
            });
          },
        ),
      ),
    );

    setBusy(false);
    const queuedCount = results.filter((r) => !r.synced).length;
    setSent(
      queuedCount > 0
        ? t("{sent} message(s) envoyé(s), {queued} en attente de synchronisation", {
            sent: recipients.length - queuedCount,
            queued: queuedCount,
          })
        : t("Message envoyé à {n} parents{audio}", {
            n: recipients.length,
            audio: audio ? t(" (+ audio dioula)") : "",
          }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <div className="font-serif text-2xl font-semibold text-ink">{t("Message aux parents")}</div>
        <div className="text-[13px] text-ink-muted">{t("Envoi par WhatsApp · aucune application à installer côté parent")}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {templates.map((tpl) => (
          <button
            key={tpl.label}
            onClick={() => {
              setDraft(tpl.text);
              setActiveTemplate(tpl.label);
            }}
            className={`rounded-full px-3 py-2 text-xs ${
              activeTemplate === tpl.label
                ? "bg-green text-card-alt"
                : "border border-border-input bg-card text-ink-soft"
            }`}
          >
            {tpl.label}
          </button>
        ))}
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={6}
        placeholder={t("Écrire le message…")}
        className="w-full resize-none rounded-xl border border-border-input bg-card p-3.5 text-sm leading-relaxed text-ink outline-none focus:border-green"
      />

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-card px-3.5 py-3">
        <div className="flex flex-col gap-0.5">
          <div className="text-[13px] font-semibold text-ink">{t("{n} parents · WhatsApp", { n: recipients.length })}</div>
          <div className="text-xs text-ink-muted">{t("Numéros parents enregistrés")}</div>
        </div>
        <button
          onClick={() => setAudio((a) => !a)}
          className={`rounded-full px-2.5 py-1.5 text-xs ${
            audio ? "border border-green bg-green text-card-alt" : "border border-border-input bg-card text-ink-soft"
          }`}
        >
          {t("+ version audio dioula")}
        </button>
      </div>

      <button
        onClick={send}
        disabled={busy || recipients.length === 0}
        className="rounded-xl bg-green py-3.5 text-center text-sm font-semibold text-card-alt hover:bg-green-dark disabled:opacity-60"
      >
        {busy ? t("Envoi…") : t("Envoyer sur WhatsApp")}
      </button>

      {sent && <div className="text-center text-xs text-terracotta">{sent}</div>}
    </div>
  );
}
