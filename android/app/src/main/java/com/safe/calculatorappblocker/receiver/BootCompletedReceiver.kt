package com.safe.calculatorappblocker.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.safe.calculatorappblocker.data.BlockedAppsRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            Log.i("BootCompletedReceiver", "Device reboot detected: verifying AppBlocker state")

            CoroutineScope(Dispatchers.IO).launch {
                val repository = BlockedAppsRepository.getInstance(context)
                repository.verifyAndRestoreProtectionRules()
            }
        }
    }
}
