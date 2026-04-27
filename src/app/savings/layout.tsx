"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";
import api from "@/lib/axios";

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
  const isDepositPage = pathname.startsWith("/savings/deposit");
  const [profile, setProfile] = useState<MemberProfile | null>(null);

  useEffect(() => {
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
    if (!profile?.member_id) return "Belum Ada ID Anggota";
    return `#${profile.member_id}`;
  }, [profile]);

  return (
    <DashboardLayout
      role="MEMBER"
      userName={profile?.full_name || "Anggota"}
      userID={memberIdLabel}
      avatarUrl={profile?.profile_picture || undefined}
    >
      {isDepositPage ? (
        <DashboardHeader
          variant="form"
          title="Form Setoran"
          backLabel="Kembali ke Ringkasan Simpanan"
          backHref="/savings"
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
