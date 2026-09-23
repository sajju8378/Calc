package com.safe.calculatorappblocker.data

import android.app.PendingIntent
import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaScannerConnection
import android.media.ThumbnailUtils
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.DocumentsContract
import android.provider.MediaStore
import android.provider.OpenableColumns
import android.provider.Settings
import android.util.Log
import android.util.Size
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.*
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.*
import javax.crypto.Cipher
import javax.crypto.CipherInputStream
import javax.crypto.CipherOutputStream
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

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
) {
    val deletedDirectlyCount: Int get() = deletedOriginalsCount
}

class MediaVaultRepository private constructor(context: Context) {

    private val appContext = context.applicationContext

    // Private encrypted vault folders with .nomedia files to prevent gallery indexing
    private val photosDir = File(appContext.filesDir, "vault_photos").apply {
        if (!exists()) mkdirs()
        val noMedia = File(this, ".nomedia")
        if (!noMedia.exists()) noMedia.createNewFile()
    }
    private val videosDir = File(appContext.filesDir, "vault_videos").apply {
        if (!exists()) mkdirs()
        val noMedia = File(this, ".nomedia")
        if (!noMedia.exists()) noMedia.createNewFile()
    }

    // AES-256 encryption engine to encrypt all media bytes on disk
    private val vaultKeySpec: SecretKeySpec by lazy {
        val salt = "CalculatorVaultSecretKey2026SafeAppBlocker".toByteArray(Charsets.UTF_8)
        val md = MessageDigest.getInstance("SHA-256")
        val keyBytes = md.digest(salt)
        SecretKeySpec(keyBytes, "AES")
    }
    private val ivSpec = IvParameterSpec("CalcVaultIV_2026".toByteArray(Charsets.UTF_8))

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

    /**
     * Imports media, encrypts all bytes on disk with AES-256,
     * deletes the original file, and prepares MediaStore deletion request.
     */
    suspend fun importMedia(uris: List<Uri>, isVideo: Boolean): ImportResult = withContext(Dispatchers.IO) {
        var importedCount = 0
        var deletedDirectlyCount = 0
        val targetDir = if (isVideo) videosDir else photosDir
        val importedItems = mutableListOf<ImportedItemInfo>()
        val mediaStoreUrisToDelete = mutableListOf<Uri>()

        val canDeleteDirectly = hasAllFilesAccess()

        for (uri in uris) {
            try {
                val displayName = queryDisplayName(uri) ?: (if (isVideo) "video_${System.currentTimeMillis()}.mp4" else "photo_${System.currentTimeMillis()}.jpg")
                val fileSize = queryFileSize(uri)
                val safePrefix = System.currentTimeMillis().toString()
                // Store with .enc extension so files are scrambled and unidentifiable
                val targetFile = File(targetDir, "${safePrefix}_${displayName}.enc")

                // 1. Encrypt raw media stream with AES-256 into private vault
                appContext.contentResolver.openInputStream(uri)?.use { rawInput ->
                    FileOutputStream(targetFile).use { fileOut ->
                        val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
                        cipher.init(Cipher.ENCRYPT_MODE, vaultKeySpec, ivSpec)
                        CipherOutputStream(fileOut, cipher).use { cipherOut ->
                            rawInput.copyTo(cipherOut)
                        }
                    }
                }

                if (targetFile.exists() && targetFile.length() > 0) {
                    importedCount++

                    // 2. Resolve original disk path and real MediaStore row
                    val (resolvedPath, resolvedMsUri) = resolveOriginalMediaLocation(uri, displayName, fileSize, isVideo)
                    Log.d(TAG, "Encrypted $displayName -> Path: $resolvedPath, MsUri: $resolvedMsUri")

                    val itemInfo = ImportedItemInfo(
                        uri = uri,
                        displayName = displayName,
                        fileSize = fileSize,
                        realPath = resolvedPath,
                        mediaStoreUri = resolvedMsUri
                    )
                    importedItems.add(itemInfo)

                    // 3. Attempt direct removal from Samsung Gallery / MediaStore and disk
                    var wasDeletedDirectly = false

                    // A: Direct delete via ContentResolver on resolved MediaStore URI
                    if (resolvedMsUri != null) {
                        try {
                            val rows = appContext.contentResolver.delete(resolvedMsUri, null, null)
                            Log.d(TAG, "contentResolver.delete($resolvedMsUri) -> rows=$rows")
                            if (rows > 0) {
                                wasDeletedDirectly = true
                            }
                        } catch (e: Exception) {
                            Log.w(TAG, "Direct contentResolver.delete on $resolvedMsUri threw: ${e.message}")
                        }
                    }

                    // B: Direct delete on original picker URI (works on some SAF / file URIs)
                    try {
                        val rows = appContext.contentResolver.delete(uri, null, null)
                        if (rows > 0) {
                            wasDeletedDirectly = true
                        }
                    } catch (e: Exception) {
                        // Expected on read-only picker URIs
                    }

                    // C: Direct physical file deletion if MANAGE_EXTERNAL_STORAGE is granted
                    if (canDeleteDirectly) {
                        if (!resolvedPath.isNullOrBlank()) {
                            try {
                                val f = File(resolvedPath)
                                if (f.exists() && f.delete()) {
                                    Log.d(TAG, "Direct File.delete($resolvedPath) succeeded")
                                    wasDeletedDirectly = true
                                    MediaScannerConnection.scanFile(appContext, arrayOf(resolvedPath), null, null)
                                }
                            } catch (e: Exception) {
                                Log.w(TAG, "File.delete failed for $resolvedPath", e)
                            }
                        }

                        // Also search standard camera/pictures folders for exact name + size match
                        val cameraDirs = listOf(
                            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM), "Camera"),
                            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM),
                            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
                            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Screenshots"),
                            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
                        )
                        for (cdir in cameraDirs) {
                            val cf = File(cdir, displayName)
                            if (cf.exists() && cf.isFile && (fileSize <= 0 || cf.length() == fileSize)) {
                                try {
                                    if (cf.delete()) {
                                        Log.d(TAG, "Direct File.delete(${cf.absolutePath}) succeeded")
                                        wasDeletedDirectly = true
                                        MediaScannerConnection.scanFile(appContext, arrayOf(cf.absolutePath), null, null)
                                    }
                                } catch (e: Exception) {
                                    // ignore
                                }
                            }
                        }
                    }

                    if (wasDeletedDirectly) {
                        deletedDirectlyCount++
                        if (!resolvedPath.isNullOrBlank()) {
                            MediaScannerConnection.scanFile(appContext, arrayOf(resolvedPath), null, null)
                        }
                    } else {
                        // Queue for system delete request if direct delete didn't remove it
                        if (resolvedMsUri != null) {
                            mediaStoreUrisToDelete.add(resolvedMsUri)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to import and encrypt media uri: $uri", e)
            }
        }

        ImportResult(
            count = importedCount,
            deletedOriginalsCount = deletedDirectlyCount,
            pendingDeleteMediaStoreUris = mediaStoreUrisToDelete.distinct(),
            items = importedItems
        )
    }

    /**
     * Decrypts an encrypted photo on-the-fly into a Bitmap for display
     */
    suspend fun loadDecryptedBitmap(file: File, reqWidth: Int, reqHeight: Int): Bitmap? = withContext(Dispatchers.IO) {
        if (!file.exists()) return@withContext null
        try {
            val decryptedBytes = decryptFileToBytes(file) ?: return@withContext null

            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeByteArray(decryptedBytes, 0, decryptedBytes.size, options)

            var inSampleSize = 1
            val height = options.outHeight
            val width = options.outWidth

            if (height > reqWidth || width > reqWidth) {
                val halfHeight = height / 2
                val halfWidth = width / 2
                while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
                    inSampleSize *= 2
                }
            }

            options.inSampleSize = inSampleSize
            options.inJustDecodeBounds = false
            BitmapFactory.decodeByteArray(decryptedBytes, 0, decryptedBytes.size, options)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load decrypted bitmap for ${file.name}", e)
            null
        }
    }

    /**
     * Decrypts an encrypted video into a temporary cache file so the video player can stream it
     */
    suspend fun getDecryptedVideoForPlayback(item: VaultMediaItem): File? = withContext(Dispatchers.IO) {
        if (!item.file.exists()) return@withContext null
        try {
            val tempDir = File(appContext.cacheDir, "vault_playback").apply { if (!exists()) mkdirs() }
            val tempFile = File(tempDir, "temp_${System.currentTimeMillis()}_${item.displayName}")

            FileInputStream(item.file).use { fileIn ->
                val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
                cipher.init(Cipher.DECRYPT_MODE, vaultKeySpec, ivSpec)
                CipherInputStream(fileIn, cipher).use { cipherIn ->
                    FileOutputStream(tempFile).use { fileOut ->
                        cipherIn.copyTo(fileOut)
                    }
                }
            }
            tempFile
        } catch (e: Exception) {
            Log.e(TAG, "Failed decrypting video for playback", e)
            null
        }
    }

    /**
     * Generates a video thumbnail by temporarily decrypting the first frame
     */
    suspend fun loadDecryptedVideoThumbnail(file: File): Bitmap? = withContext(Dispatchers.IO) {
        if (!file.exists()) return@withContext null
        try {
            val tempFile = File(appContext.cacheDir, "thumb_${System.currentTimeMillis()}.mp4")
            FileInputStream(file).use { fileIn ->
                val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
                cipher.init(Cipher.DECRYPT_MODE, vaultKeySpec, ivSpec)
                CipherInputStream(fileIn, cipher).use { cipherIn ->
                    FileOutputStream(tempFile).use { fileOut ->
                        cipherIn.copyTo(fileOut)
                    }
                }
            }

            val thumb = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ThumbnailUtils.createVideoThumbnail(tempFile, Size(180, 180), null)
            } else {
                @Suppress("DEPRECATION")
                ThumbnailUtils.createVideoThumbnail(tempFile.absolutePath, MediaStore.Images.Thumbnails.MINI_KIND)
            }
            tempFile.delete()
            thumb
        } catch (e: Exception) {
            null
        }
    }

    private fun decryptFileToBytes(file: File): ByteArray? {
        return try {
            FileInputStream(file).use { fileIn ->
                val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
                cipher.init(Cipher.DECRYPT_MODE, vaultKeySpec, ivSpec)
                CipherInputStream(fileIn, cipher).use { cipherIn ->
                    cipherIn.readBytes()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error decrypting file bytes", e)
            null
        }
    }

    /**
     * Unhides/restores media: Decrypts file back to public gallery (Pictures/RestoredVault or Movies/RestoredVault).
     * Ensures NO DUPLICATE files are created!
     */
    suspend fun unhideToGallery(item: VaultMediaItem): Boolean = withContext(Dispatchers.IO) {
        try {
            if (!item.file.exists()) return@withContext false

            val cleanName = item.displayName
            val resolver = appContext.contentResolver

            // Decrypt raw bytes
            val decryptedBytes = decryptFileToBytes(item.file) ?: return@withContext false

            // Remove any stale duplicate from DCIM/Camera or Pictures to prevent gallery showing multiple files
            if (hasAllFilesAccess()) {
                val staleDirs = listOf(
                    File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM), "Camera"),
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM),
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
                    File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "RestoredVault")
                )
                for (dir in staleDirs) {
                    val staleFile = File(dir, cleanName)
                    if (staleFile.exists() && staleFile.isFile) {
                        try {
                            staleFile.delete()
                            MediaScannerConnection.scanFile(appContext, arrayOf(staleFile.absolutePath), null, null)
                        } catch (e: Exception) {
                            // ignore
                        }
                    }
                }
            }

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

                // Delete any old conflicting row first to prevent duplicate entries
                try {
                    resolver.delete(collection, "${MediaStore.MediaColumns.DISPLAY_NAME} = ?", arrayOf(cleanName))
                } catch (e: Exception) {
                    // ignore
                }

                val targetUri = resolver.insert(collection, contentValues) ?: return@withContext false
                resolver.openOutputStream(targetUri)?.use { out ->
                    out.write(decryptedBytes)
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
                FileOutputStream(targetFile).use { output ->
                    output.write(decryptedBytes)
                }
                MediaScannerConnection.scanFile(appContext, arrayOf(targetFile.absolutePath), null, null)
            }

            // Remove encrypted file from private vault after successful restoration
            item.file.delete()
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to unhide media to gallery", e)
            false
        }
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

    private fun isRealMediaStoreUri(uri: Uri): Boolean {
        val s = uri.toString()
        return (s.startsWith("content://media/external/images/media/") ||
                s.startsWith("content://media/external/video/media/") ||
                s.startsWith("content://media/external/file/") ||
                s.startsWith("content://media/external_primary/images/media/") ||
                s.startsWith("content://media/external_primary/video/media/"))
    }

    /**
     * Finds the MediaStore URI for a photo/video currently in the vault
     * so it can be wiped from Samsung Gallery if the original wasn't deleted earlier.
     */
    suspend fun findMediaStoreUriForVaultItem(item: VaultMediaItem): Uri? = withContext(Dispatchers.IO) {
        val cleanName = item.displayName
        val collections = if (item.isVideo) {
            listOf(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, MediaStore.Files.getContentUri("external"))
        } else {
            listOf(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, MediaStore.Files.getContentUri("external"))
        }
        val proj = arrayOf(MediaStore.MediaColumns._ID)
        val sel = "${MediaStore.MediaColumns.DISPLAY_NAME} = ?"
        for (collection in collections) {
            try {
                appContext.contentResolver.query(collection, proj, sel, arrayOf(cleanName), null)?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val id = cursor.getLong(0)
                        return@withContext ContentUris.withAppendedId(collection, id)
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed finding media store uri for ${item.displayName}", e)
            }
        }

        val searchDirs = listOf(
            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM), "Camera"),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
        )
        for (dir in searchDirs) {
            val candidate = File(dir, cleanName)
            if (candidate.exists() && candidate.isFile) {
                try {
                    val filesCollection = MediaStore.Files.getContentUri("external")
                    appContext.contentResolver.query(filesCollection, proj, "${MediaStore.MediaColumns.DATA} = ?", arrayOf(candidate.absolutePath), null)?.use { cursor ->
                        if (cursor.moveToFirst()) {
                            val id = cursor.getLong(0)
                            return@withContext ContentUris.withAppendedId(filesCollection, id)
                        }
                    }
                } catch (e: Exception) {
                    // ignore
                }
            }
        }

        null
    }

    suspend fun originalFileExistsInGallery(item: VaultMediaItem): Boolean = withContext(Dispatchers.IO) {
        val cleanName = item.displayName
        val searchDirs = listOf(
            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM), "Camera"),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Screenshots"),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
        )
        for (dir in searchDirs) {
            val candidate = File(dir, cleanName)
            if (candidate.exists() && candidate.isFile) {
                return@withContext true
            }
        }
        val msUri = findMediaStoreUriForVaultItem(item)
        msUri != null
    }

    suspend fun deleteGalleryOriginal(item: VaultMediaItem): Boolean = withContext(Dispatchers.IO) {
        var deleted = false
        val msUri = findMediaStoreUriForVaultItem(item)
        if (msUri != null) {
            try {
                val rows = appContext.contentResolver.delete(msUri, null, null)
                if (rows > 0) {
                    deleted = true
                }
            } catch (e: Exception) {
                Log.w(TAG, "deleteGalleryOriginal failed on $msUri", e)
            }
        }

        val cleanName = item.displayName
        val searchDirs = listOf(
            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM), "Camera"),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DCIM),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES),
            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Screenshots"),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
        )
        for (dir in searchDirs) {
            val candidate = File(dir, cleanName)
            if (candidate.exists() && candidate.isFile) {
                try {
                    if (candidate.delete()) {
                        deleted = true
                        MediaScannerConnection.scanFile(appContext, arrayOf(candidate.absolutePath), null, null)
                    }
                } catch (e: Exception) {
                    // ignore
                }
            }
        }
        deleted
    }

    suspend fun purgeOriginalsFromGallery(items: List<VaultMediaItem>): Int = withContext(Dispatchers.IO) {
        var count = 0
        for (item in items) {
            if (deleteGalleryOriginal(item)) {
                count++
            }
        }
        count
    }

    private fun deletePhysicalFile(path: String): Boolean {
        return try {
            val file = File(path)
            if (file.exists()) {
                val deleted = file.delete()
                Log.d(TAG, "Direct physical delete for $path: $deleted")
                MediaScannerConnection.scanFile(appContext, arrayOf(path), null, null)
                deleted
            } else {
                false
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed deleting physical file $path", e)
            false
        }
    }

    private fun resolveOriginalMediaLocation(
        uri: Uri,
        displayName: String,
        fileSize: Long,
        isVideo: Boolean
    ): Pair<String?, Uri?> {
        var foundPath: String? = null
        var foundMediaStoreUri: Uri? = null

        if ("file".equals(uri.scheme, ignoreCase = true)) {
            foundPath = uri.path
        }

        if (isRealMediaStoreUri(uri)) {
            foundMediaStoreUri = uri
            foundPath = queryDataColumn(uri)
        }

        if (DocumentsContract.isDocumentUri(appContext, uri)) {
            val docId = DocumentsContract.getDocumentId(uri)
            val authority = uri.authority ?: ""

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

            if (authority.contains("downloads", ignoreCase = true)) {
                if (docId.startsWith("raw:")) {
                    foundPath = docId.removePrefix("raw:")
                }
            }
        }

        // Check if URI last segment is numeric ID
        if (foundMediaStoreUri == null && uri.lastPathSegment?.toLongOrNull() != null) {
            val candidateId = uri.lastPathSegment!!.toLong()
            val collection = if (isVideo) {
                MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            } else {
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            }
            val candidateUri = ContentUris.withAppendedId(collection, candidateId)
            val testPath = queryDataColumn(candidateUri)
            if (!testPath.isNullOrBlank()) {
                foundMediaStoreUri = candidateUri
                foundPath = testPath
            }
        }

        // Query MediaStore by DisplayName if not resolved yet
        if (foundMediaStoreUri == null && displayName.isNotBlank()) {
            try {
                val collections = if (isVideo) {
                    listOf(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, MediaStore.Files.getContentUri("external"))
                } else {
                    listOf(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, MediaStore.Files.getContentUri("external"))
                }
                val proj = arrayOf(
                    MediaStore.MediaColumns._ID,
                    MediaStore.MediaColumns.DATA,
                    MediaStore.MediaColumns.SIZE
                )
                val selection = "${MediaStore.MediaColumns.DISPLAY_NAME} = ?"
                val selectionArgs = arrayOf(displayName)

                for (collection in collections) {
                    appContext.contentResolver.query(collection, proj, selection, selectionArgs, null)?.use { cursor ->
                        while (cursor.moveToNext()) {
                            val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID))
                            val path = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA))
                            val size = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.SIZE))

                            val msUri = ContentUris.withAppendedId(collection, id)
                            if (foundMediaStoreUri == null) foundMediaStoreUri = msUri
                            if (foundPath == null && !path.isNullOrBlank()) foundPath = path

                            if (fileSize > 0 && size == fileSize) {
                                foundMediaStoreUri = msUri
                                if (!path.isNullOrBlank()) foundPath = path
                                break
                            }
                        }
                    }
                    if (foundMediaStoreUri != null) break
                }
            } catch (e: Exception) {
                Log.w(TAG, "MediaStore lookup failed", e)
            }
        }

        // Search common Samsung Camera directories
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

        // If we found a disk path but not a MediaStore URI, query MediaStore by DATA path
        if (foundMediaStoreUri == null && !foundPath.isNullOrBlank()) {
            try {
                val filesCollection = MediaStore.Files.getContentUri("external")
                val proj = arrayOf(MediaStore.MediaColumns._ID)
                val sel = "${MediaStore.MediaColumns.DATA} = ?"
                appContext.contentResolver.query(filesCollection, proj, sel, arrayOf(foundPath), null)?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val id = cursor.getLong(0)
                        val baseCol = if (isVideo) MediaStore.Video.Media.EXTERNAL_CONTENT_URI else MediaStore.Images.Media.EXTERNAL_CONTENT_URI
                        foundMediaStoreUri = ContentUris.withAppendedId(baseCol, id)
                    }
                }
            } catch (e: Exception) {
                // ignore
            }
        }

        return Pair(foundPath, foundMediaStoreUri)
    }

    /**
     * Creates an Android 11+ system delete request for the MediaStore.
     * Samsung One UI will prompt: "Allow Calculator Vault to delete X photos from your device?"
     * This is the official and only 100% reliable mechanism to purge photos from Samsung Gallery.
     */
    fun createMediaStoreDeleteRequest(mediaStoreUris: List<Uri>): PendingIntent? {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && mediaStoreUris.isNotEmpty()) {
            return try {
                val distinctUris = mediaStoreUris.distinct()
                MediaStore.createDeleteRequest(appContext.contentResolver, distinctUris)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to create MediaStore delete request", e)
                null
            }
        }
        return null
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
        var name = filename
        if (name.endsWith(".enc")) {
            name = name.removeSuffix(".enc")
        }
        val underscoreIdx = name.indexOf('_')
        return if (underscoreIdx != -1 && underscoreIdx < 16) {
            name.substring(underscoreIdx + 1)
        } else {
            name
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
