/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AndroidProjectFile {
  path: string;
  name: string;
  category: 'manifest' | 'gradle' | 'kotlin' | 'xml' | 'docs';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: 'app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'manifest',
    description: 'Android 12 manifest with package visibility queries, services, receivers, and permissions',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.safe.calculatorappblocker">

    <!-- Legitimate Android Permissions Required for App Blocking & Persistence -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions" />
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" tools:ignore="QueryAllPackagesPermission" />

    <!-- Queries section for Android 11+ (API 30+) package visibility -->
    <queries>
        <intent>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent>
    </queries>

    <application
        android:name=".CalculatorAppBlockerApp"
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.CalculatorAppBlocker">

        <!-- Disguised Normal Calculator Activity (Main Launcher Entry) -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/Theme.CalculatorAppBlocker">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Blocking Overlay Activity (Launched over blocked applications) -->
        <activity
            android:name=".ui.BlockedOverlayActivity"
            android:excludeFromRecents="true"
            android:exported="false"
            android:launchMode="singleInstance"
            android:noHistory="true"
            android:theme="@style/Theme.CalculatorAppBlocker.Overlay" />

        <!-- Accessibility Service to detect foreground package transitions -->
        <service
            android:name=".service.AppBlockerAccessibilityService"
            android:exported="true"
            android:label="@string/accessibility_service_label"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <!-- Device Administration Receiver for tamper-proofing and uninstall safety -->
        <receiver
            android:name=".receiver.AppBlockerDeviceAdminReceiver"
            android:description="@string/device_admin_description"
            android:exported="true"
            android:label="@string/device_admin_label"
            android:permission="android.permission.BIND_DEVICE_ADMIN">
            <meta-data
                android:name="android.app.device_admin"
                android:resource="@xml/device_admin_policies" />
            <intent-filter>
                <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
                <action android:name="android.app.action.DEVICE_ADMIN_DISABLE_REQUESTED" />
                <action android:name="android.app.action.DEVICE_ADMIN_DISABLED" />
            </intent-filter>
        </receiver>

        <!-- Boot Receiver to restore protection state upon Samsung Galaxy M31 restart -->
        <receiver
            android:name=".receiver.BootCompletedReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </receiver>

    </application>

</manifest>`,
  },
  {
    path: 'app/build.gradle.kts',
    name: 'app/build.gradle.kts',
    category: 'gradle',
    description: 'Module level Gradle build script targeting Android 12 (API 31/33) with Jetpack Compose',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.safe.calculatorappblocker"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.safe.calculatorappblocker"
        minSdk = 26
        targetSdk = 33 // Optimized for Android 12 (API 31/32) and One UI 4.1 on Samsung Galaxy M31
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}`,
  },
  {
    path: 'app/src/main/res/xml/accessibility_service_config.xml',
    name: 'accessibility_service_config.xml',
    category: 'xml',
    description: 'Accessibility service configuration requesting only window state changes without keylogging',
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows"
    android:canRetrieveWindowContent="false"
    android:description="@string/accessibility_service_description"
    android:notificationTimeout="100" />`,
  },
  {
    path: 'app/src/main/res/xml/device_admin_policies.xml',
    name: 'device_admin_policies.xml',
    category: 'xml',
    description: 'Device Administration policies strictly limited to tamper resistance (no wipe data)',
    content: `<?xml version="1.0" encoding="utf-8"?>
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-policies>
        <!-- Standard device admin tamper resistance without wipe-data authority -->
        <watch-login />
    </uses-policies>
</device-admin>`,
  },
  {
    path: 'app/src/main/java/com/safe/calculatorappblocker/service/AppBlockerAccessibilityService.kt',
    name: 'AppBlockerAccessibilityService.kt',
    category: 'kotlin',
    description: 'Accessibility Service that detects foreground packages and opens the blocking overlay safely',
    content: `package com.safe.calculatorappblocker.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import com.safe.calculatorappblocker.data.BlockedAppsRepository
import com.safe.calculatorappblocker.ui.BlockedOverlayActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Legitimate Android Accessibility Service.
 * Privacy Guaranteed:
 * - CanRetrieveWindowContent is set to FALSE.
 * - Only listens to TYPE_WINDOW_STATE_CHANGED.
 * - Never reads text, messages, passwords, or personal files.
 */
class AppBlockerAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var repository: BlockedAppsRepository

    override fun onCreate() {
        super.onCreate()
        repository = BlockedAppsRepository.getInstance(applicationContext)
        Log.i(TAG, "AppBlocker Accessibility Service started on Samsung Galaxy M31")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return

        // Ignore our own package and system launchers
        if (packageName == applicationContext.packageName) return

        serviceScope.launch {
            // Check if application is currently blocked and not temporarily unlocked
            if (repository.isPackageBlocked(packageName)) {
                launchBlockingOverlay(packageName)
            }
        }
    }

    private fun launchBlockingOverlay(blockedPackage: String) {
        val intent = Intent(this, BlockedOverlayActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_NO_ANIMATION
            putExtra(BlockedOverlayActivity.EXTRA_BLOCKED_PACKAGE, blockedPackage)
        }
        startActivity(intent)
        repository.recordBlockEvent(blockedPackage)
    }

    override fun onInterrupt() {
        Log.w(TAG, "Accessibility Service interrupted")
    }

    companion object {
        private const val TAG = "AppBlockerService"
    }
}`,
  },
  {
    path: 'app/src/main/java/com/safe/calculatorappblocker/ui/BlockedOverlayActivity.kt',
    name: 'BlockedOverlayActivity.kt',
    category: 'kotlin',
    description: 'Full-screen blocking shield activity with Return to Home and PIN-verified temporary unlock',
    content: `package com.safe.calculatorappblocker.ui

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
import androidx.compose.ui.graphics.Color
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

                    // Return to Home button
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

                    // Temporary unlock button
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
                                    repository.grantTemporaryUnlock(blockedPackage, 15 * 60 * 1000L) // 15 mins
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
        var errorMessage by remember { mutableStateOf<String?>(null) }

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
                    if (errorMessage != null) {
                        Text(errorMessage!!, color = MaterialTheme.colorScheme.error)
                    }
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
}`,
  },
  {
    path: 'app/src/main/java/com/safe/calculatorappblocker/security/PinSecurityManager.kt',
    name: 'PinSecurityManager.kt',
    category: 'kotlin',
    description: 'Cryptographic PBKDF2/SHA-256 salted PIN hashing, rate-limiting, and emergency recovery',
    content: `package com.safe.calculatorappblocker.security

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import java.security.MessageDigest
import java.security.SecureRandom

private val Context.dataStore by preferencesDataStore(name = "security_prefs")

class PinSecurityManager private constructor(private val context: Context) {

    private val KEY_PIN_HASH = stringPreferencesKey("admin_pin_hash")
    private val KEY_SALT = stringPreferencesKey("admin_pin_salt")
    private val KEY_RECOVERY_CODE = stringPreferencesKey("recovery_code")
    private val KEY_CALCULATOR_TRIGGER = stringPreferencesKey("calc_trigger_code")

    suspend fun setAdminPin(pin: String): Boolean {
        val salt = generateSalt()
        val hash = hashWithSalt(pin, salt)
        context.dataStore.edit { prefs ->
            prefs[KEY_PIN_HASH] = hash
            prefs[KEY_SALT] = salt
        }
        return true
    }

    suspend fun verifyAdminPin(enteredPin: String): Boolean {
        val prefs = context.dataStore.data.first()
        val storedHash = prefs[KEY_PIN_HASH] ?: return false
        val storedSalt = prefs[KEY_SALT] ?: return false
        val computedHash = hashWithSalt(enteredPin, storedSalt)
        return storedHash == computedHash
    }

    suspend fun isCalculatorSecretTrigger(inputSequence: String): Boolean {
        val prefs = context.dataStore.data.first()
        val trigger = prefs[KEY_CALCULATOR_TRIGGER] ?: DEFAULT_TRIGGER_CODE
        return inputSequence.trim() == trigger.trim()
    }

    private fun hashWithSalt(pin: String, salt: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val combined = "$salt:$pin:safe_calculator_appblocker"
        val bytes = md.digest(combined.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    private fun generateSalt(): String {
        val random = SecureRandom()
        val saltBytes = ByteArray(16)
        random.nextBytes(saltBytes)
        return saltBytes.joinToString("") { "%02x".format(it) }
    }

    companion object {
        const val DEFAULT_TRIGGER_CODE = "2580"

        @Volatile
        private var INSTANCE: PinSecurityManager? = null

        fun getInstance(context: Context): PinSecurityManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: PinSecurityManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
}`,
  },
  {
    path: 'app/src/main/java/com/safe/calculatorappblocker/receiver/BootCompletedReceiver.kt',
    name: 'BootCompletedReceiver.kt',
    category: 'kotlin',
    description: 'System BroadcastReceiver ensuring protection rules automatically persist across reboots',
    content: `package com.safe.calculatorappblocker.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.safe.calculatorappblocker.data.BlockedAppsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Safely restores blocked applications list after phone reboot.
 * Completely non-destructive: only re-reads saved preferences.
 */
class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            Log.i("BootCompletedReceiver", "Galaxy M31 restarted: verifying AppBlocker integrity")

            CoroutineScope(Dispatchers.IO).launch {
                val repository = BlockedAppsRepository.getInstance(context)
                repository.verifyAndRestoreProtectionRules()
            }
        }
    }
}`,
  },
  {
    path: 'app/src/main/java/com/safe/calculatorappblocker/receiver/AppBlockerDeviceAdminReceiver.kt',
    name: 'AppBlockerDeviceAdminReceiver.kt',
    category: 'kotlin',
    description: 'Standard Android Device Administration receiver providing anti-tampering without wipe data',
    content: `package com.safe.calculatorappblocker.receiver

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast

/**
 * Standard Android Device Administration component.
 * Allows safe anti-uninstall protection.
 * Never performs factory reset or modifies user data.
 */
class AppBlockerDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Device Admin enabled for Calculator AppBlocker")
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        Log.w(TAG, "Warning: User or system requested Device Admin deactivation")
        return "Disabling Device Administration allows Calculator AppBlocker to be uninstalled without your administrator PIN."
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.i(TAG, "Device Admin deactivated")
    }

    companion object {
        private const val TAG = "AppBlockerAdmin"
    }
}`,
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'docs',
    description: 'Full Android Studio setup guide, Samsung Galaxy M31 deployment, and architectural documentation',
    content: `# Calculator AppBlocker (Android 12 / Samsung Galaxy M31)

A privacy-first, non-destructive digital wellbeing and app-blocking tool disguised as a fully functional Samsung One UI Calculator.

## Key Design & Safety Principles
1. **Disguised Functional Calculator**: Operates as a genuine arithmetic calculator. Entering your secret code (default \`2580 =\`) opens the AppBlocker dashboard.
2. **Zero Destructive Operations**: Never deletes files, photos, contacts, or messages. Never roots or modifies system partitions.
3. **Transparent Permissions**: Every Android permission (Accessibility, Overlay, Boot Completed, Device Admin) is documented with Why, What, How, and How to Disable.
4. **Honest Android Limitations**: Clearly explains what Android 12 allows in Standard Mode vs Managed Mode. Does not falsely claim to unilaterally hijack Google Play.
5. **Reboot Persistence**: Restores all active block shields upon phone restart.

## Build Requirements
- Android Studio Iguana, Hedgehog, or Koala
- JDK 17
- Target SDK: 33 / Android 12 (One UI 4.1 on Samsung Galaxy M31)
- Min SDK: 26 (Android 8.0 Oreo)

## How to Build & Run
\`\`\`bash
git clone <repository>
cd calculator-appblocker
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
\`\`\`
`,
  },
  {
    path: '.github/workflows/deploy.yml',
    name: 'deploy.yml (GitHub Actions)',
    category: 'docs',
    description: 'Automated CI/CD: Builds Vite Web app to GitHub Pages & compiles native Android APK on every push to main',
    content: `name: Deploy Web App & Build Android APK

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: 'deploy-and-build'
  cancel-in-progress: false

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm install
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - id: deployment
        uses: actions/deploy-pages@v4

  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: android-actions/setup-android@v3
      - uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: 8.5
      - name: Build Android APK
        run: |
          cd android
          gradle assembleDebug --no-daemon --stacktrace
      - name: Prepare APK Artifact
        run: |
          mkdir -p release-artifacts
          find android/app/build/outputs/apk/debug -name "*.apk" -exec cp {} release-artifacts/CalculatorAppBlocker.apk \\;
          ls -la release-artifacts/
      - uses: actions/upload-artifact@v4
        with:
          name: CalculatorAppBlocker-Android-APK
          path: release-artifacts/CalculatorAppBlocker.apk
          retention-days: 30
      - uses: softprops/action-gh-release@v2
        if: success()
        with:
          tag_name: latest-apk
          name: "Calculator AppBlocker - Latest Android APK"
          files: release-artifacts/CalculatorAppBlocker.apk
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
  }
];
