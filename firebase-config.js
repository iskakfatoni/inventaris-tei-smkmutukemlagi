/**
 * Firebase Real Cloud Firestore & Auth Adapter
 * Project: inventaris-tei-smkmutu
 * SMK MUTU KEMLAGI - Teknik Elektronika Industri
 */

// Konfigurasi Firebase Resmi Pengguna
const firebaseConfig = {
  apiKey: "AIzaSyBhwdWwFTi6xH6quZyyOnbVqgKWu6Teo1M",
  authDomain: "inventaris-tei-smkmutu.firebaseapp.com",
  projectId: "inventaris-tei-smkmutu",
  storageBucket: "inventaris-tei-smkmutu.firebasestorage.app",
  messagingSenderId: "18734181774",
  appId: "1:18734181774:web:4fb1444a5aa718be8808df"
};

// 3 Pengguna Resmi dengan Password Default
const DEFAULT_ACCOUNTS = [
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

class FirebaseInventoryStore {
  constructor() {
    this.firebaseConfig = firebaseConfig;
    this.inventory = [];
    this.proposals = [];
    this.users = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
    this.tahunAjaranList = [
      { id: 'ta-2026-2027', nama: '2026/2027', isAktif: true, createdAt: '2026-08-01' }
    ];
    this.activeTahunAjaran = '2026/2027';
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

      // 1. Realtime listener untuk koleksi inventaris
      const invCol = collection(this.db, "inventaris");
      onSnapshot(invCol, (snapshot) => {
        if (!snapshot.empty) {
          this.inventory = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              tahunAjaran: data.tahunAjaran || '2026/2027',
              ...data
            };
          });
          this.inventory.sort((a, b) => (a.no || 0) - (b.no || 0));
        }
        this.isCloudConnected = true;
        this.notifyListeners();
      }, (err) => {
        console.warn("Firestore inventaris listener:", err.message);
      });

      // 2. Realtime listener untuk koleksi tahun_ajaran
      const taCol = collection(this.db, "tahun_ajaran");
      onSnapshot(taCol, (snapshot) => {
        if (!snapshot.empty) {
          this.tahunAjaranList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const activeTA = this.tahunAjaranList.find(t => t.isAktif);
          if (activeTA) {
            this.activeTahunAjaran = activeTA.nama;
          }
          this.notifyListeners();
        }
      });

      // 3. Realtime listener untuk koleksi usulan_barang
      const propCol = collection(this.db, "usulan_barang");
      onSnapshot(propCol, (snapshot) => {
        this.proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.notifyListeners();
      }, (err) => {
        console.warn("Firestore usulan_barang listener:", err.message);
      });

      // 4. Realtime listener untuk koleksi users
      const usersCol = collection(this.db, "users");
      onSnapshot(usersCol, (snapshot) => {
        if (!snapshot.empty) {
          this.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          this.notifyListeners();
        }
      }, (err) => {
        console.warn("Firestore users listener:", err.message);
      });

      this.isCloudConnected = true;
      console.log("✅ Berhasil terhubung ke Cloud Firestore:", this.firebaseConfig.projectId);
    } catch (e) {
      console.error("Gagal inisialisasi Firebase SDK:", e);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb());
  }

  // --- Manajemen Tahun Ajaran ---
  getTahunAjaranList() {
    return this.tahunAjaranList.length > 0 ? this.tahunAjaranList : [{ id: 'ta-2026-2027', nama: '2026/2027', isAktif: true }];
  }

  getActiveTahunAjaran() {
    return this.activeTahunAjaran || '2026/2027';
  }

  setActiveTahunAjaran(taNama) {
    this.activeTahunAjaran = taNama;
    this.notifyListeners();
  }

  async addTahunAjaran(taNama, setAsActive = false) {
    const cleanName = taNama.trim();
    const existing = this.tahunAjaranList.find(t => t.nama === cleanName);
    if (existing) {
      throw new Error(`Tahun Ajaran ${cleanName} sudah ada!`);
    }

    const newId = 'ta-' + cleanName.replace('/', '-').replace('.', '-');
    const newDoc = {
      id: newId,
      nama: cleanName,
      isAktif: setAsActive,
      createdAt: new Date().toISOString()
    };

    if (this.db) {
      const { doc, setDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      
      if (setAsActive) {
        for (const ta of this.tahunAjaranList) {
          if (ta.isAktif) {
            await updateDoc(doc(this.db, "tahun_ajaran", ta.id), { isAktif: false });
          }
        }
        this.activeTahunAjaran = cleanName;
      }

      await setDoc(doc(this.db, "tahun_ajaran", newId), newDoc);
    } else {
      if (setAsActive) {
        this.tahunAjaranList.forEach(t => t.isAktif = false);
        this.activeTahunAjaran = cleanName;
      }
      this.tahunAjaranList.push(newDoc);
      this.notifyListeners();
    }

    return newDoc;
  }

  // --- FASILITAS MIGRASI DATA KE TAHUN AJARAN BERIKUTNYA ---
  async migrateDataToNewYear(sourceYear, targetYear, toolmanName) {
    if (sourceYear === targetYear) {
      throw new Error("Tahun ajaran asal dan tujuan tidak boleh sama!");
    }

    const sourceItems = this.inventory.filter(i => (i.tahunAjaran || '2026/2027') === sourceYear);
    if (sourceItems.length === 0) {
      throw new Error(`Tidak ada data barang di Tahun Ajaran ${sourceYear} untuk dimigrasikan!`);
    }

    const existingTargetItems = this.inventory.filter(i => (i.tahunAjaran || '2026/2027') === targetYear);
    if (existingTargetItems.length > 0) {
      throw new Error(`Tahun Ajaran ${targetYear} sudah memiliki ${existingTargetItems.length} data barang! Migrasi dibatalkan demi keamanan data.`);
    }

    if (this.db) {
      const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const invCol = collection(this.db, "inventaris");

      let count = 0;
      for (const item of sourceItems) {
        const migratedItem = {
          no: item.no || (++count),
          kodeBarang: item.kodeBarang,
          namaBarang: item.namaBarang,
          fotoBarang: item.fotoBarang || '',
          spesifikasiMerk: item.spesifikasiMerk || '-',
          jumlah: item.jumlah || 1,
          satuan: item.satuan || 'Unit',
          kondisi: item.kondisi || 'Baik',
          statusPenggunaan: item.statusPenggunaan || 'Digunakan',
          tahunPerolehan: item.tahunPerolehan || '2026',
          sumberDana: item.sumberDana || 'Dana sekolah',
          lokasiRak: item.lokasiRak || 'Lemari 1',
          tglCekTerakhir: new Date().toISOString().split('T')[0],
          keterangan: item.keterangan ? `${item.keterangan} (Migrasi dari TA ${sourceYear})` : `Migrasi dari TA ${sourceYear}`,
          tahunAjaran: targetYear,
          migratedFrom: sourceYear,
          migratedBy: toolmanName,
          migratedAt: new Date().toISOString()
        };

        await addDoc(invCol, migratedItem);
      }
    }

    this.activeTahunAjaran = targetYear;
    return sourceItems.length;
  }

  // --- Auth & User Password Management ---
  getUsers() {
    return this.users;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    return this.users.find(u => u.email && u.email.trim().toLowerCase() === cleanEmail);
  }

  verifyPassword(email, passwordInput) {
    const user = this.getUserByEmail(email);
    if (!user) return false;
    const cleanPassInput = (passwordInput || '').trim();
    const storedPass = (user.password || '12345').trim();
    return storedPass === cleanPassInput;
  }

  async changePassword(email, oldPassword, newPassword) {
    const user = this.getUserByEmail(email);
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }
    if ((user.password || '12345').trim() !== (oldPassword || '').trim()) {
      throw new Error("Password lama salah!");
    }
    if (!newPassword || newPassword.length < 5) {
      throw new Error("Password baru minimal 5 karakter!");
    }

    user.password = newPassword.trim();
    user.updatedAt = new Date().toISOString();

    if (this.db) {
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await setDoc(doc(this.db, "users", user.id), user, { merge: true });
    }

    this.notifyListeners();
    return true;
  }

  // --- CRUD Inventaris ---
  getAll(filterTA = null) {
    const targetTA = filterTA || this.activeTahunAjaran || '2026/2027';
    return this.inventory.filter(i => (i.tahunAjaran || '2026/2027') === targetTA);
  }

  getById(id) {
    return this.inventory.find(i => i.id === id);
  }

  async addItem(itemData) {
    itemData.tahunAjaran = itemData.tahunAjaran || this.activeTahunAjaran || '2026/2027';
    const currentYearItems = this.getAll(itemData.tahunAjaran);
    itemData.no = currentYearItems.length + 1;

    if (this.db) {
      const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const docRef = await addDoc(collection(this.db, "inventaris"), itemData);
      itemData.id = docRef.id;
      return itemData;
    }
  }

  async updateItem(id, updatedFields) {
    if (this.db) {
      const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await updateDoc(doc(this.db, "inventaris", id), updatedFields);
    }
  }

  async deleteItem(id) {
    if (this.db) {
      const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await deleteDoc(doc(this.db, "inventaris", id));
    }
  }

  // Rekapitulasi Kondisi per Tahun Ajaran
  getRekapitulasi(filterTA = null) {
    const items = this.getAll(filterTA);
    const rekap = {
      baik: { jenis: 0, unit: 0 },
      rusakRingan: { jenis: 0, unit: 0 },
      rusakBerat: { jenis: 0, unit: 0 },
      hilang: { jenis: 0, unit: 0 },
      totalJenis: items.length,
      totalUnit: 0
    };

    items.forEach(item => {
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

  // --- Usulan Barang ---
  getProposals() {
    return this.proposals;
  }

  async addProposal(propData) {
    propData.status = 'pending';
    propData.tahunAjaran = propData.tahunAjaran || this.activeTahunAjaran || '2026/2027';
    propData.tanggalUsul = new Date().toISOString().split('T')[0];

    if (this.db) {
      const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const docRef = await addDoc(collection(this.db, "usulan_barang"), propData);
      propData.id = docRef.id;
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

    if (this.db) {
      const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await updateDoc(doc(this.db, "usulan_barang", propId), approvalData);
    }

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
      keterangan: prop.keterangan || '-',
      tahunAjaran: prop.tahunAjaran || this.activeTahunAjaran || '2026/2027'
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

    if (this.db) {
      const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await updateDoc(doc(this.db, "usulan_barang", propId), rejectData);
    }

    return prop;
  }
}

window.db = new FirebaseInventoryStore();
window.db.initFirebase();
