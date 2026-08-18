import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { logout } from "@/app/actions/auth";

// Espace élève : lecture seule, une seule page pour l'instant (progression,
// présence, paiement) — pas de file d'attente hors-ligne comme côté
// enseignant, rien n'y est jamais écrit.
export default async function EleveLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "student") redirect("/login");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-paper">
      <header className="flex items-center justify-between gap-3 bg-green px-5 py-5 text-card-alt">
        <div className="flex flex-col gap-0.5">
          <div className="font-serif text-[19px] font-semibold">{profile.full_name}</div>
          <div className="text-xs text-white/70">Espace élève · Madrasa CI</div>
        </div>
        <form action={logout}>
          <button className="rounded-full border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10">
            Déconnexion
          </button>
        </form>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-8 pt-5">{children}</main>
    </div>
  );
}
