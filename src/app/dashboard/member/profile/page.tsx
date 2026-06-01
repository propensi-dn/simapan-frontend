'use client'

import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import { User, Smartphone, MapPin, CreditCard, Lock, Camera, X, AlertTriangle } from 'lucide-react'

type BankAccount = {
  id: number
  bank_name: string
  account_number: string
  account_holder: string
  is_primary: boolean
}

// 1. TAMBAH TIPE DATA DI SINI
type MemberProfile = {
  member_id: string | null
  full_name: string
  nik: string
  email: string
  occupation: string
  phone_number: string
  home_address: string
  gender: string
  place_of_birth: string
  date_of_birth: string
  profile_picture: string | null
  bank_accounts: BankAccount[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [initialProfile, setInitialProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingBank, setAddingBank] = useState(false)
  const [updatingBankId, setUpdatingBankId] = useState<number | null>(null)
  const [deletingBankId, setDeletingBankId] = useState<number | null>(null)
  const [editingBankId, setEditingBankId] = useState<number | null>(null)
  const [showBankForm, setShowBankForm] = useState(false)
  const [profileImageVersion, setProfileImageVersion] = useState(0)
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null)
  const [bankForm, setBankForm] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
    is_primary: false,
  })
  const [editBankForm, setEditBankForm] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
    is_primary: false,
  })
  const [selectedProfilePicture, setSelectedProfilePicture] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const memberIdLabel = profile?.member_id ? `#${profile.member_id}` : 'No Member ID'
  const statusLabel = profile?.member_id ? 'Aktif' : 'Belum Aktif'
  const statusTone = profile?.member_id ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'

  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null)

  const isDirty = !!(profile && initialProfile && (
    profile.occupation !== initialProfile.occupation ||
    profile.phone_number !== initialProfile.phone_number ||
    profile.home_address !== initialProfile.home_address ||
    selectedProfilePicture !== null
  ))

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/members/profile/')
        setProfile(res.data)
        setInitialProfile(res.data)
      } catch (err) {
        console.error("Gagal memuat profil", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // Intercept native browser close/reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  // Intercept client-side Next.js route transitions
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirty) return

      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (anchor) {
        const href = anchor.getAttribute('href')
        if (href && (href.startsWith('/') || href.startsWith(window.location.origin)) && !href.startsWith('#')) {
          e.preventDefault()
          e.stopPropagation()
          setPendingNavigationUrl(href)
          setShowUnsavedModal(true)
        }
      }
    }

    document.addEventListener('click', handleAnchorClick, true)
    return () => {
      document.removeEventListener('click', handleAnchorClick, true)
    }
  }, [isDirty])

  const handleSaveProfile = async () => {
    if (!profile) return false

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('phone_number', profile.phone_number || '')
      formData.append('home_address', profile.home_address || '')
      formData.append('occupation', profile.occupation || '')

      if (selectedProfilePicture) {
        formData.append('profile_picture', selectedProfilePicture)
      }

      const res = await api.patch('/members/profile/', formData)

      setProfile(res.data)
      setInitialProfile(res.data)
      setSelectedProfilePicture(null)
      setProfilePreviewUrl(null)
      setProfileImageVersion((prev) => prev + 1)
      toast.success('Profil berhasil diperbarui')
      return true
    } catch (err) {
      console.error('Gagal menyimpan profil', err)
      toast.error('Gagal menyimpan profil')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleCancelLeave = () => {
    setShowUnsavedModal(false)
    setPendingNavigationUrl(null)
  }

  const handleDiscardAndLeave = () => {
    setProfile(initialProfile)
    setSelectedProfilePicture(null)
    setProfilePreviewUrl(null)
    setShowUnsavedModal(false)
    if (pendingNavigationUrl) {
      router.push(pendingNavigationUrl)
    }
  }

  const handleSaveAndLeave = async () => {
    const success = await handleSaveProfile()
    if (success) {
      setShowUnsavedModal(false)
      if (pendingNavigationUrl) {
        router.push(pendingNavigationUrl)
      }
    }
  }

  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    setSelectedProfilePicture(file)
    setProfilePreviewUrl(previewUrl)
    setProfile((prev) => ({
      ...prev,
      profile_picture: previewUrl,
    } as MemberProfile))
  }

  const handleAddBankAccount = async () => {
    const bank_name = bankForm.bank_name.trim()
    const account_number = bankForm.account_number.trim()
    const account_holder = bankForm.account_holder.trim()
    const is_primary = bankForm.is_primary

    if (!bank_name || !account_number || !account_holder) {
      toast.error('Semua field rekening wajib diisi')
      return
    }

    setAddingBank(true)
    try {
      const res = await api.post('/members/bank-accounts/', {
        bank_name,
        account_number,
        account_holder,
        is_primary,
      })

      setProfile((prev) => {
        if (!prev) return prev

        const currentAccounts = prev?.bank_accounts || []
        let updatedAccounts = currentAccounts

        if (res.data.is_primary) {
          updatedAccounts = currentAccounts.map((account: BankAccount) => ({
            ...account,
            is_primary: false,
          }))
        }

        return {
          ...prev,
          bank_accounts: [...updatedAccounts, res.data as BankAccount],
        }
      })

      setBankForm({
        bank_name: '',
        account_number: '',
        account_holder: '',
        is_primary: false,
      })
      setShowBankForm(false)
      toast.success('Rekening bank berhasil ditambahkan')
    } catch (err) {
      console.error('Gagal menambah rekening bank', err)
      toast.error('Gagal menambah rekening bank')
    } finally {
      setAddingBank(false)
    }
  }

  const startEditBankAccount = (account: BankAccount) => {
    setEditingBankId(account.id)
    setEditBankForm({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_holder: account.account_holder,
      is_primary: account.is_primary,
    })
  }

  const cancelEditBankAccount = () => {
    setEditingBankId(null)
    setEditBankForm({
      bank_name: '',
      account_number: '',
      account_holder: '',
      is_primary: false,
    })
  }

  const handleUpdateBankAccount = async (accountId: number) => {
    const bank_name = editBankForm.bank_name.trim()
    const account_number = editBankForm.account_number.trim()
    const account_holder = editBankForm.account_holder.trim()

    if (!bank_name || !account_number || !account_holder) {
      toast.error('Semua field rekening wajib diisi')
      return
    }

    setUpdatingBankId(accountId)
    try {
      const res = await api.patch(`/members/bank-accounts/${accountId}/`, {
        bank_name,
        account_number,
        account_holder,
        is_primary: editBankForm.is_primary,
      })

      setProfile((prev) => {
        if (!prev) return prev

        let updatedAccounts = prev.bank_accounts.map((account) =>
          account.id === accountId ? (res.data as BankAccount) : account
        )

        if (res.data.is_primary) {
          updatedAccounts = updatedAccounts.map((account) => ({
            ...account,
            is_primary: account.id === accountId,
          }))
        }

        return {
          ...prev,
          bank_accounts: updatedAccounts,
        }
      })

      cancelEditBankAccount()
      toast.success('Rekening bank berhasil diperbarui')
    } catch (err) {
      console.error('Gagal memperbarui rekening bank', err)
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(message || 'Gagal memperbarui rekening bank')
    } finally {
      setUpdatingBankId(null)
    }
  }

  const handleDeleteBankAccount = async (accountId: number) => {
    const confirmed = window.confirm('Hapus rekening bank ini?')
    if (!confirmed) return

    setDeletingBankId(accountId)
    try {
      await api.delete(`/members/bank-accounts/${accountId}/`)

      setProfile((prev) => {
        if (!prev) return prev

        const nextAccounts = prev.bank_accounts.filter((account) => account.id !== accountId)
        if (nextAccounts.length > 0 && !nextAccounts.some((account) => account.is_primary)) {
          nextAccounts[0] = { ...nextAccounts[0], is_primary: true }
        }

        return {
          ...prev,
          bank_accounts: nextAccounts,
        }
      })

      if (editingBankId === accountId) {
        cancelEditBankAccount()
      }

      toast.success('Rekening bank berhasil dihapus')
    } catch (err) {
      console.error('Gagal menghapus rekening bank', err)
      toast.error('Gagal menghapus rekening bank')
    } finally {
      setDeletingBankId(null)
    }
  }

  // Format label gender
  const formatGender = (genderCode: string) => {
    if (genderCode === 'M') return 'Laki-Laki'
    if (genderCode === 'F') return 'Perempuan'
    return genderCode || '-'
  }

  const formatDate = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <DashboardLayout role="MEMBER">
      <DashboardHeader variant="default" title="Profil Anggota" />

      <main className="flex-1 p-6 md:p-8">
        {loading ? (
          <div className="flex h-[60vh] items-center justify-center font-bold text-primary-950">Memuat profil...</div>
        ) : (
          <div className="mx-auto max-w-7xl space-y-6">
            <section className="relative overflow-hidden rounded-4xl border border-white/70 bg-bg-card shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="absolute inset-0 bg-linear-to-br from-secondary-100 via-bg-card to-primary-100" />
              <div className="absolute -right-16 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />

              <div className="relative p-6 md:p-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center">
                    <div className="relative h-28 w-28 shrink-0 md:h-32 md:w-32">
                      <div className="relative h-full w-full overflow-hidden rounded-[28px] border-4 border-white bg-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                        {profilePreviewUrl ? (
                          <Image src={profilePreviewUrl} alt="Avatar" fill unoptimized className="object-cover" />
                        ) : (
                          <Image
                            src={profile?.profile_picture ? `${profile.profile_picture}${profile.profile_picture.includes('?') ? '&' : '?'}v=${profileImageVersion}` : '/images/avatar-placeholder.png'}
                            alt="Avatar"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePictureChange} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-white bg-secondary-500 text-primary-950 shadow-lg transition-all hover:bg-secondary-400"
                      >
                        <Camera size={18} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${statusTone}`}>
                          {statusLabel}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-bg-sections bg-bg-sections px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
                          {memberIdLabel}
                        </span>
                      </div>
                      <div>
                        <h1 className="text-3xl font-black tracking-tight text-text-primary md:text-4xl">{profile?.full_name}</h1>
                        <p className="mt-2 text-sm text-text-secondary">{profile?.occupation || 'Occupation belum diisi'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 xl:self-center">
                    <Link href="/dashboard/member/profile/change-password">
                      <Button className="rounded-2xl bg-primary-950 px-5 text-white shadow-lg shadow-primary-950/10 hover:bg-primary-800">
                        <Lock size={16} /> Ubah Kata Sandi
                      </Button>
                    </Link>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="rounded-2xl bg-secondary-500 px-5 font-bold text-primary-950 shadow-lg shadow-secondary-500/20 hover:bg-secondary-400"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-4xl border border-slate-100 bg-bg-card p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] md:p-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <User className="text-secondary-500" size={20} />
                    <h3 className="text-p2 font-black uppercase tracking-[0.22em] text-text-tertiary">Informasi Pribadi</h3>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${statusTone}`}>
                    {profile?.member_id ? 'AKTIF' : 'BELUM AKTIF'}
                  </span>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <InfoField label="NIK" value={profile?.nik} />
                  <InfoField label="Nama Lengkap" value={profile?.full_name} />
                  <InfoField label="Jenis Kelamin" value={formatGender(profile?.gender || '')} />
                  <InfoField label="Tempat Lahir" value={profile?.place_of_birth || '-'} />
                  <InfoField label="Tanggal Lahir" value={formatDate(profile?.date_of_birth)} />
                  <InfoField label="Email" value={profile?.email} />

                  <div className="space-y-2 md:col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Pekerjaan</label>
                    <input
                      type="text"
                      value={profile?.occupation || ''}
                      onChange={(e) => setProfile((prev) => ({ ...prev, occupation: e.target.value } as MemberProfile))}
                      className="input-base"
                      placeholder="Masukkan pekerjaan"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Nomor Telepon</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                      <input
                        type="text"
                        value={profile?.phone_number || ''}
                        onChange={(e) => setProfile((prev) => ({ ...prev, phone_number: e.target.value } as MemberProfile))}
                        className="input-base pl-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Alamat Rumah</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-5 text-text-tertiary" size={18} />
                      <textarea
                        value={profile?.home_address || ''}
                        onChange={(e) => setProfile((prev) => ({ ...prev, home_address: e.target.value } as MemberProfile))}
                        rows={4}
                        className="input-base min-h-30 pl-12"
                      />
                    </div>
                  </div>
                </div>
              </section>
              <div className="space-y-6">
                <section className="rounded-4xl border border-slate-100 bg-bg-card p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)] md:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="text-secondary-500" size={20} />
                      <h3 className="text-p2 font-black uppercase tracking-[0.22em] text-text-tertiary">Rekening Bank</h3>
                    </div>
                    <Button
                      onClick={() => setShowBankForm((prev) => !prev)}
                      variant="outline"
                      size="sm"
                      className="rounded-2xl border-slate-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:bg-bg"
                    >
                      {showBankForm ? 'Tutup' : '+ Tambah'}
                    </Button>
                  </div>

                  {showBankForm && (
                    <div className="mb-6 rounded-3xl border border-slate-100 bg-linear-to-br from-bg-sections to-bg-card p-5">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Nama Bank</label>
                          <input
                            type="text"
                            value={bankForm.bank_name}
                            onChange={(e) => setBankForm((prev) => ({ ...prev, bank_name: e.target.value }))}
                            className="input-base"
                            placeholder="Masukkan nama bank"
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Nomor Rekening</label>
                            <input
                              type="text"
                              value={bankForm.account_number}
                              onChange={(e) => setBankForm((prev) => ({ ...prev, account_number: e.target.value }))}
                              className="input-base"
                              placeholder="Masukkan nomor rekening"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Nama Pemilik Rekening</label>
                            <input
                              type="text"
                              value={bankForm.account_holder}
                              onChange={(e) => setBankForm((prev) => ({ ...prev, account_holder: e.target.value }))}
                              className="input-base"
                              placeholder="Nama sesuai rekening"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={bankForm.is_primary}
                            onChange={(e) => setBankForm((prev) => ({ ...prev, is_primary: e.target.checked }))}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          <span className="text-sm font-medium text-text-secondary">Jadikan rekening utama</span>
                        </label>

                        <div className="flex justify-end gap-3">
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setShowBankForm(false)
                              setBankForm({ bank_name: '', account_number: '', account_holder: '', is_primary: false })
                            }}
                          >
                            Batal
                          </Button>
                          <Button onClick={handleAddBankAccount} loading={addingBank}>
                            Simpan Rekening
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {profile?.bank_accounts?.length ? (
                    <div className="space-y-4">
                      {profile.bank_accounts.map((account: BankAccount) => (
                        <div key={account.id} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 shadow-sm">
                          {editingBankId === account.id ? (
                            <div className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Nama Bank</label>
                                  <input
                                    type="text"
                                    value={editBankForm.bank_name}
                                    onChange={(e) => setEditBankForm((prev) => ({ ...prev, bank_name: e.target.value }))}
                                    className="input-base"
                                    placeholder="Masukkan nama bank"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Nomor Rekening</label>
                                  <input
                                    type="text"
                                    value={editBankForm.account_number}
                                    onChange={(e) => setEditBankForm((prev) => ({ ...prev, account_number: e.target.value }))}
                                    className="input-base"
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Nama Pemilik Rekening</label>
                                  <input
                                    type="text"
                                    value={editBankForm.account_holder}
                                    onChange={(e) => setEditBankForm((prev) => ({ ...prev, account_holder: e.target.value }))}
                                    className="input-base"
                                  />
                                </div>
                              </div>

                              <label className={`flex items-center gap-2 ${account.is_primary ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
                                <input
                                  type="checkbox"
                                  checked={editBankForm.is_primary}
                                  disabled={account.is_primary}
                                  onChange={(e) => {
                                    if (account.is_primary && !e.target.checked) {
                                      toast.error('Harus ada minimal satu rekening utama')
                                      return
                                    }
                                    setEditBankForm((prev) => ({ ...prev, is_primary: e.target.checked }))
                                  }}
                                  className="h-4 w-4 rounded border-slate-300 disabled:cursor-not-allowed"
                                />
                                <span className="text-sm font-medium text-text-secondary">Jadikan rekening utama</span>
                              </label>

                              <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={cancelEditBankAccount}>Batal</Button>
                                <Button onClick={() => handleUpdateBankAccount(account.id)} loading={updatingBankId === account.id}>
                                  Simpan
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nama Bank</p>
                                  {account.is_primary && (
                                    <span className="inline-flex rounded-full bg-primary-950 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-white shadow-xs">
                                      Utama
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-base font-extrabold text-text-primary">{account.bank_name}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nomor Rekening</p>
                                <p className="mt-1 text-base font-extrabold text-text-primary">{account.account_number}</p>
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => startEditBankAccount(account)}>Edit</Button>
                                <Button variant="danger" size="sm" onClick={() => handleDeleteBankAccount(account.id)} loading={deletingBankId === account.id}>Hapus</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-bg-sections p-6 text-center text-text-tertiary">
                      Belum ada rekening bank.
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-4xl border border-error/20 bg-linear-to-br from-error/10 via-bg-card to-error/20 p-6 shadow-[0_16px_50px_rgba(220,38,38,0.12)] md:p-8">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-error-600 text-white shadow-lg shadow-error-600/20">
                        <Lock size={18} />
                      </div>
                      <div>
                        <h3 className="text-p2 font-black uppercase tracking-[0.22em] text-error-600">Penutupan Akun</h3>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-text-secondary">
                      Dengan mengajukan penutupan akun (resign), Anda akan kehilangan akses ke semua layanan SI-MAPAN. Proses ini bersifat permanen dan tidak dapat dibatalkan setelah disetujui oleh admin.
                    </p>

                    <div className="flex justify-end">
                      <Link href="/dashboard/member/resignations">
                        <Button className="rounded-2xl bg-error-600 px-5 text-white shadow-lg shadow-error-600/20 hover:bg-error">
                          Ajukan Penutupan
                        </Button>
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>

      <Modal
        isOpen={showUnsavedModal}
        onClose={handleCancelLeave}
        icon={<AlertTriangle size={24} className="text-text-primary" />}
        title="Perubahan Belum Disimpan"
        description="Simpan perubahan profil Anda sebelum meninggalkan halaman ini?"
        cancelLabel=""
        size="sm"
      >
        <button
          onClick={handleCancelLeave}
          className="absolute top-6 right-6 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            fullWidth
            onClick={handleDiscardAndLeave}
          >
            Abaikan
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSaveAndLeave}
            loading={saving}
          >
            Simpan
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-text-tertiary">{label}</label>
      <div className="rounded-2xl border border-slate-200 bg-bg-sections px-4 py-4 text-text-secondary shadow-sm">
        <p className="font-semibold">{value || '-'}</p>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-bg-card p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">{label}</p>
      <p className="mt-2 text-sm font-bold text-text-primary">{value}</p>
    </div>
  )
}