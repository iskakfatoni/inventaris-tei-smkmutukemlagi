package id.sch.smkmutukemlagi.pinjamtei.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import id.sch.smkmutukemlagi.pinjamtei.data.model.InventoryItem
import id.sch.smkmutukemlagi.pinjamtei.data.model.Loan
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

class FirestoreRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    // Aliran Real-time Master Inventaris
    fun getInventoryItemsFlow(tahunAjaran: String = "2026/2027"): Flow<List<InventoryItem>> = callbackFlow {
        val listenerRegistration = firestore.collection("inventaris")
            .whereEqualTo("tahunAjaran", tahunAjaran)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val items = snapshot.documents.mapNotNull { doc ->
                        try {
                            InventoryItem.fromSnapshot(doc)
                        } catch (e: Exception) {
                            null
                        }
                    }.sortedBy { it.no }
                    trySend(items)
                }
            }
        awaitClose { listenerRegistration.remove() }
    }

    // Tambah Barang Baru ke Master Inventaris
    suspend fun addItem(item: InventoryItem): Result<String> {
        return try {
            val payload = item.toMap()
            val docRef = firestore.collection("inventaris").add(payload).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Perbarui Barang yang Sudah Ada
    suspend fun updateItem(item: InventoryItem): Result<Unit> {
        return try {
            if (item.id.isBlank()) {
                return Result.failure(Exception("ID barang tidak valid untuk pembaruan."))
            }
            val payload = item.toMap()
            firestore.collection("inventaris").document(item.id).set(payload).await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Hapus Barang dari Master Inventaris
    suspend fun deleteItem(itemId: String): Result<Unit> {
        return try {
            if (itemId.isBlank()) {
                return Result.failure(Exception("ID barang tidak valid."))
            }
            firestore.collection("inventaris").document(itemId).delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Aliran Real-time Logbook Peminjaman
    fun getLoansFlow(tahunAjaran: String = "2026/2027"): Flow<List<Loan>> = callbackFlow {
        val listenerRegistration = firestore.collection("peminjaman")
            .whereEqualTo("tahunAjaran", tahunAjaran)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val loans = snapshot.documents.mapNotNull { doc ->
                        try {
                            Loan.fromSnapshot(doc)
                        } catch (e: Exception) {
                            null
                        }
                    }
                    trySend(loans)
                }
            }
        awaitClose { listenerRegistration.remove() }
    }

    // Catat Peminjaman Baru
    suspend fun addLoan(loan: Loan): Result<String> {
        return try {
            val docRef = firestore.collection("peminjaman").add(loan).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Proses Pengembalian Alat
    suspend fun returnLoan(
        loanId: String,
        tglKembaliAktual: String,
        kondisiKembali: String,
        catatanKembali: String,
        petugasKembali: String,
        updateMasterKondisi: Boolean,
        itemId: String,
        namaSiswa: String
    ): Result<Unit> {
        return try {
            firestore.collection("peminjaman").document(loanId).update(
                mapOf(
                    "status" to "Kembali",
                    "tglKembaliAktual" to tglKembaliAktual,
                    "kondisiKembali" to kondisiKembali,
                    "catatanKembali" to catatanKembali,
                    "petugasKembali" to petugasKembali
                )
            ).await()

            if (updateMasterKondisi && itemId.isNotBlank()) {
                firestore.collection("inventaris").document(itemId).update(
                    mapOf(
                        "kondisi" to kondisiKembali,
                        "tglCekTerakhir" to tglKembaliAktual
                    )
                ).await()
            }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
