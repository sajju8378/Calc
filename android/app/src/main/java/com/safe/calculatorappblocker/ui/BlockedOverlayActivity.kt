package com.safe.calculatorappblocker.ui

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safe.calculatorappblocker.data.BlockedAppsRepository
import com.safe.calculatorappblocker.security.PinSecurityManager
import kotlinx.coroutines.launch

class BlockedOverlayActivity : ComponentActivity() {

    private lateinit var repository: BlockedAppsRepository
    private lateinit var pinManager: PinSecurityManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        repository = BlockedAppsRepository.getInstance(applicationContext)
        pinManager = PinSecurityManager.getInstance(applicationContext)

        val blockedPackage = intent.getStringExtra(EXTRA_BLOCKED_PACKAGE) ?: "Unknown App"
        val appName = repository.getAppNameForPackage(blockedPackage)

        setContent {
            var showPinDialog by remember { mutableStateOf(false) }
            val coroutineScope = rememberCoroutineScope()

            Surface(
                modifier = Modifier.fillMaxSize(),
                color = MaterialTheme.colorScheme.background
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Blocked",
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(72.dp)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "App Blocked",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "This application ($appName) is currently protected.",
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    Button(
                        onClick = { returnToHomeScreen() },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Icon(Icons.Default.Home, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Return to Home", fontSize = 16.sp)
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedButton(
                        onClick = { showPinDialog = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Icon(Icons.Default.LockOpen, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Unlock Temporarily", fontSize = 16.sp)
                    }
                }

                if (showPinDialog) {
                    TemporaryUnlockPinDialog(
                        onDismiss = { showPinDialog = false },
                        onPinConfirmed = { pin ->
                            coroutineScope.launch {
                                val success = pinManager.verifyAdminPin(pin)
                                if (success) {
                                    repository.grantTemporaryUnlock(blockedPackage, 15 * 60 * 1000L)
                                    finish()
                                }
                            }
                        }
                    )
                }
            }
        }
    }

    private fun returnToHomeScreen() {
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
    }

    @Composable
    fun TemporaryUnlockPinDialog(
        onDismiss: () -> Unit,
        onPinConfirmed: (String) -> Unit
    ) {
        var pinInput by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = onDismiss,
            title = { Text("Enter Administrator PIN") },
            text = {
                Column {
                    Text("Provide your Administrator PIN to temporarily unblock this app for 15 minutes.")
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = pinInput,
                        onValueChange = { if (it.length <= 6) pinInput = it },
                        singleLine = true,
                        placeholder = { Text("PIN") }
                    )
                }
            },
            confirmButton = {
                Button(onClick = { onPinConfirmed(pinInput) }) {
                    Text("Confirm")
                }
            },
            dismissButton = {
                TextButton(onClick = onDismiss) {
                    Text("Cancel")
                }
            }
        )
    }

    companion object {
        const val EXTRA_BLOCKED_PACKAGE = "extra_blocked_package"
    }
}
