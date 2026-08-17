"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { OfflineProvider, useOffline } from "@/lib/offline/offline-context";
import ServiceWorkerRegister from "./service-worker-register";

const TABS = [
  { href: "/teacher", label: "Accueil", icon: "◈" },
  { href: "/teacher/students", label: "Élèves", icon: "◍" },
  { href: "/teacher/attendance", label: "Appel", icon: "◫" },
  { href: "/teacher/payments", label: "Paiements", icon: "◎" },
  { href: "/teacher/parents", label: "Parents", icon: "◔" },
];

export default function TeacherShell({
  schoolName,
  classeName,
  teacherName,
  children,
}: {
  schoolName: string;
  classeName: string;
  teacherName: string;
  children: React.ReactNode;
}) {
  return (
    <OfflineProvider>
      <ServiceWorkerRegister />
      <TeacherShellInner schoolName={schoolName} classeName={classeName} teacherName={teacherName}>
        {children}
      </TeacherShellInner>
    </OfflineProvider>
  );
}

function TeacherShellInner({
  schoolName,
  classeName,
  teacherName,
  children,
}: {
  schoolName: string;
  classeName: string;
  teacherName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { online, pendingCount, syncing, flush } = useOffline();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-paper">
      <header className="flex flex-col gap-3 bg-green px-5 pb-4 pt-5 text-card-alt">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <div className="font-serif text-[19px] font-semibold">{schoolName}</div>
            <div className="text-xs text-white/70">
              {classeName} · {teacherName}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-white/30 px-2.5 py-1 text-[11px]">
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: online ? "#8ED6A8" : "var(--color-gold)" }}
              />
              <span>{online ? "En ligne" : "Hors ligne"}</span>
            </div>
            <form action={logout}>
              <button className="rounded-full border border-white/30 px-3 py-1.5 text-xs hover:bg-white/10">
                Déconnexion
              </button>
            </form>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center justify-between gap-2.5 rounded-[10px] bg-black/[0.18] px-3 py-2.5 text-xs text-[#E7DFCB]">
            <span>
              {pendingCount} action{pendingCount > 1 ? "s" : ""} en attente d&apos;envoi
            </span>
            <button onClick={flush} disabled={syncing || !online} className="underline disabled:opacity-50">
              {syncing ? "Synchronisation…" : "Synchroniser"}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-8 pt-5">{children}</main>

      <nav className="flex border-t border-border-soft bg-card-alt">
        {TABS.map((tab) => {
          const active = tab.href === "/teacher" ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 border-t-2 py-2.5 pb-3 ${
                active ? "border-green text-green" : "border-transparent text-ink-faint"
              }`}
            >
              <span className="text-[15px]">{tab.icon}</span>
              <span className="text-[10.5px] font-semibold tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
