package com.safe.calculatorappblocker.ui

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safe.calculatorappblocker.security.PinSecurityManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

val DEFAULT_SECURITY_QUESTIONS = listOf(
    "What was the name of your first school?",
    "What is your favorite childhood pet?",
    "What city were you born in?",
    "What is your favorite movie or book?",
    "What is your mother's maiden name?"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SetupPasswordScreen(
    onSetupCompleted: () -> Unit
) {
    val context = LocalContext.current
    val pinManager = remember { PinSecurityManager.getInstance(context) }
    val coroutineScope = rememberCoroutineScope()

    var pin by remember { mutableStateOf("") }
    var confirmPin by remember { mutableStateOf("") }
    var selectedQuestion by remember { mutableStateOf(DEFAULT_SECURITY_QUESTIONS[0]) }
    var questionExpanded by remember { mutableStateOf(false) }
    var answer by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showSuccessDialog by remember { mutableStateOf(false) }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF121212)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Surface(
                color = Color(0xFF064E3B),
                shape = RoundedCornerShape(20.dp),
                modifier = Modifier.size(64.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = Color(0xFF10B981),
                        modifier = Modifier.size(32.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Welcome to Calculator Vault",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Set your secret password to protect your hidden app blocker.",
                fontSize = 14.sp,
                color = Color(0xFF94A3B8),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Card container for setup form
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "1. Secret Numeric Password",
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFFE2E8F0),
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Enter 4-6 digits. You'll type this into the calculator and press '=' to unlock.",
                        color = Color(0xFF94A3B8),
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = pin,
                        onValueChange = { if (it.length <= 8 && it.all { char -> char.isDigit() }) pin = it },
                        label = { Text("New Password (4-6 digits)") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF10B981),
                            unfocusedBorderColor = Color(0xFF475569)
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = confirmPin,
                        onValueChange = { if (it.length <= 8 && it.all { char -> char.isDigit() }) confirmPin = it },
                        label = { Text("Confirm Password") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF10B981),
                            unfocusedBorderColor = Color(0xFF475569)
                        )
                    )

                    Spacer(modifier = Modifier.height(20.dp))
                    HorizontalDivider(color = Color(0xFF334155))
                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "2. Security Recovery Question",
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFFE2E8F0),
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Used if you ever forget your calculator password.",
                        color = Color(0xFF94A3B8),
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = selectedQuestion,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Security Question") },
                            trailingIcon = {
                                IconButton(onClick = { questionExpanded = !questionExpanded }) {
                                    Icon(
                                        imageVector = Icons.Default.Info,
                                        contentDescription = "Select Question",
                                        tint = Color(0xFF10B981)
                                    )
                                }
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { questionExpanded = true },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = Color(0xFF10B981),
                                unfocusedBorderColor = Color(0xFF475569)
                            )
                        )
                        DropdownMenu(
                            expanded = questionExpanded,
                            onDismissRequest = { questionExpanded = false },
                            modifier = Modifier.background(Color(0xFF1E293B))
                        ) {
                            DEFAULT_SECURITY_QUESTIONS.forEach { q ->
                                DropdownMenuItem(
                                    text = { Text(q, color = Color.White, fontSize = 13.sp) },
                                    onClick = {
                                        selectedQuestion = q
                                        questionExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = answer,
                        onValueChange = { answer = it },
                        label = { Text("Your Secret Answer") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFF10B981),
                            unfocusedBorderColor = Color(0xFF475569)
                        )
                    )

                    if (errorMessage != null) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = errorMessage ?: "",
                            color = Color(0xFFEF4444),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = {
                    if (pin.length < 4) {
                        errorMessage = "Password must be at least 4 digits."
                        return@Button
                    }
                    if (pin != confirmPin) {
                        errorMessage = "Passwords do not match."
                        return@Button
                    }
                    if (answer.trim().isEmpty()) {
                        errorMessage = "Please provide an answer to your security question."
                        return@Button
                    }

                    errorMessage = null
                    coroutineScope.launch {
                        pinManager.setupInitialPassword(pin, selectedQuestion, answer)
                        showSuccessDialog = true
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
            ) {
                Icon(Icons.Default.Security, contentDescription = null, tint = Color.White)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Save Password & Lock Vault",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
            }
        }
    }

    if (showSuccessDialog) {
        AlertDialog(
            onDismissRequest = { /* forced close */ },
            icon = {
                Icon(
                    Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = Color(0xFF10B981),
                    modifier = Modifier.size(48.dp)
                )
            },
            title = {
                Text(
                    "Vault Configured Successfully",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
            },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        "Your secret password has been set. The app will now close to activate stealth disguise mode.",
                        color = Color(0xFFCBD5E1),
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Surface(
                        color = Color(0xFF0F172A),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp)
                    ) {
                        Text(
                            text = "💡 Next time you open this app, it will look like a regular calculator. Enter your password and press '=' to unlock.",
                            color = Color(0xFF38BDF8),
                            fontSize = 12.sp,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val activity = context as? Activity
                        activity?.finishAffinity()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Close App Now", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            containerColor = Color(0xFF1E293B)
        )
    }
}
