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

data class ImportedItemInfo(
    val uri: Uri,
    val displayName: String,
    val fileSize: Long,
    val realPath: String?,
    val mediaStoreUri: Uri?
)

data class ImportResult(
    val count: Int,
    val deletedOriginalsCount: Int,
    val pendingDeleteMediaStoreUris: List<Uri>,
    val items: List<ImportedItemInfo>
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

    fun getAllFilesAccessIntent(context: Context): Intent {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
                    data = Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            } catch (e: Exception) {
                Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            }
        } else {
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.parse("package:${context.packageName}")
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
        var deletedOriginalsCount = 0
        val targetDir = if (isVideo) videosDir else photosDir
        val importedItems = mutableListOf<ImportedItemInfo>()
        val pendingDeleteUris = mutableListOf<Uri>()

        val canDeleteDirectly = hasAllFilesAccess()

        for (uri in uris) {
            try {
                val displayName = queryDisplayName(uri) ?: (if (isVideo) "video_${System.currentTimeMillis()}.mp4" else "photo_${System.currentTimeMillis()}.jpg")
                val fileSize = queryFileSize(uri)
                val safePrefix = System.currentTimeMillis().toString()
                val targetFile = File(targetDir, "${safePrefix}_$displayName")

                // Step 1: Copy file stream into our private vault folder
                appContext.contentResolver.openInputStream(uri)?.use { input ->
                    FileOutputStream(targetFile).use { output ->
                        input.copyTo(output)
                    }
                }

                if (targetFile.exists() && targetFile.length() > 0) {
                    importedCount++

                    // Step 2: Resolve original file's real disk path and MediaStore URI
                    val (resolvedPath, resolvedMsUri) = resolveOriginalMediaLocation(uri, displayName, fileSize, isVideo)
                    Log.d(TAG, "Imported $displayName -> Resolved: path=$resolvedPath, msUri=$resolvedMsUri")

                    val itemInfo = ImportedItemInfo(
                        uri = uri,
                        displayName = displayName,
                        fileSize = fileSize,
                        realPath = resolvedPath,
                        mediaStoreUri = resolvedMsUri
                    )
                    importedItems.add(itemInfo)

                    // Step 3: Delete original file from Gallery & My Files
                    var originalDeleted = false
                    if (canDeleteDirectly && !resolvedPath.isNullOrBlank()) {
                        originalDeleted = deleteOriginalFileDirectly(resolvedPath, resolvedMsUri)
                    }

                    if (!originalDeleted && resolvedMsUri != null) {
                        pendingDeleteUris.add(resolvedMsUri)
                    } else if (originalDeleted) {
                        deletedOriginalsCount++
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to import media uri: $uri", e)
            }
        }

        ImportResult(
            count = importedCount,
            deletedOriginalsCount = deletedOriginalsCount,
            pendingDeleteMediaStoreUris = pendingDeleteUris,
            items = importedItems
        )
    }

    /**
     * Comprehensive resolver that finds both the exact disk path and MediaStore URI
     * across Samsung One UI, Android 11/12/13/14, and various content providers.
     */
    private fun resolveOriginalMediaLocation(
        uri: Uri,
        displayName: String,
        fileSize: Long,
        isVideo: Boolean
    ): Pair<String?, Uri?> {
        var foundPath: String? = null
        var foundMediaStoreUri: Uri? = null

        // 1. Direct file scheme
        if ("file".equals(uri.scheme, ignoreCase = true)) {
            foundPath = uri.path
        }

        // 2. Direct MediaStore URI
        if (uri.authority?.contains("media") == true && !DocumentsContract.isDocumentUri(appContext, uri)) {
            foundMediaStoreUri = uri
            foundPath = queryDataColumn(uri)
        }

        // 3. SAF Document URI resolution
        if (DocumentsContract.isDocumentUri(appContext, uri)) {
            val docId = DocumentsContract.getDocumentId(uri)
            val authority = uri.authority ?: ""

            // External Storage Document Provider (primary:DCIM/Camera/...)
            if (authority.contains("externalstorage", ignoreCase = true)) {
                val split = docId.split(":")
                if (split.size >= 2) {
                    val relative = split[1]
                    val candidate = File(Environment.getExternalStorageDirectory(), relative)
                    if (candidate.exists()) {
                        foundPath = candidate.absolutePath
                    }
                }
            }

            // Media Document Provider (image:12345 or video:12345)
            if (authority.contains("media.documents", ignoreCase = true)) {
                val split = docId.split(":")
                val idStr = if (split.size >= 2) split[1] else split[0]
                val id = idStr.toLongOrNull()
                if (id != null) {
                    val collection = if (isVideo || (split.isNotEmpty() && split[0].contains("video", ignoreCase = true))) {
                        MediaStore.Video.Media.EXTERNAL_CONTENT_URI
                    } else {
                        MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                    }
                    foundMediaStoreUri = ContentUris.withAppendedId(collection, id)
                    foundPath = queryDataColumn(foundMediaStoreUri)
                }
            }

            // Downloads Document Provider
            if (authority.contains("downloads", ignoreCase = true)) {
                if (docId.startsWith("raw:")) {
                    foundPath = docId.removePrefix("raw:")
                }
            }
        }

        // 4. Query MediaStore by DisplayName and Size if path or MediaStore URI is still missing
        if ((foundPath == null || foundMediaStoreUri == null) && displayName.isNotBlank()) {
            try {
                val collection = if (isVideo) {
                    MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
                } else {
                    MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
                }
                val proj = arrayOf(
                    MediaStore.MediaColumns._ID,
                    MediaStore.MediaColumns.DATA,
                    MediaStore.MediaColumns.SIZE
                )
                val selection = "${MediaStore.MediaColumns.DISPLAY_NAME} = ?"
                val selectionArgs = arrayOf(displayName)

                appContext.contentResolver.query(collection, proj, selection, selectionArgs, null)?.use { cursor ->
                    while (cursor.moveToNext()) {
                        val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID))
                        val path = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA))
                        val size = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.SIZE))

                        val msUri = ContentUris.withAppendedId(collection, id)
                        if (foundMediaStoreUri == null) foundMediaStoreUri = msUri
                        if (foundPath == null && !path.isNullOrBlank()) foundPath = path

                        // Exact size match
                        if (fileSize > 0 && size == fileSize) {
                            foundMediaStoreUri = msUri
                            if (!path.isNullOrBlank()) foundPath = path
                            break
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "MediaStore lookup by displayName failed", e)
            }
        }

        // 5. Direct disk search in common camera & picture directories on Samsung devices
        if (foundPath == null && displayName.isNotBlank()) {
            val searchDirs = listOf(
                File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM), "Camera"),
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM),
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
                File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Screenshots"),
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
            )

            for (dir in searchDirs) {
                val candidate = File(dir, displayName)
                if (candidate.exists() && candidate.isFile) {
                    foundPath = candidate.absolutePath
                    break
                }
            }
        }

        return Pair(foundPath, foundMediaStoreUri)
    }

    /**
     * Deletes the original file from the phone disk and immediately purges
     * the MediaStore cache so Samsung Gallery & My Files remove the photo right away.
     */
    fun deleteOriginalFileDirectly(realPath: String, mediaStoreUri: Uri?): Boolean {
        var deleted = false
        try {
            val file = File(realPath)
            if (file.exists()) {
                deleted = file.delete()
                Log.d(TAG, "Direct File.delete() result for $realPath: $deleted")
            }
        } catch (e: Exception) {
            Log.w(TAG, "File.delete() failed for $realPath", e)
        }

        // Delete from MediaStore database
        if (mediaStoreUri != null) {
            try {
                val rows = appContext.contentResolver.delete(mediaStoreUri, null, null)
                if (rows > 0) deleted = true
                Log.d(TAG, "ContentResolver.delete() result for $mediaStoreUri: $rows rows")
            } catch (e: Exception) {
                // ignore
            }
        }

        try {
            appContext.contentResolver.delete(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                "${MediaStore.MediaColumns.DATA} = ?",
                arrayOf(realPath)
            )
            appContext.contentResolver.delete(
                MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
                "${MediaStore.MediaColumns.DATA} = ?",
                arrayOf(realPath)
            )
        } catch (e: Exception) {
            // ignore
        }

        // Trigger MediaScanner to instantly refresh Samsung Gallery and My Files
        MediaScannerConnection.scanFile(appContext, arrayOf(realPath), null) { scannedPath, _ ->
            Log.d(TAG, "MediaScanner refreshed Samsung gallery: $scannedPath")
        }

        return deleted
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

    private fun queryFileSize(uri: Uri): Long {
        var size: Long = 0L
        try {
            val cursor = appContext.contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                if (it.moveToFirst()) {
                    val index = it.getColumnIndex(OpenableColumns.SIZE)
                    if (index >= 0) {
                        size = it.getLong(index)
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not resolve size for $uri", e)
        }
        return size
    }

    private fun queryDataColumn(uri: Uri): String? {
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
