"use client";

import { useEffect } from "react";

export default function PrintTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      onClick={() => window.print()}
      className="mb-6 rounded-[10px] bg-green px-5 py-2.5 text-sm font-semibold text-card-alt print:hidden"
    >
      Imprimer / Enregistrer en PDF
    </button>
  );
}
