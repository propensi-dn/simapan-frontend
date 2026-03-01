"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/savings", label: "Savings", icon: "◔" },
  { href: "/loans", label: "Loans", icon: "◫" },
  { href: "/profile", label: "Profile", icon: "◌" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-200 bg-zinc-50">
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white">▣</div>
          <div>
            <p className="text-lg font-semibold text-zinc-900">SI-MAPAN</p>
            <p className="text-xs text-zinc-500">Credit Union System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith("/savings");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-zinc-200 font-semibold text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/savings/deposit"
          className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
            pathname.startsWith("/savings/deposit")
              ? "bg-zinc-200 font-semibold text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
          }`}
        >
          <span className="text-xs">◉</span>
          Tambah Setoran
        </Link>
      </nav>

      <div className="border-t border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-zinc-200 text-xs">👤</div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Budi Santoso</p>
              <p className="text-xs text-zinc-500">ID: 1092834</p>
            </div>
          </div>
          <span className="text-zinc-400">↗</span>
        </div>
      </div>
    </aside>
  );
}
