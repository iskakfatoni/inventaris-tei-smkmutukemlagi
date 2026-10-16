package id.sch.smkmutukemlagi.pinjamtei.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.sch.smkmutukemlagi.pinjamtei.data.model.InventoryItem
import id.sch.smkmutukemlagi.pinjamtei.ui.components.InventoryItemCard
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.*
import id.sch.smkmutukemlagi.pinjamtei.viewmodel.AdminInventoryViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InventoryListScreen(
    viewModel: AdminInventoryViewModel,
    onAddItemClick: () -> Unit,
    onEditItemClick: (String) -> Unit,
    onLogoutClick: () -> Unit
) {
    val context = LocalContext.current
    val currentUser by viewModel.currentUser.collectAsState()
    val filteredItems by viewModel.filteredItems.collectAsState()
    val allItems by viewModel.items.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val kondisiFilter by viewModel.kondisiFilter.collectAsState()
    val successMessage by viewModel.successMessage.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    var itemToDelete by remember { mutableStateOf<InventoryItem?>(null) }
    var selectedPhotoUrl by remember { mutableStateOf<String?>(null) }

    val filterOptions = listOf("Semua", "Baik", "Rusak Ringan", "Rusak Berat", "Hilang")

    // Rekapitulasi Cepat
    val totalJenis = allItems.size
    val totalUnit = allItems.sumOf { it.jumlah }
    val totalBaik = allItems.filter { it.kondisi.equals("Baik", ignoreCase = true) }.sumOf { it.jumlah }
    val totalRusak = totalUnit - totalBaik

    Scaffold(
        topBar = {
            Surface(
                color = DarkBackground,
                border = androidx.compose.foundation.BorderStroke(0.dp, Color.Transparent)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Inventaris TEI Admin",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextMain
                            )
                            Text(
                                text = "${currentUser?.name ?: "Petugas"} • ${currentUser?.roleTitle ?: "Admin"}",
                                fontSize = 12.sp,
                                color = CyanPrimary,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        // Tombol Logout
                        FilledTonalIconButton(
                            onClick = {
                                viewModel.logout(context, onLogoutClick)
                            },
                            colors = IconButtonDefaults.filledTonalIconButtonColors(
                                containerColor = DarkCard,
                                contentColor = ColorDanger
                            )
                        ) {
                            Icon(Icons.Default.Logout, contentDescription = "Keluar")
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Badge Hardware Binding Status
                    Surface(
                        color = DarkSurface,
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, ColorSuccess.copy(alpha = 0.3f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                tint = ColorSuccess,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "HP Terikat Resmi: ${currentUser?.device_info ?: currentUser?.device_id ?: "Perangkat Sah"}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium,
                                color = ColorSuccess,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddItemClick,
                containerColor = CyanPrimary,
                contentColor = DarkBackground,
                shape = CircleShape,
                elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 8.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = "Tambah Barang Baru", modifier = Modifier.size(28.dp))
            }
        },
        containerColor = DarkBackground
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
        ) {
            // Kotak Pencarian
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { viewModel.searchQuery.value = it },
                placeholder = { Text("Cari nama, kode barang, rak...", color = TextDim, fontSize = 13.sp) },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null, tint = CyanPrimary)
                },
                trailingIcon = {
                    if (searchQuery.isNotBlank()) {
                        IconButton(onClick = { viewModel.searchQuery.value = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "Hapus", tint = TextDim)
                        }
                    }
                },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CyanPrimary,
                    unfocusedBorderColor = DarkCardBorder,
                    focusedTextColor = TextMain,
                    unfocusedTextColor = TextMain,
                    focusedContainerColor = DarkSurface,
                    unfocusedContainerColor = DarkSurface
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Filter Chips Baris Horizontal
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                filterOptions.forEach { opt ->
                    val isSelected = opt.equals(kondisiFilter, ignoreCase = true)
                    FilterChip(
                        selected = isSelected,
                        onClick = { viewModel.kondisiFilter.value = opt },
                        label = {
                            Text(
                                text = opt,
                                fontSize = 12.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = CyanPrimary,
                            selectedLabelColor = DarkBackground,
                            containerColor = DarkCard,
                            labelColor = TextMuted
                        ),
                        border = FilterChipDefaults.filterChipBorder(
                            enabled = true,
                            selected = isSelected,
                            borderColor = if (isSelected) CyanPrimary else DarkCardBorder
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Kartu Ringkasan Statistik
            Surface(
                color = DarkSurface,
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkCardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 10.dp, horizontal = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "Total Jenis", fontSize = 10.sp, color = TextMuted)
                        Text(text = "$totalJenis", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextMain)
                    }
                    Divider(modifier = Modifier.height(24.dp).width(1.dp), color = DarkCardBorder)
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "Total Unit", fontSize = 10.sp, color = TextMuted)
                        Text(text = "$totalUnit", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = CyanPrimary)
                    }
                    Divider(modifier = Modifier.height(24.dp).width(1.dp), color = DarkCardBorder)
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "Kondisi Baik", fontSize = 10.sp, color = TextMuted)
                        Text(text = "$totalBaik", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ColorSuccess)
                    }
                    Divider(modifier = Modifier.height(24.dp).width(1.dp), color = DarkCardBorder)
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(text = "Rusak/Hilang", fontSize = 10.sp, color = TextMuted)
                        Text(text = "$totalRusak", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ColorWarning)
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Feedback Pesan Sukses / Error
            if (!successMessage.isNullOrBlank()) {
                Surface(
                    color = ColorSuccess.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, ColorSuccess.copy(alpha = 0.3f)),
                    modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                ) {
                    Row(modifier = Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ColorSuccess, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = successMessage ?: "", color = ColorSuccess, fontSize = 12.sp)
                    }
                }
            }

            // Daftar Barang (LazyColumn)
            if (isLoading && filteredItems.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = CyanPrimary)
                }
            } else if (filteredItems.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 60.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.SearchOff,
                            contentDescription = null,
                            tint = TextDim,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Tidak ada barang yang cocok",
                            fontSize = 14.sp,
                            color = TextMuted,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 80.dp)
                ) {
                    items(filteredItems, key = { it.id }) { item ->
                        InventoryItemCard(
                            item = item,
                            onEditClick = { onEditItemClick(item.id) },
                            onDeleteClick = { itemToDelete = item },
                            onPhotoClick = { selectedPhotoUrl = it }
                        )
                    }
                }
            }
        }
    }

    // Dialog Konfirmasi Hapus Barang
    itemToDelete?.let { item ->
        AlertDialog(
            onDismissRequest = { itemToDelete = null },
            title = {
                Text(text = "Hapus Barang Master?", fontWeight = FontWeight.Bold, color = TextMain)
            },
            text = {
                Text(
                    text = "Apakah Anda yakin ingin menghapus '${item.namaBarang}' (${item.kodeBarang}) dari master inventaris? Data yang dihapus tidak dapat dipulihkan.",
                    color = TextMuted,
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteItem(item.id)
                        itemToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ColorDanger)
                ) {
                    Text("Ya, Hapus", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { itemToDelete = null }) {
                    Text("Batal", color = TextMuted)
                }
            },
            containerColor = DarkSurface,
            shape = RoundedCornerShape(16.dp)
        )
    }

    // Modal Pratinjau Foto Penuh
    selectedPhotoUrl?.let { photo ->
        ImagePreviewDialog(
            photoData = photo,
            onDismiss = { selectedPhotoUrl = null }
        )
    }
}
