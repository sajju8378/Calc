package com.safe.calculatorappblocker.service

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
}
