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
| **5** | **Tamu / Pengunjung** | Username: `guest`<br>(Password: `123`) | **Guest (Tamu)** | **Akses Publik Read-Only:**<br>• Hanya dapat melihat dan mencari data inventaris utama<br>• Seluruh tombol aksi/tambah/edit/usulan/hapus dinonaktifkan<br>• Diarahkan langsung ke halaman khusus `guest.html` |

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

---

### 🔄 SOP Logbook Peminjaman & Pengembalian Alat Siswa (Check-out & Check-in):

1. **Pencatatan Peminjaman Baru:**
   - Guru / Toolman membuka menu **Peminjaman Alat** di bilah navigasi kiri.
   - Klik **"Catat Peminjaman Baru"**.
   - Pilih modul/alat praktikum dari inventaris (stok tersedia tertera otomatis).
   - Masukkan identitas siswa/kelompok, kelas (contoh: `XI TEI 1`), jumlah unit, serta estimasi tanggal batas kembali.
2. **Monitoring & Status:**
   - **Dipinjam (Kuning):** Alat sedang aktif dibawa siswa untuk kegiatan praktikum.
   - **Terlambat (Merah berkedip):** Melewati tanggal batas rencana kembali dan perlu ditindaklanjuti.
   - **Selesai Kembali (Hijau):** Telah dikembalikan dan diverifikasi kondisinya oleh Toolman.
3. **Verifikasi Pengembalian (Check-in):**
   - Klik tombol **"Kembalikan"** pada baris transaksi siswa terkait.
   - Periksa kondisi fisik alat (*Baik*, *Rusak Ringan*, *Rusak Berat*, *Hilang*).
   - Jika terdapat kerusakan atau alat hilang, centang opsi sinkronisasi otomatis agar catatan kondisi barang pada master database langsung terbarui.

---

### 📸 Manajemen & Kompresi Foto Barang:

1. **Unggah Foto Cerdas (*Client-Side Compression*):**
   - Saat menambah atau mengedit barang master, klik area Dropzone Foto atau seret berkas gambar (JPG, PNG, WebP).
   - Sistem secara otomatis mengompresi foto menjadi format WebP beresolusi tinggi dengan ukuran sangat ringan (< 40 KB) sehingga hemat kuota Firestore dan cepat dimuat.
2. **Lightbox Viewer:**
   - Klik pada thumbnail foto di baris tabel inventaris untuk membuka pratinjau resolusi penuh.

