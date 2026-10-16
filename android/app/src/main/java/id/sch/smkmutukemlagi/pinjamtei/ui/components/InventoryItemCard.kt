package id.sch.smkmutukemlagi.pinjamtei.ui.components

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import id.sch.smkmutukemlagi.pinjamtei.data.model.InventoryItem
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.*

@Composable
fun InventoryItemCard(
    item: InventoryItem,
    onEditClick: () -> Unit,
    onDeleteClick: () -> Unit,
    onPhotoClick: (String) -> Unit
) {
    val kondisiColor = when (item.kondisi.lowercase()) {
        "baik" -> ColorSuccess
        "rusak ringan" -> ColorWarning
        "rusak berat" -> ColorDanger
        else -> TextMuted
    }

    val base64Bitmap = remember(item.fotoBarang) {
        if (item.fotoBarang.startsWith("data:image")) {
            try {
                val cleanBase64 = item.fotoBarang.substringAfter(",")
                val decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
            } catch (e: Exception) {
                null
            }
        } else null
    }

    Surface(
        color = DarkSurface,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, DarkCardBorder),
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Foto Thumbnail
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(DarkCard)
                        .border(1.dp, DarkCardBorder, RoundedCornerShape(12.dp))
                        .clickable(enabled = item.fotoBarang.isNotBlank()) {
                            onPhotoClick(item.fotoBarang)
                        },
                    contentAlignment = Alignment.Center
                ) {
                    when {
                        base64Bitmap != null -> {
                            Image(
                                bitmap = base64Bitmap.asImageBitmap(),
                                contentDescription = item.namaBarang,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        item.fotoBarang.isNotBlank() && item.fotoBarang.startsWith("http") -> {
                            AsyncImage(
                                model = item.fotoBarang,
                                contentDescription = item.namaBarang,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        else -> {
                            Icon(
                                imageVector = Icons.Default.Inventory2,
                                contentDescription = "Belum ada foto",
                                tint = TextDim,
                                modifier = Modifier.size(30.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                // Detail Barang
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Surface(
                            color = CyanPrimary.copy(alpha = 0.12f),
                            shape = RoundedCornerShape(6.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, CyanPrimary.copy(alpha = 0.3f))
                        ) {
                            Text(
                                text = item.kodeBarang,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                color = CyanPrimary,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        // Badge Kondisi
                        Surface(
                            color = kondisiColor.copy(alpha = 0.12f),
                            shape = RoundedCornerShape(6.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, kondisiColor.copy(alpha = 0.3f))
                        ) {
                            Text(
                                text = item.kondisi,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = kondisiColor,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = item.namaBarang,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMain,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )

                    Text(
                        text = item.spesifikasiMerk.ifBlank { "-" },
                        fontSize = 12.sp,
                        color = TextMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            Divider(color = DarkCardBorder.copy(alpha = 0.6f))
            Spacer(modifier = Modifier.height(10.dp))

            // Footer Kartu: Lokasi Rak, Jumlah, dan Aksi Edit & Hapus
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Place,
                        contentDescription = null,
                        tint = TextDim,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = item.lokasiRak.ifBlank { "Lemari" },
                        fontSize = 11.sp,
                        color = TextMuted
                    )

                    Spacer(modifier = Modifier.width(12.dp))

                    Text(
                        text = "Stok: ${item.jumlah} ${item.satuan}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMain
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    // Tombol Edit
                    FilledTonalIconButton(
                        onClick = onEditClick,
                        colors = IconButtonDefaults.filledTonalIconButtonColors(
                            containerColor = DarkCard,
                            contentColor = CyanPrimary
                        ),
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Edit Barang",
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    // Tombol Hapus
                    FilledTonalIconButton(
                        onClick = onDeleteClick,
                        colors = IconButtonDefaults.filledTonalIconButtonColors(
                            containerColor = DarkCard,
                            contentColor = ColorDanger
                        ),
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Hapus Barang",
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}
