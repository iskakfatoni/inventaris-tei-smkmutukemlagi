const OFFICIAL_USERS = [
  {
    email: 'akbarhasfi020@gmail.com',
    name: 'Akbar Rayhan',
    role: 'toolman',
    roleTitle: 'Toolman Bengkel TEI (Petugas Utama)',
    initials: 'AR'
  },
  {
    email: 'sutarinirs@gmail.com',
    name: 'Rahayu Sutarini',
    role: 'guru',
    roleTitle: 'Guru Praktik TEI (Pengusul Kebutuhan)',
    initials: 'RS'
  },
  {
    email: 'iskakfatoni@gmail.com',
    name: 'M. Iskak Fatoni',
    role: 'kajur',
    roleTitle: 'Kepala Program Keahlian (Kajur) TEI',
    initials: 'IF'
  }
];

let currentUser = null; // Sesi awal: Belum login

document.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  applyAppTexts();
  initAuthLanding();
  initTahunAjaranManager();
  initExcelImportAndExport();
  initNavigation();
  initModals();
  initForms();
  initFilters();

  // Cek apakah ada sesi tersimpan di sessionStorage
  const savedSessionEmail = sessionStorage.getItem('INVENTARIS_LOGGED_USER');
  if (savedSessionEmail) {
    const user = OFFICIAL_USERS.find(u => u.email === savedSessionEmail);
    if (user) {
      loginAs(user);
    }
  }

  // Realtime Cloud Firestore sync listener
  if (window.db && typeof window.db.subscribe === 'function') {
    window.db.subscribe(() => {
      if (currentUser) {
        renderTahunAjaranDropdowns();
        refreshAll();
      }
    });
  }
});

/* ===================================================
   0. APPLY CENTRALIZED APP TEXT DICTIONARY
   =================================================== */

function applyAppTexts() {
  if (typeof APP_TEXT === 'undefined') return;

  // Placeholder inputs
  const emailInput = document.getElementById('login-landing-email');
  if (emailInput) emailInput.placeholder = APP_TEXT.login.emailPlaceholder;

  const passInput = document.getElementById('login-landing-password');
  if (passInput) passInput.placeholder = APP_TEXT.login.passwordPlaceholder;

  const searchInput = document.getElementById('excel-search-input');
  if (searchInput) searchInput.placeholder = APP_TEXT.inventoryView.searchPlaceholder;
}

/* ===================================================
   1. AUTHENTICATION & LOGIN LANDING SCREEN
   =================================================== */

function initAuthLanding() {
  const formLogin = document.getElementById('form-login-landing');
  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-landing-email').value.trim();
    const password = document.getElementById('login-landing-password').value.trim();

    const targetUser = OFFICIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!targetUser) {
      showToast(APP_TEXT.login.errorAuth, 'error');
      return;
    }

    const userInDb = window.db.getUserByEmail(email);
    const expectedPass = userInDb ? (userInDb.password || '12345') : '12345';
    const isValid = (password === expectedPass) || window.db.verifyPassword(email, password);

    if (isValid) {
      sessionStorage.setItem('INVENTARIS_LOGGED_USER', targetUser.email);
      loginAs(targetUser);
      showToast(`${APP_TEXT.login.welcomePrefix}, ${targetUser.name}! (${targetUser.roleTitle})`, 'success');
    } else {
      showToast(APP_TEXT.login.errorAuth, 'error');
    }
  });

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm(APP_TEXT.login.logoutConfirm)) {
        logout();
      }
    });
  }
}

function loginAs(user) {
  currentUser = user;
  document.getElementById('screen-login').style.display = 'none';
  document.getElementById('screen-app').style.display = 'block';
  renderTahunAjaranDropdowns();
  updateRoleUI();
  refreshAll();
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('INVENTARIS_LOGGED_USER');
  document.getElementById('login-landing-password').value = '';
  document.getElementById('screen-app').style.display = 'none';
  document.getElementById('screen-login').style.display = 'flex';
  showToast(APP_TEXT.login.logoutSuccess, 'info');
}

/* ===================================================
   2. TAHUN AJARAN & DATA MIGRATION MANAGER
   =================================================== */

function initTahunAjaranManager() {
  const selectTA = document.getElementById('select-active-ta');
  if (selectTA) {
    selectTA.addEventListener('change', (e) => {
      const selectedYear = e.target.value;
      window.db.setActiveTahunAjaran(selectedYear);
      refreshAll();
      showToast(`Beralih ke tampilan Tahun Ajaran: ${selectedYear}`, 'info');
    });
  }

  const btnOpenTAManager = document.getElementById('btn-open-ta-manager');
  if (btnOpenTAManager) {
    btnOpenTAManager.addEventListener('click', () => {
      if (currentUser.role === 'guru') {
        showToast('Hanya Toolman dan Kajur yang berwenang mengelola tahun ajaran & migrasi data', 'error');
        return;
      }
      renderTahunAjaranDropdowns();
      openModal('modal-ta-manager');
    });
  }

  // Form Tambah Tahun Ajaran Baru
  const formAddTA = document.getElementById('form-add-ta');
  if (formAddTA) {
    formAddTA.addEventListener('submit', async (e) => {
      e.preventDefault();
      const inputName = document.getElementById('input-new-ta-name').value.trim();
      if (!inputName) return;

      try {
        await window.db.addTahunAjaran(inputName, true);
        showToast(`Tahun Ajaran baru "${inputName}" berhasil ditambahkan & dijadikan aktif!`, 'success');
        document.getElementById('input-new-ta-name').value = '';
        renderTahunAjaranDropdowns();
        refreshAll();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Form Migrasi Data Inventaris ke TA Baru
  const formMigrate = document.getElementById('form-migrate-data');
  if (formMigrate) {
    formMigrate.addEventListener('submit', async (e) => {
      e.preventDefault();
      const sourceYear = document.getElementById('migrate-source-ta').value;
      const targetYear = document.getElementById('migrate-target-ta').value;

      if (sourceYear === targetYear) {
        showToast('Tahun ajaran asal dan tujuan tidak boleh sama!', 'error');
        return;
      }

      if (confirm(`Apakah Anda yakin ingin menduplikasi seluruh data inventaris dari TA ${sourceYear} ke TA ${targetYear}?`)) {
        try {
          const totalMigrated = await window.db.migrateDataToNewYear(sourceYear, targetYear, currentUser.name);
          showToast(`Sukses! Sebanyak ${totalMigrated} data barang berhasil dimigrasikan ke TA ${targetYear}!`, 'success');
          closeModal('modal-ta-manager');
          renderTahunAjaranDropdowns();
          refreshAll();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  }
}

function renderTahunAjaranDropdowns() {
  const taList = window.db.getTahunAjaranList();
  const activeTA = window.db.getActiveTahunAjaran();

  // 1. Selector di Header
  const selectHeader = document.getElementById('select-active-ta');
  if (selectHeader) {
    selectHeader.innerHTML = '';
    taList.forEach(ta => {
      const selected = ta.nama === activeTA ? 'selected' : '';
      selectHeader.innerHTML += `<option value="${ta.nama}" ${selected}>${ta.nama} ${ta.isAktif ? '(Aktif)' : ''}</option>`;
    });
  }

  // 2. Pill List di Modal
  const pillList = document.getElementById('ta-pill-list');
  if (pillList) {
    pillList.innerHTML = taList.map(ta => `<span class="badge ${ta.nama === activeTA ? 'badge-condition-baik' : 'badge-asset'}" style="margin-right: 4px;">${ta.nama}</span>`).join(' ');
  }

  // 3. Dropdown Form Migrasi
  const selectSource = document.getElementById('migrate-source-ta');
  const selectTarget = document.getElementById('migrate-target-ta');
  if (selectSource && selectTarget) {
    selectSource.innerHTML = '';
    selectTarget.innerHTML = '';
    taList.forEach(ta => {
      selectSource.innerHTML += `<option value="${ta.nama}">${ta.nama}</option>`;
      selectTarget.innerHTML += `<option value="${ta.nama}">${ta.nama}</option>`;
    });
    if (taList.length > 1) {
      selectTarget.selectedIndex = taList.length - 1;
    }
  }
}

/* ===================================================
   3. EXCEL IMPORT & TEMPLATE DOWNLOAD (TOOLMAN & KAJUR)
   =================================================== */

let parsedExcelItems = [];

function initExcelImportAndExport() {
  // Tombol Unduh Template Excel
  const btnDownloadTemplate = document.getElementById('btn-download-template-excel');
  const btnModalDownloadTemplate = document.getElementById('btn-modal-download-template');
  
  if (btnDownloadTemplate) btnDownloadTemplate.addEventListener('click', downloadExcelTemplate);
  if (btnModalDownloadTemplate) btnModalDownloadTemplate.addEventListener('click', downloadExcelTemplate);

  // Tombol Buka Modal Import Excel
  const btnOpenImport = document.getElementById('btn-open-import-excel');
  if (btnOpenImport) {
    btnOpenImport.addEventListener('click', () => {
      if (currentUser.role === 'guru') {
        showToast('Hanya Toolman dan Kajur yang berwenang melakukan import Excel', 'error');
        return;
      }
      parsedExcelItems = [];
      const inputFile = document.getElementById('input-excel-file');
      if (inputFile) inputFile.value = '';
      document.getElementById('import-preview-box').style.display = 'none';
      document.getElementById('btn-execute-import').disabled = true;
      document.getElementById('import-target-ta-label').textContent = window.db.getActiveTahunAjaran();
      openModal('modal-import-excel');
    });
  }

  // Event saat memilih file Excel
  const inputFile = document.getElementById('input-excel-file');
  if (inputFile) {
    inputFile.addEventListener('change', handleExcelFileSelect);
  }

  // Tombol Eksekusi Import
  const btnExecute = document.getElementById('btn-execute-import');
  if (btnExecute) {
    btnExecute.addEventListener('click', async () => {
      if (parsedExcelItems.length === 0) {
        showToast('Tidak ada data barang yang valid untuk di-import!', 'error');
        return;
      }

      const activeTA = window.db.getActiveTahunAjaran();
      const mode = document.querySelector('input[name="import-mode"]:checked').value;
      const modeText = mode === 'replace' ? 'MENGGANTIKAN seluruh' : 'MENAMBAHKAN ke';

      if (confirm(`Apakah Anda yakin ingin ${modeText} data barang di TA ${activeTA} dengan ${parsedExcelItems.length} item dari Excel?`)) {
        btnExecute.disabled = true;
        btnExecute.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Menyimpan...';

        try {
          const totalImported = await window.db.importExcelData(parsedExcelItems, mode, activeTA);
          showToast(`Berhasil meng-import ${totalImported} barang ke TA ${activeTA}!`, 'success');
          closeModal('modal-import-excel');
          refreshAll();
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          btnExecute.disabled = false;
          btnExecute.innerHTML = '<i class="ph-bold ph-floppy-disk"></i> Simpan ke Database Cloud';
        }
      }
    });
  }
}

// Generator Unduh Template Excel Resmi (.xlsx)
function downloadExcelTemplate() {
  if (typeof XLSX === 'undefined') {
    showToast('Library SheetJS sedang dimuat, silakan coba 2 detik lagi...', 'info');
    return;
  }

  // 14 Kolom Resmi sesuai format Inventaris_Lab_TEI.xlsx
  const templateData = [
    {
      "No": 1,
      "Kode Barang": "TEI-ARD-002",
      "Nama Barang / Alat": "Arduino Uno R3",
      "Foto Barang": "",
      "Spesifikasi / Merk": "Original / ATmega328P",
      "Jumlah": 12,
      "Satuan": "Unit",
      "Kondisi": "Baik",
      "Status Penggunaan": "Digunakan",
      "Tahun Perolehan": "2026",
      "Sumber Dana": "Dana sekolah",
      "Lokasi / Rak": "Lemari 1",
      "Tgl. Cek Terakhir": "2026-08-05",
      "Keterangan": "Untuk Praktek SKE"
    },
    {
      "No": 2,
      "Kode Barang": "TEI-TRN-001",
      "Nama Barang / Alat": "Project Board / Trainer Kit",
      "Foto Barang": "",
      "Spesifikasi / Merk": "-",
      "Jumlah": 19,
      "Satuan": "Unit",
      "Kondisi": "Baik",
      "Status Penggunaan": "Digunakan",
      "Tahun Perolehan": "2026",
      "Sumber Dana": "Dana sekolah",
      "Lokasi / Rak": "Etalase A",
      "Tgl. Cek Terakhir": "2026-08-05",
      "Keterangan": "Untuk Praktek SKE"
    },
    {
      "No": 3,
      "Kode Barang": "TEI-SLD-003",
      "Nama Barang / Alat": "Solder Listrik",
      "Foto Barang": "",
      "Spesifikasi / Merk": "Dekko 40W",
      "Jumlah": 17,
      "Satuan": "Unit",
      "Kondisi": "Rusak Ringan",
      "Status Penggunaan": "Dalam Perbaikan",
      "Tahun Perolehan": "2026",
      "Sumber Dana": "Dana BOS",
      "Lokasi / Rak": "Kontener box kecil",
      "Tgl. Cek Terakhir": "2026-08-05",
      "Keterangan": "Perlu ganti mata solder"
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Atur lebar kolom (column width) agar rapi saat dibuka di Microsoft Excel
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 16 }, // Kode Barang
    { wch: 30 }, // Nama Barang
    { wch: 12 }, // Foto Barang
    { wch: 26 }, // Spesifikasi / Merk
    { wch: 10 }, // Jumlah
    { wch: 10 }, // Satuan
    { wch: 15 }, // Kondisi
    { wch: 18 }, // Status Penggunaan
    { wch: 16 }, // Tahun Perolehan
    { wch: 16 }, // Sumber Dana
    { wch: 20 }, // Lokasi / Rak
    { wch: 16 }, // Tgl Cek Terakhir
    { wch: 30 }  // Keterangan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventaris_TEI");
  XLSX.writeFile(wb, "Template_Inventaris_TEI_SMKMUTU.xlsx");
  showToast("Template Excel 14 kolom berhasil diunduh!", "success");
}

// Parser File Excel
function handleExcelFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rawRows.length === 0) {
        showToast('File Excel kosong!', 'error');
        return;
      }

      parsedExcelItems = [];
      rawRows.forEach((row, idx) => {
        // Pemetaan fleksibel kolom Excel ke model inventaris
        const nama = row['Nama Barang / Alat'] || row['Nama Barang'] || row['Nama Alat'] || row['namaBarang'] || '';
        if (!nama) return; // Lewati baris tanpa nama barang

        const kode = row['Kode Barang'] || row['Kode'] || row['kodeBarang'] || `TEI-ITM-${String(idx + 1).padStart(3, '0')}`;
        const spesifikasi = row['Spesifikasi / Merk'] || row['Spesifikasi'] || row['Merk'] || row['spesifikasiMerk'] || '-';
        const jumlah = parseInt(row['Jumlah'] || row['Qty'] || row['jumlah'] || 1) || 1;
        const satuan = row['Satuan'] || row['satuan'] || 'Unit';
        const kondisi = row['Kondisi'] || row['kondisi'] || 'Baik';
        const status = row['Status Penggunaan'] || row['Status'] || row['statusPenggunaan'] || 'Digunakan';
        const tahun = String(row['Tahun Perolehan'] || row['Tahun'] || row['tahunPerolehan'] || new Date().getFullYear());
        const dana = row['Sumber Dana'] || row['sumberDana'] || 'Dana sekolah';
        const lokasi = row['Lokasi / Rak'] || row['Lokasi'] || row['Rak'] || row['lokasiRak'] || 'Lemari 1';
        const tglCek = row['Tgl. Cek Terakhir'] || row['Tgl Cek'] || row['tglCekTerakhir'] || new Date().toISOString().split('T')[0];
        const keterangan = row['Keterangan'] || row['keterangan'] || '-';

        parsedExcelItems.push({
          no: idx + 1,
          kodeBarang: kode,
          namaBarang: nama,
          fotoBarang: '',
          spesifikasiMerk: spesifikasi,
          jumlah: jumlah,
          satuan: satuan,
          kondisi: kondisi,
          statusPenggunaan: status,
          tahunPerolehan: tahun,
          sumberDana: dana,
          lokasiRak: lokasi,
          tglCekTerakhir: tglCek,
          keterangan: keterangan
        });
      });

      if (parsedExcelItems.length === 0) {
        showToast('Tidak ada data barang yang dapat dibaca. Pastikan terdapat kolom "Nama Barang / Alat".', 'error');
        return;
      }

      // Tampilkan Preview Box
      const previewBox = document.getElementById('import-preview-box');
      const summaryText = document.getElementById('import-preview-summary');
      const previewTbody = document.getElementById('import-preview-tbody');
      const btnExecute = document.getElementById('btn-execute-import');

      summaryText.textContent = `Terdeteksi ${parsedExcelItems.length} Data Barang Siap Di-Import`;
      previewTbody.innerHTML = '';

      parsedExcelItems.slice(0, 15).forEach(item => {
        previewTbody.innerHTML += `
          <tr>
            <td>${item.no}</td>
            <td><code>${item.kodeBarang}</code></td>
            <td><strong>${item.namaBarang}</strong></td>
            <td>${item.jumlah} ${item.satuan}</td>
            <td><span class="badge badge-condition-baik">${item.kondisi}</span></td>
            <td>${item.lokasiRak}</td>
          </tr>
        `;
      });

      if (parsedExcelItems.length > 15) {
        previewTbody.innerHTML += `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--text-dim);">... dan ${parsedExcelItems.length - 15} data barang lainnya</td>
          </tr>
        `;
      }

      previewBox.style.display = 'block';
      btnExecute.disabled = false;
      showToast(`Berhasil membaca ${parsedExcelItems.length} barang dari file Excel!`, 'success');

    } catch (err) {
      console.error(err);
      showToast('Gagal memproses file Excel: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function updateRoleUI() {
  if (!currentUser) return;
  const avatar = document.getElementById('user-avatar');
  const name = document.getElementById('user-name-display');
  const tag = document.getElementById('user-role-tag');
  const actionLabel = document.getElementById('label-main-action');
  const actionBtn = document.getElementById('btn-main-inventory-action');

  if (avatar) avatar.textContent = currentUser.initials;
  if (name) name.textContent = currentUser.name;
  if (tag) tag.textContent = currentUser.roleTitle;

  const isToolmanOrKajur = currentUser.role === 'toolman' || currentUser.role === 'kajur';

  // Sembunyikan tombol kelola TA untuk Guru
  const btnTAManager = document.getElementById('btn-open-ta-manager');
  if (btnTAManager) {
    btnTAManager.style.display = isToolmanOrKajur ? 'inline-flex' : 'none';
  }

  // Sembunyikan tombol Template & Import Excel untuk Guru
  document.querySelectorAll('.btn-toolman-kajur').forEach(btn => {
    btn.style.display = isToolmanOrKajur ? 'inline-flex' : 'none';
  });

  if (isToolmanOrKajur) {
    if (actionLabel) actionLabel.textContent = 'Tambah Barang Master';
    if (actionBtn) {
      actionBtn.style.display = 'inline-flex';
      actionBtn.onclick = () => openItemModal();
    }
  } else if (currentUser.role === 'guru') {
    if (actionLabel) actionLabel.textContent = 'Ajukan Barang Baru';
    if (actionBtn) {
      actionBtn.style.display = 'inline-flex';
      actionBtn.onclick = () => openProposalModal();
    }
  }
}

/* ===================================================
   2. VIEW NAVIGATION
   =================================================== */

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.getAttribute('data-view');
      switchView(viewId);
    });
  });
}

window.switchView = function(viewId) {
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('data-view') === viewId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.content-view').forEach(view => {
    view.classList.remove('active');
  });

  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  refreshAll();
};

/* ===================================================
   3. DATA RENDERING
   =================================================== */

function refreshAll() {
  renderInventoryTable();
  renderRekapitulasi();
  renderProposalsTable();
}

// Render Tabel Inventaris (Sheet 1 Excel)
function renderInventoryTable() {
  const items = window.db.getAll();
  const search = document.getElementById('excel-search-input').value.toLowerCase().trim();
  const kondisiFilter = document.getElementById('filter-excel-kondisi').value;
  const lokasiFilter = document.getElementById('filter-excel-lokasi').value;
  const statusFilter = document.getElementById('filter-excel-status').value;

  const filtered = items.filter(item => {
    const matchSearch = (item.kodeBarang && item.kodeBarang.toLowerCase().includes(search)) ||
                        (item.namaBarang && item.namaBarang.toLowerCase().includes(search)) ||
                        (item.spesifikasiMerk && item.spesifikasiMerk.toLowerCase().includes(search)) ||
                        (item.lokasiRak && item.lokasiRak.toLowerCase().includes(search)) ||
                        (item.keterangan && item.keterangan.toLowerCase().includes(search));
    
    const matchKondisi = kondisiFilter === 'all' || item.kondisi === kondisiFilter;
    const matchLokasi = lokasiFilter === 'all' || item.lokasiRak === lokasiFilter;
    const matchStatus = statusFilter === 'all' || item.statusPenggunaan === statusFilter;

    return matchSearch && matchKondisi && matchLokasi && matchStatus;
  });

  const tbody = document.getElementById('tbody-excel-inventory');
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 24px; color: var(--text-dim);">Tidak ditemukan data barang.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    let kondisiBadge = 'badge-condition-baik';
    if (item.kondisi === 'Rusak Ringan') kondisiBadge = 'badge-condition-rusak_ringan';
    if (item.kondisi === 'Rusak Berat') kondisiBadge = 'badge-condition-rusak_berat';
    if (item.kondisi === 'Hilang') kondisiBadge = 'badge-condition-afkir';

    let actionButtons = '';
    if (currentUser.role === 'toolman') {
      // Toolman: Petugas Utama (Akses Penuh Edit & Hapus Master)
      actionButtons = `
        <div style="display: flex; justify-content: flex-end; gap: 6px;">
          <button class="btn btn-sm btn-secondary" onclick="editItem('${item.id}')" title="Edit Data Barang (Petugas Utama)">
            <i class="ph ph-pencil-simple"></i> Edit
          </button>
          <button class="btn btn-sm btn-secondary" style="color: var(--color-danger);" onclick="deleteItem('${item.id}')" title="Hapus Barang">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      `;
    } else if (currentUser.role === 'guru') {
      // Guru: Pengusul
      actionButtons = `
        <button class="btn btn-sm btn-secondary" onclick="openProposalForExisting('${item.id}')" title="Ajukan Tambahan / Modifikasi ke Toolman">
          <i class="ph ph-paper-plane-tilt"></i> Usulkan
        </button>
      `;
    } else {
      // Kajur: Supervisi (Label Terverifikasi rapi tanpa ikon)
      actionButtons = `
        <span class="badge badge-condition-baik" style="font-size: 0.75rem; font-weight: 500; padding: 4px 8px;">Terverifikasi</span>
      `;
    }

    tbody.innerHTML += `
      <tr>
        <td style="color: var(--text-dim); text-align: center;">${item.no}</td>
        <td><span class="code-tag">${item.kodeBarang}</span></td>
        <td><strong>${item.namaBarang}</strong></td>
        <td style="color: var(--text-muted);">${item.spesifikasiMerk || '-'}</td>
        <td><strong>${item.jumlah}</strong> <small style="color: var(--text-dim);">${item.satuan}</small></td>
        <td><span class="badge ${kondisiBadge}">${item.kondisi}</span></td>
        <td><span class="badge badge-asset">${item.statusPenggunaan || 'Digunakan'}</span></td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${item.sumberDana || 'Dana sekolah'}</td>
        <td><i class="ph ph-map-pin text-cyan"></i> ${item.lokasiRak}</td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${item.tglCekTerakhir || '-'}</td>
        <td style="color: var(--text-dim); font-size: 0.8rem;">${item.keterangan || '-'}</td>
        <td class="text-right">${actionButtons}</td>
      </tr>
    `;
  });
}

// Render Rekapitulasi (Sheet 2 Excel)
function renderRekapitulasi() {
  const rekap = window.db.getRekapitulasi();

  document.getElementById('rekap-unit-baik').textContent = rekap.baik.unit;
  document.getElementById('rekap-jenis-baik').textContent = `${rekap.baik.jenis} jenis barang`;
  
  document.getElementById('rekap-unit-rusak-ringan').textContent = rekap.rusakRingan.unit;
  document.getElementById('rekap-jenis-rusak-ringan').textContent = `${rekap.rusakRingan.jenis} jenis barang`;

  document.getElementById('rekap-unit-rusak-berat').textContent = rekap.rusakBerat.unit + rekap.hilang.unit;
  
  document.getElementById('rekap-total-unit').textContent = rekap.totalUnit;
  document.getElementById('rekap-total-jenis').textContent = `${rekap.totalJenis} jenis barang`;

  const tbody = document.getElementById('tbody-excel-rekap');
  if (!tbody) return;

  const totalUnit = rekap.totalUnit || 1;
  const rows = [
    { kondisi: 'Baik', jenis: rekap.baik.jenis, unit: rekap.baik.unit, badge: 'badge-condition-baik', ket: 'Alat & modul siap digunakan praktikum' },
    { kondisi: 'Rusak Ringan', jenis: rekap.rusakRingan.jenis, unit: rekap.rusakRingan.unit, badge: 'badge-condition-rusak_ringan', ket: 'Perlu servis/perbaikan oleh Toolman' },
    { kondisi: 'Rusak Berat', jenis: rekap.rusakBerat.jenis, unit: rekap.rusakBerat.unit, badge: 'badge-condition-rusak_berat', ket: 'Tidak dapat digunakan' },
    { kondisi: 'Hilang', jenis: rekap.hilang.jenis, unit: rekap.hilang.unit, badge: 'badge-condition-afkir', ket: 'Tidak ditemukan saat pengecekan' }
  ];

  tbody.innerHTML = '';
  rows.forEach(r => {
    const pct = Math.round((r.unit / totalUnit) * 100);
    tbody.innerHTML += `
      <tr>
        <td><span class="badge ${r.badge}">${r.kondisi}</span></td>
        <td><strong>${r.jenis}</strong> Jenis</td>
        <td><strong>${r.unit}</strong> Unit</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="progress-track" style="flex: 1; height: 6px;"><div class="progress-fill" style="width: ${pct}%; background: var(--accent-cyan);"></div></div>
            <span style="font-size: 0.8rem; font-weight: 600;">${pct}%</span>
          </div>
        </td>
        <td style="color: var(--text-dim);">${r.ket}</td>
      </tr>
    `;
  });

  tbody.innerHTML += `
    <tr style="background: rgba(255,255,255,0.03); font-weight: 700;">
      <td>TOTAL</td>
      <td>${rekap.totalJenis} Jenis</td>
      <td>${rekap.totalUnit} Unit</td>
      <td>100%</td>
      <td style="color: var(--color-success);"><i class="ph-bold ph-check"></i> Terverifikasi oleh Toolman</td>
    </tr>
  `;
}

// Render Usulan & Approval Table
function renderProposalsTable() {
  const proposals = window.db.getProposals();
  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const badge = document.getElementById('nav-pending-badge');
  if (badge) {
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  const tbody = document.getElementById('tbody-proposals-list');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (proposals.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--text-dim);">Belum ada usulan barang dari guru.</td></tr>`;
    return;
  }

  const isToolman = currentUser.role === 'toolman' || currentUser.role === 'kajur';

  proposals.forEach(p => {
    let statusBadge = '<span class="badge badge-condition-rusak_ringan">Menunggu Approval Toolman</span>';
    if (p.status === 'approved') statusBadge = '<span class="badge badge-condition-baik">Disetujui Toolman</span>';
    if (p.status === 'rejected') statusBadge = '<span class="badge badge-condition-rusak_berat">Ditolak</span>';

    let actionButtons = '-';
    if (p.status === 'pending') {
      if (currentUser.role === 'toolman') {
        actionButtons = `
          <button class="btn btn-sm btn-primary" onclick="openReviewModal('${p.id}')">
            <i class="ph ph-check"></i> Approval Toolman
          </button>
        `;
      } else {
        actionButtons = `<span style="font-size: 0.8rem; color: var(--text-dim);"><i class="ph ph-clock"></i> Menunggu Toolman</span>`;
      }
    } else {
      actionButtons = `<span class="code-tag" style="color: var(--color-success);"><i class="ph ph-shield-check"></i> Log Audit</span>`;
    }

    tbody.innerHTML += `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${p.tanggalUsul || '-'}</td>
        <td><span class="code-tag">${p.kodeBarang}</span> <strong>${p.namaBarang}</strong></td>
        <td style="color: var(--text-muted);">${p.spesifikasiMerk || '-'}</td>
        <td><strong>${p.jumlah}</strong> ${p.satuan}</td>
        <td>${p.lokasiRak}</td>
        <td>
          <div style="font-weight: 600; color: var(--accent-blue);">${p.pengusulNama}</div>
          <small style="color: var(--text-muted);">${p.keterangan}</small>
        </td>
        <td>${statusBadge}</td>
        <td style="font-size: 0.82rem; color: var(--text-dim);">${p.catatanToolman || '-'}</td>
        <td class="text-right">${actionButtons}</td>
      </tr>
    `;
  });
}

/* ===================================================
   4. MODALS & FORMS
   =================================================== */

function initModals() {
  document.getElementById('btn-open-rbac-guide').addEventListener('click', () => openModal('modal-rbac-info'));
  document.getElementById('btn-open-settings').addEventListener('click', () => openModal('modal-settings'));

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      closeModal(modalId);
    });
  });
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function initForms() {
  // Form Master Item (Toolman sebagai Petugas Utama)
  document.getElementById('form-item').addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentUser.role === 'guru') {
      showToast('Guru hanya dapat mengajukan usulan pengadaan barang', 'info');
      closeModal('modal-item');
      openProposalModal();
      return;
    }

    const editId = document.getElementById('form-item-id').value;
    const payload = {
      kodeBarang: document.getElementById('form-kode').value.trim(),
      namaBarang: document.getElementById('form-nama').value.trim(),
      spesifikasiMerk: document.getElementById('form-spek').value.trim() || '-',
      jumlah: parseInt(document.getElementById('form-jumlah').value) || 1,
      satuan: document.getElementById('form-satuan').value.trim() || 'Unit',
      kondisi: document.getElementById('form-kondisi').value,
      statusPenggunaan: document.getElementById('form-status').value,
      tahunPerolehan: document.getElementById('form-tahun').value.trim() || '2026',
      sumberDana: document.getElementById('form-dana').value.trim() || 'Dana sekolah',
      lokasiRak: document.getElementById('form-lokasi').value.trim(),
      tglCekTerakhir: document.getElementById('form-tgl-cek').value || new Date().toISOString().split('T')[0],
      keterangan: document.getElementById('form-keterangan').value.trim() || '-'
    };

    if (editId) {
      window.db.updateItem(editId, payload);
      showToast(`Data "${payload.namaBarang}" berhasil diperbarui oleh ${currentUser.name}`, 'success');
    } else {
      window.db.addItem(payload);
      showToast(`Barang baru "${payload.namaBarang}" berhasil ditambahkan oleh ${currentUser.name}`, 'success');
    }

    closeModal('modal-item');
    refreshAll();
  });

  // Form Proposal (Usulan Guru)
  document.getElementById('form-proposal').addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      kodeBarang: document.getElementById('prop-kode').value.trim(),
      namaBarang: document.getElementById('prop-nama').value.trim(),
      spesifikasiMerk: document.getElementById('prop-spek').value.trim() || '-',
      jumlah: parseInt(document.getElementById('prop-jumlah').value) || 1,
      satuan: document.getElementById('prop-satuan').value.trim() || 'Unit',
      lokasiRak: document.getElementById('prop-lokasi').value.trim() || 'Lemari 1',
      keterangan: document.getElementById('prop-keterangan').value.trim(),
      pengusulNama: `${currentUser.name} (${currentUser.roleTitle})`,
      pengusulEmail: currentUser.email
    };

    window.db.addProposal(payload);
    showToast(`Usulan "${payload.namaBarang}" berhasil dikirim ke Toolman!`, 'success');
    closeModal('modal-proposal');
    switchView('proposals');
  });

  // Form Review Proposal oleh Toolman
  document.getElementById('form-review-proposal').addEventListener('submit', (e) => {
    e.preventDefault();
    const propId = document.getElementById('review-prop-id').value;
    const notes = document.getElementById('review-notes').value.trim();

    const result = window.db.approveProposal(propId, notes);
    if (result) {
      showToast(`Usulan "${result.namaBarang}" DISETUJUI Toolman & otomatis masuk ke Master Database!`, 'success');
    }
    closeModal('modal-review-proposal');
    refreshAll();
  });

  document.getElementById('btn-execute-reject').addEventListener('click', () => {
    const propId = document.getElementById('review-prop-id').value;
    const notes = document.getElementById('review-notes').value.trim();
    if (!notes) {
      showToast('Wajib memberikan catatan alasan penolakan!', 'error');
      return;
    }
    const result = window.db.rejectProposal(propId, notes);
    if (result) {
      showToast(`Usulan "${result.namaBarang}" DITOLAK oleh Toolman. Log tercatat untuk Kajur.`, 'info');
    }
    closeModal('modal-review-proposal');
    refreshAll();
  });

  // Event Ganti Password Modal
  document.getElementById('btn-open-change-password').addEventListener('click', () => {
    document.getElementById('cp-user-name').textContent = currentUser.name;
    document.getElementById('cp-user-email').textContent = currentUser.email;
    document.getElementById('form-change-password').reset();
    openModal('modal-change-password');
  });

  document.getElementById('form-change-password').addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPass = document.getElementById('cp-old-password').value.trim();
    const newPass = document.getElementById('cp-new-password').value.trim();
    const confirmPass = document.getElementById('cp-confirm-password').value.trim();

    if (newPass !== confirmPass) {
      showToast('Konfirmasi password baru tidak cocok!', 'error');
      return;
    }

    try {
      await window.db.changePassword(currentUser.email, oldPass, newPass);
      showToast(`Password akun ${currentUser.name} berhasil diperbarui!`, 'success');
      closeModal('modal-change-password');
    } catch (err) {
      showToast(err.message || 'Gagal mengubah password', 'error');
    }
  });

  // Reset Data ke Isi Excel Asli
  document.getElementById('btn-reset-excel-data').addEventListener('click', () => {
    if (confirm('Kembalikan data inventaris ke 9 barang asli file Excel?')) {
      window.db.resetToExcel();
      refreshAll();
      closeModal('modal-settings');
      showToast('Data berhasil di-reset sesuai file Excel Inventaris_Lab_TEI.xlsx', 'success');
    }
  });
}

function openItemModal(itemData = null) {
  const form = document.getElementById('form-item');
  form.reset();

  if (itemData) {
    document.getElementById('modal-item-title').innerHTML = '<i class="ph-bold ph-pencil"></i> Edit Master Inventaris (Toolman)';
    document.getElementById('form-item-id').value = itemData.id;
    document.getElementById('form-kode').value = itemData.kodeBarang;
    document.getElementById('form-nama').value = itemData.namaBarang;
    document.getElementById('form-spek').value = itemData.spesifikasiMerk || '';
    document.getElementById('form-jumlah').value = itemData.jumlah;
    document.getElementById('form-satuan').value = itemData.satuan;
    document.getElementById('form-kondisi').value = itemData.kondisi;
    document.getElementById('form-status').value = itemData.statusPenggunaan || 'Digunakan';
    document.getElementById('form-tahun').value = itemData.tahunPerolehan || '2026';
    document.getElementById('form-dana').value = itemData.sumberDana || 'Dana sekolah';
    document.getElementById('form-lokasi').value = itemData.lokasiRak;
    document.getElementById('form-tgl-cek').value = itemData.tglCekTerakhir || '';
    document.getElementById('form-keterangan').value = itemData.keterangan || '';
  } else {
    document.getElementById('modal-item-title').innerHTML = '<i class="ph-bold ph-package"></i> Tambah Master Inventaris (Toolman)';
    document.getElementById('form-item-id').value = '';
    document.getElementById('form-tgl-cek').value = new Date().toISOString().split('T')[0];
  }
  openModal('modal-item');
}

window.editItem = function(id) {
  const item = window.db.getById(id);
  if (item) openItemModal(item);
};

window.deleteItem = function(id) {
  if (currentUser.role !== 'toolman' && currentUser.role !== 'kajur') {
    showToast('Akses ditolak: Hanya Toolman / Kajur yang berwenang menghapus data master', 'error');
    return;
  }
  const item = window.db.getById(id);
  if (item && confirm(`Hapus "${item.namaBarang}" dari master database?`)) {
    window.db.deleteItem(id);
    showToast(`Barang "${item.namaBarang}" telah dihapus oleh ${currentUser.name}`, 'info');
    refreshAll();
  }
};

function openProposalModal() {
  const form = document.getElementById('form-proposal');
  if (form) form.reset();
  openModal('modal-proposal');
}

window.openProposalForExisting = function(itemId) {
  const item = window.db.getById(itemId);
  openProposalModal();
  if (item) {
    document.getElementById('prop-kode').value = item.kodeBarang;
    document.getElementById('prop-nama').value = item.namaBarang;
    document.getElementById('prop-spek').value = item.spesifikasiMerk || '';
    document.getElementById('prop-satuan').value = item.satuan;
    document.getElementById('prop-lokasi').value = item.lokasiRak;
    document.getElementById('prop-keterangan').value = `Penambahan kuantitas untuk ${item.namaBarang}`;
  }
};

window.openReviewModal = function(propId) {
  const prop = window.db.getProposals().find(p => p.id === propId);
  if (!prop) return;

  document.getElementById('review-prop-id').value = prop.id;
  document.getElementById('review-prop-details').innerHTML = `
    <div style="margin-bottom: 6px;">
      <span class="code-tag">${prop.kodeBarang}</span> <strong>${prop.namaBarang}</strong>
    </div>
    <div style="color: var(--text-muted); font-size: 0.82rem; margin-bottom: 4px;">
      Jumlah: <strong>${prop.jumlah} ${prop.satuan}</strong> • Lokasi: <strong>${prop.lokasiRak}</strong>
    </div>
    <div style="color: var(--accent-blue); font-size: 0.82rem;">
      Pengusul: <strong>${prop.pengusulNama}</strong>
    </div>
    <div style="color: var(--text-main); font-size: 0.82rem; font-style: italic; margin-top: 4px;">
      "${prop.keterangan}"
    </div>
  `;
  document.getElementById('review-notes').value = 'Disetujui. Sesuai kurikulum praktik elektronika.';
  openModal('modal-review-proposal');
};

/* ===================================================
   5. FILTERS & SEARCH
   =================================================== */

function initFilters() {
  document.getElementById('excel-search-input').addEventListener('input', renderInventoryTable);
  document.getElementById('filter-excel-kondisi').addEventListener('change', renderInventoryTable);
  document.getElementById('filter-excel-lokasi').addEventListener('change', renderInventoryTable);
  document.getElementById('filter-excel-status').addEventListener('change', renderInventoryTable);
}

/* ===================================================
   6. TOAST
   =================================================== */

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? 'ph-check-circle' : type === 'error' ? 'ph-x-circle' : 'ph-info';
  toast.innerHTML = `<i class="ph-bold ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
