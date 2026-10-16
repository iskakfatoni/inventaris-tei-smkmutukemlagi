package id.sch.smkmutukemlagi.pinjamtei.data.model

import com.google.firebase.firestore.DocumentId

data class InventoryItem(
    @DocumentId
    val id: String = "",
    val no: Int = 1,
    val kodeBarang: String = "",
    val namaBarang: String = "",
    val fotoBarang: String = "",
    val spesifikasiMerk: String = "-",
    val jumlah: Int = 1,
    val satuan: String = "Unit",
    val kondisi: String = "Baik",
    val statusPenggunaan: String = "Digunakan",
    val tahunPerolehan: String = "2026",
    val sumberDana: String = "Dana sekolah",
    val lokasiRak: String = "Lemari 1",
    val tglCekTerakhir: String = "",
    val keterangan: String = "-",
    val tahunAjaran: String = "2026/2027"
) {
    fun toMap(): Map<String, Any> {
        val map = mutableMapOf<String, Any>(
            "no" to no,
            "kodeBarang" to kodeBarang,
            "namaBarang" to namaBarang,
            "fotoBarang" to fotoBarang,
            "spesifikasiMerk" to spesifikasiMerk,
            "jumlah" to jumlah,
            "satuan" to satuan,
            "kondisi" to kondisi,
            "statusPenggunaan" to statusPenggunaan,
            "tahunPerolehan" to tahunPerolehan,
            "sumberDana" to sumberDana,
            "lokasiRak" to lokasiRak,
            "tglCekTerakhir" to tglCekTerakhir,
            "keterangan" to keterangan,
            "tahunAjaran" to tahunAjaran
        )
        return map
    }
}
