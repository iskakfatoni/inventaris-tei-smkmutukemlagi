package id.sch.smkmutukemlagi.pinjamtei.ui.screens

import android.app.DatePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.sch.smkmutukemlagi.pinjamtei.data.model.InventoryItem
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddLoanScreen(
    items: List<InventoryItem>,
    preSelectedCode: String? = null,
    onOpenScanner: () -> Unit,
    onSubmit: (item: InventoryItem, namaSiswa: String, kelas: String, jumlah: Int, tglKembali: String, catatan: String) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var selectedItem by remember {
        mutableStateOf(items.find { it.kodeBarang.equals(preSelectedCode, ignoreCase = true) } ?: items.firstOrNull())
    }

    // Jika preSelectedCode berubah setelah scan QR
    LaunchedEffect(preSelectedCode, items) {
        if (!preSelectedCode.isNullOrBlank()) {
            val matched = items.find { it.kodeBarang.equals(preSelectedCode, ignoreCase = true) }
            if (matched != null) {
                selectedItem = matched
            }
        }
    }

    var namaSiswa by remember { mutableStateOf("") }
    var kelas by remember { mutableStateOf("XI TEI 1") }
    var jumlahPinjam by remember { mutableIntStateOf(1) }
    var catatan by remember { mutableStateOf("") }

    // Default batas kembali: 3 hari ke depan
    val cal = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, 3) }
    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    var tglKembaliRencana by remember { mutableStateOf(sdf.format(cal.time)) }

    val classOptions = listOf("X TEI", "XI TEI 1", "XI TEI 2", "XII TEI 1", "XII TEI 2")
    var isClassExpanded by remember { mutableStateOf(false) }
    var isItemExpanded by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Catat Peminjaman Baru", color = TextMain, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali", tint = TextMain)
                    }
                },
                actions = {
                    IconButton(onClick = onOpenScanner) {
                        Icon(Icons.Default.QrCodeScanner, contentDescription = "Scan QR", tint = CyanPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBackground)
            )
        },
        containerColor = DarkBackground
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(modifier = Modifier.height(10.dp))

            // Banner Scan QR Cepat
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onOpenScanner() },
                colors = CardDefaults.cardColors(containerColor = CyanPrimary.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, CyanPrimary.copy(alpha = 0.3f))
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(Icons.Default.QrCodeScanner, contentDescription = null, tint = CyanPrimary)
                    Column {
                        Text("Pilih Alat Cepat via Scan QR", color = CyanPrimary, fontWeight = FontWeight.Bold)
                        Text("Arahkan kamera ke stiker label alat di lemari", color = TextMuted, fontSize = 12.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // 1. Pemilihan Alat Praktikum
            Text("Pilih Modul / Alat Praktikum *", color = TextMain, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(6.dp))

            ExposedDropdownMenuBox(
                expanded = isItemExpanded,
                onExpandedChange = { isItemExpanded = it }
            ) {
                OutlinedTextField(
                    value = selectedItem?.let { "${it.namaBarang} (${it.kodeBarang})" } ?: "Pilih alat...",
                    onValueChange = {},
                    readOnly = true,
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isItemExpanded) },
                    modifier = Modifier.menuAnchor().fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CyanPrimary,
                        unfocusedBorderColor = DarkCardBorder,
                        focusedTextColor = TextMain,
                        unfocusedTextColor = TextMain
                    )
                )
                ExposedDropdownMenu(
                    expanded = isItemExpanded,
                    onDismissRequest = { isItemExpanded = false },
                    modifier = Modifier.background(DarkSurface)
                ) {
                    items.forEach { item ->
                        DropdownMenuItem(
                            text = {
                                Column {
                                    Text(item.namaBarang, color = TextMain, fontWeight = FontWeight.Medium)
                                    Text("Kode: ${item.kodeBarang} • Stok: ${item.jumlah} • Rak: ${item.lokasiRak}", color = TextDim, fontSize = 11.sp)
                                }
                            },
                            onClick = {
                                selectedItem = item
                                isItemExpanded = false
                            }
                        )
                    }
                }
            }

            if (selectedItem != null) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Lokasi: ${selectedItem!!.lokasiRak} • Kondisi: ${selectedItem!!.kondisi}",
                    color = ColorSuccess,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(18.dp))

            // 2. Identitas Siswa & Kelas
            Text("Identitas Peminjam *", color = TextMain, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(6.dp))

            OutlinedTextField(
                value = namaSiswa,
                onValueChange = { namaSiswa = it },
                label = { Text("Nama Siswa / Ketua Kelompok", color = TextDim) },
                leadingIcon = { Icon(Icons.Default.Person, contentDescription = null, tint = CyanPrimary) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CyanPrimary,
                    unfocusedBorderColor = DarkCardBorder,
                    focusedTextColor = TextMain,
                    unfocusedTextColor = TextMain
                )
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Pilihan Kelas
            ExposedDropdownMenuBox(
                expanded = isClassExpanded,
                onExpandedChange = { isClassExpanded = it }
            ) {
                OutlinedTextField(
                    value = kelas,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Kelas", color = TextDim) },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isClassExpanded) },
                    modifier = Modifier.menuAnchor().fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CyanPrimary,
                        unfocusedBorderColor = DarkCardBorder,
                        focusedTextColor = TextMain,
                        unfocusedTextColor = TextMain
                    )
                )
                ExposedDropdownMenu(
                    expanded = isClassExpanded,
                    onDismissRequest = { isClassExpanded = false },
                    modifier = Modifier.background(DarkSurface)
                ) {
                    classOptions.forEach { opt ->
                        DropdownMenuItem(
                            text = { Text(opt, color = TextMain) },
                            onClick = {
                                kelas = opt
                                isClassExpanded = false
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // 3. Jumlah Unit & Batas Tanggal Kembali
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Jumlah Unit Stepper
                Column(modifier = Modifier.weight(1f)) {
                    Text("Jumlah Unit", color = TextMain, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .background(DarkCard, RoundedCornerShape(8.dp))
                            .border(1.dp, DarkCardBorder, RoundedCornerShape(8.dp))
                            .padding(4.dp)
                    ) {
                        IconButton(onClick = { if (jumlahPinjam > 1) jumlahPinjam-- }) {
                            Icon(Icons.Default.Remove, contentDescription = null, tint = CyanPrimary)
                        }
                        Text(
                            text = jumlahPinjam.toString(),
                            color = TextMain,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            modifier = Modifier.weight(1f),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                        IconButton(onClick = { jumlahPinjam++ }) {
                            Icon(Icons.Default.Add, contentDescription = null, tint = CyanPrimary)
                        }
                    }
                }

                // Tanggal Rencana Kembali
                Column(modifier = Modifier.weight(1f)) {
                    Text("Batas Kembali", color = TextMain, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(6.dp))

                    val datePicker = DatePickerDialog(
                        context,
                        { _, y, m, d ->
                            val selectedCal = Calendar.getInstance().apply { set(y, m, d) }
                            tglKembaliRencana = sdf.format(selectedCal.time)
                        },
                        cal.get(Calendar.YEAR),
                        cal.get(Calendar.MONTH),
                        cal.get(Calendar.DAY_OF_MONTH)
                    )

                    OutlinedTextField(
                        value = tglKembaliRencana,
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = {
                            IconButton(onClick = { datePicker.show() }) {
                                Icon(Icons.Default.CalendarToday, contentDescription = null, tint = CyanPrimary)
                            }
                        },
                        modifier = Modifier.fillMaxWidth().clickable { datePicker.show() },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CyanPrimary,
                            unfocusedBorderColor = DarkCardBorder,
                            focusedTextColor = TextMain,
                            unfocusedTextColor = TextMain
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // Catatan
            OutlinedTextField(
                value = catatan,
                onValueChange = { catatan = it },
                label = { Text("Catatan / Kebutuhan Praktik", color = TextDim) },
                placeholder = { Text("Contoh: Praktik modul kendali motor kelas XI TEI 1...", color = TextDim) },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CyanPrimary,
                    unfocusedBorderColor = DarkCardBorder,
                    focusedTextColor = TextMain,
                    unfocusedTextColor = TextMain
                ),
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Tombol Submit
            Button(
                onClick = {
                    if (selectedItem != null && namaSiswa.isNotBlank()) {
                        onSubmit(selectedItem!!, namaSiswa, kelas, jumlahPinjam, tglKembaliRencana, catatan)
                    }
                },
                enabled = selectedItem != null && namaSiswa.isNotBlank(),
                modifier = Modifier.fillMaxWidth().height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.Check, contentDescription = null, tint = DarkBackground)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Simpan & Catat Peminjaman", color = DarkBackground, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            }

            Spacer(modifier = Modifier.height(30.dp))
        }
    }
}
