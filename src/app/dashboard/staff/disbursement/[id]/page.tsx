'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { getLoanDetail, LoanDetail, disburseLoans } from '@/lib/staff-api'
import DisbursementDetailContent from './_components/DisbursementDetailContent'
import toast from 'react-hot-toast'
import { Loader } from 'lucide-react'

// ── Icons ──────────────────────────────────────────────────────────────────
const BackIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
)

export default function DisbursementDetailPage() {
  const router = useRouter()
  const params = useParams()
  const loanId = params.id as string

  const [loanDetail, setLoanDetail] = useState<LoanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [disbursing, setDisbursing] = useState(false)

  useEffect(() => {
    if (loanId) fetchLoanDetail()
  }, [loanId])

  const fetchLoanDetail = async () => {
    try {
      setLoading(true)
      const detail = await getLoanDetail(parseInt(loanId, 10))
      setLoanDetail(detail)
    } catch {
      toast.error('Gagal memuat detail pinjaman')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDisbursement = async (proof?: File) => {
    try {
      setDisbursing(true)
      const formData = new FormData()
      if (proof) formData.append('disbursement_proof', proof)
      await disburseLoans(parseInt(loanId, 10), formData)
      toast.success('Pinjaman berhasil dicairkan!')
      setTimeout(() => router.push('/dashboard/staff/disbursement?tab=history'), 1000)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Gagal melakukan pencairan')
    } finally {
      setDisbursing(false)
    }
  }

  return (
    <DashboardLayout role="STAFF" userName="Petugas" userID="STAFF-001">
      <DashboardHeader
        variant="default"
        title="Kelola Pencairan Pinjaman"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-8">

        {/* Content */}
        <div style={{ background: '#F5F6FA', minHeight: 'calc(100vh - 180px)', marginLeft: -32, marginRight: -32, marginBottom: -32, paddingLeft: 32, paddingRight: 32, paddingTop: 0, paddingBottom: 32 }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '60vh',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <Loader
                style={{
                  width: 32,
                  height: 32,
                  color: '#3B7DFF',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p style={{ color: '#8A9BB0', fontSize: 14 }}>Memuat detail pinjaman...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : loanDetail ? (
            <DisbursementDetailContent
              loanDetail={loanDetail}
              onConfirm={handleConfirmDisbursement}
              onCancel={() => router.back()}
              loading={disbursing}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '60vh',
              }}
            >
              <p style={{ color: '#8A9BB0' }}>Tidak dapat memuat detail pinjaman</p>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  )
}