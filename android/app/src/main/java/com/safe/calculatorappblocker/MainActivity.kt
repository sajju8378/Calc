package com.safe.calculatorappblocker

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.safe.calculatorappblocker.security.PinSecurityManager
import com.safe.calculatorappblocker.ui.CalculatorScreen
import com.safe.calculatorappblocker.ui.DashboardScreen
import com.safe.calculatorappblocker.ui.SetupWizardScreen
import kotlinx.coroutines.launch

/**
 * Main Activity: Disguised visually as a Samsung One UI calculator.
 * Entering the secret administrator code (e.g. 2580 =) unlocks AppBlocker.
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
                    color = MaterialTheme.colorScheme.background
                ) {
                    var currentView by remember { mutableStateOf<AppView>(AppView.Calculator) }
                    val coroutineScope = rememberCoroutineScope()

                    when (currentView) {
                        is AppView.Calculator -> {
                            CalculatorScreen(
                                onSecretCodeSubmitted = { code ->
                                    coroutineScope.launch {
                                        val isSecret = pinManager.isCalculatorSecretTrigger(code)
                                        if (isSecret) {
                                            currentView = AppView.Dashboard
                                        }
                                    }
                                }
                            )
                        }
                        is AppView.Dashboard -> {
                            DashboardScreen(
                                onLock = { currentView = AppView.Calculator }
                            )
                        }
                        is AppView.Setup -> {
                            SetupWizardScreen(
                                onCompleted = { currentView = AppView.Dashboard }
                            )
                        }
                    }
                }
            }
        }
    }
}

sealed class AppView {
    object Calculator : AppView()
    object Setup : AppView()
    object Dashboard : AppView()
}
