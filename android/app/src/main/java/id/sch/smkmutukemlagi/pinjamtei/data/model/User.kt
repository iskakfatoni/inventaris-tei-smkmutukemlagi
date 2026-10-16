package id.sch.smkmutukemlagi.pinjamtei.data.model

import com.google.firebase.firestore.DocumentId

data class User(
    @DocumentId
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
)
