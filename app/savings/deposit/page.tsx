"use client";

import { FormEvent, useEffect, useState } from "react";

import api from "@/lib/axios";
import { isAuthenticated } from "@/lib/auth";

type MemberStatus = "VERIFIED" | "ACTIVE" | "PENDING" | "REJECTED";
type SavingType = "POKOK" | "WAJIB" | "SUKARELA";

type BankAccount = {
  bank_name: string;
  account_number: string;
  account_holder: string;
  qr_code_url: string;
};

type OverviewResponse = {
  member_status: MemberStatus;
  bank_account: BankAccount | null;
};

export default function DepositPage() {
  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [savingType, setSavingType] = useState<SavingType>("POKOK");
  const [amount, setAmount] = useState("150000");
  const [memberBankName, setMemberBankName] = useState("");
  const [memberAccountNumber, setMemberAccountNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchOverview = async () => {
      if (!isAuthenticated()) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await api.get<OverviewResponse>("/savings/overview/");
        setMemberStatus(response.data.member_status);
        setBankAccount(response.data.bank_account);
      } catch {
        setError("Gagal mengambil status anggota.");
      }
    };

    fetchOverview();
  }, []);

  useEffect(() => {
    if (memberStatus === "VERIFIED") {
      setSavingType("POKOK");
      setAmount("150000");
      return;
    }

    if (memberStatus === "ACTIVE" && savingType === "POKOK") {
      setSavingType("WAJIB");
      setAmount("100000");
    }
  }, [memberStatus, savingType]);

  useEffect(() => {
    if (savingType === "WAJIB") {
      setAmount("100000");
    }
  }, [savingType]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!proofFile) {
      setError("Bukti transfer wajib diupload.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("transfer_proof", proofFile);
    formData.append("member_bank_name", memberBankName);
    formData.append("member_account_number", memberAccountNumber);

    try {
      if (memberStatus === "VERIFIED") {
        await api.post("/savings/deposits/pokok/", formData);
      } else {
        formData.append("saving_type", savingType);
        formData.append("amount", amount);
        await api.post("/savings/deposits/", formData);
      }

      setMessage("Setoran berhasil dikirim dan menunggu verifikasi petugas.");
      setProofFile(null);
      setMemberBankName("");
      setMemberAccountNumber("");
      if (savingType === "SUKARELA") {
        setAmount("");
      }
    } catch {
      setError("Gagal mengirim setoran. Periksa input kamu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-[44px] font-bold leading-tight text-zinc-900">Member Deposit Form</h1>
        <p className="mt-1 text-zinc-500">Please follow the instructions below to submit your deposit proof. Our team will verify your transaction within 24 hours.</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Bank Account Information</p>
        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1fr_110px]">
          <div>
            <p className="text-xs text-zinc-400">Bank Name</p>
            <p className="text-[30px] font-bold leading-tight text-zinc-900">{bankAccount?.bank_name ?? "-"}</p>

            <p className="mt-5 text-xs text-zinc-400">Account Number</p>
            <p className="text-[34px] font-bold leading-tight text-zinc-900">{bankAccount?.account_number ?? "-"}</p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">Account Holder</p>
            <p className="text-2xl font-bold leading-tight text-zinc-900">{bankAccount?.account_holder ?? "-"}</p>
            <button
              type="button"
              className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-600"
              onClick={() => navigator.clipboard.writeText(`${bankAccount?.bank_name ?? ""} - ${bankAccount?.account_number ?? ""}`)}
            >
              ▣ Copy Details
            </button>
          </div>

          <div className="grid h-[110px] place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-300">▩</div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-800">Transaction Details</div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Jenis Simpanan (Savings Type)</label>
              <select
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                value={savingType}
                onChange={(event) => setSavingType(event.target.value as SavingType)}
                disabled={memberStatus === "VERIFIED"}
              >
                {memberStatus === "VERIFIED" ? (
                  <option value="POKOK">Simpanan Pokok</option>
                ) : (
                  <>
                    <option value="WAJIB">Wajib</option>
                    <option value="SUKARELA">Sukarela</option>
                  </>
                )}
              </select>
              <p className="mt-1 text-xs text-zinc-400">Choose &apos;Wajib&apos; for monthly mandatory savings.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Jumlah Setoran (Amount)</label>
              <input
                type="number"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={savingType === "WAJIB" || savingType === "POKOK"}
                min={1}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Nama Bank Anggota</label>
              <input
                type="text"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={memberBankName}
                onChange={(event) => setMemberBankName(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Nomor Rekening Anggota</label>
              <input
                type="text"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={memberAccountNumber}
                onChange={(event) => setMemberAccountNumber(event.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-zinc-700">Bukti Transfer (Transfer Proof)</label>
            <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center">
              <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-500">☁</span>
              <span className="text-sm font-medium text-zinc-700">Click to upload or drag and drop</span>
              <span className="text-xs text-zinc-400">PNG, JPG or PDF (Max 2MB)</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                className="hidden"
                required
              />
            </label>
          </div>

          <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
            ⓘ Note: Please ensure that the transfer amount matches the value entered in the form. Incorrect data may lead to processing delays.
          </div>

          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isSubmitting ? "Mengirim..." : "Submit Setoran ▷"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
