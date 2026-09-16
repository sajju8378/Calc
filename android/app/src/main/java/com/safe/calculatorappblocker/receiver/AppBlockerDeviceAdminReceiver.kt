package com.safe.calculatorappblocker.receiver

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AppBlockerDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Device Admin enabled for Calculator AppBlocker")
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        Log.w(TAG, "Device Admin deactivation requested")
        return "Disabling Device Administration allows Calculator AppBlocker to be uninstalled without your administrator PIN."
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.i(TAG, "Device Admin deactivated")
    }

    companion object {
        private const val TAG = "AppBlockerAdmin"
    }
}
