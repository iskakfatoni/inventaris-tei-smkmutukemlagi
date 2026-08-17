# Inventaris TEI SMK MUTU KEMLAGI

Aplikasi Sistem Informasi Manajemen Inventaris Alat, Trainer Kit, dan Komponen Praktikum untuk **Jurusan Teknik Elektronika Industri (TEI) - SMK MUTU KEMLAGI**.

---

## 🔑 Kredensial Login Pengguna (Email & Kode Akses)

| Role | Email Login | Kode Akses Default |
| :--- | :--- | :---: |
| **Toolman Bengkel TEI** | `toolman@smkmutukemlagi.sch.id` | `toolman123` |
| **Guru Praktik TEI** | `guru.tei@smkmutukemlagi.sch.id` | `guru123` |
| **Kepala Jurusan (Kajur)** | `kajur.tei@smkmutukemlagi.sch.id` | `kajur123` |

---

## 📂 Struktur Berkas

```
inventaris-tei-smk-mutu-kemlagi/
├── index.html            # Antarmuka SPA (Dashboard, Katalog, Usulan & Approval, QR Tag, Log)
├── style.css             # Tema Industrial Dark & Glassmorphism
├── firebase-config.js    # Data Store & Adapter Otentikasi Email / Kode Akses
├── app.js                # Logika Aplikasi, Alur Usulan & Approval
├── firestore.rules       # Aturan Keamanan Database Cloud Firestore
├── ATURAN_PENGGUNA.md    # Matriks Hak Akses & SOP Pengguna
└── README.md             # Dokumentasi Project
```
