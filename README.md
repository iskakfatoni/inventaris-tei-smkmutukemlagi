# Inventaris TEI SMK MUTU KEMLAGI

Sistem Informasi Manajemen Inventaris Alat, Trainer Kit, dan Komponen Praktikum berbasis Cloud Real-Time untuk **Jurusan Teknik Elektronika Industri (TEI) - SMK Muhammadiyah 1 Kemlagi (SMK MUTU KEMLAGI)**.

🌐 **Website Resmi:** [https://iskakfatoni.github.io/inventaris-tei-smkmutukemlagi/](https://iskakfatoni.github.io/inventaris-tei-smkmutukemlagi/)

---

## 👥 Akun Pengguna Resmi

| Role | Nama Pengguna | Email Login | Password Default |
| :--- | :--- | :--- | :---: |
| **Toolman (Petugas Utama)** | Akbar Rayhan | `akbarhasfi020@gmail.com` | `12345` |
| **Guru Praktik (Pengusul)** | Rahayu Sutarini | `sutarinirs@gmail.com` | `12345` |
| **Kepala Jurusan (Supervisi)** | M. Iskak Fatoni | `iskakfatoni@gmail.com` | `12345` |

> 📖 Detail matriks hak akses & SOP lengkap dapat dilihat di [**docs/ATURAN_PENGGUNA.md**](docs/ATURAN_PENGGUNA.md).

---

## 📂 Struktur Direktori Project

```text
inventaris-tei-smk-mutu-kemlagi/
├── asset/
│   ├── app/
│   │   ├── Inventaris_TEI.exe       <-- Aplikasi desktop Windows standalone
│   │   └── app_url.txt              <-- Konfigurasi target URL online
│   └── image/                       <-- Tempat penyimpanan berkas gambar/foto
├── css/
│   └── style.css                    <-- Stylesheet, dark mode & full-width desktop
├── js/
│   ├── app-text.js                  <-- Kamus seluruh teks, judul, dan pesan sistem
│   ├── firebase-config.js           <-- Adapter Cloud Firestore & real-time store
│   └── app.js                       <-- Logika UI, import/export Excel & RBAC
├── docs/
│   └── ATURAN_PENGGUNA.md           <-- Dokumentasi RBAC & SOP hak akses pengguna
├── src/
│   └── Launcher.cs                  <-- Source code C# Windows Desktop Launcher
│
│   # Berkas Wajib di Root
├── index.html                       <-- Entry point halaman utama
├── manifest.json                    <-- PWA Web App Manifest
├── sw.js                            <-- Service Worker PWA
├── firebase.json                    <-- Konfigurasi Firebase CLI
├── firestore.rules                  <-- Aturan keamanan Cloud Firestore
└── README.md                        <-- Dokumentasi Utama Repository
```
