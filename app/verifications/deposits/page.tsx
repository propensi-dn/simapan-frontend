"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

type DepositItem = {
  id: number;
  saving_id: string;
  transaction_id: string;
  saving_type: "MANDATORY" | "VOLUNTARY";
  amount: string;
  status: "PENDING" | "SUCCESS" | "REJECTED";
  created_at: string;
  member_name: string;
  member_id: string | null;
};

type QueueResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: DepositItem[];
};

const formatRupiah = (v: string | number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v));

const TYPE_LABEL: Record<string, string> = {
  MANDATORY: "Wajib",
  VOLUNTARY: "Sukarela",
};

export default function DepositsQueuePage() {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [search, setSearch] = useState("");
  const [savingType, setSavingType] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQueue = async (q: string, type: string, p: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (q) params.set("search", q);
      if (type) params.set("saving_type", type);
      const res = await api.get<QueueResponse>(`/verifications/deposits/?${params}`);
      setData(res.data);
    } catch {
      setError("Gagal mengambil data antrian.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(search, savingType, page);
  }, [page, savingType]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQueue(search, savingType, 1);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Verification Queue</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Manage and approve pending member deposit proofs.
          </p>
        </div>
        <button
          onClick={() => fetchQueue(search, savingType, page)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Search + Filter */}
      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Search by name, member ID, or transaction ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        />
        <select
          value={savingType}
          onChange={(e) => { setSavingType(e.target.value); setPage(1); }}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
        >
          <option value="">All Types</option>
          <option value="MANDATORY">Wajib</option>
          <option value="VOLUNTARY">Sukarela</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Bukti Setoran — Simpanan Wajib &amp; Sukarela
          </p>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">Loading...</div>
        ) : error ? (
          <div className="px-5 py-12 text-center text-sm text-red-500">{error}</div>
        ) : data?.results.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">
            Tidak ada transaksi pending saat ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Member ID</th>
                  <th className="px-5 py-3">Savings Type</th>
                  <th className="px-5 py-3">Amount (Rp)</th>
                  <th className="px-5 py-3">Date Submitted</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {data?.results.map((item) => (
                  <tr key={item.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                    <td className="px-5 py-4 font-semibold text-zinc-900">{item.member_name}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-zinc-500">{item.member_id ?? "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.saving_type === "MANDATORY"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {TYPE_LABEL[item.saving_type]}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-zinc-800">{formatRupiah(item.amount)}</td>
                    <td className="px-5 py-4 text-zinc-600">
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Pending Verification
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/verifications/deposits/${item.id}`}
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
                      >
                        Verifikasi Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-sm text-zinc-500">
            <p>Showing {data.results.length} of {data.count} entries</p>
            <div className="flex gap-2">
              <button
                disabled={!data.previous}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="grid place-items-center rounded-md border border-zinc-900 bg-zinc-900 px-3 py-1 text-white">
                {page}
              </span>
              <button
                disabled={!data.next}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}