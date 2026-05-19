'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import { getLoanDetail, LoanDetail, disburseLoans } from '@/lib/staff-api'
import DisbursementDetailContent from './_components/DisbursementDetailContent'
import toast from 'react-hot-toast'
import { Loader, ChevronLeft } from 'lucide-react'
import { getUserName, getUserID } from '@/lib/auth'

export default function DisbursementDetailPage() {
  const router = useRouter()
  const params = useParams()
  const loanId = params.id as string

  const [loanDetail, setLoanDetail] = useState<LoanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [disbursing, setDisbursing] = useState(false)
  const [userName, setUserName] = useState<string | undefined>()
  const [userID, setUserID] = useState<string | undefined>()

  useEffect(() => {
    setUserName(getUserName() || 'Petugas')
    setUserID(getUserID() || 'STAFF-001')
  }, [])

  useEffect(() => {
    if (!loanId) return
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
    fetchLoanDetail()
  }, [loanId, router])

  const handleConfirmDisbursement = async (proof?: File) => {
    try {
      setDisbursing(true)
      const formData = new FormData()
      if (proof) formData.append('disbursement_proof', proof)
      await disburseLoans(parseInt(loanId, 10), formData)
      toast.success('Pinjaman berhasil dicairkan!')
      setTimeout(() => router.push('/dashboard/staff/disbursement'), 1000)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string }
      toast.error(err?.response?.data?.message || err?.message || 'Gagal melakukan pencairan')
    } finally {
      setDisbursing(false)
    }
  }

  return (
    <DashboardLayout role="STAFF" userName={userName} userID={userID}>
      <DashboardHeader
        variant="default"
        title="Manajemen Pencairan"
        notifCount={0}
        notifHref="/dashboard/staff/notifications"
      />

      <main className="flex-1 p-6 md:p-8 space-y-6 min-h-screen" style={{ background: '#F8FAFC' }}>

        {/* Back + Page Header */}
        <div>
          <Link
            href="/dashboard/staff/disbursement"
            className="inline-flex items-center gap-1 text-sm font-semibold mb-4 transition-opacity hover:opacity-70"
            style={{ color: '#525E71', fontFamily: 'Inter, sans-serif' }}
          >
            <ChevronLeft size={16} />
            Kembali ke Daftar Pencairan
          </Link>

          {!loading && loanDetail && (
            <>
              <h2
                className="font-bold text-2xl mb-1"
                style={{ fontFamily: 'Montserrat, sans-serif', color: '#242F43' }}
              >
                Konfirmasi Pencairan #{loanDetail.loan_number}
              </h2>
              <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
                Tinjau ringkasan pinjaman dan jadwal angsuran, lalu unggah bukti transfer untuk menyelesaikan proses pencairan.
              </p>
            </>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader size={28} className="text-[#94A3B8] animate-spin" />
            <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Memuat detail pinjaman...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : loanDetail ? (
          <DisbursementDetailContent
            loanDetail={loanDetail}
            onConfirm={handleConfirmDisbursement}
            onCancel={() => router.push('/dashboard/staff/disbursement')}
            loading={disbursing}
          />
        ) : (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm" style={{ color: '#8E99A8', fontFamily: 'Inter, sans-serif' }}>
              Tidak dapat memuat detail pinjaman.
            </p>
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}
