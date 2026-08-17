# ATURAN & MATRIKS HAK AKSES PENGGUNA (RBAC)
## Inventaris Jurusan Teknik Elektronika Industri (TEI) - SMK MUTU KEMLAGI

> **Password Default Sistem:** `12345`  
> Setiap pengguna dapat mengubah password mereka secara mandiri kapan saja melalui menu **Ikon Kunci (Ganti Password)** di pojok kanan atas aplikasi.

---

### 🔑 Daftar Akun Pengguna & Password

| No | Nama Pengguna | Email Akun | Password Default | Peran (*Role*) | Posisi & Wewenang |
| :-: | :--- | :--- | :---: | :---: | :--- |
| **1** | **Akbar Rayhan** | `akbarhasfi020@gmail.com` | `12345` | **Toolman** | **Petugas Utama Master Database** (Input, Edit, Kondisi Alat, Rak, Approval Usulan) |
| **2** | **Rahayu Sutarini** | `sutarinirs@gmail.com` | `12345` | **Guru** | **Pengusul Kebutuhan Praktik** (Mengajukan usulan alat/modul untuk siswa) |
| **3** | **M. Iskak Fatoni** | `iskakfatoni@gmail.com` | `12345` | **Kepala Jurusan** | **Supervisi & Audit Log** (Monitoring rekapitulasi sarpras, evaluasi, dan audit) |

---

### 🔐 Cara Mengubah Password di Dalam Aplikasi:
1. Pilih akun Anda di pojok kanan atas.
2. Klik tombol **Ikon Kunci 🔑 ("Ganti Password Akun")**.
3. Masukkan **Password Lama** (default: `12345`).
4. Masukkan **Password Baru** (minimal 5 karakter) dan ulangi pada kolom konfirmasi.
5. Klik **"Simpan Password"** ➔ Password baru otomatis tersimpan dan aktif di Cloud Firestore!

---

### 🛡️ Matriks Kewenangan Operasional

| Fitur / Aksi | 🔧 Akbar Rayhan (Toolman) | 👩‍🏫 Rahayu Sutarini (Guru) | 👔 M. Iskak Fatoni (Kajur) |
| :--- | :---: | :---: | :---: |
| **Kelola Master Inventaris (Tambah / Edit / Hapus)** | ✅ **Wewenang Penuh (Utama)** | ❌ Dibatasi *(Hanya Pengajuan)* | 🔍 Supervisi & Audit |
| **Update Kondisi Barang (Baik / Rusak / Hilang)** | ✅ **Wewenang Penuh (Utama)** | ⚠️ Melaporkan ke Toolman | 🔍 Monitoring Rekapitulasi |
| **Penataan Lokasi / Rak Simpan** | ✅ **Wewenang Penuh (Utama)** | ❌ Dilarang | 🔍 Monitoring Lokasi |
| **Review & Approval Usulan Guru** | ✅ **Wewenang Penuh (Utama)** | ❌ Dilarang | 🔍 Audit Log Riwayat Usulan |
| **Pengajuan Usulan Barang Baru** | ✅ Boleh | 📝 **Wewenang Pengusul** | 🔍 Memeriksa Kebutuhan |
| **Ganti Password Akun Sendiri** | ✅ Boleh | ✅ Boleh | ✅ Boleh |
