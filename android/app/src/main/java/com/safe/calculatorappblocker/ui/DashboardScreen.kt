package com.safe.calculatorappblocker.ui

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safe.calculatorappblocker.data.BlockedAppsRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class AppItem(
    val name: String,
    val packageName: String,
    val isBlocked: Boolean,
    val isSystemApp: Boolean = false
)

enum class AppFilter {
    ALL, BLOCKED, USER_ONLY, SYSTEM
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onLock: () -> Unit
) {
    val context = LocalContext.current
    val repository = remember { BlockedAppsRepository.getInstance(context) }
    val coroutineScope = rememberCoroutineScope()

    var installedApps by remember { mutableStateOf<List<AppItem>>(emptyList()) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedFilter by remember { mutableStateOf(AppFilter.ALL) }
    var isLoading by remember { mutableStateOf(true) }
    var showAddDialog by remember { mutableStateOf(false) }
    var customPackageInput by remember { mutableStateOf("") }
    var customAppNameInput by remember { mutableStateOf("") }

    // Load all real installed apps from Android PackageManager
    val refreshAppsList = {
        coroutineScope.launch {
            isLoading = true
            val blockedSet = repository.getBlockedPackages()
            val apps = withContext(Dispatchers.IO) {
                loadAllDeviceApps(context, blockedSet)
            }
            installedApps = apps
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        refreshAppsList()
    }

    // Filter apps based on search query and category
    val filteredApps = remember(installedApps, searchQuery, selectedFilter) {
        installedApps.filter { app ->
            val matchesQuery = searchQuery.isBlank() ||
                    app.name.contains(searchQuery, ignoreCase = true) ||
                    app.packageName.contains(searchQuery, ignoreCase = true)

            val matchesFilter = when (selectedFilter) {
                AppFilter.ALL -> true
                AppFilter.BLOCKED -> app.isBlocked
                AppFilter.USER_ONLY -> !app.isSystemApp
                AppFilter.SYSTEM -> app.isSystemApp
            }

            matchesQuery && matchesFilter
        }
    }

    val blockedCount = installedApps.count { it.isBlocked }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF10B981))
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text("AppBlocker Vault", fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Text(
                                text = "$blockedCount apps blocked",
                                fontSize = 12.sp,
                                color = Color(0xFF10B981)
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { showAddDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Any App", tint = Color.White)
                    }
                    IconButton(onClick = { refreshAppsList() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh Apps", tint = Color.White)
                    }
                    IconButton(onClick = onLock) {
                        Icon(Icons.Default.Lock, contentDescription = "Lock", tint = Color(0xFFEF4444))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1F1F1F),
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = Color(0xFF121212)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // Search input field
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Search all installed apps...", color = Color.Gray) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color.Gray) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", tint = Color.Gray)
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = Color(0xFF10B981),
                    unfocusedBorderColor = Color(0xFF334155),
                    focusedContainerColor = Color(0xFF1E293B),
                    unfocusedContainerColor = Color(0xFF1E293B)
                )
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Filter Chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedFilter == AppFilter.ALL,
                    onClick = { selectedFilter = AppFilter.ALL },
                    label = { Text("All (${installedApps.size})") }
                )
                FilterChip(
                    selected = selectedFilter == AppFilter.BLOCKED,
                    onClick = { selectedFilter = AppFilter.BLOCKED },
                    label = { Text("Blocked ($blockedCount)") }
                )
                FilterChip(
                    selected = selectedFilter == AppFilter.USER_ONLY,
                    onClick = { selectedFilter = AppFilter.USER_ONLY },
                    label = { Text("User Apps") }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFF10B981))
                }
            } else if (filteredApps.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Info, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No matching apps found", color = Color.Gray, fontSize = 14.sp)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filteredApps, key = { it.packageName }) { app ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = if (app.isBlocked) Color(0xFF1F2937) else Color(0xFF1E1E1E)
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = app.name,
                                            color = Color.White,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 15.sp
                                        )
                                        if (app.isSystemApp) {
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Surface(
                                                color = Color(0xFF374151),
                                                shape = RoundedCornerShape(4.dp)
                                            ) {
                                                Text(
                                                    text = "SYSTEM",
                                                    color = Color(0xFF9CA3AF),
                                                    fontSize = 9.sp,
                                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                                )
                                            }
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = app.packageName,
                                        color = Color(0xFF94A3B8),
                                        fontSize = 12.sp
                                    )
                                }

                                Switch(
                                    checked = app.isBlocked,
                                    onCheckedChange = { checked ->
                                        coroutineScope.launch {
                                            repository.setPackageBlocked(app.packageName, checked)
                                            installedApps = installedApps.map {
                                                if (it.packageName == app.packageName) it.copy(isBlocked = checked) else it
                                            }
                                        }
                                    },
                                    colors = SwitchDefaults.colors(
                                        checkedThumbColor = Color.White,
                                        checkedTrackColor = Color(0xFF10B981)
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Add Any App / Custom Package Name Dialog
    if (showAddDialog) {
        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Block Any Android App", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        "Enter the package name of any app (e.g., com.facebook.katana, com.snapchat.android, com.dts.freefireth):",
                        color = Color(0xFFCBD5E1),
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = customAppNameInput,
                        onValueChange = { customAppNameInput = it },
                        label = { Text("App Name (optional)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = customPackageInput,
                        onValueChange = { customPackageInput = it.trim() },
                        label = { Text("Package Name (e.g. com.example.app)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val pkg = customPackageInput.trim()
                        if (pkg.isNotEmpty()) {
                            val name = if (customAppNameInput.isNotBlank()) customAppNameInput.trim() else pkg
                            coroutineScope.launch {
                                repository.setPackageBlocked(pkg, true)
                                val exists = installedApps.any { it.packageName == pkg }
                                if (exists) {
                                    installedApps = installedApps.map {
                                        if (it.packageName == pkg) it.copy(isBlocked = true) else it
                                    }
                                } else {
                                    installedApps = listOf(AppItem(name, pkg, isBlocked = true, isSystemApp = false)) + installedApps
                                }
                                customPackageInput = ""
                                customAppNameInput = ""
                                showAddDialog = false
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text("Add & Block", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Cancel", color = Color.Gray)
                }
            },
            containerColor = Color(0xFF1E293B)
        )
    }
}

/**
 * Scans all installed packages from the device's PackageManager.
 * Supports every installed Android app, launcher, game, or utility.
 */
private fun loadAllDeviceApps(context: Context, blockedPackages: Set<String>): List<AppItem> {
    val pm = context.packageManager
    val myPackage = context.packageName
    val items = mutableListOf<AppItem>()

    // Priority popular apps to include if running in preview/emulator
    val defaultAppFallbacks = listOf(
        AppItem("Instagram", "com.instagram.android", blockedPackages.contains("com.instagram.android")),
        AppItem("YouTube", "com.google.android.youtube", blockedPackages.contains("com.google.android.youtube")),
        AppItem("TikTok", "com.zhiliaoapp.musically", blockedPackages.contains("com.zhiliaoapp.musically")),
        AppItem("Chrome", "com.android.chrome", blockedPackages.contains("com.android.chrome")),
        AppItem("Snapchat", "com.snapchat.android", blockedPackages.contains("com.snapchat.android")),
        AppItem("WhatsApp", "com.whatsapp", blockedPackages.contains("com.whatsapp")),
        AppItem("Facebook", "com.facebook.katana", blockedPackages.contains("com.facebook.katana")),
        AppItem("Twitter / X", "com.twitter.android", blockedPackages.contains("com.twitter.android")),
        AppItem("Telegram", "org.telegram.messenger", blockedPackages.contains("org.telegram.messenger")),
        AppItem("Netflix", "com.netflix.mediaclient", blockedPackages.contains("com.netflix.mediaclient")),
        AppItem("Spotify", "com.spotify.music", blockedPackages.contains("com.spotify.music")),
        AppItem("Discord", "com.discord", blockedPackages.contains("com.discord")),
        AppItem("Reddit", "com.reddit.frontpage", blockedPackages.contains("com.reddit.frontpage")),
        AppItem("Free Fire", "com.dts.freefireth", blockedPackages.contains("com.dts.freefireth")),
        AppItem("PUBG Mobile", "com.tencent.ig", blockedPackages.contains("com.tencent.ig"))
    )

    try {
        val installedApps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
        val addedPackages = mutableSetOf<String>()

        for (app in installedApps) {
            val pkg = app.packageName
            // Skip our own app
            if (pkg == myPackage) continue

            val isSystem = (app.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val launchIntent = pm.getLaunchIntentForPackage(pkg)
            val isLaunchable = launchIntent != null
            val isBlocked = blockedPackages.contains(pkg)

            // Only add launchable apps, user-installed apps, or currently blocked apps
            if (isLaunchable || !isSystem || isBlocked) {
                val label = try {
                    pm.getApplicationLabel(app).toString()
                } catch (e: Exception) {
                    pkg.substringAfterLast('.')
                }
                items.add(AppItem(name = label, packageName = pkg, isBlocked = isBlocked, isSystemApp = isSystem))
                addedPackages.add(pkg)
            }
        }

        // Also add any currently blocked packages that might not be in the launchable list
        for (blockedPkg in blockedPackages) {
            if (!addedPackages.contains(blockedPkg) && blockedPkg != myPackage) {
                items.add(AppItem(name = blockedPkg.substringAfterLast('.').replaceFirstChar { it.uppercase() }, packageName = blockedPkg, isBlocked = true, isSystemApp = false))
                addedPackages.add(blockedPkg)
            }
        }

        if (items.isEmpty()) {
            items.addAll(defaultAppFallbacks)
        }
    } catch (e: Exception) {
        items.addAll(defaultAppFallbacks)
    }

    return items.sortedWith(
        compareByDescending<AppItem> { it.isBlocked }
            .thenBy { it.name.lowercase() }
    )
}
