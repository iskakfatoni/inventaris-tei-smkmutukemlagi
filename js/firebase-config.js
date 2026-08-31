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
    this.loans = [];
    this.users = [];
    this.tahunAjaranList = [];
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

      // 4. Realtime listener untuk koleksi peminjaman_alat
      const loanCol = collection(this.db, "peminjaman_alat");
      onSnapshot(loanCol, (snapshot) => {
        this.loans = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            tahunAjaran: data.tahunAjaran || '2026/2027',
            ...data
          };
        });
        // Urutkan dari yang terbaru
        this.loans.sort((a, b) => new Date(b.createdAt || b.tglPinjam || 0) - new Date(a.createdAt || a.tglPinjam || 0));
        this.notifyListeners();
      }, (err) => {
        console.warn("Firestore peminjaman_alat listener:", err.message);
      });

      // 5. Realtime listener untuk koleksi users
      const usersCol = collection(this.db, "users");
      onSnapshot(usersCol, async (snapshot) => {
        if (!snapshot.empty) {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          this.users = docs;

          // Otomatis sinkronisasi dokumen guest ke Cloud Firestore jika belum ada
          if (!docs.some(u => u.role === 'guest' || u.username === 'guest' || u.email === 'guest')) {
            try {
              const guestDoc = {
                name: 'Tamu (Guest)',
                email: 'guest',
                username: 'guest',
                role: 'guest',
                roleTitle: 'Guest (Hanya Lihat Data)',
                initials: 'GT',
                password: '123',
                createdAt: new Date().toISOString()
              };
              await setDoc(doc(this.db, "users", "usr-guest"), guestDoc, { merge: true });
            } catch (e) {}
          }
          this.notifyListeners();
        } else {
          try {
            const guestDoc = {
              name: 'Tamu (Guest)',
              email: 'guest',
              username: 'guest',
              role: 'guest',
              roleTitle: 'Guest (Hanya Lihat Data)',
              initials: 'GT',
              password: '123',
              createdAt: new Date().toISOString()
            };
            this.users = [{ id: 'usr-guest', ...guestDoc }];
            await setDoc(doc(this.db, "users", "usr-guest"), guestDoc, { merge: true });
          } catch (e) {}
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

  // --- BULK IMPORT EXCEL KE CLOUD FIRESTORE ---
  async importExcelData(newItems, mode = 'append', targetYear = '2026/2027') {
    if (!newItems || newItems.length === 0) {
      throw new Error("Tidak ada data barang yang valid untuk di-import!");
    }

    if (this.db) {
      const { collection, addDoc, doc, deleteDoc, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const invCol = collection(this.db, "inventaris");

      // Jika mode replace: Hapus data barang pada tahun ajaran target terlebih dahulu
      if (mode === 'replace') {
        const existingDocs = this.inventory.filter(i => (i.tahunAjaran || '2026/2027') === targetYear);
        for (const ex of existingDocs) {
          if (ex.id) {
            await deleteDoc(doc(this.db, "inventaris", ex.id));
          }
        }
      }

      // Masukkan seluruh item baru
      let startNo = mode === 'replace' ? 1 : (this.getAll(targetYear).length + 1);
      for (const item of newItems) {
        const docData = {
          no: startNo++,
          kodeBarang: item.kodeBarang || `TEI-BRG-${String(startNo).padStart(3, '0')}`,
          namaBarang: item.namaBarang || 'Barang Baru',
          fotoBarang: item.fotoBarang || '',
          spesifikasiMerk: item.spesifikasiMerk || '-',
          jumlah: parseInt(item.jumlah) || 1,
          satuan: item.satuan || 'Unit',
          kondisi: item.kondisi || 'Baik',
          statusPenggunaan: item.statusPenggunaan || 'Digunakan',
          tahunPerolehan: item.tahunPerolehan || new Date().getFullYear().toString(),
          sumberDana: item.sumberDana || 'Dana sekolah',
          lokasiRak: item.lokasiRak || 'Lemari 1',
          tglCekTerakhir: item.tglCekTerakhir || new Date().toISOString().split('T')[0],
          keterangan: item.keterangan || '-',
          tahunAjaran: targetYear,
          importedAt: new Date().toISOString()
        };

        await addDoc(invCol, docData);
      }
    }

    return newItems.length;
  }

  // --- Auth & User Password Management ---
  getUsers() {
    return this.users;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const clean = email.trim().toLowerCase();

    // 1. Cari pengguna pada koleksi Firestore yang terload
    const found = this.users.find(u => 
      (u.email && u.email.trim().toLowerCase() === clean) ||
      (u.username && u.username.trim().toLowerCase() === clean) ||
      (u.id && u.id.trim().toLowerCase() === clean)
    );
    if (found) return found;

    // 2. Akun Guest Standar (jika input 'guest' atau 'guets')
    if (clean === 'guest' || clean === 'guets') {
      return {
        id: 'usr-guest',
        name: 'Tamu (Guest)',
        email: 'guest',
        username: 'guest',
        role: 'guest',
        roleTitle: 'Guest (Hanya Lihat Data)',
        initials: 'GT',
        password: '123'
      };
    }

    return null;
  }

  verifyPassword(email, passwordInput) {
    const user = this.getUserByEmail(email);
    if (!user) return false;
    const cleanPassInput = (passwordInput || '').trim();
    const defaultPass = user.role === 'guest' ? '123' : '12345';
    const storedPass = (user.password || defaultPass).trim();
    return storedPass === cleanPassInput;
  }

  async changePassword(email, oldPassword, newPassword) {
    const user = this.getUserByEmail(email);
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }
    if (user.role === 'guest') {
      throw new Error("Akun Tamu (Guest) bersifat publik read-only dan password tidak dapat diubah!");
    }
    if ((user.password || '').trim() !== (oldPassword || '').trim()) {
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

  // --- LOGBOOK PEMINJAMAN ALAT SISWA (REKOMENDASI NO. 2) ---
  getLoans(filterTA = null) {
    const targetTA = filterTA || this.activeTahunAjaran || '2026/2027';
    return this.loans.filter(l => (l.tahunAjaran || '2026/2027') === targetTA);
  }

  getLoanById(id) {
    return this.loans.find(l => l.id === id);
  }

  getLoanStats(filterTA = null) {
    const loans = this.getLoans(filterTA);
    const today = new Date().toISOString().split('T')[0];

    const stats = {
      total: loans.length,
      dipinjam: 0,
      kembali: 0,
      terlambat: 0,
      totalUnitDipinjam: 0
    };

    loans.forEach(l => {
      const jml = parseInt(l.jumlahPinjam) || 1;
      if (l.status === 'Dipinjam') {
        stats.dipinjam += 1;
        stats.totalUnitDipinjam += jml;
        if (l.tglKembaliRencana && l.tglKembaliRencana < today) {
          stats.terlambat += 1;
        }
      } else if (l.status === 'Kembali') {
        stats.kembali += 1;
      }
    });

    return stats;
  }

  async addLoan(loanData) {
    loanData.tahunAjaran = loanData.tahunAjaran || this.activeTahunAjaran || '2026/2027';
    loanData.status = 'Dipinjam';
    loanData.createdAt = new Date().toISOString();

    if (this.db) {
      const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const docRef = await addDoc(collection(this.db, "peminjaman_alat"), loanData);
      loanData.id = docRef.id;
      return loanData;
    } else {
      loanData.id = 'loan-' + Date.now();
      this.loans.unshift(loanData);
      this.notifyListeners();
      return loanData;
    }
  }

  async returnLoan(loanId, returnData) {
    const loan = this.loans.find(l => l.id === loanId);
    if (!loan) throw new Error("Data peminjaman tidak ditemukan.");

    const updatePayload = {
      status: 'Kembali',
      tglKembaliAktual: returnData.tglKembaliAktual || new Date().toISOString().split('T')[0],
      kondisiKembali: returnData.kondisiKembali || 'Baik',
      catatanKembali: returnData.catatanKembali || '-',
      petugasKembali: returnData.petugasKembali || 'Toolman',
      updatedAt: new Date().toISOString()
    };

    if (this.db) {
      const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await updateDoc(doc(this.db, "peminjaman_alat", loanId), updatePayload);
    } else {
      Object.assign(loan, updatePayload);
      this.notifyListeners();
    }

    // Jika kondisi saat kembali bukan 'Baik' (misal rusak/hilang), update kondisi pada inventaris master
    if (returnData.updateMasterKondisi && loan.itemId && returnData.kondisiKembali !== 'Baik') {
      try {
        await this.updateItem(loan.itemId, {
          kondisi: returnData.kondisiKembali,
          tglCekTerakhir: new Date().toISOString().split('T')[0],
          keterangan: `Kondisi diperbarui pasca peminjaman oleh ${loan.namaSiswa || 'Siswa'} (${returnData.catatanKembali || '-'})`
        });
      } catch (e) {
        console.warn("Gagal update kondisi master barang pasca pengembalian:", e);
      }
    }

    return Object.assign(loan, updatePayload);
  }

  async deleteLoan(loanId) {
    if (this.db) {
      const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      await deleteDoc(doc(this.db, "peminjaman_alat", loanId));
    } else {
      this.loans = this.loans.filter(l => l.id !== loanId);
      this.notifyListeners();
    }
  }

  // --- KOMPRESI & PENGELOLAAN FOTO BARANG (REKOMENDASI NO. 3) ---
  static async compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.75) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error("Berkas yang dipilih bukan gambar!"));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Hitung rasio aspek
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          // Antialiasing halus
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Coba simpan ke WebP, fallback ke JPEG
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve({
            dataUrl: dataUrl,
            width: width,
            height: height,
            sizeKb: Math.round(dataUrl.length / 1024)
          });
        };
        img.onerror = () => reject(new Error("Gagal membaca berkas gambar."));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Gagal memproses file."));
      reader.readAsDataURL(file);
    });
  }
}

window.db = new FirebaseInventoryStore();
window.db.initFirebase();

