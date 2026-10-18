package id.sch.smkmutukemlagi.pinjamtei.data.model

import com.google.firebase.firestore.DocumentSnapshot
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class Loan(
    val id: String = "",
    val itemId: String = "",
    val kodeBarang: String = "",
    val namaBarang: String = "",
    val namaSiswa: String = "",
    val kelas: String = "",
    val jumlahPinjam: Int = 1,
    val tglPinjam: String = "",
    val tglKembaliRencana: String = "",
    val tglKembaliAktual: String = "",
    val status: String = "Dipinjam", // "Dipinjam" | "Kembali"
    val kondisiKembali: String = "Baik",
    val catatanKembali: String = "",
    val catatanPinjam: String = "",
    val petugasPinjam: String = "Guru / Toolman",
    val petugasKembali: String = "",
    val tahunAjaran: String = "2026/2027",
    val createdAt: String = ""
) {
    val isOverdue: Boolean
        get() {
            if (status != "Dipinjam" || tglKembaliRencana.isBlank()) return false
            return try {
                val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                val dueDate = sdf.parse(tglKembaliRencana)
                val today = sdf.parse(sdf.format(Date()))
                dueDate != null && dueDate.before(today)
            } catch (e: Exception) {
                false
            }
        }

    companion object {
        fun fromSnapshot(doc: DocumentSnapshot): Loan {
            val numJumlah = when (val raw = doc.get("jumlahPinjam")) {
                is Number -> raw.toInt()
                is String -> raw.toIntOrNull() ?: 1
                else -> 1
            }

            return Loan(
                id = doc.id,
                itemId = doc.getString("itemId") ?: "",
                kodeBarang = doc.getString("kodeBarang") ?: "",
                namaBarang = doc.getString("namaBarang") ?: "",
                namaSiswa = doc.getString("namaSiswa") ?: "",
                kelas = doc.getString("kelas") ?: "",
                jumlahPinjam = numJumlah,
                tglPinjam = doc.getString("tglPinjam") ?: "",
                tglKembaliRencana = doc.getString("tglKembaliRencana") ?: "",
                tglKembaliAktual = doc.getString("tglKembaliAktual") ?: "",
                status = doc.getString("status") ?: "Dipinjam",
                kondisiKembali = doc.getString("kondisiKembali") ?: "Baik",
                catatanKembali = doc.getString("catatanKembali") ?: "",
                catatanPinjam = doc.getString("catatanPinjam") ?: "",
                petugasPinjam = doc.getString("petugasPinjam") ?: "Guru / Toolman",
                petugasKembali = doc.getString("petugasKembali") ?: "",
                tahunAjaran = doc.getString("tahunAjaran") ?: "2026/2027",
                createdAt = doc.getString("createdAt") ?: ""
            )
        }
    }
}
