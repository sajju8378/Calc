package com.safe.calculatorappblocker.data

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.provider.OpenableColumns
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class VaultMediaItem(
    val id: String,
    val displayName: String,
    val file: File,
    val sizeBytes: Long,
    val dateModifiedMs: Long,
    val isVideo: Boolean
) {
    val formattedSize: String
        get() {
            val kb = sizeBytes / 1024.0
            val mb = kb / 1024.0
            return when {
                mb >= 1.0 -> String.format(Locale.US, "%.1f MB", mb)
                kb >= 1.0 -> String.format(Locale.US, "%.0f KB", kb)
                else -> "$sizeBytes B"
            }
        }

    val formattedDate: String
        get() {
            val sdf = SimpleDateFormat("MMM d, yyyy h:mm a", Locale.getDefault())
            return sdf.format(Date(dateModifiedMs))
        }
}

class MediaVaultRepository private constructor(context: Context) {

    private val appContext = context.applicationContext
    private val photosDir = File(appContext.filesDir, "vault_photos").apply { if (!exists()) mkdirs() }
    private val videosDir = File(appContext.filesDir, "vault_videos").apply { if (!exists()) mkdirs() }

    suspend fun getPhotos(): List<VaultMediaItem> = withContext(Dispatchers.IO) {
        val files = photosDir.listFiles() ?: emptyArray()
        files.filter { it.isFile && !it.name.startsWith(".") }
            .sortedByDescending { it.lastModified() }
            .map { file ->
                VaultMediaItem(
                    id = file.name,
                    displayName = extractCleanName(file.name),
                    file = file,
                    sizeBytes = file.length(),
                    dateModifiedMs = file.lastModified(),
                    isVideo = false
                )
            }
    }

    suspend fun getVideos(): List<VaultMediaItem> = withContext(Dispatchers.IO) {
        val files = videosDir.listFiles() ?: emptyArray()
        files.filter { it.isFile && !it.name.startsWith(".") }
            .sortedByDescending { it.lastModified() }
            .map { file ->
                VaultMediaItem(
                    id = file.name,
                    displayName = extractCleanName(file.name),
                    file = file,
                    sizeBytes = file.length(),
                    dateModifiedMs = file.lastModified(),
                    isVideo = true
                )
            }
    }

    suspend fun importMedia(uris: List<Uri>, isVideo: Boolean): Int = withContext(Dispatchers.IO) {
        var importedCount = 0
        val targetDir = if (isVideo) videosDir else photosDir

        for (uri in uris) {
            try {
                val originalName = queryDisplayName(uri) ?: (if (isVideo) "video_${System.currentTimeMillis()}.mp4" else "photo_${System.currentTimeMillis()}.jpg")
                val safePrefix = System.currentTimeMillis().toString()
                val targetFile = File(targetDir, "${safePrefix}_$originalName")

                appContext.contentResolver.openInputStream(uri)?.use { input ->
                    FileOutputStream(targetFile).use { output ->
                        input.copyTo(output)
                    }
                }

                if (targetFile.exists() && targetFile.length() > 0) {
                    importedCount++
                    Log.d(TAG, "Successfully imported into vault: ${targetFile.name} (${targetFile.length()} bytes)")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to import media uri: $uri", e)
            }
        }
        importedCount
    }

    suspend fun deleteMedia(item: VaultMediaItem): Boolean = withContext(Dispatchers.IO) {
        try {
            if (item.file.exists()) {
                item.file.delete()
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error deleting media ${item.displayName}", e)
            false
        }
    }

    suspend fun unhideToGallery(item: VaultMediaItem): Boolean = withContext(Dispatchers.IO) {
        try {
            if (!item.file.exists()) return@withContext false

            val cleanName = item.displayName
            val resolver = appContext.contentResolver

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, cleanName)
                    put(MediaStore.MediaColumns.MIME_TYPE, if (item.isVideo) "video/mp4" else "image/jpeg")
                    put(
                        MediaStore.MediaColumns.RELATIVE_PATH,
                        if (item.isVideo) "${Environment.DIRECTORY_MOVIES}/RestoredVault" else "${Environment.DIRECTORY_PICTURES}/RestoredVault"
                    )
                }

                val collection = if (item.isVideo) {
                    MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                } else {
                    MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                }

                val targetUri = resolver.insert(collection, contentValues) ?: return@withContext false
                resolver.openOutputStream(targetUri)?.use { out ->
                    FileInputStream(item.file).use { input ->
                        input.copyTo(out)
                    }
                }
            } else {
                @Suppress("DEPRECATION")
                val publicDir = if (item.isVideo) {
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
                } else {
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
                }
                val vaultFolder = File(publicDir, "RestoredVault").apply { if (!exists()) mkdirs() }
                val targetFile = File(vaultFolder, cleanName)
                FileInputStream(item.file).use { input ->
                    FileOutputStream(targetFile).use { output ->
                        input.copyTo(output)
                    }
                }
            }

            // Delete from private vault after successfully unhiding back to public gallery
            item.file.delete()
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to unhide media to gallery", e)
            false
        }
    }

    private fun queryDisplayName(uri: Uri): String? {
        var name: String? = null
        try {
            val cursor = appContext.contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                if (it.moveToFirst()) {
                    val index = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (index >= 0) {
                        name = it.getString(index)
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not resolve display name for $uri", e)
        }
        return name
    }

    private fun extractCleanName(filename: String): String {
        val underscoreIdx = filename.indexOf('_')
        return if (underscoreIdx != -1 && underscoreIdx < 16) {
            filename.substring(underscoreIdx + 1)
        } else {
            filename
        }
    }

    companion object {
        private const val TAG = "MediaVaultRepository"

        @Volatile
        private var instance: MediaVaultRepository? = null

        fun getInstance(context: Context): MediaVaultRepository {
            return instance ?: synchronized(this) {
                instance ?: MediaVaultRepository(context).also { instance = it }
            }
        }
    }
}
