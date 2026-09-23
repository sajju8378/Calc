package com.safe.calculatorappblocker.ui

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.ThumbnailUtils
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import android.util.Size
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.core.content.FileProvider
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.safe.calculatorappblocker.data.ImportResult
import com.safe.calculatorappblocker.data.MediaVaultRepository
import com.safe.calculatorappblocker.data.VaultMediaItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

enum class VaultTab {
    PHOTOS,
    VIDEOS,
    APPS,
    SETTINGS
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VaultScreen(
    onLock: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val repository = remember { MediaVaultRepository.getInstance(context) }
    val coroutineScope = rememberCoroutineScope()

    var selectedTab by remember { mutableStateOf(VaultTab.PHOTOS) }
    var isImporting by remember { mutableStateOf(false) }
    var hasAllFilesAccess by remember { mutableStateOf(repository.hasAllFilesAccess()) }

    var photos by remember { mutableStateOf<List<VaultMediaItem>>(emptyList()) }
    var videos by remember { mutableStateOf<List<VaultMediaItem>>(emptyList()) }

    var selectedPhotoForViewer by remember { mutableStateOf<VaultMediaItem?>(null) }
    var selectedVideoForViewer by remember { mutableStateOf<VaultMediaItem?>(null) }
    var pendingDeleteDialog by remember { mutableStateOf<ImportResult?>(null) }

    fun refreshMedia() {
        coroutineScope.launch {
            photos = repository.getPhotos()
            videos = repository.getVideos()
            hasAllFilesAccess = repository.hasAllFilesAccess()
        }
    }

    // Refresh permission status whenever user returns from settings or another app
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                hasAllFilesAccess = repository.hasAllFilesAccess()
                refreshMedia()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    LaunchedEffect(Unit) {
        refreshMedia()
    }

    // Android 11+ System Delete Request Launcher
    // This displays Samsung's native system confirmation dialog:
    // "Allow Calculator Vault to delete this photo from your device?"
    val deleteRequestLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            Toast.makeText(
                context,
                "✓ Original deleted from Samsung Gallery! Only vault copy exists.",
                Toast.LENGTH_LONG
            ).show()
            refreshMedia()
        } else {
            Toast.makeText(
                context,
                "Original kept in Gallery (Deletion cancelled).",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    fun handlePostImport(result: ImportResult) {
        // PRIORITIZE MediaStore system delete request if any items could not be deleted directly!
        // On Android 11/12 (Samsung Galaxy M31 / One UI), this triggers Samsung's native confirmation dialog:
        // "Allow Calculator Vault to delete this photo from your device?"
        if (result.pendingDeleteMediaStoreUris.isNotEmpty()) {
            val deleteIntent = repository.createMediaStoreDeleteRequest(result.pendingDeleteMediaStoreUris)
            if (deleteIntent != null) {
                try {
                    deleteRequestLauncher.launch(
                        IntentSenderRequest.Builder(deleteIntent.intentSender).build()
                    )
                    return
                } catch (e: Exception) {
                    Log.e("VaultScreen", "Failed launching delete request", e)
                }
            }
        }

        if (result.deletedOriginalsCount > 0) {
            Toast.makeText(
                context,
                "✓ Locked ${result.count} item(s) in Vault! Original permanently deleted from Samsung Gallery.",
                Toast.LENGTH_LONG
            ).show()
        } else {
            pendingDeleteDialog = result
        }
    }

    // Photo picker launcher (Multiple images)
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            coroutineScope.launch {
                isImporting = true
                val result = repository.importMedia(uris, isVideo = false)
                photos = repository.getPhotos()
                isImporting = false

                if (result.count > 0) {
                    handlePostImport(result)
                }
            }
        }
    }

    // Video picker launcher (Multiple videos)
    val videoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            coroutineScope.launch {
                isImporting = true
                val result = repository.importMedia(uris, isVideo = true)
                videos = repository.getVideos()
                isImporting = false

                if (result.count > 0) {
                    handlePostImport(result)
                }
            }
        }
    }

    fun playVideo(video: VaultMediaItem) {
        coroutineScope.launch {
            val decryptedTemp = repository.getDecryptedVideoForPlayback(video)
            if (decryptedTemp != null) {
                try {
                    val uri = FileProvider.getUriForFile(
                        context,
                        "${context.packageName}.fileprovider",
                        decryptedTemp
                    )
                    val intent = Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(uri, "video/*")
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                } catch (e: Exception) {
                    Toast.makeText(context, "No video player installed on device", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(context, "Failed to decrypt video for playback", Toast.LENGTH_SHORT).show()
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null,
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = "Calculator Vault",
                                fontSize = 17.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = when (selectedTab) {
                                    VaultTab.PHOTOS -> "Private Photos (${photos.size})"
                                    VaultTab.VIDEOS -> "Hidden Videos (${videos.size})"
                                    VaultTab.APPS -> "App Blocker Active"
                                    VaultTab.SETTINGS -> "Vault Passcode & Security"
                                },
                                fontSize = 11.sp,
                                color = Color(0xFF10B981)
                            )
                        }
                    }
                },
                actions = {
                    if ((selectedTab == VaultTab.PHOTOS && photos.isNotEmpty()) || (selectedTab == VaultTab.VIDEOS && videos.isNotEmpty())) {
                        IconButton(
                            onClick = {
                                coroutineScope.launch {
                                    val currentList = if (selectedTab == VaultTab.PHOTOS) photos else videos
                                    if (repository.hasAllFilesAccess()) {
                                        val purged = repository.purgeOriginalsFromGallery(currentList)
                                        if (purged > 0) {
                                            Toast.makeText(context, "✓ Permanently removed $purged original(s) from Samsung Gallery!", Toast.LENGTH_LONG).show()
                                            refreshMedia()
                                            return@launch
                                        }
                                    }
                                    val urisToPurge = mutableListOf<Uri>()
                                    for (item in currentList) {
                                        val msUri = repository.findMediaStoreUriForVaultItem(item)
                                        if (msUri != null) {
                                            urisToPurge.add(msUri)
                                        }
                                    }
                                    if (urisToPurge.isNotEmpty()) {
                                        val deleteIntent = repository.createMediaStoreDeleteRequest(urisToPurge)
                                        if (deleteIntent != null) {
                                            deleteRequestLauncher.launch(
                                                IntentSenderRequest.Builder(deleteIntent.intentSender).build()
                                            )
                                        } else {
                                            Toast.makeText(context, "Found ${urisToPurge.size} gallery item(s). Please grant All Files Access to delete.", Toast.LENGTH_LONG).show()
                                        }
                                    } else {
                                        Toast.makeText(context, "No leftover originals found in Gallery! Everything is clean.", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            }
                        ) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Purge Gallery Originals",
                                tint = Color(0xFFD97706)
                            )
                        }
                    }

                    FilledTonalButton(
                        onClick = onLock,
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = Color(0xFF27272A),
                            contentColor = Color(0xFFEF4444)
                        ),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.Lock, contentDescription = "Lock", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Lock", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF18181B)
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF18181B),
                contentColor = Color.White
            ) {
                NavigationBarItem(
                    selected = selectedTab == VaultTab.PHOTOS,
                    onClick = { selectedTab = VaultTab.PHOTOS },
                    icon = { Icon(Icons.Default.Star, contentDescription = "Photos") },
                    label = { Text("Photos") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = Color(0xFF10B981),
                        indicatorColor = Color(0xFF10B981),
                        unselectedIconColor = Color(0xFF94A3B8),
                        unselectedTextColor = Color(0xFF94A3B8)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == VaultTab.VIDEOS,
                    onClick = { selectedTab = VaultTab.VIDEOS },
                    icon = { Icon(Icons.Default.PlayArrow, contentDescription = "Videos") },
                    label = { Text("Videos") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = Color(0xFF10B981),
                        indicatorColor = Color(0xFF10B981),
                        unselectedIconColor = Color(0xFF94A3B8),
                        unselectedTextColor = Color(0xFF94A3B8)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == VaultTab.APPS,
                    onClick = { selectedTab = VaultTab.APPS },
                    icon = { Icon(Icons.Default.Shield, contentDescription = "App Blocker") },
                    label = { Text("App Blocker") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = Color(0xFF10B981),
                        indicatorColor = Color(0xFF10B981),
                        unselectedIconColor = Color(0xFF94A3B8),
                        unselectedTextColor = Color(0xFF94A3B8)
                    )
                )
                NavigationBarItem(
                    selected = selectedTab == VaultTab.SETTINGS,
                    onClick = { selectedTab = VaultTab.SETTINGS },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color.White,
                        selectedTextColor = Color(0xFF10B981),
                        indicatorColor = Color(0xFF10B981),
                        unselectedIconColor = Color(0xFF94A3B8),
                        unselectedTextColor = Color(0xFF94A3B8)
                    )
                )
            }
        },
        containerColor = Color(0xFF121214)
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (selectedTab) {
                VaultTab.PHOTOS -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(14.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Private Photos",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "${photos.size} encrypted items in vault",
                                    fontSize = 11.sp,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                            Button(
                                onClick = {
                                    photoPickerLauncher.launch("image/*")
                                },
                                enabled = !isImporting,
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                shape = RoundedCornerShape(20.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(if (isImporting) "Importing..." else "Import Photos", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        if (isImporting) {
                            LinearProgressIndicator(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 8.dp),
                                color = Color(0xFF10B981)
                            )
                        }

                        if (photos.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        Icons.Default.Star,
                                        contentDescription = null,
                                        tint = Color(0xFF334155),
                                        modifier = Modifier.size(64.dp)
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = "No private photos yet",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF94A3B8)
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Tap 'Import Photos' to lock pictures inside this hidden vault",
                                        fontSize = 11.sp,
                                        color = Color(0xFF64748B),
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(horizontal = 24.dp)
                                    )
                                }
                            }
                        } else {
                            LazyVerticalGrid(
                                columns = GridCells.Fixed(3),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxSize()
                            ) {
                                items(photos, key = { it.id }) { photo ->
                                    PhotoGridThumbnail(
                                        item = photo,
                                        repository = repository,
                                        onClick = { selectedPhotoForViewer = photo }
                                    )
                                }
                            }
                        }
                    }
                }

                VaultTab.VIDEOS -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(14.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Hidden Videos",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "${videos.size} encrypted videos in vault",
                                    fontSize = 11.sp,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                            Button(
                                onClick = {
                                    videoPickerLauncher.launch("video/*")
                                },
                                enabled = !isImporting,
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                shape = RoundedCornerShape(20.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(if (isImporting) "Importing..." else "Import Videos", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        if (isImporting) {
                            LinearProgressIndicator(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 8.dp),
                                color = Color(0xFF10B981)
                            )
                        }

                        if (videos.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        Icons.Default.PlayArrow,
                                        contentDescription = null,
                                        tint = Color(0xFF334155),
                                        modifier = Modifier.size(64.dp)
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = "No hidden videos yet",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF94A3B8)
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Tap 'Import Videos' to securely store private clips",
                                        fontSize = 11.sp,
                                        color = Color(0xFF64748B),
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.padding(horizontal = 24.dp)
                                    )
                                }
                            }
                        } else {
                            LazyVerticalGrid(
                                columns = GridCells.Fixed(1),
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxSize()
                            ) {
                                items(videos, key = { it.id }) { video ->
                                    VideoListRow(
                                        item = video,
                                        repository = repository,
                                        onClick = { selectedVideoForViewer = video },
                                        onPlay = { playVideo(video) }
                                    )
                                }
                            }
                        }
                    }
                }

                VaultTab.APPS -> {
                    DashboardScreen(onLock = onLock)
                }

                VaultTab.SETTINGS -> {
                    SettingsScreen()
                }
            }
        }
    }

    // Interactive Dialog when delete intent requires manual permission
    pendingDeleteDialog?.let { result ->
        AlertDialog(
            onDismissRequest = { pendingDeleteDialog = null },
            title = {
                Text(
                    text = "Delete Originals from Gallery?",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            },
            text = {
                Column {
                    Text(
                        text = "Your media is now safely locked inside Calculator Vault.",
                        color = Color(0xFFCBD5E1),
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "To erase original unencrypted files from Samsung Gallery & My Files, allow Android permission.",
                        color = Color(0xFF94A3B8),
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        pendingDeleteDialog = null
                        if (result.pendingDeleteMediaStoreUris.isNotEmpty()) {
                            val deleteIntent = repository.createMediaStoreDeleteRequest(result.pendingDeleteMediaStoreUris)
                            if (deleteIntent != null) {
                                deleteRequestLauncher.launch(
                                    IntentSenderRequest.Builder(deleteIntent.intentSender).build()
                                )
                            }
                        } else {
                            context.startActivity(repository.getAllFilesAccessIntent(context))
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text("Delete from Gallery", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { pendingDeleteDialog = null }
                ) {
                    Text("Keep in Gallery", color = Color(0xFF94A3B8))
                }
            },
            containerColor = Color(0xFF1E1E24)
        )
    }

    // Interactive Photo Lightbox Dialog
    selectedPhotoForViewer?.let { photo ->
        Dialog(onDismissRequest = { selectedPhotoForViewer = null }) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .wrapContentHeight(),
                shape = RoundedCornerShape(24.dp),
                color = Color(0xFF1E1E24)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    var fullBitmap by remember { mutableStateOf<Bitmap?>(null) }
                    var originalExistsInGallery by remember { mutableStateOf(false) }

                    LaunchedEffect(photo.file.absolutePath) {
                        fullBitmap = withContext(Dispatchers.IO) {
                            repository.loadDecryptedBitmap(photo.file, 800, 800)
                        }
                        originalExistsInGallery = repository.originalFileExistsInGallery(photo)
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(260.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.Black),
                        contentAlignment = Alignment.Center
                    ) {
                        if (fullBitmap != null) {
                            Image(
                                bitmap = fullBitmap!!.asImageBitmap(),
                                contentDescription = photo.displayName,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Fit
                            )
                        } else {
                            CircularProgressIndicator(color = Color(0xFF10B981))
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = photo.displayName,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "${photo.formattedSize} • ${photo.formattedDate}",
                        fontSize = 11.sp,
                        color = Color(0xFF94A3B8)
                    )

                    // If original still exists in Samsung Gallery, provide an explicit button to delete it!
                    if (originalExistsInGallery) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Button(
                            onClick = {
                                coroutineScope.launch {
                                    if (repository.hasAllFilesAccess()) {
                                        val deleted = repository.deleteGalleryOriginal(photo)
                                        if (deleted) {
                                            originalExistsInGallery = false
                                            Toast.makeText(context, "✓ Original permanently removed from Samsung Gallery!", Toast.LENGTH_SHORT).show()
                                            refreshMedia()
                                            return@launch
                                        }
                                    }
                                    val msUri = repository.findMediaStoreUriForVaultItem(photo)
                                    if (msUri != null) {
                                        val deleteIntent = repository.createMediaStoreDeleteRequest(listOf(msUri))
                                        if (deleteIntent != null) {
                                            selectedPhotoForViewer = null
                                            deleteRequestLauncher.launch(
                                                IntentSenderRequest.Builder(deleteIntent.intentSender).build()
                                            )
                                        } else {
                                            Toast.makeText(context, "Please grant All Files Access to delete original.", Toast.LENGTH_LONG).show()
                                        }
                                    } else {
                                        Toast.makeText(context, "Could not locate gallery entry", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706)),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Remove Original from Samsung Gallery", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                coroutineScope.launch {
                                    val success = repository.unhideToGallery(photo)
                                    if (success) {
                                        photos = repository.getPhotos()
                                        selectedPhotoForViewer = null
                                        Toast.makeText(context, "Restored photo back to Gallery!", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "Failed to restore photo", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.ArrowBack, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Unhide", fontSize = 12.sp)
                        }

                        Button(
                            onClick = {
                                coroutineScope.launch {
                                    repository.deleteMedia(photo)
                                    photos = repository.getPhotos()
                                    selectedPhotoForViewer = null
                                    Toast.makeText(context, "Deleted from vault", Toast.LENGTH_SHORT).show()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Delete", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }

    // Video Details & Play Dialog
    selectedVideoForViewer?.let { video ->
        Dialog(onDismissRequest = { selectedVideoForViewer = null }) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .wrapContentHeight(),
                shape = RoundedCornerShape(24.dp),
                color = Color(0xFF1E1E24)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    var originalExistsInGallery by remember { mutableStateOf(false) }

                    LaunchedEffect(video.file.absolutePath) {
                        originalExistsInGallery = repository.originalFileExistsInGallery(video)
                    }

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color(0xFF0F291E))
                            .clickable {
                                playVideo(video)
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(54.dp)
                                    .clip(RoundedCornerShape(27.dp))
                                    .background(Color(0xFF10B981)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.PlayArrow, contentDescription = "Play", tint = Color.White, modifier = Modifier.size(36.dp))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Tap to Play Video", color = Color(0xFF10B981), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = video.displayName,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "${video.formattedSize} • ${video.formattedDate}",
                        fontSize = 11.sp,
                        color = Color(0xFF94A3B8)
                    )

                    // If original still exists in Samsung Gallery, provide an explicit button to delete it!
                    if (originalExistsInGallery) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Button(
                            onClick = {
                                coroutineScope.launch {
                                    if (repository.hasAllFilesAccess()) {
                                        val deleted = repository.deleteGalleryOriginal(video)
                                        if (deleted) {
                                            originalExistsInGallery = false
                                            Toast.makeText(context, "✓ Original permanently removed from Samsung Gallery!", Toast.LENGTH_SHORT).show()
                                            refreshMedia()
                                            return@launch
                                        }
                                    }
                                    val msUri = repository.findMediaStoreUriForVaultItem(video)
                                    if (msUri != null) {
                                        val deleteIntent = repository.createMediaStoreDeleteRequest(listOf(msUri))
                                        if (deleteIntent != null) {
                                            selectedVideoForViewer = null
                                            deleteRequestLauncher.launch(
                                                IntentSenderRequest.Builder(deleteIntent.intentSender).build()
                                            )
                                        } else {
                                            Toast.makeText(context, "Please grant All Files Access to delete original.", Toast.LENGTH_LONG).show()
                                        }
                                    } else {
                                        Toast.makeText(context, "Could not locate gallery entry", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD97706)),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Remove Original from Samsung Gallery", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                coroutineScope.launch {
                                    val success = repository.unhideToGallery(video)
                                    if (success) {
                                        videos = repository.getVideos()
                                        selectedVideoForViewer = null
                                        Toast.makeText(context, "Restored video back to Movies/Gallery!", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "Failed to restore video", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.ArrowBack, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Unhide", fontSize = 12.sp)
                        }

                        Button(
                            onClick = {
                                coroutineScope.launch {
                                    repository.deleteMedia(video)
                                    videos = repository.getVideos()
                                    selectedVideoForViewer = null
                                    Toast.makeText(context, "Deleted from vault", Toast.LENGTH_SHORT).show()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Delete", fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PhotoGridThumbnail(
    item: VaultMediaItem,
    repository: MediaVaultRepository,
    onClick: () -> Unit
) {
    var thumbnail by remember { mutableStateOf<Bitmap?>(null) }

    LaunchedEffect(item.file.absolutePath) {
        thumbnail = withContext(Dispatchers.IO) {
            repository.loadDecryptedBitmap(item.file, 160, 160)
        }
    }

    Box(
        modifier = Modifier
            .aspectRatio(1f)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF26262B))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        if (thumbnail != null) {
            Image(
                bitmap = thumbnail!!.asImageBitmap(),
                contentDescription = item.displayName,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        } else {
            Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFF64748B), modifier = Modifier.size(24.dp))
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(Color(0xAA000000))
                .padding(horizontal = 4.dp, vertical = 2.dp)
        ) {
            Text(
                text = item.formattedSize,
                fontSize = 9.sp,
                color = Color(0xFFE2E8F0),
                maxLines = 1
            )
        }
    }
}

@Composable
fun VideoListRow(
    item: VaultMediaItem,
    repository: MediaVaultRepository,
    onClick: () -> Unit,
    onPlay: () -> Unit
) {
    var thumbnail by remember { mutableStateOf<Bitmap?>(null) }

    LaunchedEffect(item.file.absolutePath) {
        thumbnail = withContext(Dispatchers.IO) {
            repository.loadDecryptedVideoThumbnail(item.file)
        }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFF1E1E24))
            .clickable(onClick = onClick)
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(60.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFF0F291E)),
            contentAlignment = Alignment.Center
        ) {
            if (thumbnail != null) {
                Image(
                    bitmap = thumbnail!!.asImageBitmap(),
                    contentDescription = item.displayName,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Color(0xCC10B981)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = "Play", tint = Color.White, modifier = Modifier.size(18.dp))
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.displayName,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "${item.formattedSize} • ${item.formattedDate}",
                fontSize = 11.sp,
                color = Color(0xFF94A3B8)
            )
        }

        IconButton(onClick = onPlay) {
            Icon(Icons.Default.PlayArrow, contentDescription = "Play", tint = Color(0xFF10B981))
        }
    }
}

private fun loadSampledBitmap(path: String, reqWidth: Int, reqHeight: Int): Bitmap? {
    return try {
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(path, options)

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
        BitmapFactory.decodeFile(path, options)
    } catch (e: Exception) {
        null
    }
}

private fun loadVideoThumbnail(path: String): Bitmap? {
    return try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ThumbnailUtils.createVideoThumbnail(File(path), Size(180, 180), null)
        } else {
            @Suppress("DEPRECATION")
            ThumbnailUtils.createVideoThumbnail(path, MediaStore.Images.Thumbnails.MINI_KIND)
        }
    } catch (e: Exception) {
        null
    }
}
