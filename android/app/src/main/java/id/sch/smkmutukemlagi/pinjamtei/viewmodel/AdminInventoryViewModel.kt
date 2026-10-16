package id.sch.smkmutukemlagi.pinjamtei.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import id.sch.smkmutukemlagi.pinjamtei.data.model.InventoryItem
import id.sch.smkmutukemlagi.pinjamtei.data.model.User
import id.sch.smkmutukemlagi.pinjamtei.data.repository.AuthRepository
import id.sch.smkmutukemlagi.pinjamtei.data.repository.FirestoreRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class AdminInventoryViewModel(
    private val authRepo: AuthRepository = AuthRepository(),
    private val firestoreRepo: FirestoreRepository = FirestoreRepository()
) : ViewModel() {

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _items = MutableStateFlow<List<InventoryItem>>(emptyList())
    val items: StateFlow<List<InventoryItem>> = _items.asStateFlow()

    val searchQuery = MutableStateFlow("")
    val kondisiFilter = MutableStateFlow("Semua")
    val activeTahunAjaran = MutableStateFlow("2026/2027")

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _successMessage = MutableStateFlow<String?>(null)
    val successMessage: StateFlow<String?> = _successMessage.asStateFlow()

    // Daftar terfilter secara reaktif
    val filteredItems: StateFlow<List<InventoryItem>> = combine(
        _items,
        searchQuery,
        kondisiFilter
    ) { itemList, query, filter ->
        itemList.filter { item ->
            val matchesQuery = query.isBlank() ||
                    item.namaBarang.contains(query, ignoreCase = true) ||
                    item.kodeBarang.contains(query, ignoreCase = true) ||
                    item.spesifikasiMerk.contains(query, ignoreCase = true) ||
                    item.lokasiRak.contains(query, ignoreCase = true)

            val matchesKondisi = filter == "Semua" || item.kondisi.equals(filter, ignoreCase = true)

            matchesQuery && matchesKondisi
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun checkSavedSession(context: Context) {
        val saved = authRepo.getSavedUser(context)
        if (saved != null) {
            _currentUser.value = saved
            listenToInventory()
        }
    }

    fun login(identifier: String, pass: String, context: Context, onSuccess: () -> Unit) {
        if (identifier.isBlank() || pass.isBlank()) {
            _errorMessage.value = "Email/Username dan Password tidak boleh kosong!"
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            val result = authRepo.login(identifier, pass, context)
            _isLoading.value = false

            result.onSuccess { user ->
                _currentUser.value = user
                _successMessage.value = "Selamat datang, ${user.name}! (${user.roleTitle})"
                listenToInventory()
                onSuccess()
            }.onFailure { err ->
                _errorMessage.value = err.message ?: "Gagal masuk ke sistem."
            }
        }
    }

    fun logout(context: Context, onLoggedOut: () -> Unit) {
        authRepo.logout(context)
        _currentUser.value = null
        _items.value = emptyList()
        onLoggedOut()
    }

    private fun listenToInventory() {
        viewModelScope.launch {
            firestoreRepo.getInventoryItemsFlow(activeTahunAjaran.value).collect { list ->
                _items.value = list
            }
        }
    }

    fun saveItem(item: InventoryItem, isEdit: Boolean, onSuccess: () -> Unit) {
        if (item.namaBarang.isBlank() || item.kodeBarang.isBlank()) {
            _errorMessage.value = "Nama barang dan kode barang wajib diisi!"
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            val result = if (isEdit) {
                firestoreRepo.updateItem(item)
            } else {
                // Beri nomor urut otomatis jika baru
                val nextNo = (_items.value.maxOfOrNull { it.no } ?: 0) + 1
                firestoreRepo.addItem(item.copy(no = nextNo))
            }
            _isLoading.value = false

            result.onSuccess {
                _successMessage.value = if (isEdit) "Barang '${item.namaBarang}' berhasil diperbarui!" else "Barang baru '${item.namaBarang}' berhasil disimpan!"
                onSuccess()
            }.onFailure { err ->
                _errorMessage.value = "Gagal menyimpan barang: ${err.message}"
            }
        }
    }

    fun deleteItem(itemId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = firestoreRepo.deleteItem(itemId)
            _isLoading.value = false

            result.onSuccess {
                _successMessage.value = "Barang berhasil dihapus dari master inventaris."
            }.onFailure { err ->
                _errorMessage.value = "Gagal menghapus barang: ${err.message}"
            }
        }
    }

    fun getItemById(id: String): InventoryItem? {
        return _items.value.find { it.id == id }
    }

    fun clearMessages() {
        _errorMessage.value = null
        _successMessage.value = null
    }
}
