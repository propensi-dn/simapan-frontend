"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default function SavingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDepositPage = pathname.startsWith("/savings/deposit");

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F1F5F9" }}>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6">
          {isDepositPage ? (
            <div className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
              {/* <Link href="/dashboard" className="hover:text-zinc-900">
                ← Back to Dashboard
              </Link> */}
              <Link href="/savings" className="hover:text-zinc-900">
                ← Back to Savings
              </Link>
              <span className="text-zinc-300">|</span>
              <span className="text-zinc-900">Deposit Form</span>
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-700">Savings</p>
          )}

          <div className="flex items-center gap-2">
            <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500">🔔</button>
            <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500">⚙️</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
