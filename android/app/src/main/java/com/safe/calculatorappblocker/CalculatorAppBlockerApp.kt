package com.safe.calculatorappblocker

import android.app.Application
import android.util.Log

class CalculatorAppBlockerApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Log.i("CalculatorAppBlocker", "Application initialized on Android 12 / Samsung Galaxy M31")
    }
}
