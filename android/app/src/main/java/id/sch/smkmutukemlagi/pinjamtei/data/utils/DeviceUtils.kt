package id.sch.smkmutukemlagi.pinjamtei.data.utils

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Base64
import java.io.ByteArrayOutputStream
import java.io.InputStream
import kotlin.math.roundToInt

object DeviceUtils {

    @SuppressLint("HardwareIds")
    fun getDeviceId(context: Context): String {
        val androidId = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: "UNKNOWN"
        return "HW-${androidId.uppercase()}"
    }

    fun getDeviceInfo(): String {
        val manufacturer = Build.MANUFACTURER.replaceFirstChar { it.uppercase() }
        val model = Build.MODEL
        return "$manufacturer $model"
    }

    /**
     * Mengompresi Bitmap dari Kamera/Galeri menjadi Data URL Base64 yang kompatibel dengan Web
     * Format: data:image/jpeg;base64,... (Ukuran berkas < 50 KB)
     */
    fun compressBitmapToBase64(bitmap: Bitmap, maxWidth: Int = 800, maxHeight: Int = 800, quality: Int = 75): String {
        var width = bitmap.width
        var height = bitmap.height

        if (width > height) {
            if (width > maxWidth) {
                height = (height.toFloat() * maxWidth.toFloat() / width.toFloat()).roundToInt()
                width = maxWidth
            }
        } else {
            if (height > maxHeight) {
                width = (width.toFloat() * maxHeight.toFloat() / height.toFloat()).roundToInt()
                height = maxHeight
            }
        }

        val resizedBitmap = Bitmap.createScaledBitmap(bitmap, width, height, true)
        val outputStream = ByteArrayOutputStream()
        resizedBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
        val byteArray = outputStream.toByteArray()
        val base64String = Base64.encodeToString(byteArray, Base64.NO_WRAP)
        return "data:image/jpeg;base64,$base64String"
    }

    fun uriToBitmap(context: Context, uri: Uri): Bitmap? {
        return try {
            val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
            BitmapFactory.decodeStream(inputStream)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
