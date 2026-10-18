package id.sch.smkmutukemlagi.pinjamtei.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
import id.sch.smkmutukemlagi.pinjamtei.data.model.InventoryItem
import id.sch.smkmutukemlagi.pinjamtei.data.utils.DeviceUtils
import id.sch.smkmutukemlagi.pinjamtei.ui.theme.*
import id.sch.smkmutukemlagi.pinjamtei.viewmodel.AdminInventoryViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditItemScreen(
    itemId: String? = null,
    viewModel: AdminInventoryViewModel,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val isEditMode = !itemId.isNullOrBlank()
    val existingItem = remember(itemId) {
        if (isEditMode && itemId != null) viewModel.getItemById(itemId) else null
    }

    var kodeBarang by remember { mutableStateOf(existingItem?.kodeBarang ?: "TEI-ITM-001") }
    var namaBarang by remember { mutableStateOf(existingItem?.namaBarang ?: "") }
    var spesifikasiMerk by remember { mutableStateOf(existingItem?.spesifikasiMerk ?: "") }
    var jumlah by remember { mutableStateOf((existingItem?.jumlah ?: 1).toString()) }
    var satuan by remember { mutableStateOf(existingItem?.satuan ?: "Unit") }
    var kondisi by remember { mutableStateOf(existingItem?.kondisi ?: "Baik") }
    var statusPenggunaan by remember { mutableStateOf(existingItem?.statusPenggunaan ?: "Digunakan") }
    var tahunPerolehan by remember { mutableStateOf(existingItem?.tahunPerolehan ?: "2026") }
    var sumberDana by remember { mutableStateOf(existingItem?.sumberDana ?: "Dana sekolah") }
    var lokasiRak by remember { mutableStateOf(existingItem?.lokasiRak ?: "Lemari 1") }
    var keterangan by remember { mutableStateOf(existingItem?.keterangan ?: "-") }
    var fotoBarangBase64 by remember { mutableStateOf(existingItem?.fotoBarang ?: "") }

    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    // Preview Bitmap Lokal jika baru mengambil gambar
    var localBitmapPreview by remember { mutableStateOf<Bitmap?>(null) }

    // Launcher Kamera Native Android (Capture Image)
    val cameraLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.TakePicturePreview()
    ) { bitmap: Bitmap? ->
        if (bitmap != null) {
            localBitmapPreview = bitmap
            fotoBarangBase64 = DeviceUtils.compressBitmapToBase64(bitmap, 800, 800, 75)
            Toast.makeText(context, "Foto berhasil diambil dari kamera & dioptimasi!", Toast.LENGTH_SHORT).show()
        }
    }

    // Permission Launcher untuk Izin Kamera Android
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            try {
                cameraLauncher.launch(null)
            } catch (e: Exception) {
                Toast.makeText(context, "Gagal membuka kamera: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        } else {
            Toast.makeText(context, "Izin kamera diperlukan untuk mengambil foto barang.", Toast.LENGTH_LONG).show()
        }
    }

    // Helper untuk mengecek izin sebelum membuka kamera
    val openCameraWithPermission = {
        val hasPermission = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED

        if (hasPermission) {
            try {
                cameraLauncher.launch(null)
            } catch (e: Exception) {
                Toast.makeText(context, "Gagal membuka kamera: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            }
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    // Launcher Galeri Native Android (Select Image)
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            val bitmap = DeviceUtils.uriToBitmap(context, uri)
            if (bitmap != null) {
                localBitmapPreview = bitmap
                fotoBarangBase64 = DeviceUtils.compressBitmapToBase64(bitmap, 800, 800, 75)
                Toast.makeText(context, "Foto galeri berhasil dikompresi WebP/JPEG!", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Bitmap Decoder untuk foto yang sudah tersimpan di Firestore
    val savedBitmap = remember(fotoBarangBase64) {
        if (fotoBarangBase64.startsWith("data:image")) {
            try {
                val clean = fotoBarangBase64.substringAfter(",")
                val bytes = Base64.decode(clean, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
            } catch (e: Exception) {
                null
            }
        } else null
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (isEditMode) "Edit Barang (${existingItem?.kodeBarang ?: ""})" else "Tambah Master Barang",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMain
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali", tint = CyanPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DarkBackground
                )
            )
        },
        containerColor = DarkBackground
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            // ==========================================
            // BAGIAN 1: FOTO BARANG (KAMERA & GALERI)
            // ==========================================
            Surface(
                color = DarkSurface,
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkCardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CameraAlt, contentDescription = null, tint = CyanPrimary, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Foto Barang / Alat Praktikum",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextMain
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    val hasPhoto = localBitmapPreview != null || savedBitmap != null || (fotoBarangBase64.isNotBlank() && fotoBarangBase64.startsWith("http"))

                    if (hasPhoto) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(DarkCard)
                                .border(1.dp, DarkCardBorder, RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            when {
                                localBitmapPreview != null -> {
                                    Image(
                                        bitmap = localBitmapPreview!!.asImageBitmap(),
                                        contentDescription = "Foto Baru",
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                                savedBitmap != null -> {
                                    Image(
                                        bitmap = savedBitmap.asImageBitmap(),
                                        contentDescription = "Foto Tersimpan",
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                                fotoBarangBase64.startsWith("http") -> {
                                    AsyncImage(
                                        model = fotoBarangBase64,
                                        contentDescription = "Foto URL",
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { openCameraWithPermission() },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = CyanPrimary),
                                border = androidx.compose.foundation.BorderStroke(1.dp, CyanPrimary),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Ambil Ulang", fontSize = 12.sp)
                            }

                            OutlinedButton(
                                onClick = { galleryLauncher.launch("image/*") },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextMain),
                                border = androidx.compose.foundation.BorderStroke(1.dp, DarkCardBorder),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.Image, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Galeri", fontSize = 12.sp)
                            }

                            IconButton(
                                onClick = {
                                    localBitmapPreview = null
                                    fotoBarangBase64 = ""
                                },
                                colors = IconButtonDefaults.iconButtonColors(contentColor = ColorDanger)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Hapus Foto")
                            }
                        }
                    } else {
                        // Area Dropzone / Empty Photo State
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(DarkCard)
                                .border(1.dp, DarkCardBorder, RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Default.AddAPhoto, contentDescription = null, tint = TextDim, modifier = Modifier.size(36.dp))
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Belum ada foto barang", fontSize = 12.sp, color = TextMuted)
                                Text("Otomatis dikompresi ringan & tajam untuk web", fontSize = 10.sp, color = TextDim)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Button(
                                onClick = { openCameraWithPermission() },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary, contentColor = DarkBackground),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.CameraAlt, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Foto Kamera", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }

                            Button(
                                onClick = { galleryLauncher.launch("image/*") },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = DarkCard, contentColor = TextMain),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Pilih Galeri", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // ==========================================
            // BAGIAN 2: IDENTITAS BARANG
            // ==========================================
            Surface(
                color = DarkSurface,
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, DarkCardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Informasi Master Barang",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextMain
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Kode Barang
                    OutlinedTextField(
                        value = kodeBarang,
                        onValueChange = { kodeBarang = it.uppercase() },
                        label = { Text("Kode Barang *") },
                        placeholder = { Text("Contoh: TEI-MOD-001") },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CyanPrimary,
                            unfocusedBorderColor = DarkCardBorder,
                            focusedTextColor = TextMain,
                            unfocusedTextColor = TextMain
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Nama Barang
                    OutlinedTextField(
                        value = namaBarang,
                        onValueChange = { namaBarang = it },
                        label = { Text("Nama Barang / Alat *") },
                        placeholder = { Text("Contoh: Digital Storage Oscilloscope") },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CyanPrimary,
                            unfocusedBorderColor = DarkCardBorder,
                            focusedTextColor = TextMain,
                            unfocusedTextColor = TextMain
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Spesifikasi / Merk
                    OutlinedTextField(
                        value = spesifikasiMerk,
                        onValueChange = { spesifikasiMerk = it },
                        label = { Text("Spesifikasi / Merk") },
                        placeholder = { Text("Contoh: Rigol DS1054Z 50MHz 4-CH") },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CyanPrimary,
                            unfocusedBorderColor = DarkCardBorder,
                            focusedTextColor = TextMain,
                            unfocusedTextColor = TextMain
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Jumlah & Satuan
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = jumlah,
                            onValueChange = { if (it.all { char -> char.isDigit() }) jumlah = it },
                            label = { Text("Jumlah *") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = CyanPrimary,
                                unfocusedBorderColor = DarkCardBorder,
                                focusedTextColor = TextMain,
                                unfocusedTextColor = TextMain
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = satuan,
                            onValueChange = { satuan = it },
                            label = { Text("Satuan") },
                            placeholder = { Text("Unit, Set, Pcs") },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = CyanPrimary,
                                unfocusedBorderColor = DarkCardBorder,
                                focusedTextColor = TextMain,
                                unfocusedTextColor = TextMain
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Lokasi / Rak
                    OutlinedTextField(
                        value = lokasiRak,
                        onValueChange = { lokasiRak = it },
                        label = { Text("Lokasi / Rak Penyimpanan *") },
                        placeholder = { Text("Contoh: Lemari 1, Rak A-2") },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CyanPrimary,
                            unfocusedBorderColor = DarkCardBorder,
                            focusedTextColor = TextMain,
                            unfocusedTextColor = TextMain
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Pilihan Kondisi Fisik
                    Text(text = "Kondisi Fisik:", fontSize = 12.sp, color = TextMuted)
                    Spacer(modifier = Modifier.height(4.dp))
                    val kondisiList = listOf("Baik", "Rusak Ringan", "Rusak Berat", "Hilang")
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        kondisiList.forEach { k ->
                            val isSel = k.equals(kondisi, ignoreCase = true)
                            FilterChip(
                                selected = isSel,
                                onClick = { kondisi = k },
                                label = { Text(k, fontSize = 10.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = when(k) {
                                        "Baik" -> ColorSuccess
                                        "Rusak Ringan" -> ColorWarning
                                        "Rusak Berat" -> ColorDanger
                                        else -> TextDim
                                    },
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Keterangan
                    OutlinedTextField(
                        value = keterangan,
                        onValueChange = { keterangan = it },
                        label = { Text("Keterangan Tambahan") },
                        placeholder = { Text("Catatan peruntukan / status perbaikan...") },
                        maxLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CyanPrimary,
                            unfocusedBorderColor = DarkCardBorder,
                            focusedTextColor = TextMain,
                            unfocusedTextColor = TextMain
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            if (!errorMessage.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = errorMessage ?: "",
                    color = ColorDanger,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Tombol Simpan Barang ke Database
            Button(
                onClick = {
                    val parsedJumlah = jumlah.toIntOrNull() ?: 1
                    val todayIso = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

                    val itemToSave = InventoryItem(
                        id = existingItem?.id ?: "",
                        no = existingItem?.no ?: 1,
                        kodeBarang = kodeBarang.trim(),
                        namaBarang = namaBarang.trim(),
                        spesifikasiMerk = spesifikasiMerk.trim().ifBlank { "-" },
                        jumlah = parsedJumlah,
                        satuan = satuan.trim().ifBlank { "Unit" },
                        kondisi = kondisi,
                        statusPenggunaan = statusPenggunaan,
                        tahunPerolehan = tahunPerolehan.trim().ifBlank { "2026" },
                        sumberDana = sumberDana.trim().ifBlank { "Dana sekolah" },
                        lokasiRak = lokasiRak.trim().ifBlank { "Lemari 1" },
                        tglCekTerakhir = existingItem?.tglCekTerakhir?.ifBlank { todayIso } ?: todayIso,
                        keterangan = keterangan.trim().ifBlank { "-" },
                        tahunAjaran = existingItem?.tahunAjaran ?: viewModel.activeTahunAjaran.value,
                        fotoBarang = fotoBarangBase64
                    )

                    viewModel.saveItem(itemToSave, isEditMode) {
                        onNavigateBack()
                    }
                },
                enabled = !isLoading,
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = CyanPrimary,
                    contentColor = DarkBackground
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = DarkBackground, modifier = Modifier.size(22.dp), strokeWidth = 2.5.dp)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text("Menyimpan ke Cloud Firestore...", fontWeight = FontWeight.Bold)
                } else {
                    Icon(Icons.Default.Save, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isEditMode) "Perbarui Data Barang" else "Simpan ke Master Inventaris",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(30.dp))
        }
    }
}
