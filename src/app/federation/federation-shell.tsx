"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

const NAV = [
  { href: "/federation", label: "Vue d'ensemble", icon: "◈" },
  { href: "/federation/schools", label: "Écoles membres", icon: "◍" },
  { href: "/federation/advocacy", label: "Plaidoyer", icon: "◫" },
  { href: "/guide", label: "Guide d'utilisation", icon: "?" },
];

export default function FederationShell({
  orgName,
  integrationRate,
  children,
}: {
  orgName: string;
  integrationRate: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-paper-sunk">
      <aside className="flex w-[244px] shrink-0 flex-col gap-7 bg-green-deep px-[18px] py-[26px] text-[#E7DFCB]">
        <div className="flex flex-col gap-1">
          <div className="font-serif text-lg font-semibold text-[#FBF7EE]">{orgName}</div>
          <div className="text-[11.5px] leading-relaxed text-[#90AC9D]">
            Tableau de bord agrégé · réseau d&apos;écoles membres
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = n.href === "/federation" ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-[13.5px] ${
                  active ? "bg-white/[0.14] text-[#FBF7EE]" : "text-[#BFD1C6] hover:bg-white/[0.08]"
                }`}
              >
                <span className="text-[13px] opacity-85">{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 border-t border-white/[0.16] pt-4">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[#7E9A8B]">
              Plaidoyer intégration
            </div>
            <div className="font-serif text-2xl font-semibold text-[#FBF7EE]">{integrationRate}%</div>
            <div className="text-[11.5px] leading-relaxed text-[#90AC9D]">
              des écoles du réseau intégrées au système national
            </div>
          </div>
          <form action={logout}>
            <button className="w-full rounded-[9px] border border-white/[0.35] py-2.5 text-xs font-semibold hover:bg-white/[0.08]">
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
