package com.safe.calculatorappblocker.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun CalculatorScreen(
    onSecretCodeSubmitted: (String) -> Unit
) {
    var displayValue by remember { mutableStateOf("0") }
    var inputHistory by remember { mutableStateOf("") }

    val buttons = listOf(
        listOf("C", "±", "%", "÷"),
        listOf("7", "8", "9", "×"),
        listOf("4", "5", "6", "-"),
        listOf("1", "2", "3", "+"),
        listOf("0", ".", "=")
    )

    fun onButtonClick(label: String) {
        when (label) {
            "C" -> {
                displayValue = "0"
                inputHistory = ""
            }
            "=" -> {
                onSecretCodeSubmitted(displayValue)
                try {
                    val result = evaluateSimpleExpression(displayValue)
                    displayValue = result
                } catch (e: Exception) {
                    // Silent fail, keep display
                }
            }
            "+", "-", "×", "÷" -> {
                displayValue += " $label "
            }
            "±" -> {
                if (displayValue.startsWith("-")) {
                    displayValue = displayValue.removePrefix("-")
                } else if (displayValue != "0") {
                    displayValue = "-$displayValue"
                }
            }
            "%" -> {
                val num = displayValue.toDoubleOrNull()
                if (num != null) {
                    displayValue = (num / 100.0).toString()
                }
            }
            else -> {
                if (displayValue == "0") {
                    displayValue = label
                } else {
                    displayValue += label
                }
            }
        }
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = Color(0xFF171717)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.Bottom
        ) {
            Text(
                text = displayValue,
                color = Color.White,
                fontSize = 52.sp,
                fontWeight = FontWeight.Light,
                textAlign = TextAlign.End,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 24.dp),
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(16.dp))

            buttons.forEach { row ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    row.forEach { btn ->
                        val isWide = btn == "0"
                        val weight = if (isWide) 2f else 1f
                        val isOperator = btn in listOf("÷", "×", "-", "+", "=")
                        val isTop = btn in listOf("C", "±", "%")

                        val bgColor = when {
                            btn == "=" -> Color(0xFF10B981)
                            isOperator -> Color(0xFF262626)
                            isTop -> Color(0xFF404040)
                            else -> Color(0xFF262626)
                        }

                        val textColor = when {
                            btn == "=" -> Color.White
                            isOperator -> Color(0xFF10B981)
                            isTop -> Color(0xFFE5E5E5)
                            else -> Color.White
                        }

                        Box(
                            modifier = Modifier
                                .weight(weight)
                                .aspectRatio(if (isWide) 2.2f else 1f)
                                .clip(CircleShape)
                                .background(bgColor)
                                .clickable { onButtonClick(btn) },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = btn,
                                color = textColor,
                                fontSize = 24.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun evaluateSimpleExpression(expr: String): String {
    val clean = expr.replace("×", "*").replace("÷", "/")
    return try {
        val parts = clean.split(" ")
        if (parts.size == 3) {
            val a = parts[0].toDouble()
            val op = parts[1]
            val b = parts[2].toDouble()
            val res = when (op) {
                "+" -> a + b
                "-" -> a - b
                "*" -> a * b
                "/" -> if (b != 0.0) a / b else 0.0
                else -> a
            }
            if (res % 1.0 == 0.0) res.toLong().toString() else res.toString()
        } else {
            expr
        }
    } catch (e: Exception) {
        expr
    }
}
