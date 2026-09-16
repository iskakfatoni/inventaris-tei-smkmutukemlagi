package id.sch.smkmutukemlagi.pinjamtei.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import id.sch.smkmutukemlagi.pinjamtei.data.model.InventoryItem
import id.sch.smkmutukemlagi.pinjamtei.data.model.Loan
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class FirestoreRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()
) {
    // Aliran Real-time Koleksi Peminjaman Alat
    fun getLoansFlow(tahunAjaran: String = "2026/2027"): Flow<List<Loan>> = callbackFlow {
        val listenerRegistration = firestore.collection("peminjaman_alat")
            .whereEqualTo("tahunAjaran", tahunAjaran)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                if (snapshot != null) {
                    val loans = snapshot.toObjects(Loan::class.java)
                    // Urutkan dari yang terbaru
                    val sorted = loans.sortedByDescending { it.createdAt.ifBlank { it.tglPinjam } }
                    trySend(sorted)
                }
            }
        awaitClose { listenerRegistration.remove() }
    }

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
                    val items = snapshot.toObjects(InventoryItem::class.java)
                        .sortedBy { it.kodeBarang }
                    trySend(items)
                }
            }
        awaitClose { listenerRegistration.remove() }
    }

    // Tambah Transaksi Peminjaman Baru (Check-out)
    async suspend fun addLoan(loan: Loan): Result<String> {
        return try {
            val docRef = firestore.collection("peminjaman_alat").add(loan).await()
            Result.success(docRef.id)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Konfirmasi Pengembalian Alat (Check-in)
    suspend fun returnLoan(
        loanId: String,
        tglKembaliAktual: String,
        kondisiKembali: String,
        catatanKembali: String,
        petugasKembali: String,
        updateMasterKondisi: Boolean,
        itemId: String?,
        namaSiswa: String
    ): Result<Unit> {
        return try {
            val updatePayload = mapOf(
                "status" to "Kembali",
                "tglKembaliAktual" to tglKembaliAktual,
                "kondisiKembali" to kondisiKembali,
                "catatanKembali" to catatanKembali,
                "petugasKembali" to petugasKembali,
                "updatedAt" to SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).format(Date())
            )

            firestore.collection("peminjaman_alat").document(loanId).update(updatePayload).await()

            // Jika kondisi alat rusak/hilang dan dicentang untuk update master inventaris
            if (updateMasterKondisi && !itemId.isNullOrBlank() && kondisiKembali != "Baik") {
                val masterPayload = mapOf(
                    "kondisi" to kondisiKembali,
                    "tglCekTerakhir" to SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
                    "keterangan" to "Kondisi diperbarui pasca peminjaman siswa $namaSiswa ($catatanKembali)"
                )
                firestore.collection("inventaris").document(itemId).update(masterPayload).await()
            }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
