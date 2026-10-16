package id.sch.smkmutukemlagi.pinjamtei.data.model

import com.google.firebase.firestore.DocumentId
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class Loan(
    @DocumentId
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
}
