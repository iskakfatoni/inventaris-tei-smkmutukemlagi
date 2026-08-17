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

class FirebaseInventoryStore {
  constructor() {
    this.firebaseConfig = firebaseConfig;
    this.inventory = [];
    this.proposals = [];
    this.users = [];
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
      onSnapshot(invCol, (snapshot) => {
        this.inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.inventory.sort((a, b) => (a.no || 0) - (b.no || 0));
        this.isCloudConnected = true;
        this.notifyListeners();
      }, (err) => {
        console.warn("Firestore inventaris listener error:", err.message);
      });

      // Realtime listener untuk koleksi usulan barang
      const propCol = collection(this.db, "usulan_barang");
      onSnapshot(propCol, (snapshot) => {
        this.proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.notifyListeners();
      }, (err) => {
        console.warn("Firestore usulan_barang listener error:", err.message);
      });

      // Realtime listener untuk koleksi users
      const usersCol = collection(this.db, "users");
      onSnapshot(usersCol, (snapshot) => {
        this.users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.notifyListeners();
      }, (err) => {
        console.warn("Firestore users listener error:", err.message);
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

  // --- Auth & User Password Management ---
  getUsers() {
    return this.users;
  }

  getUserByEmail(email) {
    return this.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
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

    if (this.db) {
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await setDoc(doc(this.db, "users", user.id), user, { merge: true });
    }

    return true;
  }

  // --- CRUD Inventaris ---
  getAll() {
    return this.inventory;
  }

  getById(id) {
    return this.inventory.find(i => i.id === id);
  }

  async addItem(itemData) {
    itemData.no = this.inventory.length + 1;
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

  // Rekapitulasi Kondisi
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

  // --- Usulan Barang ---
  getProposals() {
    return this.proposals;
  }

  async addProposal(propData) {
    propData.status = 'pending';
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

    if (this.db) {
      const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await updateDoc(doc(this.db, "usulan_barang", propId), rejectData);
    }

    return prop;
  }
}

window.db = new FirebaseInventoryStore();
window.db.initFirebase();
