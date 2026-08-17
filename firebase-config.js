/**
 * Firebase Real Cloud Firestore & Auth Adapter
 * Project: inventaris-tei-smkmutu
 * SMK MUTU KEMLAGI - Teknik Elektronika Industri
 */

// 1. Konfigurasi Firebase Resmi Pengguna
const firebaseConfig = {
  apiKey: "AIzaSyBhwdWwFTi6xH6quZyyOnbVqgKWu6Teo1M",
  authDomain: "inventaris-tei-smkmutu.firebaseapp.com",
  projectId: "inventaris-tei-smkmutu",
  storageBucket: "inventaris-tei-smkmutu.firebasestorage.app",
  messagingSenderId: "18734181774",
  appId: "1:18734181774:web:4fb1444a5aa718be8808df"
};

// 2. Daftar Pengguna Resmi & Password Default: 12345
const DEFAULT_USERS_SEED = [
  {
    id: 'user-akbar',
    email: 'akbarhasfi020@gmail.com',
    name: 'Akbar Rayhan',
    role: 'toolman',
    roleTitle: 'Toolman Bengkel TEI (Petugas Utama)',
    initials: 'AR',
    password: '12345'
  },
  {
    id: 'user-sutarini',
    email: 'sutarinirs@gmail.com',
    name: 'Rahayu Sutarini',
    role: 'guru',
    roleTitle: 'Guru Praktik TEI (Pengusul Kebutuhan)',
    initials: 'RS',
    password: '12345'
  },
  {
    id: 'user-iskak',
    email: 'iskakfatoni@gmail.com',
    name: 'M. Iskak Fatoni',
    role: 'kajur',
    roleTitle: 'Kepala Program Keahlian (Kajur) TEI',
    initials: 'IF',
    password: '12345'
  }
];

// Data Awal dari File Excel (Untuk Inisialisasi Otomatis ke Cloud Firestore)
const EXCEL_INITIAL_SEED = [
  {
    no: 1,
    kodeBarang: 'TEI-TRN-001',
    namaBarang: 'Project Board / Trainer Kit',
    fotoBarang: '',
    spesifikasiMerk: '-',
    jumlah: 19,
    satuan: 'Unit',
    kondisi: 'Baik',
    statusPenggunaan: 'Digunakan',
    tahunPerolehan: '2026',
    sumberDana: 'Dana sekolah',
    lokasiRak: 'Etalase A',
    tglCekTerakhir: '2026-08-05',
    keterangan: 'Untuk Praktek SKE'
  },
  {
    no: 2,
    kodeBarang: 'TEI-ARD-002',
    namaBarang: 'Arduino Uno R3',
    fotoBarang: '',
    spesifikasiMerk: 'Original / ATmega328P',
    jumlah: 12,
    satuan: 'Unit',
    kondisi: 'Baik',
    statusPenggunaan: 'Digunakan',
    tahunPerolehan: '2026',
    sumberDana: 'Dana sekolah',
    lokasiRak: 'Lemari 1',
    tglCekTerakhir: '2026-07-27',
    keterangan: 'Untuk Praktek SKI'
  },
  {
    no: 3,
    kodeBarang: 'TEI-SLD-003',
    namaBarang: 'Solder Listrik',
    fotoBarang: '',
    spesifikasiMerk: '-',
    jumlah: 17,
    satuan: 'Unit',
    kondisi: 'Rusak Ringan',
    statusPenggunaan: 'Disimpan',
    tahunPerolehan: '2025',
    sumberDana: 'Dana sekolah',
    lokasiRak: 'Kontener box kecil',
    tglCekTerakhir: '2026-07-23',
    keterangan: 'Untuk Praktek Gamtek'
  },
  {
    no: 4,
    kodeBarang: 'TEI-ULC-004',
    namaBarang: 'Sensor Ultra Sonic',
    fotoBarang: '',
    spesifikasiMerk: 'HC-SR04',
    jumlah: 17,
    satuan: 'Unit',
    kondisi: 'Baik',
    statusPenggunaan: 'Digunakan',
    tahunPerolehan: '2026',
    sumberDana: 'Dana sekolah',
    lokasiRak: 'Lemari 1',
    tglCekTerakhir: '2026-07-27',
    keterangan: '-'
  },
  {
    no: 5,
    kodeBarang: 'TEI-LCD-005',
    namaBarang: 'LCD 16x2',
    fotoBarang: '',
    spesifikasiMerk: '16x2 Character Blue/Green',
    jumlah: 3,
    satuan: 'unit',
    kondisi: 'Baik',
    statusPenggunaan: 'Digunakan',
    tahunPerolehan: '2026',
    sumberDana: 'Dana sekolah',
    lokasiRak: 'Lemari 1',
    tglCekTerakhir: '2026-07-27',
    keterangan: '-'
  },
  {
    no: 6,
    kodeBarang: 'TEI-PIR-006',
    namaBarang: 'Sensor PIR',
    fotoBarang: '',
    spesifikasiMerk: 'HC-SR501',
    jumlah: 16,
    satuan: 'unit',
    kondisi: 'Baik',
    statusPenggunaan: 'Digunakan',
    tahunPerolehan: '2026',
    sumberDana: 'Dana sekolah',
    lokasiRak: 'Lemari 1',
    tglCekTerakhir: '2026-07-27',
    keterangan: '-'
  },
  {
    no: 7,
    kodeBarang: 'TEI-DHT-007',
    namaBarang: 'Sensor DHT-11',
    fotoBarang: '',
    spesifikasiMerk: 'Temperature & Humidity',
    jumlah: 33,
    satuan: 'unit',
    kondisi: 'Baik',
    statusPenggunaan: 'Digunakan',
    tahunPerolehan: '2026',
    sumberDana: 'Dana sekolah',
    lokasiRak: 'Lemari 1',
    tglCekTerakhir: '2026-07-27',
    keterangan: '-'
  },
  {
    no: 8,
    kodeBarang: 'TEI-ARS-008',
    namaBarang: 'Sensor Arus',
    fotoBarang: '',
    spesifikasiMerk: 'ACS712',
    jumlah: 1,
    satuan: 'unit',
    kondisi: 'Baik',
    statusPenggunaan: 'Disimpan',
    tahunPerolehan: '2026',
    sumberDana: 'Dana sekolah',
    lokasiRak: 'Lemari 1',
    tglCekTerakhir: '2026-07-27',
    keterangan: '-'
  },
  {
    no: 9,
    kodeBarang: 'TEI-BSR-001',
    namaBarang: 'BUSER/Speaker',
    fotoBarang: '',
    spesifikasiMerk: '5V Active Buzzer',
    jumlah: 9,
    satuan: 'Unit',
    kondisi: 'Baik',
    statusPenggunaan: 'Digunakan',
    tahunPerolehan: '2026',
    sumberDana: 'Dana sekolah',
    lokasiRak: 'Lemari 1',
    tglCekTerakhir: '2026-08-01',
    keterangan: '-'
  }
];

class FirebaseInventoryStore {
  constructor() {
    this.firebaseConfig = firebaseConfig;
    this.inventory = [];
    this.proposals = [];
    this.users = JSON.parse(JSON.stringify(DEFAULT_USERS_SEED));
    this.isCloudConnected = false;
    this.listeners = [];
  }

  async initFirebase() {
    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
      const { 
        getFirestore, collection, onSnapshot, doc, 
        setDoc, addDoc, updateDoc, deleteDoc, getDocs 
      } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

      this.app = initializeApp(this.firebaseConfig);
      this.db = getFirestore(this.app);

      // Realtime listener untuk koleksi inventaris
      const invCol = collection(this.db, "inventaris");
      onSnapshot(invCol, async (snapshot) => {
        if (snapshot.empty) {
          console.log("Cloud Firestore kosong, melakukan seeder otomatis dari Excel...");
          await this.seedInitialExcelData();
        } else {
          this.inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          this.inventory.sort((a, b) => (a.no || 0) - (b.no || 0));
          this.isCloudConnected = true;
          this.notifyListeners();
        }
      }, (err) => {
        console.warn("Firestore listener fallback ke lokal:", err.message);
        this.fallbackToLocal();
      });

      // Realtime listener untuk koleksi usulan barang
      const propCol = collection(this.db, "usulan_barang");
      onSnapshot(propCol, (snapshot) => {
        this.proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.notifyListeners();
      });

      // Realtime listener untuk koleksi users (pengaturan password)
      const usersCol = collection(this.db, "users");
      onSnapshot(usersCol, async (snapshot) => {
        if (snapshot.empty) {
          // Seed users default ke Firestore
          for (const u of DEFAULT_USERS_SEED) {
            await setDoc(doc(this.db, "users", u.id), u);
          }
        } else {
          this.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          this.notifyListeners();
        }
      }, () => {
        this.loadLocalUsers();
      });

      this.isCloudConnected = true;
      console.log("✅ Berhasil terhubung ke Cloud Firestore:", this.firebaseConfig.projectId);
      
      // Pastikan ketiga koleksi (inventaris, users, usulan_barang) ada di Firestore
      await this.seedInitialExcelData();
    } catch (e) {
      console.error("Gagal inisialisasi Firebase SDK, fallback ke LocalStore:", e);
      this.fallbackToLocal();
    }
  }

  loadLocalUsers() {
    const saved = localStorage.getItem('INVENTARIS_USERS_STORAGE');
    if (saved) {
      try {
        this.users = JSON.parse(saved);
      } catch (e) {
        this.users = JSON.parse(JSON.stringify(DEFAULT_USERS_SEED));
      }
    } else {
      this.users = JSON.parse(JSON.stringify(DEFAULT_USERS_SEED));
    }
  }

  saveLocalUsers() {
    localStorage.setItem('INVENTARIS_USERS_STORAGE', JSON.stringify(this.users));
  }

  fallbackToLocal() {
    this.isCloudConnected = false;
    const saved = localStorage.getItem('INVENTARIS_LOCAL_FALLBACK');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.inventory = parsed.inventory || EXCEL_INITIAL_SEED;
      this.proposals = parsed.proposals || [];
    } else {
      this.inventory = EXCEL_INITIAL_SEED;
      this.proposals = [];
    }
    this.loadLocalUsers();
    this.notifyListeners();
  }

  saveLocal() {
    localStorage.setItem('INVENTARIS_LOCAL_FALLBACK', JSON.stringify({
      inventory: this.inventory,
      proposals: this.proposals
    }));
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb());
  }

  // --- Auth & User Password Management ---
  getUsers() {
    return this.users;
  }

  getUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  verifyPassword(email, passwordInput) {
    const user = this.getUserByEmail(email);
    if (!user) return false;
    return (user.password || '12345') === passwordInput;
  }

  async changePassword(email, oldPassword, newPassword) {
    const user = this.getUserByEmail(email);
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }
    if ((user.password || '12345') !== oldPassword) {
      throw new Error("Password lama salah!");
    }
    if (!newPassword || newPassword.length < 5) {
      throw new Error("Password baru minimal 5 karakter!");
    }

    user.password = newPassword;
    user.updatedAt = new Date().toISOString();

    if (this.db && this.isCloudConnected) {
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await setDoc(doc(this.db, "users", user.id), user, { merge: true });
    } else {
      this.saveLocalUsers();
      this.notifyListeners();
    }

    return true;
  }

  // Seeder Data Excel & Users ke Cloud Firestore
  async seedInitialExcelData() {
    if (!this.db) return;
    try {
      const { collection, addDoc, doc, setDoc, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      
      // 1. Seed koleksi inventaris (jika kosong)
      const invCol = collection(this.db, "inventaris");
      const invSnap = await getDocs(invCol);
      if (invSnap.empty) {
        for (const item of EXCEL_INITIAL_SEED) {
          await addDoc(invCol, item);
        }
        console.log("✅ 9 Barang dari Excel berhasil disimpan ke koleksi 'inventaris' Cloud Firestore!");
      }

      // 2. Seed koleksi users (3 akun resmi)
      const usersCol = collection(this.db, "users");
      const usersSnap = await getDocs(usersCol);
      if (usersSnap.empty) {
        for (const u of DEFAULT_USERS_SEED) {
          await setDoc(doc(this.db, "users", u.id), u);
        }
        console.log("✅ 3 Akun resmi (Akbar, Sutarini, Iskak) berhasil disimpan ke koleksi 'users' Cloud Firestore!");
      }
    } catch (e) {
      console.error("Gagal seeding data:", e);
    }
  }

  // --- CRUD Inventaris (100% Kolom Excel) ---
  getAll() {
    return this.inventory;
  }

  getById(id) {
    return this.inventory.find(i => i.id === id);
  }

  async addItem(itemData) {
    itemData.no = this.inventory.length + 1;
    if (this.db && this.isCloudConnected) {
      const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const docRef = await addDoc(collection(this.db, "inventaris"), itemData);
      itemData.id = docRef.id;
      return itemData;
    } else {
      itemData.id = 'inv-' + Date.now();
      this.inventory.push(itemData);
      this.saveLocal();
      this.notifyListeners();
      return itemData;
    }
  }

  async updateItem(id, updatedFields) {
    if (this.db && this.isCloudConnected) {
      const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await updateDoc(doc(this.db, "inventaris", id), updatedFields);
    } else {
      const idx = this.inventory.findIndex(i => i.id === id);
      if (idx !== -1) {
        this.inventory[idx] = { ...this.inventory[idx], ...updatedFields };
        this.saveLocal();
        this.notifyListeners();
      }
    }
  }

  async deleteItem(id) {
    if (this.db && this.isCloudConnected) {
      const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await deleteDoc(doc(this.db, "inventaris", id));
    } else {
      this.inventory = this.inventory.filter(i => i.id !== id);
      this.inventory.forEach((item, idx) => item.no = idx + 1);
      this.saveLocal();
      this.notifyListeners();
    }
  }

  // Rekapitulasi Kondisi (Sesuai Sheet 2 Excel)
  getRekapitulasi() {
    const rekap = {
      baik: { jenis: 0, unit: 0 },
      rusakRingan: { jenis: 0, unit: 0 },
      rusakBerat: { jenis: 0, unit: 0 },
      hilang: { jenis: 0, unit: 0 },
      totalJenis: this.inventory.length,
      totalUnit: 0
    };

    this.inventory.forEach(item => {
      const jml = parseInt(item.jumlah) || 0;
      rekap.totalUnit += jml;

      const k = (item.kondisi || '').toLowerCase();
      if (k === 'baik' || k === 'bagus') {
        rekap.baik.jenis += 1;
        rekap.baik.unit += jml;
      } else if (k === 'rusak ringan') {
        rekap.rusakRingan.jenis += 1;
        rekap.rusakRingan.unit += jml;
      } else if (k === 'rusak berat') {
        rekap.rusakBerat.jenis += 1;
        rekap.rusakBerat.unit += jml;
      } else if (k === 'hilang') {
        rekap.hilang.jenis += 1;
        rekap.hilang.unit += jml;
      } else {
        rekap.baik.jenis += 1;
        rekap.baik.unit += jml;
      }
    });

    return rekap;
  }

  // --- Usulan Barang (Guru -> Toolman Approval) ---
  getProposals() {
    return this.proposals;
  }

  async addProposal(propData) {
    propData.status = 'pending';
    propData.tanggalUsul = new Date().toISOString().split('T')[0];

    if (this.db && this.isCloudConnected) {
      const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const docRef = await addDoc(collection(this.db, "usulan_barang"), propData);
      propData.id = docRef.id;
      return propData;
    } else {
      propData.id = 'prop-' + Date.now();
      this.proposals.unshift(propData);
      this.saveLocal();
      this.notifyListeners();
      return propData;
    }
  }

  async approveProposal(propId, notes) {
    const prop = this.proposals.find(p => p.id === propId);
    if (!prop) return null;

    const approvalData = {
      status: 'approved',
      catatanToolman: notes || 'Disetujui oleh Toolman',
      tanggalApproval: new Date().toISOString().split('T')[0]
    };

    if (this.db && this.isCloudConnected) {
      const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await updateDoc(doc(this.db, "usulan_barang", propId), approvalData);
    } else {
      Object.assign(prop, approvalData);
      this.saveLocal();
    }

    // Masukkan langsung ke Master Inventaris
    await this.addItem({
      kodeBarang: prop.kodeBarang,
      namaBarang: prop.namaBarang,
      fotoBarang: '',
      spesifikasiMerk: prop.spesifikasiMerk || '-',
      jumlah: parseInt(prop.jumlah) || 1,
      satuan: prop.satuan || 'Unit',
      kondisi: 'Baik',
      statusPenggunaan: 'Digunakan',
      tahunPerolehan: new Date().getFullYear().toString(),
      sumberDana: 'Dana sekolah',
      lokasiRak: prop.lokasiRak || 'Lemari 1',
      tglCekTerakhir: new Date().toISOString().split('T')[0],
      keterangan: prop.keterangan || '-'
    });

    return prop;
  }

  async rejectProposal(propId, notes) {
    const prop = this.proposals.find(p => p.id === propId);
    if (!prop) return null;

    const rejectData = {
      status: 'rejected',
      catatanToolman: notes || 'Ditolak oleh Toolman',
      tanggalApproval: new Date().toISOString().split('T')[0]
    };

    if (this.db && this.isCloudConnected) {
      const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await updateDoc(doc(this.db, "usulan_barang", propId), rejectData);
    } else {
      Object.assign(prop, rejectData);
      this.saveLocal();
      this.notifyListeners();
    }

    return prop;
  }
}

window.db = new FirebaseInventoryStore();
window.db.initFirebase();
