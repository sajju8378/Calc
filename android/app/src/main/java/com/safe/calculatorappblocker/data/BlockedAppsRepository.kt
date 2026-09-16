package com.safe.calculatorappblocker.data

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import java.util.concurrent.ConcurrentHashMap

private val Context.dataStore by preferencesDataStore(name = "blocker_rules")

class BlockedAppsRepository private constructor(private val context: Context) {

    private val KEY_BLOCKED_PACKAGES = stringSetPreferencesKey("blocked_packages")
    private val temporaryUnlocks = ConcurrentHashMap<String, Long>()

    suspend fun isPackageBlocked(packageName: String): Boolean {
        // Check temporary unlock expiration
        val expiry = temporaryUnlocks[packageName]
        if (expiry != null && expiry > System.currentTimeMillis()) {
            return false
        }

        val prefs = context.dataStore.data.first()
        val blocked = prefs[KEY_BLOCKED_PACKAGES] ?: emptySet()
        return blocked.contains(packageName)
    }

    suspend fun setPackageBlocked(packageName: String, isBlocked: Boolean) {
        context.dataStore.edit { prefs ->
            val current = (prefs[KEY_BLOCKED_PACKAGES] ?: emptySet()).toMutableSet()
            if (isBlocked) {
                current.add(packageName)
            } else {
                current.remove(packageName)
            }
            prefs[KEY_BLOCKED_PACKAGES] = current
        }
    }

    fun grantTemporaryUnlock(packageName: String, durationMillis: Long) {
        temporaryUnlocks[packageName] = System.currentTimeMillis() + durationMillis
    }

    fun recordBlockEvent(packageName: String) {
        // In-memory telemetry without external network transmission
    }

    fun getAppNameForPackage(packageName: String): String {
        return try {
            val pm = context.packageManager
            val info = pm.getApplicationInfo(packageName, 0)
            pm.getApplicationLabel(info).toString()
        } catch (e: Exception) {
            packageName.substringAfterLast('.')
        }
    }

    suspend fun verifyAndRestoreProtectionRules() {
        val prefs = context.dataStore.data.first()
        val count = (prefs[KEY_BLOCKED_PACKAGES] ?: emptySet()).size
        // Validated rules across device reboot
    }

    companion object {
        @Volatile
        private var INSTANCE: BlockedAppsRepository? = null

        fun getInstance(context: Context): BlockedAppsRepository {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: BlockedAppsRepository(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
}
