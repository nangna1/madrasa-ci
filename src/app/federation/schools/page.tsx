import { createClient } from "@/lib/supabase/server";
import { getSchoolRows } from "@/lib/data/federation";
import PageHeader from "../page-header";
import SchoolsTable from "./schools-table";

export default async function SchoolsPage() {
  const supabase = await createClient();
  const rows = await getSchoolRows(supabase);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Écoles membres"
        subtitle="Effectifs, recouvrement et remontée de données école par école"
      />
      <div className="px-[34px] py-[26px]">
        <SchoolsTable rows={rows} />
      </div>
    </div>
  );
}
