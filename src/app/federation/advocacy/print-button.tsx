"use client";

import { useLocale } from "@/components/locale-provider";

export default function PrintButton() {
  const { t } = useLocale();
  return (
    <button
      onClick={() => window.open("/print/plaidoyer", "_blank")}
      className="self-start rounded-[10px] bg-green px-5 py-3 text-[13.5px] font-semibold text-card-alt hover:bg-green-dark"
    >
      {t("Générer le dossier PDF")}
    </button>
  );
}
