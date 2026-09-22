package com.safe.calculatorappblocker.data

import android.app.PendingIntent
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.DocumentsContract
import android.provider.MediaStore
import android.provider.OpenableColumns
import android.provider.Settings
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

data class ImportResult(
    val count: Int,
    val uris: List<Uri>,
    val realPaths: List<String>,
    val mediaStoreUris: List<Uri>
)

class MediaVaultRepository private constructor(context: Context) {

    private val appContext = context.applicationContext
    private val photosDir = File(appContext.filesDir, "vault_photos").apply { if (!exists()) mkdirs() }
    private val videosDir = File(appContext.filesDir, "vault_videos").apply { if (!exists()) mkdirs() }

    fun hasAllFilesAccess(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Environment.isExternalStorageManager()
        } else {
            true
        }
    }

    fun getAllFilesAccessIntent(): Intent {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
                    data = Uri.parse("package:${appContext.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            } catch (e: Exception) {
                Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            }
        } else {
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${appContext.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        }
    }

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

    suspend fun importMedia(uris: List<Uri>, isVideo: Boolean): ImportResult = withContext(Dispatchers.IO) {
        var importedCount = 0
        val targetDir = if (isVideo) videosDir else photosDir
        val importedUris = mutableListOf<Uri>()
        val realPaths = mutableListOf<String>()
        val mediaStoreUris = mutableListOf<Uri>()

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
                    importedUris.add(uri)

                    val realPath = resolveRealPath(uri)
                    if (!realPath.isNullOrBlank()) {
                        realPaths.add(realPath)
                    }

                    val msUri = resolveMediaStoreUri(uri, isVideo, realPath)
                    if (msUri != null) {
                        mediaStoreUris.add(msUri)
                    }
                    Log.d(TAG, "Imported file ${targetFile.name}. RealPath=$realPath, MediaStoreUri=$msUri")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to import media uri: $uri", e)
            }
        }

        ImportResult(
            count = importedCount,
            uris = importedUris,
            realPaths = realPaths,
            mediaStoreUris = mediaStoreUris
        )
    }

    /**
     * Attempts to delete original files from Gallery / My Files directly.
     * Works when MANAGE_EXTERNAL_STORAGE is granted, or if file paths are writable.
     */
    suspend fun deleteOriginalFilesDirectly(paths: List<String>): Int = withContext(Dispatchers.IO) {
        var deletedCount = 0
        val pathsToScan = mutableListOf<String>()

        for (path in paths) {
            try {
                val file = File(path)
                if (file.exists() && file.delete()) {
                    deletedCount++
                    pathsToScan.add(path)
                    try {
                        appContext.contentResolver.delete(
                            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                            "${MediaStore.MediaColumns.DATA}=?",
                            arrayOf(path)
                        )
                        appContext.contentResolver.delete(
                            MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
                            "${MediaStore.MediaColumns.DATA}=?",
                            arrayOf(path)
                        )
                    } catch (e: Exception) {
                        // ignore
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Could not directly delete file at $path", e)
            }
        }

        if (pathsToScan.isNotEmpty()) {
            MediaScannerConnection.scanFile(appContext, pathsToScan.toTypedArray(), null, null)
        }
        deletedCount
    }

    /**
     * Creates an Android 11+ system delete request for the MediaStore.
     * Samsung One UI will prompt: "Allow Calculator Vault to delete X photos from your device?"
     */
    fun createMediaStoreDeleteRequest(mediaStoreUris: List<Uri>): PendingIntent? {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && mediaStoreUris.isNotEmpty()) {
            return try {
                MediaStore.createDeleteRequest(appContext.contentResolver, mediaStoreUris)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to create MediaStore delete request", e)
                null
            }
        }
        return null
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
                MediaScannerConnection.scanFile(appContext, arrayOf(targetFile.absolutePath), null, null)
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

    private fun resolveRealPath(uri: Uri): String? {
        if ("file".equals(uri.scheme, ignoreCase = true)) {
            return uri.path
        }
        try {
            val proj = arrayOf(MediaStore.MediaColumns.DATA)
            appContext.contentResolver.query(uri, proj, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val idx = cursor.getColumnIndex(MediaStore.MediaColumns.DATA)
                    if (idx >= 0) {
                        return cursor.getString(idx)
                    }
                }
            }
        } catch (e: Exception) {
            // ignore
        }
        return null
    }

    private fun resolveMediaStoreUri(uri: Uri, isVideo: Boolean, realPath: String?): Uri? {
        if (uri.authority?.contains("media") == true && !DocumentsContract.isDocumentUri(appContext, uri)) {
            return uri
        }

        try {
            if (DocumentsContract.isDocumentUri(appContext, uri)) {
                val docId = DocumentsContract.getDocumentId(uri)
                val split = docId.split(":")
                if (split.size >= 2) {
                    val id = split[1].toLongOrNull()
                    if (id != null) {
                        return if (isVideo || split[0].contains("video", ignoreCase = true)) {
                            ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id)
                        } else {
                            ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            // ignore
        }

        // Try querying by realPath in MediaStore
        if (!realPath.isNullOrBlank()) {
            try {
                val collection = if (isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI else MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                val proj = arrayOf(MediaStore.MediaColumns._ID)
                appContext.contentResolver.query(
                    collection,
                    proj,
                    "${MediaStore.MediaColumns.DATA}=?",
                    arrayOf(realPath),
                    null
                )?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val id = cursor.getLong(0)
                        return ContentUris.withAppendedId(collection, id)
                    }
                }
            } catch (e: Exception) {
                // ignore
            }
        }
        return null
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
