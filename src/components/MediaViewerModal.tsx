/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Info,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { VaultMediaItem } from '../types';

interface MediaViewerModalProps {
  mediaList: VaultMediaItem[];
  initialIndex: number;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onUnhideMedia: (id: string) => void;
  onDeleteMedia: (id: string) => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  mediaList,
  initialIndex,
  onClose,
  onToggleFavorite,
  onUnhideMedia,
  onDeleteMedia,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentItem = mediaList[currentIndex];

  if (!currentItem) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
    setIsPlaying(false);
    setZoomLevel(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
    setIsPlaying(false);
    setZoomLevel(1);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col text-white backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-950/80 border-b border-neutral-800/80 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer text-neutral-300 hover:text-white"
            title="Back to Vault"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold truncate text-neutral-100">
              {currentItem.title}
            </h3>
            <p className="text-[11px] text-neutral-400">
              {currentIndex + 1} of {mediaList.length} • {currentItem.type === 'video' ? 'Secret Video' : 'Hidden Photo'}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleFavorite(currentItem.id)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              currentItem.isFavorite ? 'text-rose-500 bg-rose-500/10' : 'text-neutral-300 hover:bg-neutral-800'
            }`}
            title="Favorite"
          >
            <Heart className={`w-5 h-5 ${currentItem.isFavorite ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 rounded-full text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
            title="File Info"
          >
            <Info className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (confirm('Unhide this item back to your public Gallery?')) {
                onUnhideMedia(currentItem.id);
                onClose();
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 border border-emerald-500/30 text-xs font-medium cursor-pointer transition-colors"
            title="Unhide back to Gallery"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Unhide</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Permanently delete this secret media from Vault?')) {
                onDeleteMedia(currentItem.id);
                if (mediaList.length <= 1) {
                  onClose();
                } else {
                  handleNext();
                }
              }
            }}
            className="p-2 rounded-full text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
            title="Delete Permanently"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewing Area */}
      <div className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Navigation buttons */}
        {mediaList.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 z-30 p-2.5 rounded-full bg-neutral-900/80 border border-neutral-700 text-white hover:bg-neutral-800 active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 sm:right-6 z-30 p-2.5 rounded-full bg-neutral-900/80 border border-neutral-700 text-white hover:bg-neutral-800 active:scale-95 transition-all shadow-lg cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Media content */}
        {currentItem.type === 'image' ? (
          <div className="max-w-full max-h-full flex items-center justify-center">
            <img
              src={currentItem.url}
              alt={currentItem.title}
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
              referrerPolicy="no-referrer"
              onClick={() => setZoomLevel((z) => (z === 1 ? 1.75 : 1))}
            />
          </div>
        ) : (
          <div className="w-full max-w-2xl max-h-[75vh] flex flex-col items-center justify-center relative rounded-xl overflow-hidden bg-black border border-neutral-800 shadow-2xl">
            <video
              ref={videoRef}
              src={currentItem.url}
              poster={currentItem.thumbnailUrl}
              className="w-full max-h-[65vh] object-contain cursor-pointer"
              onClick={togglePlay}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />

            {/* Custom Video Controls */}
            <div className="w-full bg-neutral-950/90 border-t border-neutral-800 px-4 py-3 flex items-center justify-between gap-3 text-white">
              <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
              </button>

              <div className="flex-1 text-xs text-neutral-400 font-mono">
                {currentItem.duration || '00:15'} • Encrypted Stream
              </div>

              <button
                onClick={toggleMute}
                className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
                  }
                }}
                className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Info Slide-Over Panel */}
        {showInfo && (
          <div className="absolute right-4 top-4 bottom-4 w-72 bg-neutral-900/95 border border-neutral-800 rounded-2xl p-4 text-left shadow-2xl flex flex-col justify-between z-30 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Media Details
                </span>
                <button
                  onClick={() => setShowInfo(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-neutral-400 mb-0.5">Original File Name</div>
                  <div className="text-white font-mono break-all">{currentItem.originalFileName || currentItem.title}</div>
                </div>

                <div>
                  <div className="text-neutral-400 mb-0.5">Hidden Since</div>
                  <div className="text-white">{currentItem.dateAdded}</div>
                </div>

                <div>
                  <div className="text-neutral-400 mb-0.5">File Size</div>
                  <div className="text-white">{formatFileSize(currentItem.sizeBytes)}</div>
                </div>

                <div>
                  <div className="text-neutral-400 mb-0.5">Album</div>
                  <div className="text-emerald-400 capitalize">{currentItem.album}</div>
                </div>

                <div>
                  <div className="text-neutral-400 mb-0.5">Protection Status</div>
                  <div className="flex items-center gap-1 text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    AES-256 Encrypted In Vault
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/60">
              Hidden media is invisible to standard Android Gallery and file managers until explicitly unhidden.
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="py-2 text-center text-xs text-neutral-500 border-t border-neutral-900 bg-neutral-950/60">
        Tap image to toggle zoom • Press Unhide to restore to device gallery
      </div>
    </div>
  );
};
