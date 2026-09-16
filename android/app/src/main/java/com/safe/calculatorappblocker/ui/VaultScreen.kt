package com.safe.calculatorappblocker.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class VaultTab {
    APP_BLOCKER,
    SETTINGS
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VaultScreen(
    onLock: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(VaultTab.APP_BLOCKER) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Shield,
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
                                text = if (selectedTab == VaultTab.APP_BLOCKER) "App Blocker Active" else "Security & Preferences",
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
                            containerColor = Color(0xFF374151),
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
                    selected = selectedTab == VaultTab.APP_BLOCKER,
                    onClick = { selectedTab = VaultTab.APP_BLOCKER },
                    icon = { Icon(Icons.Default.Block, contentDescription = "App Blocker") },
                    label = { Text("App Blocker", fontWeight = if (selectedTab == VaultTab.APP_BLOCKER) FontWeight.Bold else FontWeight.Normal) },
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
                    label = { Text("Settings", fontWeight = if (selectedTab == VaultTab.SETTINGS) FontWeight.Bold else FontWeight.Normal) },
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
        containerColor = Color(0xFF121212)
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (selectedTab) {
                VaultTab.APP_BLOCKER -> {
                    DashboardScreen(
                        onLock = onLock
                    )
                }
                VaultTab.SETTINGS -> {
                    SettingsScreen()
                }
            }
        }
    }
}
