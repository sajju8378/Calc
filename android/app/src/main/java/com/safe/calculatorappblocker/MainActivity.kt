package com.safe.calculatorappblocker

import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.safe.calculatorappblocker.security.PinSecurityManager
import com.safe.calculatorappblocker.ui.CalculatorScreen
import com.safe.calculatorappblocker.ui.SetupPasswordScreen
import com.safe.calculatorappblocker.ui.VaultScreen
import kotlinx.coroutines.launch

/**
 * Main Activity: Disguised visually as a Samsung One UI calculator.
 * On first installation: Prompts user to set secret password & security question.
 * After password is set: Closes and reopens as a fully functional normal calculator.
 * Typing the secret password followed by '=' unlocks the hidden AppBlocker & Settings Vault.
 */
class MainActivity : ComponentActivity() {

    private lateinit var pinManager: PinSecurityManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pinManager = PinSecurityManager.getInstance(applicationContext)

        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF121212)
                ) {
                    var currentView by remember { mutableStateOf<AppView>(AppView.Loading) }
                    val coroutineScope = rememberCoroutineScope()

                    // Check if password has been configured
                    LaunchedEffect(Unit) {
                        val isConfigured = pinManager.isPasswordConfigured()
                        currentView = if (isConfigured) {
                            AppView.Calculator
                        } else {
                            AppView.Setup
                        }
                    }

                    when (currentView) {
                        is AppView.Loading -> {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(color = Color(0xFF10B981))
                            }
                        }
                        is AppView.Setup -> {
                            SetupPasswordScreen(
                                onSetupCompleted = {
                                    // User completed first-time setup; close app to activate stealth mode
                                    finishAffinity()
                                }
                            )
                        }
                        is AppView.Calculator -> {
                            CalculatorScreen(
                                onSecretCodeSubmitted = { code ->
                                    coroutineScope.launch {
                                        val isValid = pinManager.verifyPassword(code)
                                        if (isValid) {
                                            currentView = AppView.Vault
                                        }
                                    }
                                }
                            )
                        }
                        is AppView.Vault -> {
                            VaultScreen(
                                onLock = {
                                    currentView = AppView.Calculator
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

sealed class AppView {
    object Loading : AppView()
    object Setup : AppView()
    object Calculator : AppView()
    object Vault : AppView()
}
