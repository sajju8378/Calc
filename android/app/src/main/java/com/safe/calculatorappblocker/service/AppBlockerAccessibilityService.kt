package com.safe.calculatorappblocker.service

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import com.safe.calculatorappblocker.data.BlockedAppsRepository
import com.safe.calculatorappblocker.ui.BlockedOverlayActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicReference

/**
 * Accessibility service used to enforce the app-blocking list.
 * It does not retrieve window text or personal content.
 */
class AppBlockerAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private lateinit var repository: BlockedAppsRepository

    // Keep the protection list in memory so enforcement does not wait for a DataStore read
    // every time another application comes to the foreground.
    private val blockedPackages = AtomicReference<Set<String>>(emptySet())
    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile
    private var lastOverlayPackage: String? = null

    @Volatile
    private var lastOverlayTime: Long = 0L

    override fun onCreate() {
        super.onCreate()
        repository = BlockedAppsRepository.getInstance(applicationContext)

        // Load the current rules immediately, then keep them synchronized with the UI.
        serviceScope.launch {
            blockedPackages.set(repository.getBlockedPackages())
            repository.getBlockedPackagesFlow().collect { packages ->
                blockedPackages.set(packages)
                Log.d(TAG, "Protection rules updated: ${packages.size} blocked apps")
            }
        }

        Log.i(TAG, "AppBlocker Accessibility Service started")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        // Foreground app changes are the primary enforcement signal. Window changes are
        // included as a fallback for launchers and OEM-specific app transitions.
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            event.eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED) {
            return
        }

        val packageName = event.packageName?.toString() ?: return
        if (packageName == applicationContext.packageName) return

        if (!blockedPackages.get().contains(packageName)) return

        val now = System.currentTimeMillis()
        // Avoid repeatedly creating the overlay for the same app from duplicate OEM events.
        if (packageName == lastOverlayPackage && now - lastOverlayTime < OVERLAY_COOLDOWN_MS) {
            return
        }

        lastOverlayPackage = packageName
        lastOverlayTime = now

        // Accessibility callbacks normally run on the main thread, but explicitly post here
        // so the Activity launch is always performed from the UI thread.
        mainHandler.post {
            launchBlockingOverlay(packageName)
        }
    }

    private fun launchBlockingOverlay(blockedPackage: String) {
        try {
            val intent = Intent(this, BlockedOverlayActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP or
                        Intent.FLAG_ACTIVITY_NO_ANIMATION
                putExtra(BlockedOverlayActivity.EXTRA_BLOCKED_PACKAGE, blockedPackage)
            }
            startActivity(intent)
            repository.recordBlockEvent(blockedPackage)
            Log.i(TAG, "Blocked launch of $blockedPackage")
        } catch (e: Exception) {
            Log.e(TAG, "Unable to show blocking screen for $blockedPackage", e)
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Accessibility Service interrupted")
    }

    override fun onDestroy() {
        serviceScope.coroutineContext.cancel()
        super.onDestroy()
    }

    companion object {
        private const val TAG = "AppBlockerService"
        private const val OVERLAY_COOLDOWN_MS = 1000L
    }
}
