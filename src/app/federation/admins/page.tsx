import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profile";
import { listFederationAdmins } from "@/app/actions/admin-management";
import { getT } from "@/lib/i18n/server";
import PageHeader from "../page-header";
import AdminsTable from "./admins-table";

// Réservé au super_admin — un federation_admin qui tape cette URL est
// renvoyé au tableau de bord plutôt que de voir un écran vide/en erreur.
export default async function AdminsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile || profile.role !== "super_admin") redirect("/federation");

  const rows = await listFederationAdmins();
  const { t } = await getT();

  if ("error" in rows) {
    return <div className="p-8 text-sm text-terracotta">{rows.error}</div>;
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t("Comptes admin")}
        subtitle={t("Comptes federation_admin du réseau — suspension réversible en cas de besoin")}
      />
      <div className="px-[34px] py-[26px]">
        <AdminsTable rows={rows} />
      </div>
    </div>
  );
}
