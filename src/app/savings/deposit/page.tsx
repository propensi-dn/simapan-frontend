"use client";

<<<<<<< HEAD
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import api from "@/lib/axios";
import { isAuthenticated } from "@/lib/auth";
=======
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";

import api from "@/lib/axios";
import { isAuthenticated } from "@/lib/auth";
import Modal from "@/components/ui/Modal";
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d

type MemberStatus = "VERIFIED" | "ACTIVE" | "PENDING" | "REJECTED";
type SavingType = "POKOK" | "WAJIB" | "SUKARELA";

type BankAccount = {
<<<<<<< HEAD
  bank_name: string;
  account_number: string;
  account_holder: string;
  qr_code_url: string;
=======
  id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
};

type MemberProfile = {
  bank_accounts: BankAccount[];
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
};

type OverviewResponse = {
  member_status: MemberStatus;
<<<<<<< HEAD
  bank_account: BankAccount | null;
=======
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
};

export default function DepositPage() {
  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [savingType, setSavingType] = useState<SavingType>("POKOK");
  const [amount, setAmount] = useState("150000");
  const [memberBankName, setMemberBankName] = useState("");
  const [memberAccountNumber, setMemberAccountNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
<<<<<<< HEAD
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
=======
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const canDeposit = memberStatus === "VERIFIED" || memberStatus === "ACTIVE";
  const primaryBankAccount = bankAccount;

  useEffect(() => {
    if (!proofFile || !proofFile.type.startsWith("image/")) {
      setProofPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(proofFile);
    setProofPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [proofFile]);
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d

  useEffect(() => {
    const fetchOverview = async () => {
      if (!isAuthenticated()) {
        window.location.href = "/login";
        return;
      }

      try {
<<<<<<< HEAD
        const response = await api.get<OverviewResponse>("/savings/overview/");
        setMemberStatus(response.data.member_status);
        setBankAccount(response.data.bank_account);
=======
        const [overviewResponse, profileResponse] = await Promise.all([
          api.get<OverviewResponse>("/savings/overview/"),
          api.get<MemberProfile>("/members/profile/"),
        ]);

        setMemberStatus(overviewResponse.data.member_status);

        const profileBankAccounts = profileResponse.data.bank_accounts || [];
        const primary =
          profileBankAccounts.find((account) => account.is_primary) ||
          profileBankAccounts[0] ||
          null;

        setBankAccount(primary);
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
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

<<<<<<< HEAD
=======
  const onCopyDetails = async () => {
    if (!primaryBankAccount) {
      setError("Rekening bank anggota belum tersedia di halaman profil.");
      return;
    }

    setMemberBankName(primaryBankAccount.bank_name);
    setMemberAccountNumber(primaryBankAccount.account_number);

    const payload = `${primaryBankAccount.bank_name} - ${primaryBankAccount.account_number}`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // fallback no-op for unsupported clipboard context
    }
  };

>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

<<<<<<< HEAD
=======
    if (!canDeposit) {
      setError("Status anggota belum dapat melakukan setoran.");
      return;
    }

>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
    if (!proofFile) {
      setError("Bukti transfer wajib diupload.");
      return;
    }

<<<<<<< HEAD
=======
    if (proofFile.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.");
      return;
    }

>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
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

<<<<<<< HEAD
      setMessage("Setoran berhasil dikirim dan menunggu verifikasi petugas.");
=======
      setMessage("");
      setIsSuccessModalOpen(true);
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
      setProofFile(null);
      setMemberBankName("");
      setMemberAccountNumber("");
      if (savingType === "SUKARELA") {
        setAmount("");
      }
<<<<<<< HEAD
    } catch {
      setError("Gagal mengirim setoran. Periksa input kamu.");
=======
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage =
          (error.response?.data as { detail?: string; message?: string })?.detail ||
          (error.response?.data as { detail?: string; message?: string })?.message;
        setError(backendMessage ?? "Gagal mengirim setoran. Periksa input kamu.");
      } else {
        setError("Gagal mengirim setoran. Periksa input kamu.");
      }
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link href="/savings" className="hover:text-zinc-700">
            ← Back to Dashboard
          </Link>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-800">Deposit Form</span>
        </div>

        <h1 className="mt-5 text-[44px] font-bold leading-tight text-zinc-900">Member Deposit Form</h1>
        <p className="mt-1 text-zinc-500">Please follow the instructions below to submit your deposit proof. Our team will verify your transaction within 24 hours.</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
=======
    <>
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-6">
        <h1 className="text-[44px] font-bold leading-tight text-zinc-900">Member Deposit Form</h1>
        <p className="mt-1 text-zinc-500">Please follow the instructions below to submit your deposit proof. Our team will verify your transaction within 24 hours.</p>
        {memberStatus && !canDeposit ? (
          <p className="mt-2 text-sm text-amber-700">
            Status kamu saat ini {memberStatus}. Setoran hanya tersedia untuk status VERIFIED atau ACTIVE.
          </p>
        ) : null}
      </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Bank Account Information</p>
        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1fr_110px]">
          <div>
            <p className="text-xs text-zinc-400">Bank Name</p>
<<<<<<< HEAD
            <p className="text-[30px] font-bold leading-tight text-zinc-900">{bankAccount?.bank_name ?? "-"}</p>

            <p className="mt-5 text-xs text-zinc-400">Account Number</p>
            <p className="text-[34px] font-bold leading-tight text-zinc-900">{bankAccount?.account_number ?? "-"}</p>
=======
            <p className="text-[30px] font-bold leading-tight text-zinc-900">{primaryBankAccount?.bank_name ?? "-"}</p>

            <p className="mt-5 text-xs text-zinc-400">Account Number</p>
            <p className="text-[34px] font-bold leading-tight text-zinc-900">{primaryBankAccount?.account_number ?? "-"}</p>
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
          </div>

          <div>
            <p className="text-xs text-zinc-400">Account Holder</p>
<<<<<<< HEAD
            <p className="text-2xl font-bold leading-tight text-zinc-900">{bankAccount?.account_holder ?? "-"}</p>
            <button
              type="button"
              className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-600"
              onClick={() => navigator.clipboard.writeText(`${bankAccount?.bank_name ?? ""} - ${bankAccount?.account_number ?? ""}`)}
=======
            <p className="text-2xl font-bold leading-tight text-zinc-900">{primaryBankAccount?.account_holder ?? "-"}</p>
            <button
              type="button"
              className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-600"
              onClick={onCopyDetails}
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
            >
              ▣ Copy Details
            </button>
          </div>

          <div className="grid h-[110px] place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-300">▩</div>
        </div>
<<<<<<< HEAD
      </div>

      <form onSubmit={onSubmit} className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
=======
        </div>

        <form onSubmit={onSubmit} className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-800">Transaction Details</div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Jenis Simpanan (Savings Type)</label>
              <select
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                value={savingType}
                onChange={(event) => setSavingType(event.target.value as SavingType)}
<<<<<<< HEAD
                disabled={memberStatus === "VERIFIED"}
=======
                disabled={memberStatus === "VERIFIED" || !canDeposit}
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
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
<<<<<<< HEAD
                disabled={savingType === "WAJIB" || savingType === "POKOK"}
=======
                disabled={savingType === "WAJIB" || savingType === "POKOK" || !canDeposit}
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
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
<<<<<<< HEAD
=======
                disabled={!canDeposit}
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
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
<<<<<<< HEAD
=======
                disabled={!canDeposit}
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-zinc-700">Bukti Transfer (Transfer Proof)</label>
            <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center">
<<<<<<< HEAD
              <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-500">☁</span>
              <span className="text-sm font-medium text-zinc-700">Click to upload or drag and drop</span>
              <span className="text-xs text-zinc-400">PNG, JPG or PDF (Max 2MB)</span>
=======
              {proofPreviewUrl ? (
                <Image
                  src={proofPreviewUrl}
                  alt="Preview bukti transfer"
                  width={360}
                  height={176}
                  unoptimized
                  className="mb-3 max-h-44 w-auto rounded-lg border border-zinc-200 object-contain"
                />
              ) : (
                <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-500">☁</span>
              )}
              <span className="text-sm font-medium text-zinc-700">
                {proofFile ? "File selected. Click to change" : "Click to upload or drag and drop"}
              </span>
              <span className="text-xs text-zinc-400">
                {proofFile ? proofFile.name : "PNG, JPG or PDF (Max 5MB)"}
              </span>
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                className="hidden"
<<<<<<< HEAD
=======
                disabled={!canDeposit}
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
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
<<<<<<< HEAD
              disabled={isSubmitting}
=======
              disabled={!canDeposit || isSubmitting}
              aria-disabled={!canDeposit || isSubmitting}
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
              className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isSubmitting ? "Mengirim..." : "Submit Setoran ▷"}
            </button>
          </div>
        </div>
<<<<<<< HEAD
      </form>
    </div>
=======
        </form>
      </div>

      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
        }
        title="Simpanan berhasil disimpan"
        description="Setoran berhasil dikirim dan menunggu verifikasi petugas."
        cancelLabel="I Understand"
        size="sm"
      />
    </>
>>>>>>> d8de6f67f51419d3ee2eb9da7262d7b69555831d
  );
}
