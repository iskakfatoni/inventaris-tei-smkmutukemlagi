package id.sch.smkmutukemlagi.pinjamtei.data.model

import com.google.firebase.firestore.DocumentId

data class InventoryItem(
    @DocumentId
    val id: String = "",
    val kodeBarang: String = "",
    val namaBarang: String = "",
    val spesifikasiMerk: String = "",
    val jumlah: Int = 1,
    val satuan: String = "Unit",
    val kondisi: String = "Baik",
    val lokasiRak: String = "Lemari 1",
    val statusPenggunaan: String = "Digunakan",
    val fotoBarang: String = "",
    val tahunAjaran: String = "2026/2027"
)
