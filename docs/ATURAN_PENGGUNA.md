# ATURAN & MATRIKS HAK AKSES PENGGUNA (RBAC)
## Inventaris Jurusan Teknik Elektronika Industri (TEI) - SMK MUTU KEMLAGI

> **Tahun Ajaran Aktif:** `2026/2027`  
> **Password Default Sistem:** `12345`

---

### 🔑 Pembagian Peran & Kewenangan Pengguna

| No | Nama Pengguna | Email Akun | Peran (*Role*) | Posisi & Wewenang Utama |
| :-: | :--- | :--- | :---: | :--- |
| **1** | **Akbar Rayhan** | `akbarhasfi020@gmail.com` | **Toolman** | **Petugas Utama Master Database:**<br>• Input, edit spesifikasi & jumlah barang<br>• Update kondisi alat (*Baik, Rusak, Hilang*) & rak<br>• **Menambah Tahun Ajaran Baru**<br>• **Eksekusi Fasilitas Migrasi Data ke TA Baru**<br>• **Import Excel & Unduh Template 14 Kolom**<br>• Review & approval usulan barang dari Guru |
| **2** | **Rahayu Sutarini** | `sutarinirs@gmail.com` | **Guru** | **Pengusul Kebutuhan Praktikum:**<br>• Mengajukan usulan alat/modul untuk praktik siswa<br>• Melihat kesiapan alat pada tahun ajaran aktif |
| **3** | **Rizky Prayoga** | `zkypra704@gmail.com` | **Guru** | **Pengusul Kebutuhan Praktikum:**<br>• Mengajukan usulan alat/modul untuk praktik siswa<br>• Melihat kesiapan alat pada tahun ajaran aktif |
| **4** | **M. Iskak Fatoni** | `iskakfatoni@gmail.com` | **Kepala Jurusan** | **Supervisi & Audit Log:**<br>• Memantau rekapitulasi kondisi alat per tahun ajaran<br>• Monitoring log riwayat usulan dan arsip tahun ajaran lampau<br>• Wewenang Tambah Barang Master & Import Excel |

---

### 📅 Manajemen Tahun Ajaran & Prosedur Migrasi Data:

1. **Tahun Ajaran Awal:** Sistem berjalan dengan Tahun Ajaran default **`2026/2027`**.
2. **Tambah Tahun Ajaran Baru:**
   - Toolman mengklik tombol **Ikon Kalender Plus 📅 ("Kelola Tahun Ajaran")** di pojok kanan atas.
   - Memasukkan format tahun ajaran baru (contoh: `2027/2028`) ➔ Klik **Tambah TA**.
3. **Fasilitas Migrasi Data (Tutup Buku / Buka TA Baru):**
   - Toolman memilih **Tahun Ajaran Asal** (misal: `2026/2027`) dan **Tahun Ajaran Tujuan** (misal: `2027/2028`).
   - Klik **"Eksekusi Migrasi Data Inventaris"**.
   - **Otomatisasi:** Sistem akan menyalin seluruh data barang, kondisi fisik terkini, dan lokasi penyimpanan dari tahun ajaran asal ke tahun ajaran baru secara utuh.
   - **Keamanan Data:** Data di tahun ajaran lama tetap tersimpan sebagai arsip historis dan dapat dibuka kapan saja melalui menu dropdown filter Tahun Ajaran di header.
