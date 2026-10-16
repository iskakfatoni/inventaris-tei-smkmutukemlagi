# Proguard Rules for Inventaris TEI Admin

# Keep Firebase Firestore models and annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepclassmembers class * {
    @com.google.firebase.firestore.PropertyName <fields>;
    @com.google.firebase.firestore.DocumentId <fields>;
}
-keep class id.sch.smkmutukemlagi.pinjamtei.data.model.** { *; }

# Keep Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# ML Kit Barcode
-keep class com.google.mlkit.** { *; }

# Coil image loader
-keep class coil.** { *; }
