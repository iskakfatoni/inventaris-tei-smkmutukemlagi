/**
 * Kamus Teks & String Konfigurasi Sistem (Centralized App Text Dictionary)
 * Inventaris TEI - SMK Muhammadiyah 1 Kemlagi (SMK MUTU KEMLAGI)
 * 
 * Anda dapat mengedit seluruh teks, judul, tombol, dan pesan sistem di sini
 * tanpa perlu mengubah file HTML atau logika JavaScript lainnya.
 */

const APP_TEXT = {
  // Identitas Lembaga & Aplikasi
  brand: {
    appName: "Inventaris TEI",
    schoolName: "SMK Muhammadiyah 1 Kemlagi",
    schoolShort: "SMK MUTU KEMLAGI",
    labName: "Bengkel Elektronika Industri",
    departmentName: "Teknik Elektronika Industri (TEI)",
    academicYearDefault: "TA 2026/2027",
    statusConnected: "Database Cloud Terhubung"
  },

  // Layar Login (Landing Page)
  login: {
    title: "Inventaris TEI",
    subtitle: "SMK Muhammadiyah 1 Kemlagi (SMK MUTU KEMLAGI)",
    badge: "Bengkel Elektronika Industri • TA 2026/2027",
    emailLabel: "Email Pengguna",
    emailPlaceholder: "Masukkan alamat email",
    passwordLabel: "Password",
    passwordPlaceholder: "Masukkan password",
    submitButton: "Masuk",
    errorAuth: "Email atau password yang Anda masukkan salah!",
    welcomePrefix: "Selamat datang",
    logoutConfirm: "Apakah Anda yakin ingin keluar dari sistem?",
    logoutSuccess: "Anda telah keluar dari sistem."
  },

  // Menu Navigasi Sidebar
  navigation: {
    inventory: "Data Inventaris",
    rekap: "Rekapitulasi Kondisi",
    proposals: "Usulan & Approval"
  },

  // Header & Profil Pengguna
  header: {
    academicYearLabel: "TA:",
    btnManageTA: "Kelola Tahun Ajaran & Migrasi Data (Toolman)",
    btnChangePassword: "Ganti Password Akun",
    btnRbacGuide: "Lihat Aturan Hak Akses Pengguna",
    btnSettings: "Pengaturan Database",
    btnLogout: "Keluar / Logout"
  },

  // Halaman 1: Data Inventaris
  inventoryView: {
    title: "Daftar Inventaris Laboratorium / Bengkel TEI",
    subtitle: "Tabel data mengacu langsung pada struktur format Excel 14 Kolom",
    btnAddItem: "Tambah Barang Master",
    btnProposeItem: "Ajukan Barang Baru",
    btnTemplateExcel: "Template Excel",
    btnImportExcel: "Import Excel",
    searchPlaceholder: "Cari kode barang, nama alat, spesifikasi, lokasi rak...",
    emptyData: "Tidak ada data barang yang sesuai kriteria pencarian.",
    filterAllKondisi: "Semua Kondisi",
    filterAllLokasi: "Semua Lokasi / Rak",
    actionVerifiedLabel: "Terverifikasi"
  },

  // Halaman 2: Rekapitulasi Kondisi
  rekapView: {
    title: "Rekapitulasi Kondisi & Kesiapan Alat Praktikum",
    subtitle: "Ringkasan data fisik barang sesuai Sheet 2 format Excel",
    cardBaikTitle: "Kondisi Baik",
    cardRusakRinganTitle: "Rusak Ringan",
    cardRusakBeratTitle: "Rusak Berat & Hilang",
    cardTotalTitle: "Total Keseluruhan",
    tableHeaderKondisi: "Kondisi Barang",
    tableHeaderJenis: "Jumlah Jenis",
    tableHeaderUnit: "Jumlah Unit",
    tableHeaderPersen: "Persentase Fisik",
    tableHeaderKet: "Keterangan Status"
  },

  // Halaman 3: Usulan & Approval
  proposalsView: {
    title: "Pengajuan Kebutuhan Alat & Modul Praktikum",
    subtitle: "Alur Usulan Guru Praktik ➔ Review & Approval Toolman ➔ Audit Log Kajur",
    btnOpenProposal: "Buat Usulan Baru",
    emptyProposals: "Belum ada usulan pengadaan barang."
  },

  // Modals & Formulir
  modals: {
    addItemTitle: "Tambah Data Barang Master",
    editItemTitle: "Edit Data Barang Master",
    proposeItemTitle: "Ajukan Usulan Pengadaan / Tambahan Alat",
    manageTATitle: "Kelola Tahun Ajaran & Migrasi Data",
    importExcelTitle: "Import Data Excel Inventaris",
    changePasswordTitle: "Ganti Password Akun",
    rbacGuideTitle: "Matriks Hak Akses & Kewenangan Pengguna"
  },

  // Pesan Notifikasi (Toast Alerts)
  toasts: {
    itemAdded: "Data barang baru berhasil disimpan ke Cloud Database!",
    itemUpdated: "Perubahan data barang berhasil diperbarui!",
    itemDeleted: "Data barang berhasil dihapus dari sistem.",
    deleteConfirm: "Apakah Anda yakin ingin menghapus data barang ini?",
    proposalSubmitted: "Usulan barang berhasil diajukan ke Toolman!",
    proposalApproved: "Usulan barang disetujui & otomatis masuk ke Master Inventaris!",
    proposalRejected: "Usulan barang telah ditolak.",
    passwordChanged: "Password berhasil diperbarui!",
    passwordMismatch: "Konfirmasi password baru tidak cocok!",
    passwordMinLength: "Password baru minimal 5 karakter!",
    importSuccess: "Berhasil meng-import data barang ke Cloud Database!",
    taAdded: "Tahun Ajaran baru berhasil ditambahkan!",
    migrationSuccess: "Data inventaris berhasil dimigrasikan ke Tahun Ajaran baru!",
    permissionDenied: "Anda tidak memiliki wewenang untuk melakukan aksi ini."
  }
};

// Export ke window agar dapat diakses dari seluruh berkas JavaScript
if (typeof window !== 'undefined') {
  window.APP_TEXT = APP_TEXT;
}
