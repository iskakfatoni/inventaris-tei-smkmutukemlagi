package id.sch.smkmutukemlagi.pinjamtei.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import id.sch.smkmutukemlagi.pinjamtei.data.model.Loan
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReturnLoanDialog(
    loan: Loan,
    onDismiss: () -> Unit,
    onConfirm: (kondisi: String, catatan: String, updateMaster: Boolean) -> Unit
) {
    var selectedCondition by remember { mutableStateOf("Baik") }
    var notes by remember { mutableStateOf("Alat dikembalikan lengkap dan dalam kondisi baik.") }
    var updateMaster by remember { mutableStateOf(true) }

    val conditions = listOf("Baik", "Rusak Ringan", "Rusak Berat", "Hilang")

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface),
            border = androidx.compose.foundation.BorderStroke(1.dp, DarkCardBorder)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Text(
                    text = "Konfirmasi Pengembalian",
                    style = MaterialTheme.typography.titleMedium.copy(
                        color = TextMain,
                        fontWeight = FontWeight.Bold
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Detail Ringkas Barang & Siswa
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(DarkCard, RoundedCornerShape(8.dp))
                        .padding(12.dp)
                ) {
                    Column {
                        Text(
                            text = loan.namaBarang,
                            style = MaterialTheme.typography.bodyLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = CyanPrimary
                            )
                        )
                        Text(
                            text = "Peminjam: ${loan.namaSiswa} (${loan.kelas})",
                            style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted)
                        )
                        Text(
                            text = "Jumlah: ${loan.jumlahPinjam} unit • Kode: ${loan.kodeBarang}",
                            style = MaterialTheme.typography.bodySmall.copy(color = TextDim)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Pilihan Kondisi Fisik Alat
                Text(
                    text = "Kondisi Fisik Saat Kembali:",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = TextMain,
                        fontWeight = FontWeight.SemiBold
                    )
                )

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    conditions.forEach { condition ->
                        val isSelected = selectedCondition == condition
                        val btnColor = when (condition) {
                            "Baik" -> ColorSuccess
                            "Rusak Ringan" -> ColorWarning
                            else -> ColorDanger
                        }

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .background(
                                    if (isSelected) btnColor.copy(alpha = 0.2f) else DarkCard,
                                    RoundedCornerShape(8.dp)
                                )
                                .border(
                                    1.dp,
                                    if (isSelected) btnColor else DarkCardBorder,
                                    RoundedCornerShape(8.dp)
                                )
                                .clickable { selectedCondition = condition }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = condition,
                                fontSize = 10.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) btnColor else TextMuted
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Checkbox Sinkronisasi Master Inventaris
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { updateMaster = !updateMaster },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = updateMaster,
                        onCheckedChange = { updateMaster = it },
                        colors = CheckboxDefaults.colors(checkedColor = CyanPrimary)
                    )
                    Text(
                        text = "Sinkronkan kondisi alat ke master inventaris jika rusak/hilang",
                        style = MaterialTheme.typography.bodySmall.copy(color = TextMuted)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Input Catatan
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Catatan Pengembalian", color = TextDim) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CyanPrimary,
                        unfocusedBorderColor = DarkCardBorder,
                        focusedTextColor = TextMain,
                        unfocusedTextColor = TextMain
                    ),
                    maxLines = 2
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Tombol Aksi
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Batal", color = TextMuted)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onConfirm(selectedCondition, notes, updateMaster) },
                        colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Selesaikan", color = DarkBackground, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
