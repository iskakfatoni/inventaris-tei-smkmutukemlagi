package id.sch.smkmutukemlagi.pinjamtei.data.model

import com.google.firebase.firestore.DocumentSnapshot

data class User(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val username: String = "",
    val role: String = "",
    val roleTitle: String = "",
    val password: String = "",
    val device_id: String? = null,
    val device_info: String? = null,
    val bound_at: String? = null
) {
    companion object {
        fun fromSnapshot(doc: DocumentSnapshot): User {
            return User(
                id = doc.id,
                name = doc.getString("name") ?: "",
                email = doc.getString("email") ?: "",
                username = doc.getString("username") ?: "",
                role = doc.getString("role") ?: "",
                roleTitle = doc.getString("roleTitle") ?: "",
                password = doc.getString("password") ?: "",
                device_id = doc.getString("device_id"),
                device_info = doc.getString("device_info"),
                bound_at = doc.getString("bound_at")
            )
        }
    }
}
