package com.safe.calculatorappblocker.ui

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class VaultTab {
    PHOTOS,
    VIDEOS,
    APPS,
    SETTINGS
}

data class SampleMedia(val title: String, val date: String, val size: String, val isVideo: Boolean)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VaultScreen(
    onLock: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(VaultTab.PHOTOS) }

    val samplePhotos = remember {
        listOf(
            SampleMedia("Secret Vacation Sunset", "Today, 2:15 PM", "3.4 MB", false),
            SampleMedia("Passport & ID Scan", "Yesterday", "2.1 MB", false),
            SampleMedia("Private Family Portrait", "Sep 18, 2026", "4.1 MB", false),
            SampleMedia("Bank Card Backup", "Sep 15, 2026", "1.9 MB", false),
            SampleMedia("Handwritten Diary", "Sep 10, 2026", "1.8 MB", false),
            SampleMedia("Mountain Hideaway", "Sep 08, 2026", "3.9 MB", false)
        )
    }

    val sampleVideos = remember {
        listOf(
            SampleMedia("Beach Waves & Aerial", "Sep 17, 2026", "18.4 MB", true),
            SampleMedia("Strategy Meeting Recording", "Sep 14, 2026", "14.2 MB", true),
            SampleMedia("Private Event Memo", "Sep 09, 2026", "22.5 MB", true)
        )
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
                                    VaultTab.PHOTOS -> "Private Photos (AES-256 Encrypted)"
                                    VaultTab.VIDEOS -> "Hidden Videos (Encrypted)"
                                    VaultTab.APPS -> "Hidden & Disguised Apps"
                                    VaultTab.SETTINGS -> "Vault Passcode & Decoy Settings"
                                },
                                fontSize = 11.sp,
                                color = Color(0xFF10B981)
                            )
                        }
                    }
                },
                actions = {
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
                    icon = { Icon(Icons.Default.Lock, contentDescription = "Apps") },
                    label = { Text("Hide Apps") },
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
                    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Hidden Photos (${samplePhotos.size})",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Button(
                                onClick = {},
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                shape = RoundedCornerShape(20.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Import Photo", fontSize = 11.sp)
                            }
                        }

                        LazyVerticalGrid(
                            columns = GridCells.Fixed(2),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(samplePhotos) { photo ->
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(130.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Color(0xFF1F1F23))
                                        .clickable {},
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        modifier = Modifier.padding(8.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Lock,
                                            contentDescription = null,
                                            tint = Color(0xFF10B981),
                                            modifier = Modifier.size(32.dp)
                                        )
                                        Spacer(modifier = Modifier.height(6.dp))
                                        Text(
                                            text = photo.title,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Color.White,
                                            maxLines = 1
                                        )
                                        Text(
                                            text = "${photo.date} • ${photo.size}",
                                            fontSize = 10.sp,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                VaultTab.VIDEOS -> {
                    Column(modifier = Modifier.fillMaxSize().padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Hidden Videos (${sampleVideos.size})",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Button(
                                onClick = {},
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                shape = RoundedCornerShape(20.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Import Video", fontSize = 11.sp)
                            }
                        }

                        LazyVerticalGrid(
                            columns = GridCells.Fixed(1),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(sampleVideos) { video ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Color(0xFF1F1F23))
                                        .clickable {}
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(50.dp)
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color(0xFF0F3E2E)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Default.PlayArrow,
                                            contentDescription = null,
                                            tint = Color(0xFF10B981),
                                            modifier = Modifier.size(28.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = video.title,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                        Text(
                                            text = "${video.date} • ${video.size}",
                                            fontSize = 11.sp,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                    Icon(
                                        Icons.Default.Lock,
                                        contentDescription = null,
                                        tint = Color(0xFF10B981),
                                        modifier = Modifier.size(20.dp)
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
}
