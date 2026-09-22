/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, UploadCloud, Image, Video, CheckCircle2, ShieldCheck, FolderPlus, Sparkles } from 'lucide-react';
import { VaultMediaItem, VaultAlbum, MediaType } from '../types';

interface ImportMediaModalProps {
  albums: VaultAlbum[];
  onClose: () => void;
  onImportItems: (newItems: VaultMediaItem[]) => void;
}

export const ImportMediaModal: React.FC<ImportMediaModalProps> = ({
  albums,
  onClose,
  onImportItems,
}) => {
  const [selectedAlbum, setSelectedAlbum] = useState<string>('personal');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [importedItems, setImportedItems] = useState<VaultMediaItem[]>([]);
  const [deleteOriginal, setDeleteOriginal] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sample quick templates for testing
  const samplePresets: Omit<VaultMediaItem, 'id'>[] = [
    {
      title: 'Confidential ID Document',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80',
      dateAdded: 'Just now',
      sizeBytes: 2450000,
      album: 'documents',
      originalFileName: 'National_ID_Card_Confidential.jpg',
    },
    {
      title: 'Private Event Video Memo',
      type: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
      dateAdded: 'Just now',
      sizeBytes: 9800000,
      duration: '0:15',
      album: 'videos',
      originalFileName: 'VID_Private_Event_Memo.mp4',
    },
    {
      title: 'Secret Family Celebration',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1000&q=80',
      dateAdded: 'Just now',
      sizeBytes: 3100000,
      album: 'personal',
      originalFileName: 'IMG_Celebration_Gathering.jpg',
    },
    {
      title: 'Private Property Deed',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80',
      dateAdded: 'Just now',
      sizeBytes: 4200000,
      album: 'documents',
      originalFileName: 'Deed_Agreement_Signed.png',
    }
  ];

  // Handle manual file picking
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: VaultMediaItem[] = [];

    Array.from(files).forEach((file, index) => {
      const isVideo = file.type.startsWith('video');
      const objectUrl = URL.createObjectURL(file);

      newItems.push({
        id: `media-upload-${Date.now()}-${index}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: isVideo ? 'video' : 'image',
        url: objectUrl,
        thumbnailUrl: isVideo ? undefined : objectUrl,
        dateAdded: 'Just now',
        sizeBytes: file.size,
        album: selectedAlbum,
        originalFileName: file.name,
        duration: isVideo ? '0:20' : undefined,
      });
    });

    setImportedItems((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleAddSample = (sample: Omit<VaultMediaItem, 'id'>) => {
    const newItem: VaultMediaItem = {
      ...sample,
      id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      album: selectedAlbum,
    };
    setImportedItems((prev) => [...prev, newItem]);
  };

  const handleSaveToVault = () => {
    if (importedItems.length === 0) return;
    onImportItems(importedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#18181b] border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Hide Photos & Videos</h3>
              <p className="text-xs text-neutral-400">Import from device into secret AES vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Target Album Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Select Vault Album
            </label>
            <div className="flex flex-wrap gap-2">
              {albums.map((alb) => (
                <button
                  key={alb.id}
                  onClick={() => setSelectedAlbum(alb.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all ${
                    selectedAlbum === alb.id
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {alb.name}
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-950/20'
                : 'border-neutral-700 hover:border-emerald-500/60 bg-neutral-900/40 hover:bg-neutral-900'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-full bg-neutral-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              Choose files from Device or Drop here
            </p>
            <p className="text-xs text-neutral-400">
              Supports JPEG, PNG, WEBP, MP4, MOV, WEBM
            </p>
          </div>

          {/* Quick Demo Samples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Or Pick Sample Photos & Videos to Hide:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {samplePresets.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSample(sample)}
                  className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-left transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center text-neutral-400">
                    {sample.type === 'video' ? <Video className="w-4 h-4 text-emerald-400" /> : <Image className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{sample.title}</p>
                    <p className="text-[10px] text-neutral-400 uppercase">{sample.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected queue preview */}
          {importedItems.length > 0 && (
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-2">
                <span>Ready to Encrypt ({importedItems.length} items)</span>
                <button
                  onClick={() => setImportedItems([])}
                  className="text-neutral-400 hover:text-rose-400 text-[11px]"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {importedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs text-neutral-300 py-1 px-2 rounded bg-neutral-800/40"
                  >
                    <span className="truncate pr-2">{item.title}</span>
                    <span className="text-[10px] text-emerald-400 uppercase shrink-0 font-mono">{item.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Guarantee Checkbox */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-neutral-300">
            <input
              type="checkbox"
              id="delOriginal"
              checked={deleteOriginal}
              onChange={(e) => setDeleteOriginal(e.target.checked)}
              className="mt-0.5 rounded accent-emerald-500"
            />
            <label htmlFor="delOriginal" className="cursor-pointer leading-relaxed">
              <span className="font-semibold text-emerald-400">Auto-delete original from public gallery</span>
              <p className="text-[11px] text-neutral-400">Prevents photos and videos from showing up in Google Photos or Samsung Gallery.</p>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-neutral-800 bg-neutral-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium text-neutral-400 hover:text-white cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveToVault}
            disabled={importedItems.length === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-semibold cursor-pointer shadow-lg shadow-emerald-950 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Hide {importedItems.length > 0 ? `(${importedItems.length}) Items` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
