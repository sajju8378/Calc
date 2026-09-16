package com.safe.calculatorappblocker.ui

import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Key
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.safe.calculatorappblocker.security.PinSecurityManager
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen() {
    val context = LocalContext.current
    val pinManager = remember { PinSecurityManager.getInstance(context) }
    val coroutineScope = rememberCoroutineScope()

    // Change Password state
    var currentPinForChange by remember { mutableStateOf("") }
    var newPin by remember { mutableStateOf("") }
    var confirmNewPin by remember { mutableStateOf("") }
    var passwordChangeMessage by remember { mutableStateOf<String?>(null) }
    var isPasswordChangeSuccess by remember { mutableStateOf(false) }

    // Security Question state
    var currentSecurityQuestion by remember { mutableStateOf("") }
    var showQuestionDialog by remember { mutableStateOf(false) }
    var verifyPinForQuestion by remember { mutableStateOf("") }
    var selectedNewQuestion by remember { mutableStateOf(DEFAULT_SECURITY_QUESTIONS[0]) }
    var questionDropdownExpanded by remember { mutableStateOf(false) }
    var newAnswer by remember { mutableStateOf("") }
    var questionUpdateMessage by remember { mutableStateOf<String?>(null) }
    var isQuestionSuccess by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        currentSecurityQuestion = pinManager.getSecurityQuestion()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Section 1: Change Password
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Key, contentDescription = null, tint = Color(0xFF10B981))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Change Calculator Password",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = currentPinForChange,
                    onValueChange = { if (it.length <= 8 && it.all { c -> c.isDigit() }) currentPinForChange = it },
                    label = { Text("Current Password") },
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

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = newPin,
                    onValueChange = { if (it.length <= 8 && it.all { c -> c.isDigit() }) newPin = it },
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

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = confirmNewPin,
                    onValueChange = { if (it.length <= 8 && it.all { c -> c.isDigit() }) confirmNewPin = it },
                    label = { Text("Confirm New Password") },
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

                if (passwordChangeMessage != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = passwordChangeMessage ?: "",
                        color = if (isPasswordChangeSuccess) Color(0xFF10B981) else Color(0xFFEF4444),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = {
                        if (currentPinForChange.isEmpty() || newPin.isEmpty()) {
                            passwordChangeMessage = "Please enter all fields."
                            isPasswordChangeSuccess = false
                            return@Button
                        }
                        if (newPin.length < 4) {
                            passwordChangeMessage = "New password must be at least 4 digits."
                            isPasswordChangeSuccess = false
                            return@Button
                        }
                        if (newPin != confirmNewPin) {
                            passwordChangeMessage = "New passwords do not match."
                            isPasswordChangeSuccess = false
                            return@Button
                        }

                        coroutineScope.launch {
                            val success = pinManager.changePassword(currentPinForChange, newPin)
                            if (success) {
                                isPasswordChangeSuccess = true
                                passwordChangeMessage = "Password updated successfully!"
                                currentPinForChange = ""
                                newPin = ""
                                confirmNewPin = ""
                            } else {
                                isPasswordChangeSuccess = false
                                passwordChangeMessage = "Incorrect current password."
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text("Update Password", color = Color.White, fontWeight = FontWeight.SemiBold)
                }
            }
        }

        // Section 2: Security Question
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Security, contentDescription = null, tint = Color(0xFF38BDF8))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Security Question",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Current Question:",
                    fontSize = 12.sp,
                    color = Color(0xFF94A3B8)
                )
                Text(
                    text = currentSecurityQuestion.ifEmpty { "What was the name of your first school?" },
                    fontSize = 14.sp,
                    color = Color.White,
                    fontWeight = FontWeight.Medium
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedButton(
                    onClick = {
                        verifyPinForQuestion = ""
                        newAnswer = ""
                        questionUpdateMessage = null
                        showQuestionDialog = true
                    },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF38BDF8))
                ) {
                    Text("Change Security Question")
                }
            }
        }

        // Section 3: Android Accessibility Service Status
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF10B981))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "System Accessibility Service",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "To automatically intercept and block target apps when opened, the Accessibility Service must be enabled in Android Settings.",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8)
                )

                Spacer(modifier = Modifier.height(12.dp))

                Button(
                    onClick = {
                        try {
                            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            }
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            // Fallback
                        }
                    },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155))
                ) {
                    Text("Open Android Accessibility Settings", color = Color.White)
                }
            }
        }

        // Section 4: About App
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Info, contentDescription = null, tint = Color(0xFFA78BFA))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "About Calculator AppBlocker",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("App Version", color = Color(0xFF94A3B8), fontSize = 13.sp)
                    Text("1.0.0 (Release Build)", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Disguise Mode", color = Color(0xFF94A3B8), fontSize = 13.sp)
                    Text("Samsung One UI Calculator", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Data Privacy", color = Color(0xFF94A3B8), fontSize = 13.sp)
                    Text("100% Offline & Private", color = Color(0xFF10B981), fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Supported OS", color = Color(0xFF94A3B8), fontSize = 13.sp)
                    Text("Android 8.0 to Android 15+", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                }

                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = Color(0xFF334155))
                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "This app protects your focus and privacy by disguising an app locker behind a fully functional calculator. No background servers or personal telemetry.",
                    color = Color(0xFF64748B),
                    fontSize = 12.sp,
                    lineHeight = 16.sp
                )
            }
        }
    }

    // Change Security Question Dialog
    if (showQuestionDialog) {
        AlertDialog(
            onDismissRequest = { showQuestionDialog = false },
            title = { Text("Update Security Question", color = Color.White, fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    OutlinedTextField(
                        value = verifyPinForQuestion,
                        onValueChange = { if (it.length <= 8 && it.all { c -> c.isDigit() }) verifyPinForQuestion = it },
                        label = { Text("Current Password") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    ExposedDropdownMenuBox(
                        expanded = questionDropdownExpanded,
                        onExpandedChange = { questionDropdownExpanded = !questionDropdownExpanded },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        OutlinedTextField(
                            value = selectedNewQuestion,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("New Question") },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = questionDropdownExpanded) },
                            modifier = Modifier.menuAnchor().fillMaxWidth()
                        )
                        ExposedDropdownMenu(
                            expanded = questionDropdownExpanded,
                            onDismissRequest = { questionDropdownExpanded = false },
                            modifier = Modifier.background(Color(0xFF1E293B))
                        ) {
                            DEFAULT_SECURITY_QUESTIONS.forEach { q ->
                                DropdownMenuItem(
                                    text = { Text(q, color = Color.White, fontSize = 13.sp) },
                                    onClick = {
                                        selectedNewQuestion = q
                                        questionDropdownExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = newAnswer,
                        onValueChange = { newAnswer = it },
                        label = { Text("New Answer") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (questionUpdateMessage != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = questionUpdateMessage ?: "",
                            color = if (isQuestionSuccess) Color(0xFF10B981) else Color(0xFFEF4444),
                            fontSize = 12.sp
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newAnswer.trim().isEmpty()) {
                            questionUpdateMessage = "Please enter an answer."
                            isQuestionSuccess = false
                            return@Button
                        }
                        coroutineScope.launch {
                            val success = pinManager.updateSecurityQuestion(verifyPinForQuestion, selectedNewQuestion, newAnswer)
                            if (success) {
                                isQuestionSuccess = true
                                currentSecurityQuestion = selectedNewQuestion
                                showQuestionDialog = false
                            } else {
                                isQuestionSuccess = false
                                questionUpdateMessage = "Incorrect current password."
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
                ) {
                    Text("Save", color = Color.White)
                }
            },
            dismissButton = {
                TextButton(onClick = { showQuestionDialog = false }) {
                    Text("Cancel", color = Color.Gray)
                }
            },
            containerColor = Color(0xFF1E293B)
        )
    }
}
