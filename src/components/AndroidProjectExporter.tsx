/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  FileCode,
  FolderOpen,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Terminal,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Play,
  GitBranch,
  Workflow
} from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES, AndroidProjectFile } from '../data/androidProjectFiles';

interface AndroidProjectExporterProps {
  onClose: () => void;
}

export const AndroidProjectExporter: React.FC<AndroidProjectExporterProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'ci_guide'>('ci_guide');
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(ANDROID_PROJECT_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const workflowContent = ANDROID_PROJECT_FILES.find((f) => f.path.includes('deploy.yml'))?.content || '';

  const handleCopyCode = (text: string, isWorkflow = false) => {
    navigator.clipboard.writeText(text);
    if (isWorkflow) {
      setCopiedWorkflow(true);
      setTimeout(() => setCopiedWorkflow(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Populate all files into zip
      ANDROID_PROJECT_FILES.forEach((file) => {
        zip.file(`CalculatorAppBlocker/${file.path}`, file.content);
      });

      // Add gradle wrapper properties and root files
      zip.file(
        'CalculatorAppBlocker/build.gradle.kts',
        `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}`
      );
      zip.file(
        'CalculatorAppBlocker/settings.gradle.kts',
        `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "CalculatorAppBlocker"
include(":app")`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'CalculatorAppBlocker-Android12-Project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsZipping(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
      setIsZipping(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-neutral-900 z-50 flex flex-col text-neutral-100 overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-950 border-b border-neutral-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Android Studio Project</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Android 12 · M31
              </span>
            </h2>
            <p className="text-[10px] text-neutral-400">Complete buildable Kotlin & Jetpack Compose project</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isZipping ? 'Generating ZIP...' : downloadSuccess ? 'Downloaded!' : 'Download .ZIP'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* Navigation Sub-header / Tabs */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ci_guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ci_guide'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-emerald-400" />
            <span>Automate APK & GitHub Actions</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-200 font-mono">
              Fix 404
            </span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'files'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Android Project Files</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
              {ANDROID_PROJECT_FILES.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-neutral-400 hidden md:flex items-center gap-2">
          <span>Target: Samsung Galaxy M31 / Android 12</span>
          <span className="w-1 h-1 rounded-full bg-neutral-700" />
          <span className="text-emerald-400">CI/CD Ready</span>
        </div>
      </div>

      {activeTab === 'ci_guide' ? (
        /* CI/CD Guide & Deployment Fix View */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-950 text-neutral-200 space-y-6">
          {/* Comparison Banner: Main Branch vs GitHub Actions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Which is good: "main" branch or "GitHub Actions"?</h3>
                  <p className="text-xs text-neutral-400">
                    Why the error <code className="text-rose-400 bg-rose-950/40 px-1 py-0.5 rounded font-mono">404 main.tsx:1</code> happened and how to fix it
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                GitHub Actions is 100% the right choice
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Option A: Deploy from branch (main) */}
              <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-rose-900/40 space-y-2">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Deploying from "main" branch (Why it failed)</span>
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  When GitHub Pages is set to "Deploy from a branch", GitHub only serves raw uncompiled files from the repository root.
                </p>
                <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                  <li><strong className="text-rose-300">Vite isn't built:</strong> The browser tries to load raw <code className="font-mono text-rose-300">/src/main.tsx</code> directly, producing a 404 / blank screen.</li>
                  <li><strong className="text-rose-300">Cannot build APK:</strong> The "main" branch has no Android SDK, Java, or Gradle environment to compile an APK file.</li>
                </ul>
              </div>

              {/* Option B: GitHub Actions */}
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Deploying with GitHub Actions (The Solution)</span>
                </div>
                <p className="text-neutral-300 leading-relaxed">
                  GitHub Actions spins up a clean cloud virtual machine every time you push to <code className="font-mono text-emerald-300">main</code>:
                </p>
                <ul className="space-y-1 text-neutral-300 list-disc list-inside">
                  <li><strong className="text-emerald-300">Compiles Vite:</strong> Runs <code className="font-mono text-emerald-300">npm run build</code> into <code className="font-mono">dist/</code> and deploys cleanly to GitHub Pages.</li>
                  <li><strong className="text-emerald-300">Compiles Android APK:</strong> Installs Java 17 & Android SDK, runs Gradle, and outputs downloadable <code className="font-mono text-emerald-300">CalculatorAppBlocker.apk</code>!</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick 2-Minute Fix Steps */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>How to switch to GitHub Actions on your repository (Quick 3 Steps)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  STEP 1
                </span>
                <p className="font-semibold text-white">Change GitHub Pages Source</p>
                <p className="text-neutral-400 leading-relaxed">
                  Go to your GitHub repo <strong className="text-neutral-200">sajju8378/Calc</strong> &rarr; <strong className="text-neutral-200">Settings</strong> &rarr; <strong className="text-neutral-200">Pages</strong>. Under <em>"Build and deployment &gt; Source"</em>, select <strong className="text-emerald-400">"GitHub Actions"</strong> instead of "Deploy from a branch".
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  STEP 2
                </span>
                <p className="font-semibold text-white">Push Workflow & Code</p>
                <p className="text-neutral-400 leading-relaxed">
                  The workflow file <code className="text-emerald-300 font-mono">.github/workflows/deploy.yml</code> is now included. Simply commit and push your changes to branch <strong className="text-neutral-200">main</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  STEP 3
                </span>
                <p className="font-semibold text-white">Download APK & View Site</p>
                <p className="text-neutral-400 leading-relaxed">
                  Click the <strong className="text-neutral-200">Actions</strong> tab in GitHub. You'll see the build succeed. Download <strong className="text-emerald-400">CalculatorAppBlocker.apk</strong> directly from the artifacts or GitHub Releases!
                </p>
              </div>
            </div>
          </div>

          {/* Workflow File Viewer & Copy Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Workflow File: .github/workflows/deploy.yml</span>
                </h4>
                <p className="text-[11px] text-neutral-400">Configured with Node 20 (Vite) + Java 17 + Android SDK Gradle Assemble</p>
              </div>

              <button
                onClick={() => handleCopyCode(workflowContent, true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer border border-neutral-700"
              >
                {copiedWorkflow ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWorkflow ? 'Copied to Clipboard!' : 'Copy deploy.yml'}</span>
              </button>
            </div>

            <div className="bg-[#0e1015] border border-neutral-800 rounded-xl p-3 font-mono text-[11px] text-neutral-300 overflow-x-auto max-h-64 select-text">
              <pre>
                <code>{workflowContent}</code>
              </pre>
            </div>
          </div>
        </div>
      ) : (
        /* Original Files Explorer View */
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Sidebar: File Tree */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-neutral-800 bg-neutral-950/80 p-2 overflow-y-auto shrink-0 max-h-48 sm:max-h-full">
            <div className="text-[11px] font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Project Files</span>
            </div>

            <div className="space-y-1 mt-1">
              {ANDROID_PROJECT_FILES.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                    selectedFile.path === file.path
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-neutral-800 text-neutral-400 shrink-0">
                    {file.category}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Editor / Preview */}
          <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
            {/* File bar */}
            <div className="h-10 border-b border-neutral-800 px-4 flex items-center justify-between bg-neutral-900/60 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xs font-mono text-emerald-400 truncate">{selectedFile.path}</span>
                <span className="text-[11px] text-neutral-400 hidden sm:inline truncate">· {selectedFile.description}</span>
              </div>
              <button
                onClick={() => handleCopyCode(selectedFile.content)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code Viewer */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-neutral-300 select-text bg-[#0e1015]">
              <pre>
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
