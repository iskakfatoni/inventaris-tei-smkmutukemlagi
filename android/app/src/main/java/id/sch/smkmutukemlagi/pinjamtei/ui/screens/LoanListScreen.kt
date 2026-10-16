package id.sch.smkmutukemlagi.pinjamtei.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.sch.smkmutukemlagi.pinjamtei.data.model.Loan
import id.sch.smkmutukemlagi.pinjamtei.ui.components.LoanCard
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.*
import id.sch.smkmutukemlagi.pinjamtei.viewmodel.LoanStats
import id.sch.smkmutukemlagi.pinjamtei.viewmodel.LoanViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoanListScreen(
    viewModel: LoanViewModel,
    onNavigateToAddLoan: () -> Unit,
    onNavigateToQrScanner: () -> Unit
) {
    val loans by viewModel.filteredLoans.collectAsState()
    val stats by viewModel.stats.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedFilter by viewModel.selectedFilter.collectAsState()
    val activeYear by viewModel.activeYear.collectAsState()

    var returningLoan by remember { mutableStateOf<Loan?>(null) }
    val snackbarHostState = remember { SnackbarHostState() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "PinjamTEI",
                                fontWeight = FontWeight.ExtraBold,
                                color = TextMain,
                                fontSize = 18.sp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .background(CyanPrimary.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "TA $activeYear",
                                    color = CyanPrimary,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        Text(
                            text = "SMK Muhammadiyah 1 Kemlagi",
                            color = TextDim,
                            fontSize = 11.sp
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToQrScanner) {
                        Icon(Icons.Default.QrCodeScanner, contentDescription = "Scan QR", tint = CyanPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBackground)
            )
        },
        floatingActionButton = {
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Tombol Cepat Scanner
                SmallFloatingActionButton(
                    onClick = onNavigateToQrScanner,
                    containerColor = DarkCard,
                    contentColor = CyanPrimary,
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.QrCodeScanner, contentDescription = "Scan QR")
                }

                // Tombol Utama Tambah Peminjaman
                ExtendedFloatingActionButton(
                    onClick = onNavigateToAddLoan,
                    containerColor = CyanPrimary,
                    contentColor = DarkBackground,
                    shape = RoundedCornerShape(16.dp),
                    icon = { Icon(Icons.Default.Add, contentDescription = null) },
                    text = { Text("Catat Pinjam", fontWeight = FontWeight.Bold) }
                )
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = DarkBackground
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            // 4 Statistik Ringkas Horizontal
            StatsRow(stats = stats)

            Spacer(modifier = Modifier.height(14.dp))

            // Pencarian
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { viewModel.onSearchQueryChanged(it) },
                placeholder = { Text("Cari siswa, kelas, kode, atau alat...", color = TextDim, fontSize = 13.sp) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextDim) },
                trailingIcon = {
                    if (searchQuery.isNotBlank()) {
                        IconButton(onClick = { viewModel.onSearchQueryChanged("") }) {
                            Icon(Icons.Default.Close, contentDescription = "Hapus", tint = TextDim)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CyanPrimary,
                    unfocusedBorderColor = DarkCardBorder,
                    focusedTextColor = TextMain,
                    unfocusedTextColor = TextMain,
                    focusedContainerColor = DarkCard,
                    unfocusedContainerColor = DarkCard
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Filter Tabs
            FilterRow(
                selectedFilter = selectedFilter,
                onFilterSelected = { viewModel.onFilterSelected(it) }
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Daftar Peminjaman
            if (loans.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.Inbox,
                            contentDescription = null,
                            tint = TextDim,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Tidak ada data peminjaman",
                            color = TextMuted,
                            fontSize = 14.sp
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 90.dp)
                ) {
                    items(loans, key = { it.id }) { loan ->
                        LoanCard(
                            loan = loan,
                            onReturnClick = { returningLoan = it }
                        )
                    }
                }
            }
        }
    }

    // Dialog Pengembalian Alat
    returningLoan?.let { loan ->
        ReturnLoanDialog(
            loan = loan,
            onDismiss = { returningLoan = null },
            onConfirm = { kondisi, catatan, updateMaster ->
                viewModel.processReturn(
                    loan = loan,
                    kondisiKembali = kondisi,
                    catatanKembali = catatan,
                    petugasKembali = "Toolman",
                    updateMaster = updateMaster,
                    onSuccess = {
                        returningLoan = null
                    },
                    onError = {
                        // Error handling
                    }
                )
            }
        )
    }
}

@Composable
private fun StatsRow(stats: LoanStats) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        StatPill(modifier = Modifier.weight(1f), label = "Total", count = stats.total, color = CyanPrimary)
        StatPill(modifier = Modifier.weight(1f), label = "Dipinjam", count = stats.dipinjam, color = ColorWarning)
        StatPill(modifier = Modifier.weight(1f), label = "Terlambat", count = stats.terlambat, color = ColorDanger)
        StatPill(modifier = Modifier.weight(1f), label = "Kembali", count = stats.kembali, color = ColorSuccess)
    }
}

@Composable
private fun StatPill(modifier: Modifier = Modifier, label: String, count: Int, color: Color) {
    Box(
        modifier = modifier
            .background(DarkCard, RoundedCornerShape(10.dp))
            .border(1.dp, DarkCardBorder, RoundedCornerShape(10.dp))
            .padding(vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = count.toString(), color = color, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
            Text(text = label, color = TextDim, fontSize = 10.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun FilterRow(
    selectedFilter: String,
    onFilterSelected: (String) -> Unit
) {
    val filters = listOf("Semua", "Dipinjam", "Terlambat", "Kembali")

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        filters.forEach { filter ->
            val isSelected = selectedFilter == filter
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(
                        if (isSelected) CyanPrimary else DarkCard,
                        RoundedCornerShape(8.dp)
                    )
                    .border(
                        1.dp,
                        if (isSelected) CyanPrimary else DarkCardBorder,
                        RoundedCornerShape(8.dp)
                    )
                    .clickable { onFilterSelected(filter) }
                    .padding(vertical = 7.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = filter,
                    color = if (isSelected) DarkBackground else TextMuted,
                    fontSize = 11.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                )
            }
        }
    }
}
