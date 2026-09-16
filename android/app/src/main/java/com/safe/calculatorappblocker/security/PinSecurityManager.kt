package com.safe.calculatorappblocker.security

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import java.security.MessageDigest
import java.security.SecureRandom

private val Context.dataStore by preferencesDataStore(name = "security_prefs")

class PinSecurityManager private constructor(private val context: Context) {

    private val KEY_IS_CONFIGURED = booleanPreferencesKey("is_pin_configured")
    private val KEY_PIN_HASH = stringPreferencesKey("admin_pin_hash")
    private val KEY_SALT = stringPreferencesKey("admin_pin_salt")
    private val KEY_SECURITY_QUESTION = stringPreferencesKey("security_question")
    private val KEY_SECURITY_ANSWER_HASH = stringPreferencesKey("security_answer_hash")

    suspend fun isPasswordConfigured(): Boolean {
        val prefs = context.dataStore.data.first()
        val isConfigured = prefs[KEY_IS_CONFIGURED] ?: false
        val hasHash = !prefs[KEY_PIN_HASH].isNullOrBlank()
        return isConfigured && hasHash
    }

    suspend fun setupInitialPassword(
        pin: String,
        securityQuestion: String,
        securityAnswer: String
    ): Boolean {
        if (pin.length < 4) return false
        val salt = generateSalt()
        val pinHash = hashWithSalt(pin.trim(), salt)
        val answerHash = hashWithSalt(securityAnswer.trim().lowercase(), salt)

        context.dataStore.edit { prefs ->
            prefs[KEY_IS_CONFIGURED] = true
            prefs[KEY_PIN_HASH] = pinHash
            prefs[KEY_SALT] = salt
            prefs[KEY_SECURITY_QUESTION] = securityQuestion.trim()
            prefs[KEY_SECURITY_ANSWER_HASH] = answerHash
        }
        return true
    }

    suspend fun verifyPassword(enteredPin: String): Boolean {
        val prefs = context.dataStore.data.first()
        val storedHash = prefs[KEY_PIN_HASH] ?: return false
        val storedSalt = prefs[KEY_SALT] ?: return false
        val computedHash = hashWithSalt(enteredPin.trim(), storedSalt)
        return storedHash == computedHash
    }

    suspend fun verifyAdminPin(enteredPin: String): Boolean = verifyPassword(enteredPin)

    suspend fun changePassword(oldPin: String, newPin: String): Boolean {
        if (!verifyPassword(oldPin)) return false
        if (newPin.length < 4) return false

        val salt = generateSalt()
        val newHash = hashWithSalt(newPin.trim(), salt)
        context.dataStore.edit { prefs ->
            prefs[KEY_PIN_HASH] = newHash
            prefs[KEY_SALT] = salt
        }
        return true
    }

    suspend fun getSecurityQuestion(): String {
        val prefs = context.dataStore.data.first()
        return prefs[KEY_SECURITY_QUESTION] ?: "What was the name of your first school?"
    }

    suspend fun updateSecurityQuestion(
        currentPin: String,
        newQuestion: String,
        newAnswer: String
    ): Boolean {
        if (!verifyPassword(currentPin)) return false
        val prefs = context.dataStore.data.first()
        val salt = prefs[KEY_SALT] ?: generateSalt()
        val answerHash = hashWithSalt(newAnswer.trim().lowercase(), salt)

        context.dataStore.edit { p ->
            p[KEY_SECURITY_QUESTION] = newQuestion.trim()
            p[KEY_SECURITY_ANSWER_HASH] = answerHash
        }
        return true
    }

    suspend fun verifySecurityAnswer(enteredAnswer: String): Boolean {
        val prefs = context.dataStore.data.first()
        val storedAnswerHash = prefs[KEY_SECURITY_ANSWER_HASH] ?: return false
        val salt = prefs[KEY_SALT] ?: return false
        val computedHash = hashWithSalt(enteredAnswer.trim().lowercase(), salt)
        return storedAnswerHash == computedHash
    }

    suspend fun resetPasswordWithSecurityAnswer(answer: String, newPin: String): Boolean {
        if (!verifySecurityAnswer(answer)) return false
        if (newPin.length < 4) return false

        val salt = generateSalt()
        val newPinHash = hashWithSalt(newPin.trim(), salt)
        val newAnswerHash = hashWithSalt(answer.trim().lowercase(), salt)

        context.dataStore.edit { prefs ->
            prefs[KEY_PIN_HASH] = newPinHash
            prefs[KEY_SALT] = salt
            prefs[KEY_SECURITY_ANSWER_HASH] = newAnswerHash
            prefs[KEY_IS_CONFIGURED] = true
        }
        return true
    }

    private fun hashWithSalt(value: String, salt: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val combined = "$salt:$value:safe_calculator_appblocker_v2"
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
        @Volatile
        private var INSTANCE: PinSecurityManager? = null

        fun getInstance(context: Context): PinSecurityManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: PinSecurityManager(context.applicationContext).also { INSTANCE = it }
            }
        }
    }
}
