package id.sch.smkmutukemlagi.pinjamtei.data.model

import com.google.firebase.firestore.DocumentSnapshot

data class InventoryItem(
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
        return mapOf(
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
    }

    companion object {
        fun fromSnapshot(doc: DocumentSnapshot): InventoryItem {
            val numNo = when (val raw = doc.get("no")) {
                is Number -> raw.toInt()
                is String -> raw.toIntOrNull() ?: 1
                else -> 1
            }
            val numJumlah = when (val raw = doc.get("jumlah")) {
                is Number -> raw.toInt()
                is String -> raw.toIntOrNull() ?: 1
                else -> 1
            }

            return InventoryItem(
                id = doc.id,
                no = numNo,
                kodeBarang = doc.getString("kodeBarang") ?: "",
                namaBarang = doc.getString("namaBarang") ?: "",
                fotoBarang = doc.getString("fotoBarang") ?: "",
                spesifikasiMerk = doc.getString("spesifikasiMerk") ?: "-",
                jumlah = numJumlah,
                satuan = doc.getString("satuan") ?: "Unit",
                kondisi = doc.getString("kondisi") ?: "Baik",
                statusPenggunaan = doc.getString("statusPenggunaan") ?: "Digunakan",
                tahunPerolehan = doc.getString("tahunPerolehan") ?: (doc.get("tahunPerolehan")?.toString() ?: "2026"),
                sumberDana = doc.getString("sumberDana") ?: "Dana sekolah",
                lokasiRak = doc.getString("lokasiRak") ?: "Lemari 1",
                tglCekTerakhir = doc.getString("tglCekTerakhir") ?: "",
                keterangan = doc.getString("keterangan") ?: "-",
                tahunAjaran = doc.getString("tahunAjaran") ?: "2026/2027"
            )
        }
    }
}
