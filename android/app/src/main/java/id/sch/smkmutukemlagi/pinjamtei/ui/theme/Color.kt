package id.sch.smkmutukemlagi.pinjamtei.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

// ========================================================
// Tema Oranye Gradasi Ungu (Sesuai Logo Resmi Inventaris TEI)
// ========================================================

val OrangePrimary = Color(0xFFFF7A00)        // Oranye Terang
val OrangeGradientStart = Color(0xFFFF8A00)  // Oranye Awal
val PurpleGradientEnd = Color(0xFF9333EA)    // Ungu Royal
val PurplePrimary = Color(0xFF8B5CF6)        // Ungu Terang
val PurpleDeep = Color(0xFF581C87)           // Ungu Gelap

// Gradasi Utama Oranye ke Ungu
val OrangePurpleGradient = Brush.horizontalGradient(
    colors = listOf(Color(0xFFFF7A00), Color(0xFF9333EA))
)

// Alias Utama agar seluruh UI otomatis beralih ke tema Oranye & Ungu
val CyanPrimary = OrangePrimary
val CyanVariant = PurplePrimary

// Latar Belakang Dark Elegance bernuansa Ungu Gelap / Indigo
val DarkBackground = Color(0xFF0C0A17)
val DarkSurface = Color(0xFF161226)
val DarkCard = Color(0xFF1E1835)
val DarkCardBorder = Color(0xFF3B2F63)

// Status Colors
val ColorSuccess = Color(0xFF10B981)
val ColorWarning = Color(0xFFF59E0B)
val ColorDanger = Color(0xFFEF4444)

// Typography Colors
val TextMain = Color(0xFFF8FAFC)
val TextMuted = Color(0xFFA5B4FC)
val TextDim = Color(0xFF71717A)
