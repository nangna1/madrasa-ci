import { logout } from "@/app/actions/auth";
import { getT } from "@/lib/i18n/server";

export default async function NoClassAssigned({ schoolName }: { schoolName: string }) {
  const { t } = await getT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <div className="font-serif text-xl font-semibold text-ink">{t("Aucune classe assignée")}</div>
      <p className="max-w-xs text-sm text-ink-muted">
        {t("Votre compte est rattaché à {schoolName}, mais aucune classe ne vous a encore été assignée. Contactez le responsable de l'école pour qu'il vous affecte à une classe.", { schoolName })}
      </p>
      <form action={logout}>
        <button className="rounded-full border border-border-input px-4 py-2 text-xs font-semibold text-ink-soft">
          {t("Déconnexion")}
        </button>
      </form>
    </div>
  );
}
