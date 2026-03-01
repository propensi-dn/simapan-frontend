import Sidebar from "@/components/layout/Sidebar";

export default function SavingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-6">
          <p className="text-sm font-semibold text-zinc-700">Savings</p>
          <div className="flex items-center gap-2">
            <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500">🔔</button>
            <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-500">⚙️</button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
