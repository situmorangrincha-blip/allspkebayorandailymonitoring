# TARGET QUEST — Sales Monitoring (Arjuna & Bima · malam sakura)

Upload Excel monitoring harian → dashboard dua tim. Tema retro/game dengan dua tokoh 3D low-poly (Arjuna & Bima)
di malam sakura, SFX + backsound chiptune (bisa on/off), transisi 3D, SNAP PNG, halaman GRAFIK dan Bandingkan.

## Deploy (GitHub → Vercel)
1. Push folder ini ke GitHub (folder `src`, `api`, `scripts` harus ikut sebagai folder utuh).
2. Vercel → Add New Project → import repo (Vite terdeteksi otomatis).
3. Project Vercel: **Storage → Create → Blob**, lalu **Connect** ke project (otomatis menambah `BLOB_READ_WRITE_TOKEN`).
4. **Settings → Environment Variables**:
   - `PASS_RINCHA` = password Rincha (kalau kosong, otomatis memakai `DASH_PASSWORD` yang lama)
   - `PASS_ECI` = password Bu Eci
5. Redeploy.

## Login
Tiap buka web: pilih **Rincha / Bu Eci** → password → pilih data (**Tim sendiri** atau **Keduanya**).
Tim tunggal hanya bisa dibuka pemiliknya; "Keduanya" bisa dibuka dengan password siapa saja. Kamera 3D langsung fokus ke tokoh tim yang dipilih.

## Upload harian
Satu file Excel untuk dua tim (sheet `BIMA` = tim Bima). Bulan berjalan diganti; Sep & L3M dipertahankan (kotak centang).
Tiap tim disimpan terpisah. Upload hanya menyimpan tim yang boleh disimpan dari akses itu (tim sendiri, atau keduanya kalau masuk lewat "Keduanya").

## Aturan hitung
- Timegone = hari kerja berjalan ÷ total hari kerja (Senin–Sabtu), data H-1 (WIB). Libur bisa diatur manual di modal Upload.
- **% SEP / % L3M = ACT ÷ (pembanding × timegone)**. L3M selalu rata-rata per bulan (total 3 bulan ÷ 3).
- Target total = jumlah semua kolom principal di sheet TGT (termasuk FLORA).
- Arjuna: salesman dari sheet (LOOK) RECAPT. Bima: salesman dari pivot sheet BIMA.
- Salesman tipe Yudistira (mis. Iktiar, anggota tim Bima) ACT-nya = produk Bima + produk Arjuna.
- CA = ACT toko ≥ Rp1. CA Produktif = ACT ≥ Minimum CA Prod (LAB; default retail 200rb, grosir 1jt).
- Tim tanpa sheet LAB (Bima): Pareto JKS = 30 toko terbesar per salesman berdasarkan rata-rata L3M, SAK = 30 terbesar se-tim,
  CA Produktif pakai minimum default, target per toko tidak ada (tabel memakai % vs Sep / % vs L3M).
- Kategori Fokus per tim (bisa diedit lewat "Atur daftar"). Arjuna: Chocolatos Wafer Stick, Rosta, Roasted, Dilan, Pilus, Malkist.
  Bima: RTS, GBS, MBR-B, RANS, FLORA. Kata kunci dicocokkan ke principal + brand + sub brand.
- Ukuran toko dari kata SMALL / MEDIUM / BIG / SUPERBIG di kolom CC5.

## Lokal
```
npm install
npm run dev          # tanpa backend: data di browser (IndexedDB), tanpa password
npm run test:parse   # tes parser ke Excel asli (Arjuna + Bima)
```
