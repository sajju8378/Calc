/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeyRound, ShieldCheck, HelpCircle, Info, Check, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import { BlockerConfig } from '../types';
import { hashPinWithSalt } from '../utils/security';

interface SettingsTabProps {
  config: BlockerConfig;
  onUpdateConfig: (updated: Partial<BlockerConfig>) => void;
  onOpenProjectExporter: () => void;
}

const DEFAULT_QUESTIONS = [
  'What was the name of your first school?',
  'What is your favorite childhood pet?',
  'What city were you born in?',
  'What is your favorite movie or book?',
  'What is your mother’s maiden name?',
];

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  onUpdateConfig,
  onOpenProjectExporter,
}) => {
  // Password Change state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Security Question state
  const [securityQuestion, setSecurityQuestion] = useState(
    config.securityQuestion || DEFAULT_QUESTIONS[0]
  );
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [questionPinVerify, setQuestionPinVerify] = useState('');
  const [questionMessage, setQuestionMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPin || !newPin || !confirmNewPin) {
      setPinMessage({ text: 'Please fill out all fields.', isError: true });
      return;
    }

    // Verify current PIN
    const currentHash = await hashPinWithSalt(currentPin, config.adminPinSalt);
    if (currentHash !== config.adminPinHash && currentPin !== config.secretCalculatorCode) {
      setPinMessage({ text: 'Incorrect current password.', isError: true });
      return;
    }

    if (newPin.length < 4 || newPin.length > 8) {
      setPinMessage({ text: 'New password must be 4 to 8 digits.', isError: true });
      return;
    }

    if (!/^\d+$/.test(newPin)) {
      setPinMessage({ text: 'Password must contain digits only.', isError: true });
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinMessage({ text: 'New passwords do not match.', isError: true });
      return;
    }

    const newSalt = 'm31_salt_' + Math.random().toString(36).substring(2, 8);
    const newHash = await hashPinWithSalt(newPin, newSalt);

    onUpdateConfig({
      adminPinHash: newHash,
      adminPinSalt: newSalt,
      secretCalculatorCode: newPin,
    });

    setPinMessage({ text: 'Password updated successfully! Use this new code in the calculator.', isError: false });
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
  };

  const handleSecurityQuestionUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionPinVerify || !securityAnswer.trim()) {
      setQuestionMessage({ text: 'Please enter your current password and secret answer.', isError: true });
      return;
    }

    const currentHash = await hashPinWithSalt(questionPinVerify, config.adminPinSalt);
    if (currentHash !== config.adminPinHash && questionPinVerify !== config.secretCalculatorCode) {
      setQuestionMessage({ text: 'Incorrect current password.', isError: true });
      return;
    }

    const answerSalt = 'ans_salt_' + Math.random().toString(36).substring(2, 8);
    const answerHash = await hashPinWithSalt(securityAnswer.trim().toLowerCase(), answerSalt);

    onUpdateConfig({
      securityQuestion,
      securityAnswerHash: answerHash,
      securityAnswerSalt: answerSalt,
    });

    setQuestionMessage({ text: 'Security recovery question saved successfully!', isError: false });
    setQuestionPinVerify('');
    setSecurityAnswer('');
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Change Password Card */}
      <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Change Calculator Password</h3>
            <p className="text-[11px] text-neutral-400">Used to unlock the vault from calculator disguise</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-2.5">
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">Current Password</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              placeholder="Enter current PIN"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">New Password (4-8 digits)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="New PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Confirm New Password</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                placeholder="Confirm PIN"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {pinMessage && (
            <div className={`text-xs p-2 rounded-lg flex items-center gap-1.5 ${
              pinMessage.isError ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
            }`}>
              {pinMessage.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
              <span>{pinMessage.text}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* 2. Security Recovery Question */}
      <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Security Recovery Question</h3>
            <p className="text-[11px] text-neutral-400">Allows password reset if you forget your calculator PIN</p>
          </div>
        </div>

        <form onSubmit={handleSecurityQuestionUpdate} className="space-y-2.5">
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">Select Question</label>
            <select
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
            >
              {DEFAULT_QUESTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">Secret Answer</label>
            <input
              type="text"
              placeholder="Your secret recovery answer"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">Verify Current Password to Save</label>
            <input
              type="password"
              inputMode="numeric"
              placeholder="Enter current PIN"
              value={questionPinVerify}
              onChange={(e) => setQuestionPinVerify(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {questionMessage && (
            <div className={`text-xs p-2 rounded-lg flex items-center gap-1.5 ${
              questionMessage.isError ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50' : 'bg-sky-950/40 text-sky-300 border border-sky-800/50'
            }`}>
              {questionMessage.isError ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <Check className="w-3.5 h-3.5 shrink-0" />}
              <span>{questionMessage.text}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Save Security Question
          </button>
        </form>
      </div>

      {/* 3. About App Card */}
      <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">About Calculator AppBlocker</h3>
            <p className="text-[11px] text-neutral-400">Stealth focus & privacy guardian</p>
          </div>
        </div>

        <div className="space-y-2 text-xs font-sans">
          <div className="flex justify-between py-1 border-b border-neutral-700/40">
            <span className="text-neutral-400">Application Version</span>
            <span className="text-white font-mono font-medium">1.0.0 (Release APK)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-700/40">
            <span className="text-neutral-400">Disguise Mode</span>
            <span className="text-white">Samsung One UI Calculator</span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-700/40">
            <span className="text-neutral-400">Data Storage</span>
            <span className="text-emerald-400 font-medium">100% Offline & Private (DataStore)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-700/40">
            <span className="text-neutral-400">Target Devices</span>
            <span className="text-white">Samsung Galaxy M31 / Android 12+</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-neutral-400">Native Android Service</span>
            <span className="text-emerald-400 font-medium">AppBlockerAccessibilityService</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-700/60">
          <button
            onClick={onOpenProjectExporter}
            className="w-full py-2 bg-neutral-700/80 hover:bg-neutral-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Project & CI Workflow</span>
          </button>
        </div>
      </div>
    </div>
  );
};
