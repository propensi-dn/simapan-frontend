"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import api from "@/lib/axios";
import { getUserID, getUserName } from "@/lib/auth";

type BankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
};

type MemberProfile = {
  member_id: string | null;
  full_name: string;
  profile_picture: string | null;
  bank_accounts: BankAccount[];
};

export default function SavingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDepositPage = pathname.startsWith("/savings/deposit") || pathname.startsWith("/dashboard/member/savings/deposit");
  const isWithdrawPage = pathname.startsWith("/savings/withdraw") || pathname.startsWith("/dashboard/member/savings/withdraw");
  const isFormPage = isDepositPage || isWithdrawPage;
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [authUserName, setAuthUserName] = useState<string | undefined>(undefined);
  const [authUserID, setAuthUserID] = useState<string | undefined>(undefined);

  useEffect(() => {
    setAuthUserName(getUserName());
    setAuthUserID(getUserID());

    const fetchProfile = async () => {
      try {
        const response = await api.get<MemberProfile>("/members/profile/");
        setProfile(response.data);
      } catch {
        setProfile(null);
      }
    };

    fetchProfile();
  }, []);

  const memberIdLabel = useMemo(() => {
    if (profile?.member_id) return `#${profile.member_id}`;
    if (authUserID) return authUserID.startsWith("#") ? authUserID : `#${authUserID}`;
    return "Belum Ada ID Anggota";
  }, [profile, authUserID]);

  const displayName = profile?.full_name || authUserName || "Anggota";

  return (
    <DashboardLayout
      role="MEMBER"
      userName={displayName}
      userID={memberIdLabel}
      avatarUrl={profile?.profile_picture || undefined}
    >
      {isFormPage ? (
        <DashboardHeader
          variant="form"
          title={isWithdrawPage ? "Form Penarikan" : "Form Setoran"}
          backLabel="Kembali ke Ringkasan Simpanan"
          backHref="/dashboard/member/savings"
          notifCount={2}
        />
      ) : (
        <DashboardHeader
          variant="detail"
          parentLabel="Dashboard"
          parentHref="/dashboard/member"
          currentLabel="Simpanan"
          notifCount={2}
        />
      )}

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </DashboardLayout>
  );
}
