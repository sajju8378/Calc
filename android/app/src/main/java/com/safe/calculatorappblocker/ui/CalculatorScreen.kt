package com.safe.calculatorappblocker.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safe.calculatorappblocker.security.PinSecurityManager
import kotlinx.coroutines.launch

@Composable
fun CalculatorScreen(
    onSecretCodeSubmitted: (String) -> Unit
) {
    val context = LocalContext.current
    val pinManager = remember { PinSecurityManager.getInstance(context) }
    val coroutineScope = rememberCoroutineScope()

    var displayValue by remember { mutableStateOf("0") }
    var previousValue by remember { mutableStateOf("") }
    var currentOperation by remember { mutableStateOf<String?>(null) }
    var isNewNumber by remember { mutableStateOf(true) }

    // Forgot password / recovery dialog
    var showRecoveryDialog by remember { mutableStateOf(false) }
    var recoveryQuestion by remember { mutableStateOf("") }
    var recoveryAnswer by remember { mutableStateOf("") }
    var newPinInput by remember { mutableStateOf("") }
    var recoveryError by remember { mutableStateOf<String?>(null) }

    val buttons = listOf(
        listOf("C", "±", "%", "÷"),
        listOf("7", "8", "9", "×"),
        listOf("4", "5", "6", "-"),
        listOf("1", "2", "3", "+"),
        listOf("0", ".", "=")
    )

    fun onButtonClick(label: String) {
        when (label) {
            "C" -> {
                displayValue = "0"
                previousValue = ""
                currentOperation = null
                isNewNumber = true
            }
            "=" -> {
                // First check secret code trigger with current displayed value
                onSecretCodeSubmitted(displayValue.trim())

                if (currentOperation != null && previousValue.isNotEmpty()) {
                    val a = previousValue.toDoubleOrNull() ?: 0.0
                    val b = displayValue.toDoubleOrNull() ?: 0.0
                    val result = when (currentOperation) {
                        "+" -> a + b
                        "-" -> a - b
                        "×" -> a * b
                        "÷" -> if (b != 0.0) a / b else 0.0
                        else -> b
                    }
                    displayValue = if (result % 1.0 == 0.0) result.toLong().toString() else result.toString()
                    previousValue = ""
                    currentOperation = null
                    isNewNumber = true
                }
            }
            "+", "-", "×", "÷" -> {
                previousValue = displayValue
                currentOperation = label
                isNewNumber = true
            }
            "±" -> {
                if (displayValue.startsWith("-")) {
                    displayValue = displayValue.removePrefix("-")
                } else if (displayValue != "0") {
                    displayValue = "-$displayValue"
                }
            }
            "%" -> {
                val num = displayValue.toDoubleOrNull()
                if (num != null) {
                    displayValue = (num / 100.0).toString()
                }
            }
            "." -> {
                if (isNewNumber) {
                    displayValue = "0."
                    isNewNumber = false
                } else if (!displayValue.contains(".")) {
                    displayValue += "."
                }
            }
            else -> {
                // Digit 0-9
                if (isNewNumber || displayValue == "0") {
                    displayValue = label
                    isNewNumber = false
                } else {
                    if (displayValue.length < 15) {
                        displayValue += label
                    }
                }
            }
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF171717)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.Bottom
        ) {
            // Subtle top bar icon for password recovery if forgotten
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                IconButton(
                    onClick = {
                        coroutineScope.launch {
                            recoveryQuestion = pinManager.getSecurityQuestion()
                            recoveryAnswer = ""
                            newPinInput = ""
                            recoveryError = null
                            showRecoveryDialog = true
                        }
                    },
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = "Forgot Password Help",
                        tint = Color(0xFF404040),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Current operation preview
            if (previousValue.isNotEmpty() && currentOperation != null) {
                Text(
                    text = "$previousValue $currentOperation",
                    color = Color(0xFF9CA3AF),
                    fontSize = 22.sp,
                    textAlign = TextAlign.End,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                )
            }

            // Main Display
            Text(
                text = displayValue,
                color = Color.White,
                fontSize = if (displayValue.length > 8) 38.sp else 52.sp,
                fontWeight = FontWeight.Light,
                textAlign = TextAlign.End,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 20.dp),
                maxLines = 1
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Calculator Keypad
            buttons.forEach { row ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 5.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    row.forEach { btn ->
                        val isWide = btn == "0"
                        val weight = if (isWide) 2f else 1f
                        val isOperator = btn in listOf("÷", "×", "-", "+", "=")
                        val isTop = btn in listOf("C", "±", "%")

                        val bgColor = when {
                            btn == "=" -> Color(0xFF10B981)
                            isOperator -> Color(0xFF262626)
                            isTop -> Color(0xFF383838)
                            else -> Color(0xFF222222)
                        }

                        val textColor = when {
                            btn == "=" -> Color.White
                            isOperator -> Color(0xFF10B981)
                            isTop -> Color(0xFFE5E5E5)
                            else -> Color.White
                        }

                        Box(
                            modifier = Modifier
                                .weight(weight)
                                .aspectRatio(if (isWide) 2.2f else 1f)
                                .clip(CircleShape)
                                .background(bgColor)
                                .clickable { onButtonClick(btn) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = btn,
                                color = textColor,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    }

    // Forgot Password Recovery Dialog
    if (showRecoveryDialog) {
        AlertDialog(
            onDismissRequest = { showRecoveryDialog = false },
            title = {
                Text("Forgot Vault Password", color = Color.White, fontWeight = FontWeight.Bold)
            },
            text = {
                Column {
                    Text(
                        "Answer your security question to reset your password and unlock:",
                        color = Color(0xFF94A3B8),
                        fontSize = 13.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = recoveryQuestion.ifEmpty { "Security Question" },
                        color = Color.White,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = recoveryAnswer,
                        onValueChange = { recoveryAnswer = it },
                        label = { Text("Your Answer") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = newPinInput,
                        onValueChange = { if (it.length <= 8 && it.all { c -> c.isDigit() }) newPinInput = it },
                        label = { Text("New Password (4-6 digits)") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (recoveryError != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(recoveryError ?: "", color = Color(0xFFEF4444), fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (recoveryAnswer.trim().isEmpty() || newPinInput.length < 4) {
                            recoveryError = "Enter your answer and a 4-digit PIN."
                            return@Button
                        }
                        coroutineScope.launch {
                            val resetOk = pinManager.resetPasswordWithSecurityAnswer(recoveryAnswer, newPinInput)
                            if (resetOk) {
                                showRecoveryDialog = false
                                onSecretCodeSubmitted(newPinInput)
                            } else {
                                recoveryError = "Incorrect answer to security question."
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text("Reset & Unlock", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showRecoveryDialog = false }) {
                    Text("Cancel", color = Color.Gray)
                }
            },
            containerColor = Color(0xFF1E293B)
        )
    }
}
