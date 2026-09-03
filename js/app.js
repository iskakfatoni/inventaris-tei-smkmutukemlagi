/* ===================================================
   0. THEME MANAGER (DARK / LIGHT / AUTO)
   =================================================== */

const THEME_KEY = 'INVENTARIS_THEME';

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'auto';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);

  // Update theme meta color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    metaTheme.setAttribute('content', isDark ? '#0B0F17' : '#F8FAFC');
  }

  // Update all theme toggle buttons
  updateThemeToggleButtons(theme);
}

function updateThemeToggleButtons(theme) {
  const buttons = document.querySelectorAll('#btn-theme-toggle, .theme-toggle-btn');
  buttons.forEach(btn => {
    let iconClass = 'ph-desktop';
    let titleText = 'Tema: Otomatis Sistem (Klik untuk Beralih)';

    if (theme === 'dark') {
      iconClass = 'ph-moon-stars';
      titleText = 'Tema: Mode Gelap (Klik untuk Beralih)';
    } else if (theme === 'light') {
      iconClass = 'ph-sun';
      titleText = 'Tema: Mode Terang (Klik untuk Beralih)';
    }

    btn.innerHTML = `<i class="ph-bold ${iconClass}"></i>`;
    btn.setAttribute('title', titleText);
    btn.setAttribute('aria-label', titleText);
  });
}

function cycleTheme() {
  const current = getTheme();
  let next = 'dark';
  let message = 'Tema diubah ke Mode Gelap';

  if (current === 'dark') {
    next = 'light';
    message = 'Tema diubah ke Mode Terang';
  } else if (current === 'light') {
    next = 'auto';
    message = 'Tema diubah ke Otomatis (Mengikuti Sistem)';
  } else {
    next = 'dark';
    message = 'Tema diubah ke Mode Gelap';
  }

  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  if (typeof showToast === 'function') {
    showToast(message, 'info');
  }
}

function initThemeManager() {
  const currentTheme = getTheme();
  applyTheme(currentTheme);

  // Pasang listener pada semua tombol toggle tema
  const buttons = document.querySelectorAll('#btn-theme-toggle, .theme-toggle-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      cycleTheme();
    });
  });

  // Listener untuk perubahan preferensi OS jika mode 'auto'
  try {
    const darkMatcher = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkMatcher && darkMatcher.addEventListener) {
      darkMatcher.addEventListener('change', () => {
        if (getTheme() === 'auto') {
          applyTheme('auto');
        }
      });
    }
  } catch (e) {}
}

let currentUser = null; // Disimpan saat login aktif

const isLoginPage = document.getElementById('screen-login') !== null;
const isDashboardPage = document.getElementById('screen-app') !== null;
const isGuestPage = document.getElementById('screen-guest') !== null;

document.addEventListener('DOMContentLoaded', () => {
  initThemeManager();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(isLoginPage ? 'sw.js' : '../../sw.js').catch(() => {});
  }
  applyAppTexts();

  const savedSessionEmail = localStorage.getItem('INVENTARIS_LOGGED_USER') || sessionStorage.getItem('INVENTARIS_LOGGED_USER');
  const savedUserJson = localStorage.getItem('INVENTARIS_LOGGED_USER_DATA') || sessionStorage.getItem('INVENTARIS_LOGGED_USER_DATA');
  if (savedUserJson) {
    try {
      currentUser = JSON.parse(savedUserJson);
    } catch (e) {}
  }

  // --- 1. JIKA DI HALAMAN LOGIN (index.html) ---
  if (isLoginPage) {
    initAuthLanding();
    if (savedSessionEmail) {
      if (currentUser && currentUser.role === 'guest') {
        window.location.href = 'asset/page/guest.html';
      } else {
        window.location.href = 'asset/page/dashboard.html';
      }
    }
  }

  // --- 2. JIKA DI HALAMAN DASHBOARD (asset/page/dashboard.html) ---
  if (isDashboardPage) {
    if (!savedSessionEmail) {
      window.location.href = '../../index.html';
      return;
    }

    // Jika pengguna yang login adalah Guest, arahkan ke tampilan khusus guest
    if (currentUser && currentUser.role === 'guest') {
      window.location.href = 'guest.html';
      return;
    }

    initTahunAjaranManager();
    initExcelImportAndExport();
    initSidebarToggle();
    initNavigation();
    initModals();
    initForms();
    initFilters();
    initPhotoUpload();
    initLoansManager();
    initDashboardLogout();
    renderTahunAjaranDropdowns();
    updateRoleUI();
    populateLokasiFilter();
    refreshAll();

    // Realtime Cloud Firestore sync listener
    if (window.db && typeof window.db.subscribe === 'function') {
      window.db.subscribe(() => {
        // Sinkronisasi data profil pengguna terkini dari Cloud Firestore
        const liveUser = window.db.getUserByEmail(savedSessionEmail);
        if (liveUser) {
          currentUser = liveUser;
          localStorage.setItem('INVENTARIS_LOGGED_USER_DATA', JSON.stringify(liveUser));
          updateRoleUI();
        }
        renderTahunAjaranDropdowns();
        populateLokasiFilter();
        refreshAll();
      });
    }
  }

  // --- 3. JIKA DI HALAMAN TAMU / GUEST (asset/page/guest.html) ---
  if (isGuestPage) {
    if (!savedSessionEmail) {
      window.location.href = '../../index.html';
      return;
    }

    initTahunAjaranManager();
    initFilters();
    initDashboardLogout();
    initModals();
    renderTahunAjaranDropdowns();
    populateLokasiFilter();
    renderInventoryTable();

    // Realtime Cloud Firestore sync listener
    if (window.db && typeof window.db.subscribe === 'function') {
      window.db.subscribe(() => {
        renderTahunAjaranDropdowns();
        populateLokasiFilter();
        renderInventoryTable();
      });
    }
  }
});

/* ===================================================
   0. APPLY CENTRALIZED APP TEXT DICTIONARY
   =================================================== */

function applyAppTexts() {
  if (typeof APP_TEXT === 'undefined') return;

  const emailInput = document.getElementById('login-landing-email');
  if (emailInput) emailInput.placeholder = APP_TEXT.login.emailPlaceholder;

  const passInput = document.getElementById('login-landing-password');
  if (passInput) passInput.placeholder = APP_TEXT.login.passwordPlaceholder;

  const searchInput = document.getElementById('excel-search-input');
  if (searchInput) searchInput.placeholder = APP_TEXT.inventoryView.searchPlaceholder;
}

/* ===================================================
   1. AUTHENTICATION & LOGIN LANDING SCREEN (index.html)
   =================================================== */

function initAuthLanding() {
  const formLogin = document.getElementById('form-login-landing');
  if (!formLogin) return;

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-landing-email').value.trim();
    const password = document.getElementById('login-landing-password').value.trim();

    const targetUser = window.db.getUserByEmail(email);
    if (!targetUser) {
      showToast(APP_TEXT.login.errorAuth, 'error');
      return;
    }

    const isValid = window.db.verifyPassword(email, password);
    if (isValid) {
      const userIdentifier = targetUser.email || targetUser.username || targetUser.id;
      localStorage.setItem('INVENTARIS_LOGGED_USER', userIdentifier);
      localStorage.setItem('INVENTARIS_LOGGED_USER_DATA', JSON.stringify(targetUser));
      sessionStorage.setItem('INVENTARIS_LOGGED_USER', userIdentifier);
      sessionStorage.setItem('INVENTARIS_LOGGED_USER_DATA', JSON.stringify(targetUser));

      showToast(`${APP_TEXT.login.welcomePrefix}, ${targetUser.name}! (${targetUser.roleTitle})`, 'success');
      setTimeout(() => {
        if (targetUser.role === 'guest') {
          window.location.href = 'asset/page/guest.html';
        } else {
          window.location.href = 'asset/page/dashboard.html';
        }
      }, 250);
    } else {
      showToast(APP_TEXT.login.errorAuth, 'error');
    }
  });
}

function initDashboardLogout() {
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm(APP_TEXT.login.logoutConfirm)) {
        localStorage.removeItem('INVENTARIS_LOGGED_USER');
        localStorage.removeItem('INVENTARIS_LOGGED_USER_DATA');
        sessionStorage.removeItem('INVENTARIS_LOGGED_USER');
        sessionStorage.removeItem('INVENTARIS_LOGGED_USER_DATA');
        window.location.href = '../../index.html';
      }
    });
  }
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
   SIDEBAR FOLD / UNFOLD MANAGER
   =================================================== */

const SIDEBAR_COLLAPSED_KEY = 'INVENTARIS_SIDEBAR_COLLAPSED';

function initSidebarToggle() {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;

  const btnHeaderToggle = document.getElementById('btn-toggle-sidebar');
  const btnSidebarFold = document.getElementById('btn-sidebar-fold');

  // Muat status fold dari localStorage (default: false / unfold terbuka)
  const isCollapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  if (isCollapsed) {
    sidebar.classList.add('collapsed');
  } else {
    sidebar.classList.remove('collapsed');
  }
  updateSidebarToggleUI(isCollapsed);

  function toggleSidebar() {
    const willCollapse = !sidebar.classList.contains('collapsed');
    sidebar.classList.toggle('collapsed', willCollapse);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, willCollapse ? 'true' : 'false');
    updateSidebarToggleUI(willCollapse);
  }

  function updateSidebarToggleUI(collapsed) {
    if (btnHeaderToggle) {
      btnHeaderToggle.title = collapsed ? 'Buka Panel Menu Samping' : 'Lipat Panel Menu Samping';
      btnHeaderToggle.setAttribute('aria-expanded', String(!collapsed));
      btnHeaderToggle.innerHTML = `<i class="ph-bold ${collapsed ? 'ph-sidebar' : 'ph-sidebar-simple'}"></i>`;
    }
    if (btnSidebarFold) {
      btnSidebarFold.title = collapsed ? 'Buka Menu Samping' : 'Lipat Menu Samping';
      btnSidebarFold.setAttribute('aria-label', collapsed ? 'Buka Menu Samping' : 'Lipat Menu Samping');
      btnSidebarFold.innerHTML = `<i class="ph-bold ${collapsed ? 'ph-caret-right' : 'ph-caret-left'}"></i>`;
    }
  }

  if (btnHeaderToggle) {
    btnHeaderToggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
    });
  }

  if (btnSidebarFold) {
    btnSidebarFold.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
    });
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

function populateLokasiFilter() {
  const lokasiSelect = document.getElementById('filter-excel-lokasi');
  if (!lokasiSelect) return;
  const currentVal = lokasiSelect.value || 'all';
  const items = window.db.getAll();
  const uniqueLokasi = Array.from(new Set(items.map(i => i.lokasiRak).filter(Boolean))).sort();
  
  lokasiSelect.innerHTML = '<option value="all">Semua Lokasi / Rak</option>';
  uniqueLokasi.forEach(lok => {
    const selected = lok === currentVal ? 'selected' : '';
    lokasiSelect.innerHTML += `<option value="${lok}" ${selected}>${lok}</option>`;
  });
}

function refreshAll() {
  renderInventoryTable();
  renderRekapitulasi();
  renderLoansTable();
  renderProposalsTable();
}

// Render Tabel Inventaris (Sheet 1 Excel)
function renderInventoryTable() {
  const items = window.db.getAll();
  const searchInput = document.getElementById('excel-search-input');
  const kondisiSelect = document.getElementById('filter-excel-kondisi');
  const lokasiSelect = document.getElementById('filter-excel-lokasi');
  const statusSelect = document.getElementById('filter-excel-status');

  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const kondisiFilter = kondisiSelect ? kondisiSelect.value : 'all';
  const lokasiFilter = lokasiSelect ? lokasiSelect.value : 'all';
  const statusFilter = statusSelect ? statusSelect.value : 'all';

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
  if (!tbody) return;
  tbody.innerHTML = '';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 24px; color: var(--text-dim);">Tidak ditemukan data barang.</td></tr>`;
    return;
  }

  const userRole = (currentUser && currentUser.role) ? currentUser.role : 'guest';

  filtered.forEach(item => {
    let kondisiBadge = 'badge-condition-baik';
    if (item.kondisi === 'Rusak Ringan') kondisiBadge = 'badge-condition-rusak_ringan';
    if (item.kondisi === 'Rusak Berat') kondisiBadge = 'badge-condition-rusak_berat';
    if (item.kondisi === 'Hilang') kondisiBadge = 'badge-condition-afkir';

    // Foto Thumbnail (Rekomendasi No. 3)
    const photoHtml = item.fotoBarang
      ? `<div class="item-table-thumb-wrap" onclick="openLightbox('${item.id}')" title="Klik untuk melihat foto beresolusi penuh">
           <img src="${item.fotoBarang}" class="item-table-thumb" alt="${item.namaBarang}">
         </div>`
      : `<div class="item-table-thumb-wrap" title="Belum ada foto">
           <i class="ph-bold ph-package item-thumb-placeholder"></i>
         </div>`;

    let actionButtons = '';
    if (userRole === 'toolman') {
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
    } else if (userRole === 'guru') {
      // Guru: Pengusul
      actionButtons = `
        <button class="btn btn-sm btn-secondary" onclick="openProposalForExisting('${item.id}')" title="Ajukan Tambahan / Modifikasi ke Toolman">
          <i class="ph ph-paper-plane-tilt"></i> Usulkan
        </button>
      `;
    } else if (userRole === 'guest') {
      // Guest: Read-only badge
      actionButtons = `
        <span class="badge badge-asset" style="font-size: 0.75rem; padding: 4px 8px;"><i class="ph ph-check-circle" style="color: var(--color-success); margin-right: 4px;"></i>Terdata</span>
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
        <td>
          <div class="item-cell-with-photo">
            ${photoHtml}
            <div>
              <strong>${item.namaBarang}</strong>
            </div>
          </div>
        </td>
        <td style="color: var(--text-muted);">${item.spesifikasiMerk || '-'}</td>
        <td><strong>${item.jumlah}</strong> <small style="color: var(--text-dim);">${item.satuan}</small></td>
        <td><span class="badge ${kondisiBadge}">${item.kondisi}</span></td>
        <td><span class="badge badge-asset">${item.statusPenggunaan || 'Digunakan'}</span></td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${item.sumberDana || 'Dana sekolah'}</td>
        <td><i class="ph ph-map-pin text-cyan"></i> ${item.lokasiRak}</td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${item.tglCekTerakhir || '-'}</td>
        <td style="color: var(--text-dim); font-size: 0.8rem;">${item.keterangan || '-'}</td>
        <td class="${userRole === 'guest' ? 'text-center' : 'text-right'}">${actionButtons}</td>
      </tr>
    `;
  });
}

// Render Rekapitulasi (Sheet 2 Excel)
function renderRekapitulasi() {
  const rekap = window.db.getRekapitulasi();

  const elBaikUnit = document.getElementById('rekap-unit-baik');
  const elBaikJenis = document.getElementById('rekap-jenis-baik');
  const elRusakUnit = document.getElementById('rekap-unit-rusak-ringan');
  const elRusakJenis = document.getElementById('rekap-jenis-rusak-ringan');
  const elBeratUnit = document.getElementById('rekap-unit-rusak-berat');
  const elTotalUnit = document.getElementById('rekap-total-unit');
  const elTotalJenis = document.getElementById('rekap-total-jenis');

  if (elBaikUnit) elBaikUnit.textContent = rekap.baik.unit;
  if (elBaikJenis) elBaikJenis.textContent = `${rekap.baik.jenis} jenis barang`;
  if (elRusakUnit) elRusakUnit.textContent = rekap.rusakRingan.unit;
  if (elRusakJenis) elRusakJenis.textContent = `${rekap.rusakRingan.jenis} jenis barang`;
  if (elBeratUnit) elBeratUnit.textContent = rekap.rusakBerat.unit + rekap.hilang.unit;
  if (elTotalUnit) elTotalUnit.textContent = rekap.totalUnit;
  if (elTotalJenis) elTotalJenis.textContent = `${rekap.totalJenis} jenis barang`;

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
  const btnRbac = document.getElementById('btn-open-rbac-guide');
  if (btnRbac) btnRbac.addEventListener('click', () => openModal('modal-rbac-info'));

  const btnSettings = document.getElementById('btn-open-settings');
  if (btnSettings) btnSettings.addEventListener('click', () => openModal('modal-settings'));

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      closeModal(modalId);
    });
  });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

let activeReviewPropId = null;

function initForms() {
  // Form Master Item (Toolman sebagai Petugas Utama)
  const formItem = document.getElementById('form-item');
  if (formItem) {
    formItem.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (currentUser && currentUser.role === 'guru') {
        showToast('Guru hanya dapat mengajukan usulan pengadaan barang', 'info');
        closeModal('modal-item');
        openProposalModal();
        return;
      }

      const editIdEl = document.getElementById('form-item-id') || document.getElementById('item-id');
      const editId = editIdEl ? editIdEl.value : '';

      const getVal = (id1, id2) => {
        const el = document.getElementById(id1) || document.getElementById(id2);
        return el ? el.value.trim() : '';
      };

      const payload = {
        kodeBarang: getVal('item-kode', 'form-kode'),
        namaBarang: getVal('item-nama', 'form-nama'),
        fotoBarang: document.getElementById('item-foto-data') ? document.getElementById('item-foto-data').value : '',
        spesifikasiMerk: getVal('item-spesifikasi', 'form-spek') || '-',
        jumlah: parseInt(getVal('item-jumlah', 'form-jumlah')) || 1,
        satuan: getVal('item-satuan', 'form-satuan') || 'Unit',
        kondisi: getVal('item-kondisi', 'form-kondisi') || 'Baik',
        statusPenggunaan: getVal('item-status', 'form-status') || 'Digunakan',
        tahunPerolehan: getVal('item-tahun', 'form-tahun') || new Date().getFullYear().toString(),
        sumberDana: getVal('item-dana', 'form-dana') || 'Dana sekolah',
        lokasiRak: getVal('item-lokasi', 'form-lokasi') || 'Lemari 1',
        tglCekTerakhir: getVal('item-tgl-cek', 'form-tgl-cek') || new Date().toISOString().split('T')[0],
        keterangan: getVal('item-keterangan', 'form-keterangan') || '-'
      };

      if (editId) {
        await window.db.updateItem(editId, payload);
        showToast(`Data "${payload.namaBarang}" berhasil diperbarui!`, 'success');
      } else {
        await window.db.addItem(payload);
        showToast(`Barang baru "${payload.namaBarang}" berhasil ditambahkan!`, 'success');
      }

      closeModal('modal-item');
      refreshAll();
    });
  }

  // Form Proposal (Usulan Guru)
  const formProposal = document.getElementById('form-proposal');
  if (formProposal) {
    formProposal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const getVal = (id1, id2) => {
        const el = document.getElementById(id1) || document.getElementById(id2);
        return el ? el.value.trim() : '';
      };

      const payload = {
        kodeBarang: getVal('prop-kode'),
        namaBarang: getVal('prop-nama'),
        spesifikasiMerk: getVal('prop-spesifikasi', 'prop-spek') || '-',
        jumlah: parseInt(getVal('prop-jumlah')) || 1,
        satuan: getVal('prop-satuan') || 'Unit',
        lokasiRak: getVal('prop-lokasi') || 'Lemari 1',
        keterangan: getVal('prop-keterangan') || '-',
        pengusulNama: currentUser ? `${currentUser.name} (${currentUser.roleTitle})` : 'Guru Praktik',
        pengusulEmail: currentUser ? (currentUser.email || currentUser.username) : 'guru'
      };

      await window.db.addProposal(payload);
      showToast(`Usulan "${payload.namaBarang}" berhasil dikirim ke Toolman!`, 'success');
      closeModal('modal-proposal');
      switchView('proposals');
    });
  }

  // Review Proposal Buttons (Toolman)
  const btnApprove = document.getElementById('btn-approve-proposal');
  if (btnApprove) {
    btnApprove.addEventListener('click', async () => {
      const notesEl = document.getElementById('review-prop-notes') || document.getElementById('review-notes');
      const notes = notesEl ? notesEl.value.trim() : 'Disetujui Toolman';
      if (activeReviewPropId) {
        const result = await window.db.approveProposal(activeReviewPropId, notes);
        if (result) {
          showToast(`Usulan "${result.namaBarang}" DISETUJUI Toolman & otomatis masuk ke Master Database!`, 'success');
        }
        closeModal('modal-review-proposal');
        refreshAll();
      }
    });
  }

  const btnReject = document.getElementById('btn-reject-proposal');
  if (btnReject) {
    btnReject.addEventListener('click', async () => {
      const notesEl = document.getElementById('review-prop-notes') || document.getElementById('review-notes');
      const notes = notesEl ? notesEl.value.trim() : '';
      if (!notes) {
        showToast('Wajib memberikan catatan alasan penolakan!', 'error');
        return;
      }
      if (activeReviewPropId) {
        const result = await window.db.rejectProposal(activeReviewPropId, notes);
        if (result) {
          showToast(`Usulan "${result.namaBarang}" DITOLAK oleh Toolman. Log tercatat untuk Kajur.`, 'info');
        }
        closeModal('modal-review-proposal');
        refreshAll();
      }
    });
  }

  // Event Ganti Password Modal
  const btnOpenCP = document.getElementById('btn-open-change-password');
  if (btnOpenCP) {
    btnOpenCP.addEventListener('click', () => {
      if (currentUser) {
        const nameEl = document.getElementById('cp-user-name');
        const emailEl = document.getElementById('cp-user-email');
        if (nameEl) nameEl.textContent = currentUser.name;
        if (emailEl) emailEl.textContent = currentUser.email || currentUser.username;
      }
      const formCP = document.getElementById('form-change-password');
      if (formCP) formCP.reset();
      openModal('modal-change-password');
    });
  }

  const formCP = document.getElementById('form-change-password');
  if (formCP) {
    formCP.addEventListener('submit', async (e) => {
      e.preventDefault();
      const oldPass = document.getElementById('cp-old-password').value.trim();
      const newPass = document.getElementById('cp-new-password').value.trim();
      const confirmPass = document.getElementById('cp-confirm-password').value.trim();

      if (newPass !== confirmPass) {
        showToast('Konfirmasi password baru tidak cocok!', 'error');
        return;
      }

      try {
        await window.db.changePassword(currentUser.email || currentUser.username, oldPass, newPass);
        showToast(`Password akun ${currentUser.name} berhasil diperbarui!`, 'success');
        closeModal('modal-change-password');
      } catch (err) {
        showToast(err.message || 'Gagal mengubah password', 'error');
      }
    });
  }
}

function openItemModal(itemData = null) {
  const form = document.getElementById('form-item');
  if (form) form.reset();

  const setVal = (id1, id2, val) => {
    const el = document.getElementById(id1) || document.getElementById(id2);
    if (el) el.value = val;
  };

  // Reset Dropzone Foto
  const fotoInput = document.getElementById('item-foto-data');
  const previewBox = document.getElementById('item-photo-preview-box');
  const previewImg = document.getElementById('item-photo-preview-img');
  const previewName = document.getElementById('item-photo-preview-name');
  const previewSize = document.getElementById('item-photo-preview-size');
  const fileInput = document.getElementById('item-foto-file-input');

  if (fileInput) fileInput.value = '';

  if (itemData) {
    const titleEl = document.getElementById('modal-item-title');
    if (titleEl) titleEl.innerHTML = '<i class="ph-bold ph-pencil"></i> Edit Master Inventaris (Toolman)';
    setVal('form-item-id', 'item-id', itemData.id);
    setVal('item-kode', 'form-kode', itemData.kodeBarang || '');
    setVal('item-nama', 'form-nama', itemData.namaBarang || '');
    setVal('item-spesifikasi', 'form-spek', itemData.spesifikasiMerk || '');
    setVal('item-jumlah', 'form-jumlah', itemData.jumlah || 1);
    setVal('item-satuan', 'form-satuan', itemData.satuan || 'Unit');
    setVal('item-kondisi', 'form-kondisi', itemData.kondisi || 'Baik');
    setVal('item-status', 'form-status', itemData.statusPenggunaan || 'Digunakan');
    setVal('item-tahun', 'form-tahun', itemData.tahunPerolehan || '2026');
    setVal('item-dana', 'form-dana', itemData.sumberDana || 'Dana sekolah');
    setVal('item-lokasi', 'form-lokasi', itemData.lokasiRak || 'Lemari 1');
    setVal('item-tgl-cek', 'form-tgl-cek', itemData.tglCekTerakhir || '');
    setVal('item-keterangan', 'form-keterangan', itemData.keterangan || '');

    if (itemData.fotoBarang) {
      if (fotoInput) fotoInput.value = itemData.fotoBarang;
      if (previewImg) previewImg.src = itemData.fotoBarang;
      if (previewName) previewName.textContent = `${itemData.namaBarang}.webp`;
      if (previewSize) previewSize.textContent = `Tersimpan di database`;
      if (previewBox) previewBox.style.display = 'flex';
    } else {
      if (fotoInput) fotoInput.value = '';
      if (previewBox) previewBox.style.display = 'none';
    }
  } else {
    const titleEl = document.getElementById('modal-item-title');
    if (titleEl) titleEl.innerHTML = '<i class="ph-bold ph-cube"></i> Tambah Master Inventaris (Toolman)';
    setVal('form-item-id', 'item-id', '');
    setVal('item-tgl-cek', 'form-tgl-cek', new Date().toISOString().split('T')[0]);
    if (fotoInput) fotoInput.value = '';
    if (previewBox) previewBox.style.display = 'none';
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
    const setVal = (id1, id2, val) => {
      const el = document.getElementById(id1) || document.getElementById(id2);
      if (el) el.value = val;
    };
    setVal('prop-kode', '', item.kodeBarang);
    setVal('prop-nama', '', item.namaBarang);
    setVal('prop-spesifikasi', 'prop-spek', item.spesifikasiMerk || '');
    setVal('prop-satuan', '', item.satuan || 'Unit');
    setVal('prop-lokasi', '', item.lokasiRak || 'Lemari 1');
    setVal('prop-keterangan', '', `Penambahan kuantitas untuk ${item.namaBarang}`);
  }
};

window.openReviewModal = function(propId) {
  const prop = window.db.getProposals().find(p => p.id === propId);
  if (!prop) return;

  activeReviewPropId = prop.id;

  const detailsEl = document.getElementById('review-prop-details');
  if (detailsEl) {
    detailsEl.innerHTML = `
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
  }
  const notesEl = document.getElementById('review-prop-notes') || document.getElementById('review-notes');
  if (notesEl) notesEl.value = 'Disetujui. Sesuai kurikulum praktik elektronika.';
  openModal('modal-review-proposal');
};

/* ===================================================
   5. PHOTO UPLOAD & LIGHTBOX PREVIEW (REKOMENDASI NO. 3)
   =================================================== */

function initPhotoUpload() {
  const dropzone = document.getElementById('item-photo-dropzone');
  const fileInput = document.getElementById('item-foto-file-input');
  const fotoDataInput = document.getElementById('item-foto-data');
  const previewBox = document.getElementById('item-photo-preview-box');
  const previewImg = document.getElementById('item-photo-preview-img');
  const previewName = document.getElementById('item-photo-preview-name');
  const previewSize = document.getElementById('item-photo-preview-size');
  const btnRemove = document.getElementById('btn-remove-item-photo');

  if (!dropzone || !fileInput) return;

  // Klik dropzone memicu file picker
  dropzone.addEventListener('click', () => fileInput.click());

  // Drag and Drop
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', async (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processSelectedPhoto(files[0]);
    }
  });

  fileInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processSelectedPhoto(files[0]);
    }
  });

  if (btnRemove) {
    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      if (fileInput) fileInput.value = '';
      if (fotoDataInput) fotoDataInput.value = '';
      if (previewBox) previewBox.style.display = 'none';
      showToast('Foto barang dihapus', 'info');
    });
  }

  async function processSelectedPhoto(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Berkas yang dipilih harus berupa gambar (JPG/PNG/WebP)!', 'error');
      return;
    }

    try {
      showToast('Mengompresi foto barang...', 'info');
      const compressed = await FirebaseInventoryStore.compressImageFile(file, 800, 800, 0.75);

      if (fotoDataInput) fotoDataInput.value = compressed.dataUrl;
      if (previewImg) previewImg.src = compressed.dataUrl;
      if (previewName) previewName.textContent = file.name;
      if (previewSize) previewSize.textContent = `${compressed.sizeKb} KB (Terkompresi WebP)`;
      if (previewBox) previewBox.style.display = 'flex';

      showToast(`Foto berhasil dioptimasi (${compressed.sizeKb} KB)!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal memproses foto: ' + err.message, 'error');
    }
  }
}

// Lightbox Preview Zoom
window.openLightbox = function(itemId) {
  const item = window.db.getById(itemId);
  if (!item || !item.fotoBarang) return;

  const previewImg = document.getElementById('lightbox-preview-img');
  const captionName = document.getElementById('lightbox-item-name');
  const captionMeta = document.getElementById('lightbox-item-meta');

  if (previewImg) previewImg.src = item.fotoBarang;
  if (captionName) captionName.textContent = item.namaBarang;
  if (captionMeta) captionMeta.textContent = `${item.kodeBarang} • ${item.spesifikasiMerk || '-'} • Lokasi: ${item.lokasiRak || 'Lemari 1'}`;

  openModal('modal-image-preview');
};

/* ===================================================
   6. LOGBOOK PEMINJAMAN ALAT SISWA (REKOMENDASI NO. 2)
   =================================================== */

let activeReturnLoanId = null;

function initLoansManager() {
  const btnOpenAddLoan = document.getElementById('btn-open-add-loan');
  if (btnOpenAddLoan) {
    btnOpenAddLoan.addEventListener('click', () => {
      openAddLoanModal();
    });
  }

  // Listener pilih barang pada modal pinjam
  const selectItem = document.getElementById('loan-item-select');
  const stockHint = document.getElementById('loan-stock-hint');
  const qtyInput = document.getElementById('loan-qty');

  if (selectItem) {
    selectItem.addEventListener('change', () => {
      const itemId = selectItem.value;
      if (!itemId) {
        if (stockHint) stockHint.textContent = 'Stok tersedia: -';
        if (qtyInput) qtyInput.removeAttribute('max');
        return;
      }

      const item = window.db.getById(itemId);
      if (item) {
        const availableStock = parseInt(item.jumlah) || 1;
        if (stockHint) stockHint.textContent = `Stok tersedia di rak: ${availableStock} ${item.satuan} (${item.lokasiRak})`;
        if (qtyInput) {
          qtyInput.max = availableStock;
          if (parseInt(qtyInput.value) > availableStock) {
            qtyInput.value = availableStock;
          }
        }
      }
    });
  }

  // Form Tambah Pinjam Baru
  const formAddLoan = document.getElementById('form-add-loan');
  if (formAddLoan) {
    formAddLoan.addEventListener('submit', async (e) => {
      e.preventDefault();
      const itemId = document.getElementById('loan-item-select').value;
      const studentName = document.getElementById('loan-student-name').value.trim();
      const studentClass = document.getElementById('loan-student-class').value.trim();
      const qty = parseInt(document.getElementById('loan-qty').value) || 1;
      const dateStart = document.getElementById('loan-date-start').value;
      const dateDue = document.getElementById('loan-date-due').value;
      const purpose = document.getElementById('loan-purpose').value.trim();

      const item = window.db.getById(itemId);
      if (!item) {
        showToast('Pilih barang yang valid!', 'error');
        return;
      }

      const availableStock = parseInt(item.jumlah) || 1;
      if (qty > availableStock) {
        showToast(`Jumlah pinjam (${qty}) melebihi stok tersedia (${availableStock})!`, 'error');
        return;
      }

      const payload = {
        itemId: item.id,
        kodeBarang: item.kodeBarang,
        namaBarang: item.namaBarang,
        namaSiswa: studentName,
        kelasSiswa: studentClass,
        jumlahPinjam: qty,
        satuan: item.satuan || 'Unit',
        tglPinjam: dateStart,
        tglKembaliRencana: dateDue,
        keperluan: purpose,
        petugasPinjam: currentUser ? `${currentUser.name} (${currentUser.roleTitle})` : 'Toolman TEI',
        tahunAjaran: window.db.getActiveTahunAjaran()
      };

      try {
        await window.db.addLoan(payload);
        showToast(`Peminjaman ${qty} ${item.satuan} "${item.namaBarang}" untuk ${studentName} berhasil dicatat!`, 'success');
        closeModal('modal-add-loan');
        refreshAll();
      } catch (err) {
        showToast('Gagal mencatat peminjaman: ' + err.message, 'error');
      }
    });
  }

  // Form Verifikasi Pengembalian (Check-in)
  const formReturnLoan = document.getElementById('form-return-loan');
  if (formReturnLoan) {
    formReturnLoan.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeReturnLoanId) return;

      const actualDate = document.getElementById('return-actual-date').value;
      const condition = document.getElementById('return-condition').value;
      const updateMaster = document.getElementById('return-update-master').checked;
      const notes = document.getElementById('return-notes').value.trim();

      try {
        const result = await window.db.returnLoan(activeReturnLoanId, {
          tglKembaliAktual: actualDate,
          kondisiKembali: condition,
          updateMasterKondisi: updateMaster,
          catatanKembali: notes,
          petugasKembali: currentUser ? `${currentUser.name} (${currentUser.roleTitle})` : 'Toolman TEI'
        });

        showToast(`Pengembalian alat "${result.namaBarang}" dari ${result.namaSiswa} berhasil dikonfirmasi!`, 'success');
        closeModal('modal-return-loan');
        refreshAll();
      } catch (err) {
        showToast('Gagal memproses pengembalian: ' + err.message, 'error');
      }
    });
  }

  // Search & Filter Listeners for Loans
  const searchInput = document.getElementById('loan-search-input');
  if (searchInput) searchInput.addEventListener('input', renderLoansTable);

  const filterStatus = document.getElementById('filter-loan-status');
  if (filterStatus) {
    filterStatus.addEventListener('change', () => {
      // Sinkronkan active state pada pills
      const val = filterStatus.value;
      document.querySelectorAll('.loan-pill-btn').forEach(btn => {
        if (btn.getAttribute('data-loan-filter') === val) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      renderLoansTable();
    });
  }

  // Quick Filter Pills (Mobile / Touch Friendly)
  document.querySelectorAll('.loan-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.loan-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-loan-filter') || 'all';
      if (filterStatus) {
        filterStatus.value = filterVal;
      }
      renderLoansTable();
    });
  });
}

function openAddLoanModal() {
  const form = document.getElementById('form-add-loan');
  if (form) form.reset();

  // Set default dates
  const todayStr = new Date().toISOString().split('T')[0];
  const dueDefault = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // +1 hari

  const dateStartEl = document.getElementById('loan-date-start');
  const dateDueEl = document.getElementById('loan-date-due');
  if (dateStartEl) dateStartEl.value = todayStr;
  if (dateDueEl) dateDueEl.value = dueDefault;

  // Populate item dropdown with available tools in current TA
  const selectItem = document.getElementById('loan-item-select');
  if (selectItem) {
    selectItem.innerHTML = '<option value="">-- Pilih Barang dari Master Inventaris --</option>';
    const items = window.db.getAll();
    items.forEach(item => {
      const stock = parseInt(item.jumlah) || 0;
      if (stock > 0 && item.kondisi !== 'Hilang' && item.kondisi !== 'Rusak Berat') {
        selectItem.innerHTML += `<option value="${item.id}">${item.kodeBarang} - ${item.namaBarang} (Stok: ${stock} ${item.satuan} • ${item.lokasiRak})</option>`;
      }
    });
  }

  const stockHint = document.getElementById('loan-stock-hint');
  if (stockHint) stockHint.textContent = 'Pilih barang untuk melihat ketersediaan stok';

  openModal('modal-add-loan');
}

// Render Tabel Logbook Peminjaman (Desktop & Mobile Optimized)
function renderLoansTable() {
  const loans = window.db.getLoans();
  const searchInput = document.getElementById('loan-search-input');
  const statusSelect = document.getElementById('filter-loan-status');

  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const filterStatusVal = statusSelect ? statusSelect.value : 'all';
  const today = new Date().toISOString().split('T')[0];

  const filtered = loans.filter(loan => {
    const isOverdue = loan.status === 'Dipinjam' && loan.tglKembaliRencana && loan.tglKembaliRencana < today;
    const computedStatus = isOverdue ? 'Terlambat' : loan.status;

    const matchSearch = (loan.namaSiswa && loan.namaSiswa.toLowerCase().includes(search)) ||
                        (loan.kelasSiswa && loan.kelasSiswa.toLowerCase().includes(search)) ||
                        (loan.namaBarang && loan.namaBarang.toLowerCase().includes(search)) ||
                        (loan.kodeBarang && loan.kodeBarang.toLowerCase().includes(search)) ||
                        (loan.keperluan && loan.keperluan.toLowerCase().includes(search));

    let matchStatus = true;
    if (filterStatusVal === 'Dipinjam') {
      matchStatus = loan.status === 'Dipinjam';
    } else if (filterStatusVal === 'Terlambat') {
      matchStatus = isOverdue;
    } else if (filterStatusVal === 'Kembali') {
      matchStatus = loan.status === 'Kembali';
    }

    return matchSearch && matchStatus;
  });

  // Render Stat Cards & Badge
  const stats = window.db.getLoanStats();
  const statTotal = document.getElementById('loan-stat-total');
  const statDipinjam = document.getElementById('loan-stat-dipinjam');
  const statUnitDipinjam = document.getElementById('loan-stat-unit-dipinjam');
  const statTerlambat = document.getElementById('loan-stat-terlambat');
  const statKembali = document.getElementById('loan-stat-kembali');
  const navBadge = document.getElementById('nav-loans-badge');

  if (statTotal) statTotal.textContent = stats.total;
  if (statDipinjam) statDipinjam.textContent = stats.dipinjam;
  if (statUnitDipinjam) statUnitDipinjam.textContent = `${stats.totalUnitDipinjam} unit alat di luar`;
  if (statTerlambat) statTerlambat.textContent = stats.terlambat;
  if (statKembali) statKembali.textContent = stats.kembali;

  if (navBadge) {
    if (stats.dipinjam > 0) {
      navBadge.textContent = stats.dipinjam;
      navBadge.style.display = 'inline-block';
      if (stats.terlambat > 0) {
        navBadge.className = 'badge badge-loan-overdue';
      } else {
        navBadge.className = 'badge badge-loan-active';
      }
    } else {
      navBadge.style.display = 'none';
    }
  }

  // 1. RENDER TABEL DESKTOP
  const tbody = document.getElementById('tbody-loans-logbook');
  if (tbody) {
    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 24px; color: var(--text-dim);">Tidak ada catatan peminjaman alat.</td></tr>`;
    } else {
      filtered.forEach((loan, idx) => {
        const isOverdue = loan.status === 'Dipinjam' && loan.tglKembaliRencana && loan.tglKembaliRencana < today;
        
        let statusBadge = '<span class="badge badge-loan-active"><i class="ph-bold ph-clock"></i> Dipinjam</span>';
        if (isOverdue) {
          statusBadge = '<span class="badge badge-loan-overdue"><i class="ph-bold ph-warning"></i> Terlambat</span>';
        } else if (loan.status === 'Kembali') {
          statusBadge = '<span class="badge badge-loan-returned"><i class="ph-bold ph-check-circle"></i> Selesai Kembali</span>';
        }

        let actionButtons = '';
        if (loan.status === 'Dipinjam') {
          actionButtons = `
            <div style="display: flex; justify-content: flex-end; gap: 6px;">
              <button class="btn btn-sm btn-primary" onclick="openReturnLoanModal('${loan.id}')" title="Proses Pengembalian / Check-in Alat">
                <i class="ph-bold ph-arrow-u-up-left"></i> Kembalikan
              </button>
            </div>
          `;
        } else {
          actionButtons = `
            <span class="badge badge-asset" style="font-size: 0.75rem; color: var(--color-success);"><i class="ph-bold ph-check"></i> Selesai</span>
          `;
        }

        const tglKembaliInfo = loan.status === 'Kembali' 
          ? `<div><strong>${loan.tglKembaliAktual || '-'}</strong><br><small class="badge badge-${loan.kondisiKembali === 'Baik' ? 'condition-baik' : 'condition-rusak_ringan'}" style="font-size: 0.7rem; padding: 2px 6px;">Kondisi: ${loan.kondisiKembali || 'Baik'}</small></div>`
          : `<span style="color: var(--text-dim); font-size: 0.8rem;">-</span>`;

        tbody.innerHTML += `
          <tr>
            <td style="color: var(--text-dim); text-align: center;">${idx + 1}</td>
            <td style="color: var(--text-muted); font-size: 0.82rem;">${loan.tglPinjam || '-'}</td>
            <td>
              <strong>${loan.namaSiswa}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${loan.keperluan || '-'}</div>
            </td>
            <td><span class="badge badge-asset" style="font-weight: 600;">${loan.kelasSiswa}</span></td>
            <td>
              <span class="code-tag" style="font-size: 0.72rem;">${loan.kodeBarang}</span> 
              <strong>${loan.namaBarang}</strong>
            </td>
            <td><strong>${loan.jumlahPinjam}</strong> <small style="color: var(--text-dim);">${loan.satuan || 'Unit'}</small></td>
            <td style="color: ${isOverdue ? 'var(--color-danger)' : 'var(--text-main)'}; font-weight: ${isOverdue ? '700' : '500'}; font-size: 0.82rem;">
              ${loan.tglKembaliRencana || '-'}
            </td>
            <td>${statusBadge}</td>
            <td>${tglKembaliInfo}</td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">${loan.petugasPinjam || '-'}</td>
            <td class="text-right">${actionButtons}</td>
          </tr>
        `;
      });
    }
  }

  // 2. RENDER MOBILE CARDS LIST (KHUSUS PONSEL / TOUCH SCREEN)
  const mobileContainer = document.getElementById('list-loans-mobile');
  if (mobileContainer) {
    mobileContainer.innerHTML = '';
    if (filtered.length === 0) {
      mobileContainer.innerHTML = `
        <div class="table-card" style="text-align: center; padding: 28px 16px; color: var(--text-dim);">
          <i class="ph-bold ph-hand-coins" style="font-size: 2.2rem; color: var(--text-dim); margin-bottom: 8px; display: block;"></i>
          <p>Tidak ada catatan peminjaman alat sesuai filter.</p>
        </div>
      `;
    } else {
      filtered.forEach((loan) => {
        const isOverdue = loan.status === 'Dipinjam' && loan.tglKembaliRencana && loan.tglKembaliRencana < today;
        let cardStatusClass = 'status-dipinjam';
        let statusBadge = '<span class="badge badge-loan-active"><i class="ph-bold ph-clock"></i> Dipinjam</span>';

        if (isOverdue) {
          cardStatusClass = 'status-terlambat';
          statusBadge = '<span class="badge badge-loan-overdue"><i class="ph-bold ph-warning"></i> Terlambat</span>';
        } else if (loan.status === 'Kembali') {
          cardStatusClass = 'status-kembali';
          statusBadge = '<span class="badge badge-loan-returned"><i class="ph-bold ph-check-circle"></i> Selesai Kembali</span>';
        }

        let actionBtnHtml = '';
        if (loan.status === 'Dipinjam') {
          actionBtnHtml = `
            <div class="loan-card-footer">
              <button type="button" class="btn btn-primary btn-block" onclick="openReturnLoanModal('${loan.id}')">
                <i class="ph-bold ph-arrow-u-up-left"></i> Proses Pengembalian Alat
              </button>
            </div>
          `;
        }

        const returnDetails = loan.status === 'Kembali'
          ? `<div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-sm); padding: 8px 10px; margin-bottom: 10px; font-size: 0.78rem;">
               <div style="color: var(--color-success); font-weight: 600;"><i class="ph-bold ph-check-circle"></i> Dikembalikan: ${loan.tglKembaliAktual || '-'}</div>
               <div style="color: var(--text-muted); margin-top: 2px;">Kondisi: <strong>${loan.kondisiKembali || 'Baik'}</strong> • Penerima: <strong>${loan.petugasKembali || '-'}</strong></div>
               ${loan.catatanKembali && loan.catatanKembali !== '-' ? `<div style="color: var(--text-dim); font-style: italic; margin-top: 2px;">"${loan.catatanKembali}"</div>` : ''}
             </div>`
          : '';

        mobileContainer.innerHTML += `
          <div class="loan-card-mobile ${cardStatusClass}">
            <div class="loan-card-header">
              <div class="loan-student-info">
                <strong>${loan.namaSiswa}</strong>
                <div class="loan-student-meta">
                  <span class="badge badge-asset">${loan.kelasSiswa}</span>
                  <small style="color: var(--text-dim); font-size: 0.75rem;">Petugas: ${loan.petugasPinjam || '-'}</small>
                </div>
              </div>
              <div>${statusBadge}</div>
            </div>

            <div class="loan-item-box">
              <div class="loan-item-title">
                <strong>${loan.namaBarang}</strong>
                <span class="loan-qty-badge"><i class="ph-bold ph-cube"></i> ${loan.jumlahPinjam} ${loan.satuan || 'Unit'}</span>
              </div>
              <span class="code-tag" style="font-size: 0.72rem;">${loan.kodeBarang}</span>
            </div>

            <div class="loan-dates-grid">
              <div class="loan-date-col">
                <span class="loan-date-label">Tgl. Pinjam</span>
                <span class="loan-date-val">${loan.tglPinjam || '-'}</span>
              </div>
              <div class="loan-date-col">
                <span class="loan-date-label">Batas Kembali</span>
                <span class="loan-date-val ${isOverdue ? 'overdue' : ''}">${loan.tglKembaliRencana || '-'} ${isOverdue ? '⚠️' : ''}</span>
              </div>
            </div>

            ${loan.keperluan ? `<div class="loan-extra-info"><i class="ph-bold ph-info"></i> ${loan.keperluan}</div>` : ''}
            ${returnDetails}
            ${actionBtnHtml}
          </div>
        `;
      });
    }
  }
}

// Modal Verifikasi Pengembalian
window.openReturnLoanModal = function(loanId) {
  const loan = window.db.getLoanById(loanId);
  if (!loan) return;

  activeReturnLoanId = loan.id;
  const summaryBox = document.getElementById('return-loan-summary-box');
  if (summaryBox) {
    summaryBox.innerHTML = `
      <div style="margin-bottom: 6px;">
        Peminjam: <strong style="color: var(--accent-cyan);">${loan.namaSiswa}</strong> (${loan.kelasSiswa})
      </div>
      <div style="margin-bottom: 6px;">
        Barang: <strong>${loan.namaBarang}</strong> (<span class="code-tag">${loan.kodeBarang}</span>)
      </div>
      <div style="margin-bottom: 4px; color: var(--text-muted);">
        Jumlah Dipinjam: <strong>${loan.jumlahPinjam} ${loan.satuan || 'Unit'}</strong> • Tgl. Pinjam: <strong>${loan.tglPinjam}</strong>
      </div>
      <div style="color: var(--text-dim); font-size: 0.78rem;">
        Batas Kembali: <strong>${loan.tglKembaliRencana}</strong>
      </div>
    `;
  }

  const returnDateEl = document.getElementById('return-actual-date');
  if (returnDateEl) returnDateEl.value = new Date().toISOString().split('T')[0];

  const conditionEl = document.getElementById('return-condition');
  if (conditionEl) conditionEl.value = 'Baik';

  const notesEl = document.getElementById('return-notes');
  if (notesEl) notesEl.value = 'Alat dikembalikan lengkap dan dalam kondisi baik.';

  openModal('modal-return-loan');
};

/* ===================================================
   7. FILTERS & SEARCH
   =================================================== */

function initFilters() {
  const searchInput = document.getElementById('excel-search-input');
  if (searchInput) searchInput.addEventListener('input', renderInventoryTable);

  const kondisiSelect = document.getElementById('filter-excel-kondisi');
  if (kondisiSelect) kondisiSelect.addEventListener('change', renderInventoryTable);

  const lokasiSelect = document.getElementById('filter-excel-lokasi');
  if (lokasiSelect) lokasiSelect.addEventListener('change', renderInventoryTable);

  const statusSelect = document.getElementById('filter-excel-status');
  if (statusSelect) statusSelect.addEventListener('change', renderInventoryTable);
}

/* ===================================================
   8. TOAST
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

