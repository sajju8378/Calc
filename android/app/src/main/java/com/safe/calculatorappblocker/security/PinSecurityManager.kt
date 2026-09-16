package com.safe.calculatorappblocker.security

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
}
