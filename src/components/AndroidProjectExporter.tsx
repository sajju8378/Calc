/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  FileCode,
  Folder,
  FolderOpen,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Terminal,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES, AndroidProjectFile } from '../data/androidProjectFiles';

interface AndroidProjectExporterProps {
  onClose: () => void;
}

export const AndroidProjectExporter: React.FC<AndroidProjectExporterProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(ANDROID_PROJECT_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* Main split layout */}
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
              onClick={handleCopyCode}
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
    </div>
  );
};
