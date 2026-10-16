package id.sch.smkmutukemlagi.pinjamtei.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.google.firebase.firestore.FirebaseFirestore
import id.sch.smkmutukemlagi.pinjamtei.data.model.User
import id.sch.smkmutukemlagi.pinjamtei.data.utils.DeviceUtils
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AuthRepository(private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance()) {

    companion object {
        private const val PREFS_NAME = "inventaris_auth_prefs"
        private const val KEY_USER_ID = "logged_user_id"
        private const val KEY_USER_NAME = "logged_user_name"
        private const val KEY_USER_EMAIL = "logged_user_email"
        private const val KEY_USER_ROLE = "logged_user_role"
        private const val KEY_USER_ROLE_TITLE = "logged_user_role_title"
        private const val KEY_DEVICE_ID = "logged_device_id"
        private const val KEY_DEVICE_INFO = "logged_device_info"
    }

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getSavedUser(context: Context): User? {
        val prefs = getPrefs(context)
        val id = prefs.getString(KEY_USER_ID, null) ?: return null
        return User(
            id = id,
            name = prefs.getString(KEY_USER_NAME, "") ?: "",
            email = prefs.getString(KEY_USER_EMAIL, "") ?: "",
            role = prefs.getString(KEY_USER_ROLE, "") ?: "",
            roleTitle = prefs.getString(KEY_USER_ROLE_TITLE, "") ?: "",
            device_id = prefs.getString(KEY_DEVICE_ID, null),
            device_info = prefs.getString(KEY_DEVICE_INFO, null)
        )
    }

    private fun saveUserSession(context: Context, user: User) {
        getPrefs(context).edit().apply {
            putString(KEY_USER_ID, user.id)
            putString(KEY_USER_NAME, user.name)
            putString(KEY_USER_EMAIL, user.email)
            putString(KEY_USER_ROLE, user.role)
            putString(KEY_USER_ROLE_TITLE, user.roleTitle)
            putString(KEY_DEVICE_ID, user.device_id)
            putString(KEY_DEVICE_INFO, user.device_info)
            apply()
        }
    }

    fun logout(context: Context) {
        getPrefs(context).edit().clear().apply()
    }

    suspend fun login(identifier: String, pass: String, context: Context): Result<User> {
        return try {
            val cleanId = identifier.trim().lowercase()
            val cleanPass = pass.trim()

            // 1. Ambil data koleksi users dari Firestore
            val snapshot = firestore.collection("users").get().await()
            val userDoc = snapshot.documents.find { doc ->
                val email = doc.getString("email")?.trim()?.lowercase() ?: ""
                val username = doc.getString("username")?.trim()?.lowercase() ?: ""
                val docId = doc.id.trim().lowercase()
                email == cleanId || username == cleanId || docId == cleanId
            } ?: return Result.failure(Exception("Email atau username '$identifier' tidak terdaftar dalam sistem!"))

            val user = userDoc.toObject(User::class.java)?.copy(id = userDoc.id)
                ?: return Result.failure(Exception("Gagal memproses data profil pengguna."))

            // 2. Proteksi Wewenang Khusus: Hanya Kajur dan Toolman
            val role = user.role.lowercase()
            if (role != "toolman" && role != "kajur") {
                return Result.failure(
                    Exception("Akses Ditolak: Aplikasi ini khusus untuk Kepala Jurusan dan Toolman Bengkel TEI. Akun '${user.name}' (${user.roleTitle}) tidak memiliki izin.")
                )
            }

            // 3. Verifikasi Password
            val defaultPass = "12345"
            val storedPass = user.password.ifBlank { defaultPass }
            if (storedPass != cleanPass) {
                return Result.failure(Exception("Password yang Anda masukkan salah!"))
            }

            // 4. Validasi & Fitur Ikat Device (Hardware Fingerprint)
            val currentDeviceId = DeviceUtils.getDeviceId(context)
            val currentDeviceInfo = DeviceUtils.getDeviceInfo()
            val existingDeviceId = user.device_id?.trim()

            val finalUser: User
            if (existingDeviceId.isNullOrBlank()) {
                // Perangkat belum terikat: Lakukan BINDING PERTAMA KALI
                val nowFormatted = SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.getDefault()).format(Date())
                val updates = mapOf(
                    "device_id" to currentDeviceId,
                    "device_info" to currentDeviceInfo,
                    "bound_at" to nowFormatted
                )
                firestore.collection("users").document(user.id).update(updates).await()

                finalUser = user.copy(
                    device_id = currentDeviceId,
                    device_info = currentDeviceInfo,
                    bound_at = nowFormatted
                )
            } else {
                // Perangkat sudah terikat: Periksa kecocokan hardware ID
                if (existingDeviceId != currentDeviceId) {
                    val infoDeviceLama = user.device_info ?: existingDeviceId
                    return Result.failure(
                        Exception(
                            "❌ Perangkat Tidak Sesuai!\n\nAkun '${user.name}' sudah terikat secara resmi pada perangkat:\n'$infoDeviceLama'\n\nHanya HP yang terikat resmi yang diizinkan mengelola data bengkel. Hubungi admin/Kajur untuk reset binding jika Anda berganti HP."
                        )
                    )
                }
                finalUser = user
            }

            // Simpan sesi login lokal
            saveUserSession(context, finalUser)
            Result.success(finalUser)

        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
