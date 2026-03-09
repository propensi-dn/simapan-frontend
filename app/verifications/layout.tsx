"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function VerificationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = () => {
        if (!isAuthenticated()) {
            window.location.href = "/login";
            return;
        }
        const role = localStorage.getItem("userRole");
        if (!["STAFF", "MANAGER", "CHAIRMAN"].includes(role ?? "")) {
            window.location.href = "/savings";
            return;
        }
        setChecked(true);
    };

    const timer = setTimeout(check, 0);
    return () => clearTimeout(timer);
 }, []);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-400">Checking access...</p>
      </div>
    );
  }

  const tabs = [
    { href: "/verifications/pokok", label: "Simpanan Pokok", badge: "PBI-9" },
    { href: "/verifications/deposits", label: "Simpanan Wajib / Sukarela", badge: "PBI-12" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">SI-MAPAN Staff Portal</p>
              <h1 className="text-2xl font-bold text-zinc-900">Verification Queue</h1>
            </div>
            <Link
              href="/savings"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1">
            {tabs.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  }`}
                >
                  {tab.label}
                  <span className={`rounded px-1.5 py-0.5 text-xs ${isActive ? "bg-zinc-700 text-zinc-300" : "bg-zinc-100 text-zinc-500"}`}>
                    {tab.badge}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {children}
      </div>
    </div>
  );
}