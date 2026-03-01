This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Laporan Pengerjaan Individu - Karina

## Informasi Pekerja
- **Nama:** Karina
- **Role / Branch:** `feat/karina`

## Daftar Product Backlog Item (PBI) yang Dikerjakan
Saya bertanggung jawab penuh atas modul mutasi simpanan rutin (masuk), pengelolaan pembayaran angsuran kredit, serta kalkulasi estimasi keuntungan koperasi (SHU).

### 1. PBI-8: Tambah Setoran Rutin (Priority: Must Have)
- **Deskripsi:** Mengembangkan form bagi anggota untuk menyetorkan Simpanan Wajib atau Sukarela beserta upload bukti transfernya.
- **Tujuan:** Memfasilitasi anggota untuk menabung secara digital dan mandiri.

### 2. PBI-9: Lihat Riwayat Setoran Rutin (Priority: Must Have)
- **Deskripsi:** Membuat antarmuka tabel bagi anggota untuk melihat status transaksi setoran mereka (Pending/Success).
- **Tujuan:** Memberikan transparansi mutasi masuk kepada anggota.

### 3. PBI-10: Update Saldo Setoran Rutin Anggota (Priority: Must Have)
- **Deskripsi:** Mengembangkan logika validasi petugas untuk mengonfirmasi setoran yang masuk, yang akan secara otomatis menambah saldo anggota.
- **Tujuan:** Memastikan pembukuan kas masuk sinkron dengan saldo dompet pengguna.

### 4. PBI-17: Update Pembayaran Tagihan Bulanan (Priority: Must Have)
- **Deskripsi:** Mengembangkan fitur pembayaran cicilan yang memiliki logika matematis untuk memecah secara otomatis proporsi pelunasan Pokok dan pendapatan Jasa (Bunga).
- **Tujuan:** Memastikan perhitungan sisa hutang dan pencatatan laba bunga berjalan dengan sangat presisi.

### 5. PBI-23: Lihat Estimasi SHU (Priority: Should Have)
- **Deskripsi:** Membuat kalkulator dasbor yang mengagregasi seluruh pendapatan jasa pinjaman dikurangi biaya operasional untuk menghasilkan angka Sisa Hasil Usaha (SHU) sementara.
- **Tujuan:** Menampilkan gambaran profitabilitas koperasi secara *real-time*.
