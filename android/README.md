# PinjamTEI - Aplikasi Android Peminjaman Alat Bengkel TEI
### SMK Muhammadiyah 1 Kemlagi (SMK MUTU KEMLAGI)

Aplikasi Android Native khusus untuk operasional **Check-out & Check-in Peminjaman Alat Praktikum Siswa** di Bengkel Teknik Elektronika Industri (TEI). Aplikasi terhubung secara real-time ke **Firebase Cloud Firestore** yang sama dengan dashboard web utama dan dilengkapi **Pemindai Barcode / QR Code Kamera (CameraX + ML Kit)**.

---

## 📱 Spesifikasi Teknis

* **Package Name:** `id.sch.smkmutukemlagi.pinjamtei`
* **Bahasa:** Kotlin
* **UI Framework:** Jetpack Compose + Material Design 3
* **Arsitektur:** MVVM (StateFlow, ViewModel, Repository Pattern)
* **Backend:** Firebase Cloud Firestore (`com.google.firebase:firebase-firestore-ktx`)
* **Pemindai QR Code:** CameraX + Google ML Kit Barcode Scanning
* **Target SDK:** Android 8.0 (API 26) s/d Android 14+ (API 34)

---

## 🚀 Fitur Unggulan PinjamTEI

1. **Logbook Peminjaman Real-Time:**
   - Terhubung langsung ke koleksi `peminjaman_alat` di Cloud Firestore.
   - Status peminjaman otomatis terbarui tanpa perlu refresh manual.
   - Deteksi keterlambatan (*merah berkedip/overdue badge*).
2. **Scanner QR Code / Barcode Bawaan Kamera:**
   - Cukup arahkan kamera ke stiker label QR alat di lemari/box trainer.
   - Aplikasi otomatis mendeteksi kode barang dan membuka form peminjaman dengan alat yang langsung terpilih.
3. **Form Catat Peminjaman Baru (Check-out):**
   - Pemilihan alat praktikum lengkap dengan informasi stok dan lokasi rak/lemari.
   - Input nama siswa/kelompok, kelas (X, XI, XII TEI), jumlah unit, dan tanggal batas kembali.
4. **Verifikasi Pengembalian Alat (Check-in):**
   - Pemeriksaan kondisi alat saat kembali (*Baik, Rusak Ringan, Rusak Berat, Hilang*).
   - Opsi otomatis sinkronisasi kondisi kerusakan ke master inventaris.
5. **Statistik Sirkulasi & Pencarian Cepat:**
   - 4 Card statistik ringkas: Total Transaksi, Sedang Dipinjam, Terlambat, dan Selesai.
   - Pencarian instan berdasarkan nama siswa, kelas, kode, atau nama alat.

---

## 🛠️ Cara Membuka & Mem-build APK di Android Studio

1. **Buka Android Studio:**
   - Pilih menu **File > Open...**
   - Arahkan ke folder: `inventaris-tei-smk-mutu-kemlagi/android`
   - Klik **OK** dan tunggu Android Studio melakukan sinkronisasi Gradle (Gradle Sync).

2. **Jalankan di HP Android / Emulator:**
   - Sambungkan HP Android dengan kabel USB (aktifkan *USB Debugging* di Pengaturan Pengembang HP).
   - Atau pilih Emulator Android yang tersedia.
   - Klik tombol hijau **Run ▶ (Shift + F10)**.

3. **Membuat Berkas APK (Siap Pasang / Distribusi):**
   - Pada menu atas Android Studio, pilih:
     `Build > Build Bundle(s) / APK(s) > Build APK(s)`
   - Setelah proses selesai, klik notifikasi **locate** di pojok kanan bawah.
   - Berkas APK siap dipasang di HP guru, toolman, maupun siswa:
     `app/build/outputs/apk/debug/app-debug.apk`

---

## 📂 Struktur Direktori Proyek

```text
android/
├── app/
│   ├── build.gradle.kts                      <-- Dependensi Compose, Firebase, CameraX
│   ├── google-services.json                  <-- Konfigurasi resmi Firebase inventaris-tei-smkmutu
│   └── src/main/
│       ├── AndroidManifest.xml               <-- Izin Kamera & Internet
│       ├── java/id/sch/smkmutukemlagi/pinjamtei/
│       │   ├── MainActivity.kt               <-- Navigasi Jetpack Compose
│       │   ├── data/
│       │   │   ├── model/Loan.kt             <-- Model Transaksi Peminjaman
│       │   │   ├── model/InventoryItem.kt    <-- Model Master Alat
│       │   │   └── repository/FirestoreRepository.kt <-- Realtime Firestore Flow
│       │   ├── viewmodel/LoanViewModel.kt    <-- State Management & Logika Bisnis
│       │   └── ui/
│       │       ├── theme/ (Color.kt, Theme.kt, Type.kt)
│       │       ├── components/LoanCard.kt    <-- Kartu Peminjaman
│       │       └── screens/
│       │           ├── LoanListScreen.kt     <-- Layar Utama Logbook & Filter
│       │           ├── AddLoanScreen.kt      <-- Form Peminjaman Baru
│       │           ├── ReturnLoanDialog.kt   <-- Dialog Verifikasi Pengembalian
│       │           └── QrScannerScreen.kt    <-- Scanner Kamera CameraX + ML Kit
│       └── res/                              <-- Ikon, string, dan warna tema
├── build.gradle.kts                          <-- Root Gradle config
├── settings.gradle.kts                       <-- Root project settings
└── README.md                                 <-- Panduan ini
```
