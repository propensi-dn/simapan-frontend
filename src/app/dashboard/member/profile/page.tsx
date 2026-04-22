'use client'

import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'
import Button from '@/components/ui/Button'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import { User, Smartphone, MapPin, CreditCard, Lock, Camera } from 'lucide-react'

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
  phone_number: string
  home_address: string
  gender: string
  place_of_birth: string
  date_of_birth: string
  profile_picture: string | null
  bank_accounts: BankAccount[]
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<MemberProfile | null>(null)
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/members/profile/')
        setProfile(res.data)
      } catch (err) {
        console.error("Gagal memuat profil", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('phone_number', profile.phone_number || '')
      formData.append('home_address', profile.home_address || '')

      if (selectedProfilePicture) {
        formData.append('profile_picture', selectedProfilePicture)
      }

      const res = await api.patch('/members/profile/', formData)

      setProfile(res.data)
      setSelectedProfilePicture(null)
      setProfilePreviewUrl(null)
      setProfileImageVersion((prev) => prev + 1)
      toast.success('Profil berhasil diperbarui')
    } catch (err) {
      console.error('Gagal menyimpan profil', err)
      toast.error('Gagal menyimpan profil')
    } finally {
      setSaving(false)
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

  return (
    <DashboardLayout
      role="MEMBER"
      userName={profile?.full_name || 'Member'}
      userID={memberIdLabel}
      avatarUrl={profile?.profile_picture || undefined}
    >
      <DashboardHeader
        variant="default"
        title="Profil Anggota"
        notifCount={2}
      />

      <main className="flex-1 p-8">
        {loading ? (
          <div className="h-[60vh] flex items-center justify-center font-bold text-primary-950">Loading Profile...</div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <header className="mb-10">
              <h1 className="text-h3 font-bold text-text-primary">Profil Anggota</h1>
              <div className="w-12 h-1 bg-secondary-500 rounded-full mt-2"></div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* --- LEFT COLUMN: AVATAR & QUICK ACTIONS --- */}
              <div className="lg:col-span-1 space-y-8">
                <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm text-center">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="relative w-full h-full rounded-[32px] overflow-hidden border-4 border-bg shadow-inner">
                      {profilePreviewUrl ? (
                        <Image
                          src={profilePreviewUrl}
                          alt="Avatar"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <Image
                          src={profile?.profile_picture ? `${profile.profile_picture}${profile.profile_picture.includes('?') ? '&' : '?'}v=${profileImageVersion}` : "/images/avatar-placeholder.png"}
                          alt="Avatar"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary-500 text-primary-950 rounded-xl flex items-center justify-center shadow-lg border-2 border-white hover:bg-secondary-400 transition-all"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                  
                  <h2 className="text-h4 font-bold text-text-primary mb-1">{profile?.full_name}</h2>
                  <p className="text-p3 font-bold text-text-tertiary mb-4 tracking-tight">
                    {memberIdLabel}
                  </p>
                  <span className="px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-green-100">
                    Active Member
                  </span>

                  <div className="mt-8 pt-8 border-t border-gray-50 space-y-3">
                    <Link href="/dashboard/member/profile/change-password">
                      <Button className="w-full bg-primary-950 text-white hover:bg-primary-800 rounded-xl flex items-center justify-center gap-2">
                        <Lock size={16} /> Ubah Kata Sandi
                      </Button>
                    </Link>
                  </div>
                </section>
              </div>

              {/* --- RIGHT COLUMN: DETAILED INFO --- */}
              <div className="lg:col-span-2 space-y-8">
                {/* Informasi Pribadi */}
                <section className="bg-white rounded-[32px] p-8 md:p-10 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <User className="text-secondary-500" size={20} />
                    <h3 className="text-p2 font-bold uppercase tracking-[0.2em] text-text-tertiary">Informasi Pribadi</h3>
                  </div>

                  {/* 2. PENAMBAHAN FIELD DI SINI */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Member ID</label>
                      <input type="text" value={profile?.member_id || 'No Member ID'} disabled className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-text-secondary font-medium cursor-not-allowed opacity-70" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">NIK (Identity Number)</label>
                      <input type="text" value={profile?.nik} disabled className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-text-secondary font-medium cursor-not-allowed opacity-70" />
                    </div>
                    
                    {/* Data Demografi (Disabled karena diatur via registrasi awal) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Jenis Kelamin</label>
                      <input type="text" value={formatGender(profile?.gender || '')} disabled className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-text-secondary font-medium cursor-not-allowed opacity-70" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Tempat Lahir</label>
                      <input type="text" value={profile?.place_of_birth || '-'} disabled className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-text-secondary font-medium cursor-not-allowed opacity-70" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Tanggal Lahir</label>
                      <input type="date" value={profile?.date_of_birth || ''} disabled className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-text-secondary font-medium cursor-not-allowed opacity-70" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Email Address</label>
                      <input type="email" value={profile?.email} disabled className="w-full p-4 bg-bg border border-gray-100 rounded-2xl text-text-secondary font-medium cursor-not-allowed opacity-70" />
                    </div>

                    {/* Data Kontak (Bisa Diedit) */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Nomor Telepon</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                        <input type="text" value={profile?.phone_number || ''} className="w-full p-4 pl-12 bg-white border border-gray-100 rounded-2xl text-text-primary focus:ring-2 focus:ring-secondary-100 transition-all outline-none" onChange={(e) => setProfile((prev) => ({ ...prev, phone_number: e.target.value } as MemberProfile))} />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Alamat Rumah</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                        <input type="text" value={profile?.home_address || ''} className="w-full p-4 pl-12 bg-white border border-gray-100 rounded-2xl text-text-primary focus:ring-2 focus:ring-secondary-100 transition-all outline-none" onChange={(e) => setProfile((prev) => ({ ...prev, home_address: e.target.value } as MemberProfile))} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-secondary-500 text-primary-950 hover:bg-secondary-400 px-10 rounded-2xl font-bold shadow-lg shadow-secondary-500/20"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </section>

                {/* Informasi Bank */}
                <section className="bg-white rounded-[32px] p-8 md:p-10 border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <CreditCard className="text-secondary-500" size={20} />
                      <h3 className="text-p2 font-bold uppercase tracking-[0.2em] text-text-tertiary">Rekening Bank</h3>
                    </div>
                    <Button
                      onClick={() => setShowBankForm((prev) => !prev)}
                      variant="outline"
                      size="sm"
                      className="text-[10px] uppercase font-bold border-gray-200 text-text-secondary hover:bg-bg"
                    >
                      {showBankForm ? 'Tutup' : '+ Tambah'}
                    </Button>
                  </div>

                  {showBankForm && (
                    <div className="mb-6 p-6 bg-bg border border-gray-100 rounded-[24px]">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Nama Bank</label>
                          <input
                            type="text"
                            value={bankForm.bank_name}
                            onChange={(e) => setBankForm((prev) => ({ ...prev, bank_name: e.target.value }))}
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-text-primary focus:ring-2 focus:ring-secondary-100 transition-all outline-none"
                            placeholder="Masukkan nama bank"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Nomor Rekening</label>
                          <input
                            type="text"
                            value={bankForm.account_number}
                            onChange={(e) => setBankForm((prev) => ({ ...prev, account_number: e.target.value }))}
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-text-primary focus:ring-2 focus:ring-secondary-100 transition-all outline-none"
                            placeholder="Masukkan nomor rekening"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Nama Pemilik Rekening</label>
                          <input
                            type="text"
                            value={bankForm.account_holder}
                            onChange={(e) => setBankForm((prev) => ({ ...prev, account_holder: e.target.value }))}
                            className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-text-primary focus:ring-2 focus:ring-secondary-100 transition-all outline-none"
                            placeholder="Nama sesuai rekening"
                          />
                        </div>
                      </div>

                      <label className="mt-4 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bankForm.is_primary}
                          onChange={(e) => setBankForm((prev) => ({ ...prev, is_primary: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-text-secondary font-medium">Jadikan rekening utama</span>
                      </label>

                      <div className="mt-6 flex justify-end gap-3">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowBankForm(false)
                            setBankForm({
                              bank_name: '',
                              account_number: '',
                              account_holder: '',
                              is_primary: false,
                            })
                          }}
                        >
                          Batal
                        </Button>
                        <Button onClick={handleAddBankAccount} loading={addingBank}>
                          Simpan Rekening
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {profile?.bank_accounts?.length ? (
                    profile.bank_accounts.map((account: BankAccount) => (
                      <div key={account.id} className="p-6 bg-bg border border-gray-50 rounded-[24px] mb-4 last:mb-0">
                        {editingBankId === account.id ? (
                          <div className="w-full space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Nama Bank</label>
                                <input
                                  type="text"
                                  value={editBankForm.bank_name}
                                  onChange={(e) => setEditBankForm((prev) => ({ ...prev, bank_name: e.target.value }))}
                                  className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-text-primary focus:ring-2 focus:ring-secondary-100 transition-all outline-none"
                                  placeholder="Masukkan nama bank"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Nomor Rekening</label>
                                <input
                                  type="text"
                                  value={editBankForm.account_number}
                                  onChange={(e) => setEditBankForm((prev) => ({ ...prev, account_number: e.target.value }))}
                                  className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-text-primary focus:ring-2 focus:ring-secondary-100 transition-all outline-none"
                                />
                              </div>
                              <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-bold uppercase text-text-tertiary tracking-widest">Nama Pemilik Rekening</label>
                                <input
                                  type="text"
                                  value={editBankForm.account_holder}
                                  onChange={(e) => setEditBankForm((prev) => ({ ...prev, account_holder: e.target.value }))}
                                  className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-text-primary focus:ring-2 focus:ring-secondary-100 transition-all outline-none"
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
                                className="w-4 h-4 rounded border-gray-300 disabled:cursor-not-allowed"
                              />
                              <span className="text-sm text-text-secondary font-medium">Jadikan rekening utama</span>
                            </label>

                            <div className="flex justify-end gap-3">
                              <Button variant="ghost" onClick={cancelEditBankAccount}>Batal</Button>
                              <Button onClick={() => handleUpdateBankAccount(account.id)} loading={updatingBankId === account.id}>
                                Simpan
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center">
                            <div className="md:col-span-3 text-left">
                              <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Nama Bank</p>
                              <p className="text-p3 font-bold text-text-primary">{account.bank_name}</p>
                            </div>
                            <div className="md:col-span-3 text-left">
                              <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Nomor Rekening</p>
                              <p className="text-p3 font-bold text-text-primary">{account.account_number}</p>
                            </div>
                            <div className="md:col-span-2 flex md:justify-start">
                              {account.is_primary && (
                                <span className="px-4 py-1.5 bg-primary-950 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest">Utama</span>
                              )}
                            </div>
                            <div className="md:col-span-4 flex items-center gap-2 md:justify-end">
                              <Button variant="ghost" size="sm" onClick={() => startEditBankAccount(account)}>Edit</Button>
                              <Button variant="danger" size="sm" onClick={() => handleDeleteBankAccount(account.id)} loading={deletingBankId === account.id}>Hapus</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 bg-bg border border-gray-50 rounded-[24px] text-center text-text-tertiary font-medium">
                      Belum ada rekening bank.
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}