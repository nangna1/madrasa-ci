"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { studentEmailFor } from "@/lib/auth/student-code";

type Mode = "adulte" | "eleve";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("adulte");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } =
      mode === "adulte"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signInWithPassword({ email: studentEmailFor(code), password: code.trim().toUpperCase() });

    if (error) {
      setError(mode === "adulte" ? "Identifiants incorrects." : "Code incorrect.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-sunk px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[0_24px_60px_rgba(38,30,16,0.12)]">
        <div className="mb-6 flex flex-col items-center gap-1 text-center">
          <div className="font-serif text-2xl font-semibold text-ink">Madrasa CI</div>
          <div className="text-xs uppercase tracking-[0.14em] text-ink-faint">Connexion</div>
        </div>

        <div className="mb-6 flex rounded-lg border border-border-input bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("adulte")}
            className={`flex-1 rounded-md py-2 text-xs font-semibold ${
              mode === "adulte" ? "bg-green text-card-alt" : "text-ink-muted"
            }`}
          >
            Enseignant / Fédération
          </button>
          <button
            type="button"
            onClick={() => setMode("eleve")}
            className={`flex-1 rounded-md py-2 text-xs font-semibold ${
              mode === "eleve" ? "bg-green text-card-alt" : "text-ink-muted"
            }`}
          >
            Élève
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {mode === "adulte" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink-muted" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-border-input bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-green"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink-muted" htmlFor="password">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg border border-border-input bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-green"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-ink-muted" htmlFor="code">
                Code d&apos;accès
              </label>
              <input
                id="code"
                type="text"
                required
                autoCapitalize="characters"
                placeholder="Ex. 7F3K9QRT"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="rounded-lg border border-border-input bg-white px-3 py-3 text-center font-serif text-lg tracking-[0.15em] text-ink outline-none focus:border-green"
              />
              <div className="text-center text-[11px] text-ink-faint">
                Le code donné par le maître, reçu sur WhatsApp
              </div>
            </div>
          )}

          {error && <div className="text-sm text-terracotta">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-green px-4 py-3 text-sm font-semibold text-card-alt hover:bg-green-dark disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
