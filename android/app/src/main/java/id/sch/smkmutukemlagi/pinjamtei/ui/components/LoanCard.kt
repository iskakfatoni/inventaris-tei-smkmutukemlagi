package id.sch.smkmutukemlagi.pinjamtei.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AssignmentReturn
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.sch.smkmutukemlagi.pinjamtei.data.model.Loan
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.*

@Composable
fun LoanCard(
    loan: Loan,
    onReturnClick: (Loan) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 5.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard),
        border = BorderStroke(1.dp, DarkCardBorder)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            // Header Baris 1: Nama Siswa & Kelas + Badge Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = loan.namaSiswa.ifBlank { "Siswa Praktikan" },
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = TextMain
                        )
                    )
                    Text(
                        text = "Kelas: ${loan.kelas.ifBlank { "-" }}",
                        style = MaterialTheme.typography.bodyMedium.copy(color = CyanPrimary)
                    )
                }

                // Badge Status
                StatusBadge(loan = loan)
            }

            Spacer(modifier = Modifier.height(10.dp))
            Divider(color = DarkCardBorder, thickness = 1.dp)
            Spacer(modifier = Modifier.height(10.dp))

            // Baris 2: Nama Alat & Jumlah
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = loan.namaBarang.ifBlank { "Alat Elektronika" },
                        style = MaterialTheme.typography.bodyLarge.copy(
                            fontWeight = FontWeight.SemiBold,
                            color = TextMain
                        )
                    )
                    Text(
                        text = "Kode: ${loan.kodeBarang} • Jml: ${loan.jumlahPinjam} unit",
                        style = MaterialTheme.typography.bodyMedium.copy(color = TextMuted)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Baris 3: Tanggal Pinjam & Rencana Kembali + Tombol Kembalikan
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Pinjam: ${loan.tglPinjam}",
                        style = MaterialTheme.typography.labelSmall.copy(color = TextDim)
                    )
                    Text(
                        text = if (loan.status == "Kembali") "Kembali: ${loan.tglKembaliAktual}" else "Batas: ${loan.tglKembaliRencana}",
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = if (loan.isOverdue) ColorDanger else TextMuted,
                            fontWeight = if (loan.isOverdue) FontWeight.Bold else FontWeight.Normal
                        )
                    )
                }

                if (loan.status == "Dipinjam") {
                    Button(
                        onClick = { onReturnClick(loan) },
                        colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AssignmentReturn,
                            contentDescription = null,
                            tint = DarkBackground,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Kembalikan",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = DarkBackground
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StatusBadge(loan: Loan) {
    val (bgColor, textColor, text, icon) = when {
        loan.status == "Kembali" -> Tuple4(
            ColorSuccess.copy(alpha = 0.15f),
            ColorSuccess,
            "Selesai",
            Icons.Default.CheckCircle
        )
        loan.isOverdue -> Tuple4(
            ColorDanger.copy(alpha = 0.18f),
            ColorDanger,
            "Terlambat",
            Icons.Default.Warning
        )
        else -> Tuple4(
            ColorWarning.copy(alpha = 0.15f),
            ColorWarning,
            "Dipinjam",
            Icons.Default.Schedule
        )
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = textColor,
                modifier = Modifier.size(12.dp)
            )
            Text(
                text = text,
                color = textColor,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

private data class Tuple4<A, B, C, D>(val a: A, val b: B, val c: C, val d: D)
