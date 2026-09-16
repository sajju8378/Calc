/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Delete, History, RotateCcw } from 'lucide-react';

interface CalculatorProps {
  onSecretCodeEntered: () => void;
  secretCode: string; // e.g. "2580"
}

export const Calculator: React.FC<CalculatorProps> = ({
  onSecretCodeEntered,
  secretCode,
}) => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [equation, setEquation] = useState<string>('');
  const [isNewNumber, setIsNewNumber] = useState<boolean>(true);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Normal calculation logic
  const handleDigit = (digit: string) => {
    if (isNewNumber || displayValue === '0') {
      setDisplayValue(digit);
      setIsNewNumber(false);
    } else {
      // Limit to 12 digits for clean UI
      if (displayValue.length < 12) {
        setDisplayValue(displayValue + digit);
      }
    }
  };

  const handleDecimal = () => {
    if (isNewNumber) {
      setDisplayValue('0.');
      setIsNewNumber(false);
    } else if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const handleClear = () => {
    setDisplayValue('0');
    setEquation('');
    setIsNewNumber(true);
  };

  const handleBackspace = () => {
    if (displayValue.length > 1) {
      setDisplayValue(displayValue.slice(0, -1));
    } else {
      setDisplayValue('0');
      setIsNewNumber(true);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(`${displayValue} ${op}`);
    setIsNewNumber(true);
  };

  const handlePercentage = () => {
    const num = parseFloat(displayValue);
    if (!isNaN(num)) {
      const result = num / 100;
      setDisplayValue(result.toString());
      setIsNewNumber(true);
    }
  };

  const handleEquals = () => {
    const rawInput = displayValue.trim();

    // 1. Check if the secret AppBlocker trigger was entered!
    // Example: user enters 2580 and presses =
    // Or if equation is empty and displayValue is the secret code
    if (rawInput === secretCode) {
      onSecretCodeEntered();
      return;
    }

    // 2. Normal mathematical evaluation
    if (!equation) return;

    try {
      const parts = equation.trim().split(' ');
      if (parts.length >= 2) {
        const num1 = parseFloat(parts[0]);
        const op = parts[1];
        const num2 = parseFloat(displayValue);

        if (isNaN(num1) || isNaN(num2)) return;

        let result = 0;
        if (op === '+') result = num1 + num2;
        else if (op === '−' || op === '-') result = num1 - num2;
        else if (op === '×' || op === '*') result = num1 * num2;
        else if (op === '÷' || op === '/') {
          if (num2 === 0) {
            setDisplayValue('Cannot divide by 0');
            setEquation('');
            setIsNewNumber(true);
            return;
          }
          result = num1 / num2;
        }

        // Format neatly
        const formattedResult = Number.isInteger(result)
          ? result.toString()
          : parseFloat(result.toFixed(8)).toString();

        const historyRecord = `${equation} ${displayValue} = ${formattedResult}`;
        setHistory((prev) => [historyRecord, ...prev.slice(0, 9)]);

        setEquation(`${equation} ${displayValue} =`);
        setDisplayValue(formattedResult);
        setIsNewNumber(true);
      }
    } catch {
      setDisplayValue('Error');
      setIsNewNumber(true);
    }
  };

  return (
    <div className="flex-1 bg-[#121316] text-white flex flex-col justify-between p-4 sm:p-5 select-none font-display">
      {/* Top toolbar */}
      <div className="flex items-center justify-between py-1 text-neutral-400">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="p-2 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-400 hover:text-white"
          title="Calculation History"
        >
          <History className="w-5 h-5" />
        </button>

        {showHistory && (
          <button
            onClick={() => setHistory([])}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History Drawer or Calculator Display */}
      {showHistory ? (
        <div className="flex-1 my-2 overflow-y-auto bg-neutral-900/60 rounded-2xl p-3 text-right flex flex-col gap-2 border border-neutral-800">
          <div className="text-xs text-neutral-400 font-sans text-left border-b border-neutral-800 pb-1">
            Recent Calculations
          </div>
          {history.length === 0 ? (
            <div className="text-sm text-neutral-500 my-auto text-center font-sans">
              No history yet
            </div>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="text-neutral-300 font-mono-num text-sm py-1 border-b border-neutral-800/40">
                {item}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end text-right px-2 pb-4">
          {/* Ongoing formula/equation */}
          <div className="text-neutral-400 font-mono-num text-sm sm:text-base min-h-[24px] tracking-wide overflow-x-auto whitespace-nowrap">
            {equation}
          </div>
          {/* Active number */}
          <div className="text-4xl sm:text-5xl font-mono-num font-light tracking-tight text-neutral-100 overflow-x-auto whitespace-nowrap py-1">
            {displayValue}
          </div>
        </div>
      )}

      {/* Keypad Grid (Samsung One UI Calculator Style) */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3 text-xl font-medium pt-2">
        {/* Row 1 */}
        <button
          onClick={handleClear}
          className="h-14 sm:h-16 rounded-full bg-[#e35656]/20 text-[#ff6b6b] hover:bg-[#e35656]/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          {displayValue === '0' && !equation ? 'AC' : 'C'}
        </button>
        <button
          onClick={handleBackspace}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={handlePercentage}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          %
        </button>
        <button
          onClick={() => handleOperator('÷')}
          className="h-14 sm:h-16 rounded-full bg-[#10b981]/20 text-[#34d399] hover:bg-[#10b981]/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl font-light"
        >
          ÷
        </button>

        {/* Row 2 */}
        <button
          onClick={() => handleDigit('7')}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl"
        >
          7
        </button>
        <button
          onClick={() => handleDigit('8')}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl"
        >
          8
        </button>
        <button
          onClick={() => handleDigit('9')}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl"
        >
          9
        </button>
        <button
          onClick={() => handleOperator('×')}
          className="h-14 sm:h-16 rounded-full bg-[#10b981]/20 text-[#34d399] hover:bg-[#10b981]/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl font-light"
        >
          ×
        </button>

        {/* Row 3 */}
        <button
          onClick={() => handleDigit('4')}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl"
        >
          4
        </button>
        <button
          onClick={() => handleDigit('5')}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl"
        >
          5
        </button>
        <button
          onClick={() => handleDigit('6')}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl"
        >
          6
        </button>
        <button
          onClick={() => handleOperator('−')}
          className="h-14 sm:h-16 rounded-full bg-[#10b981]/20 text-[#34d399] hover:bg-[#10b981]/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl font-light"
        >
          −
        </button>

        {/* Row 4 */}
        <button
          onClick={() => handleDigit('1')}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl"
        >
          1
        </button>
        <button
          onClick={() => handleDigit('2')}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl"
        >
          2
        </button>
        <button
          onClick={() => handleDigit('3')}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl"
        >
          3
        </button>
        <button
          onClick={() => handleOperator('+')}
          className="h-14 sm:h-16 rounded-full bg-[#10b981]/20 text-[#34d399] hover:bg-[#10b981]/30 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl font-light"
        >
          +
        </button>

        {/* Row 5 */}
        <button
          onClick={() => handleDigit('0')}
          className="col-span-2 h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl pl-4 text-left"
        >
          0
        </button>
        <button
          onClick={handleDecimal}
          className="h-14 sm:h-16 rounded-full bg-neutral-800/60 text-white hover:bg-neutral-700/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-2xl"
        >
          .
        </button>
        <button
          onClick={handleEquals}
          className="h-14 sm:h-16 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center cursor-pointer text-3xl font-light shadow-lg shadow-emerald-900/30"
        >
          =
        </button>
      </div>
    </div>
  );
};
