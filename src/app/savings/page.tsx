"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import api from "@/lib/axios";
import { isAuthenticated } from "@/lib/auth";

type SavingItem = {
  id: number;
  saving_id: string;
  transaction_id: string;
  saving_type: "POKOK" | "WAJIB" | "SUKARELA";
  amount: string;
  status: "PENDING" | "SUCCESS" | "REJECTED";
  submitted_at: string;
  transfer_proof_url?: string | null;
};

type OverviewResponse = {
  member_status: "VERIFIED" | "ACTIVE" | "PENDING" | "REJECTED";
  totals: { wajib: string; sukarela: string };
  count: number;
  next: string | null;
  previous: string | null;
  results: SavingItem[];
};

const fmtRp = (value: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value));

const STATUS_CONFIG: Record<SavingItem["status"], { bg: string; text: string; dot: string; label: string }> = {
  SUCCESS:  { bg: "#D1FAE5", text: "#065F46", dot: "#10B981", label: "Success" },
  PENDING:  { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", label: "Pending" },
  REJECTED: { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", label: "Rejected" },
};

const TYPE_CONFIG: Record<SavingItem["saving_type"], { bg: string; text: string; label: string }> = {
  POKOK:    { bg: "#F1F5F9", text: "#525E71", label: "Pokok" },
  WAJIB:    { bg: "#DBEAFE", text: "#1E40AF", label: "Wajib" },
  SUKARELA: { bg: "#EDE9FE", text: "#5B21B6", label: "Sukarela" },
};

const STATUS_FILTERS: { key: "ALL" | SavingItem["status"]; label: string }[] = [
  { key: "ALL",      label: "Semua" },
  { key: "SUCCESS",  label: "Success" },
  { key: "PENDING",  label: "Pending" },
  { key: "REJECTED", label: "Rejected" },
];

const TYPE_FILTERS: { key: "ALL" | SavingItem["saving_type"]; label: string }[] = [
  { key: "ALL",      label: "Semua Tipe" },
  { key: "POKOK",    label: "Pokok" },
  { key: "WAJIB",    label: "Wajib" },
  { key: "SUKARELA", label: "Sukarela" },
];

export default function SavingsOverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"ALL" | SavingItem["status"]>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | SavingItem["saving_type"]>("ALL");
  const [dateSortOrder, setDateSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated()) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await api.get<OverviewResponse>("/savings/overview/", {
          params: { page },
        });
        setData(response.data);
      } catch {
        setError("Gagal mengambil data simpanan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page]);

  const summaryText = useMemo(() => {
    if (!data) return "";
    if (data.member_status === "VERIFIED") {
      return "Status kamu VERIFIED. Silakan upload simpanan pokok dulu.";
    }
    return "Manage and track your mandatory and voluntary savings.";
  }, [data]);

  const visibleTransactions = useMemo(() => {
    if (!data) return [];

    const filtered = data.results.filter((item) => {
      const statusMatch = statusFilter === "ALL" || item.status === statusFilter;
      const typeMatch = typeFilter === "ALL" || item.saving_type === typeFilter;
      return statusMatch && typeMatch;
    });

    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.submitted_at).getTime();
      const bTime = new Date(b.submitted_at).getTime();
      return dateSortOrder === "desc" ? bTime - aTime : aTime - bTime;
    });
  }, [data, statusFilter, typeFilter, dateSortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "#11447D", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm py-8 text-center" style={{ color: "#EF4444", fontFamily: "Inter, sans-serif" }}>
        {error}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl mb-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#242F43" }}>
            Savings Overview
          </h2>
          <p className="text-sm" style={{ color: "#8E99A8", fontFamily: "Inter, sans-serif" }}>
            {summaryText}
          </p>
        </div>
        <Link
          href="/savings/deposit"
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ backgroundColor: "#242F43", color: "#fff", fontFamily: "Montserrat, sans-serif" }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Setoran
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-6 flex flex-col gap-2" style={{ border: "1px solid #F1F5F9" }}>
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#8E99A8", fontFamily: "Inter, sans-serif" }}>
            Total Simpanan Wajib
          </p>
          <p className="font-bold text-2xl" style={{ fontFamily: "Montserrat, sans-serif", color: "#242F43" }}>
            {fmtRp(data.totals.wajib)}
          </p>
          <p className="text-xs" style={{ color: "#8E99A8", fontFamily: "Inter, sans-serif" }}>
            *Wajib dibayarkan setiap awal bulan
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 flex flex-col gap-2" style={{ border: "1px solid #F1F5F9" }}>
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#8E99A8", fontFamily: "Inter, sans-serif" }}>
            Total Simpanan Sukarela
          </p>
          <p className="font-bold text-2xl" style={{ fontFamily: "Montserrat, sans-serif", color: "#242F43" }}>
            {fmtRp(data.totals.sukarela)}
          </p>
          <p className="text-xs" style={{ color: "#8E99A8", fontFamily: "Inter, sans-serif" }}>
            *Dapat disetorkan kapan saja secara fleksibel
          </p>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #F1F5F9" }}>

        {/* Toolbar */}
        <div className="px-6 py-3 flex flex-wrap items-center gap-3" style={{ borderBottom: "1px solid #F1F5F9" }}>
          
          {/* Status pill filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="px-3 py-1.5 rounded-lg text-xs" style={{ fontFamily: "Montserrat, sans-serif", color: "#242F43" }}>
              Status Transaksi
            </p>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: statusFilter === f.key ? "#242F43" : "#F1F5F9",
                  color: statusFilter === f.key ? "#fff" : "#525E71",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px" style={{ backgroundColor: "#E5E7EB" }} />

          {/* Type pill filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="px-3 py-1.5 rounded-lg text-xs" style={{ fontFamily: "Montserrat, sans-serif", color: "#242F43" }}>
              Jenis Simpanan
            </p>
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setTypeFilter(f.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: typeFilter === f.key ? "#11447D" : "#F1F5F9",
                  color: typeFilter === f.key ? "#fff" : "#525E71",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs" style={{ color: "#B0BAC5", fontFamily: "Inter, sans-serif" }}>
            {visibleTransactions.length} transaksi
          </span>
        </div>

        {/* Table */}
        {visibleTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: "#8E99A8", fontFamily: "Inter, sans-serif" }}>
              {data.results.length === 0
                ? "Belum ada transaksi simpanan."
                : "Tidak ada transaksi yang sesuai filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: "#8E99A8", fontFamily: "Inter, sans-serif" }}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => setDateSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                    >
                      DATE {dateSortOrder === "desc" ? "↓" : "↑"}
                    </button>
                  </th>
                  {["TYPE", "AMOUNT", "STATUS", "ACTION"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: "#8E99A8", fontFamily: "Inter, sans-serif" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTransactions.map((item, i) => {
                  const st = STATUS_CONFIG[item.status];
                  const ty = TYPE_CONFIG[item.saving_type];
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#FAFAFA] transition-colors"
                      style={{ borderBottom: i < visibleTransactions.length - 1 ? "1px solid #F8FAFC" : "none" }}
                    >
                      <td className="px-5 py-4 text-sm" style={{ color: "#8E99A8", fontFamily: "Inter, sans-serif" }}>
                        {new Date(item.submitted_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md"
                          style={{ backgroundColor: ty.bg, color: ty.text, fontFamily: "Inter, sans-serif" }}
                        >
                          {ty.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-sm" style={{ color: "#242F43", fontFamily: "Montserrat, sans-serif" }}>
                          {fmtRp(item.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md"
                          style={{ backgroundColor: st.bg, color: st.text, fontFamily: "Inter, sans-serif" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.dot }} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {item.transfer_proof_url ? (
                          <a
                            href={item.transfer_proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-bold transition-opacity hover:opacity-60"
                            style={{ color: "#11447D", fontFamily: "Inter, sans-serif" }}
                          >
                            Lihat Bukti →
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: "#B0BAC5" }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ borderTop: "1px solid #F1F5F9" }}
        >
          <p className="text-xs" style={{ color: "#B0BAC5", fontFamily: "Inter, sans-serif" }}>
            Showing {visibleTransactions.length} of {data.count} transactions
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!data.previous}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{ border: "1px solid #E5E7EB", color: "#525E71", fontFamily: "Inter, sans-serif" }}
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!data.next}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: "#242F43", color: "#fff", fontFamily: "Inter, sans-serif" }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
