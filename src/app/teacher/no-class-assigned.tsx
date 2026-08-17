import { logout } from "@/app/actions/auth";

export default function NoClassAssigned({ schoolName }: { schoolName: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <div className="font-serif text-xl font-semibold text-ink">Aucune classe assignée</div>
      <p className="max-w-xs text-sm text-ink-muted">
        Votre compte est rattaché à {schoolName}, mais aucune classe ne vous a encore été
        assignée. Contactez le responsable de l&apos;école pour qu&apos;il vous affecte à une
        classe.
      </p>
      <form action={logout}>
        <button className="rounded-full border border-border-input px-4 py-2 text-xs font-semibold text-ink-soft">
          Déconnexion
        </button>
      </form>
    </div>
  );
}
