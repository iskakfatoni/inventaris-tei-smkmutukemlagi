package id.sch.smkmutukemlagi.pinjamtei.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import id.sch.smkmutukemlagi.pinjamtei.data.model.InventoryItem
import id.sch.smkmutukemlagi.pinjamtei.data.model.Loan
import id.sch.smkmutukemlagi.pinjamtei.data.repository.FirestoreRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class LoanStats(
    val total: Int = 0,
    val dipinjam: Int = 0,
    val terlambat: Int = 0,
    val kembali: Int = 0
)

class LoanViewModel(
    private val repository: FirestoreRepository = FirestoreRepository()
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedFilter = MutableStateFlow("Semua") // "Semua", "Dipinjam", "Terlambat", "Kembali"
    val selectedFilter: StateFlow<String> = _selectedFilter.asStateFlow()

    private val _activeYear = MutableStateFlow("2026/2027")
    val activeYear: StateFlow<String> = _activeYear.asStateFlow()

    val inventoryItems: StateFlow<List<InventoryItem>> = repository.getInventoryItemsFlow(_activeYear.value)
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    val rawLoans: StateFlow<List<Loan>> = repository.getLoansFlow(_activeYear.value)
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    // Filtered Loans based on Search & Filter Tab
    val filteredLoans: StateFlow<List<Loan>> = combine(rawLoans, _searchQuery, _selectedFilter) { loans, query, filter ->
        loans.filter { loan ->
            val matchQuery = query.isBlank() ||
                loan.namaSiswa.contains(query, ignoreCase = true) ||
                loan.kelas.contains(query, ignoreCase = true) ||
                loan.namaBarang.contains(query, ignoreCase = true) ||
                loan.kodeBarang.contains(query, ignoreCase = true)

            val matchFilter = when (filter) {
                "Dipinjam" -> loan.status == "Dipinjam" && !loan.isOverdue
                "Terlambat" -> loan.status == "Dipinjam" && loan.isOverdue
                "Kembali" -> loan.status == "Kembali"
                else -> true
            }

            matchQuery && matchFilter
        }
    }.stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    // Realtime Statistics
    val stats: StateFlow<LoanStats> = rawLoans.combine(_activeYear) { loans, _ ->
        var dipinjam = 0
        var terlambat = 0
        var kembali = 0

        loans.forEach { loan ->
            if (loan.status == "Dipinjam") {
                if (loan.isOverdue) terlambat++ else dipinjam++
            } else if (loan.status == "Kembali") {
                kembali++
            }
        }

        LoanStats(
            total = loans.size,
            dipinjam = dipinjam,
            terlambat = terlambat,
            kembali = kembali
        )
    }.stateIn(viewModelScope, SharingStarted.Lazily, LoanStats())

    fun onSearchQueryChanged(newQuery: String) {
        _searchQuery.value = newQuery
    }

    fun onFilterSelected(filter: String) {
        _selectedFilter.value = filter
    }

    // Aksi Tambah Peminjaman Baru (Check-out)
    fun createLoan(
        item: InventoryItem,
        namaSiswa: String,
        kelas: String,
        jumlah: Int,
        tglKembaliRencana: String,
        catatan: String,
        petugas: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val newLoan = Loan(
                itemId = item.id,
                kodeBarang = item.kodeBarang,
                namaBarang = item.namaBarang,
                namaSiswa = namaSiswa.trim(),
                kelas = kelas.trim(),
                jumlahPinjam = jumlah,
                tglPinjam = todayStr,
                tglKembaliRencana = tglKembaliRencana,
                status = "Dipinjam",
                catatanPinjam = catatan,
                petugasPinjam = petugas.ifBlank { "Toolman" },
                tahunAjaran = _activeYear.value,
                createdAt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()).format(Date())
            )

            val result = repository.addLoan(newLoan)
            if (result.isSuccess) {
                onSuccess()
            } else {
                onError(result.exceptionOrNull()?.message ?: "Gagal mencatat peminjaman")
            }
        }
    }

    // Aksi Konfirmasi Pengembalian Alat (Check-in)
    fun processReturn(
        loan: Loan,
        kondisiKembali: String,
        catatanKembali: String,
        petugasKembali: String,
        updateMaster: Boolean,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        viewModelScope.launch {
            val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val result = repository.returnLoan(
                loanId = loan.id,
                tglKembaliAktual = todayStr,
                kondisiKembali = kondisiKembali,
                catatanKembali = catatanKembali,
                petugasKembali = petugasKembali.ifBlank { "Toolman" },
                updateMasterKondisi = updateMaster,
                itemId = loan.itemId,
                namaSiswa = loan.namaSiswa
            )

            if (result.isSuccess) {
                onSuccess()
            } else {
                onError(result.exceptionOrNull()?.message ?: "Gagal memproses pengembalian")
            }
        }
    }
}
