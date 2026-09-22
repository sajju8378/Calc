/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Shield,
  FileText,
  AlertTriangle,
  Settings as SettingsIcon,
  Plus,
  Lock,
  Search,
  EyeOff,
  Eye,
  Heart,
  Download,
  Trash2,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Copy,
  Check,
  FolderPlus,
  Play
} from 'lucide-react';
import {
  VaultMediaItem,
  VaultAlbum,
  HiddenAppItem,
  SecretNote,
  IntruderLog,
  VaultConfig,
  VaultActiveTab,
  CamouflageIcon
} from '../types';
import { MediaViewerModal } from './MediaViewerModal';
import { ImportMediaModal } from './ImportMediaModal';
import { AppDisguiseModal } from './AppDisguiseModal';
import { SimulatedAppLaunchModal } from './SimulatedAppLaunchModal';

interface VaultDashboardProps {
  onLock: () => void;
  config: VaultConfig;
  onUpdateConfig: (newConfig: VaultConfig) => void;
  isDecoyMode: boolean;
}

export const VaultDashboard: React.FC<VaultDashboardProps> = ({
  onLock,
  config,
  onUpdateConfig,
  isDecoyMode,
}) => {
  const [activeTab, setActiveTab] = useState<VaultActiveTab>('photos');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appCategoryFilter, setAppCategoryFilter] = useState<string>('All');

  // Media state (empty if decoy mode!)
  const [mediaList, setMediaList] = useState<VaultMediaItem[]>([]);
  const [albums, setAlbums] = useState<VaultAlbum[]>([]);
  const [apps, setApps] = useState<HiddenAppItem[]>([]);
  const [notes, setNotes] = useState<SecretNote[]>([]);
  const [intruders, setIntruders] = useState<IntruderLog[]>([]);

  // Modals
  const [viewingMediaIndex, setViewingMediaIndex] = useState<number | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [disguiseAppTarget, setDisguiseAppTarget] = useState<HiddenAppItem | null>(null);
  const [launchingApp, setLaunchingApp] = useState<HiddenAppItem | null>(null);

  // Note editor modal
  const [editingNote, setEditingNote] = useState<SecretNote | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState<boolean>(false);
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [newNoteCategory, setNewNoteCategory] = useState<'Passwords' | 'Personal' | 'Cards' | 'General'>('Passwords');

  // New Custom App
  const [isAddingApp, setIsAddingApp] = useState<boolean>(false);
  const [customAppName, setCustomAppName] = useState<string>('');
  const [customAppPackage, setCustomAppPackage] = useState<string>('');

  // Settings PIN inputs
  const [newMasterPin, setNewMasterPin] = useState<string>(config.secretCalculatorCode);
  const [newDecoyPin, setNewDecoyPin] = useState<string>(config.decoyCalculatorCode);
  const [pinSavedToast, setPinSavedToast] = useState<boolean>(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Initialize data on mount
  React.useEffect(() => {
    if (isDecoyMode) {
      // Decoy vault shows empty state or clean decoy photos!
      setMediaList([
        {
          id: 'decoy-1',
          title: 'Wallpaper Sky',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          dateAdded: 'Today',
          sizeBytes: 1200000,
          album: 'all',
          isFavorite: false,
          originalFileName: 'wallpaper_sample.jpg',
        }
      ]);
      setAlbums([{ id: 'all', name: 'All Media', type: 'mixed', icon: 'Folder' }]);
      setApps([]);
      setNotes([]);
      setIntruders([]);
    } else {
      // Normal Vault: load from localStorage or defaults
      const savedMedia = localStorage.getItem('calc_vault_media_v2');
      const savedApps = localStorage.getItem('calc_vault_apps_v2');
      const savedNotes = localStorage.getItem('calc_vault_notes_v2');
      const savedIntruders = localStorage.getItem('calc_vault_intruders_v2');

      import('../data/vaultData').then((module) => {
        setAlbums(module.INITIAL_ALBUMS);
        setMediaList(savedMedia ? JSON.parse(savedMedia) : module.INITIAL_MEDIA);
        setApps(savedApps ? JSON.parse(savedApps) : module.INITIAL_HIDDEN_APPS);
        setNotes(savedNotes ? JSON.parse(savedNotes) : module.INITIAL_SECRET_NOTES);
        setIntruders(savedIntruders ? JSON.parse(savedIntruders) : module.INITIAL_INTRUDER_LOGS);
      });
    }
  }, [isDecoyMode]);

  // Persist helpers (only in non-decoy mode)
  const saveMedia = (newMedia: VaultMediaItem[]) => {
    setMediaList(newMedia);
    if (!isDecoyMode) localStorage.setItem('calc_vault_media_v2', JSON.stringify(newMedia));
  };

  const saveApps = (newApps: HiddenAppItem[]) => {
    setApps(newApps);
    if (!isDecoyMode) localStorage.setItem('calc_vault_apps_v2', JSON.stringify(newApps));
  };

  const saveNotes = (newNotes: SecretNote[]) => {
    setNotes(newNotes);
    if (!isDecoyMode) localStorage.setItem('calc_vault_notes_v2', JSON.stringify(newNotes));
  };

  const saveIntruders = (newIntruders: IntruderLog[]) => {
    setIntruders(newIntruders);
    if (!isDecoyMode) localStorage.setItem('calc_vault_intruders_v2', JSON.stringify(newIntruders));
  };

  // Media operations
  const handleToggleFavorite = (id: string) => {
    saveMedia(mediaList.map((m) => (m.id === id ? { ...m, isFavorite: !m.isFavorite } : m)));
  };

  const handleUnhideMedia = (id: string) => {
    saveMedia(mediaList.filter((m) => m.id !== id));
  };

  const handleDeleteMedia = (id: string) => {
    saveMedia(mediaList.filter((m) => m.id !== id));
  };

  const handleImportItems = (newItems: VaultMediaItem[]) => {
    saveMedia([...newItems, ...mediaList]);
  };

  // App operations
  const handleToggleHideApp = (appId: string) => {
    saveApps(
      apps.map((app) => (app.id === appId ? { ...app, isHidden: !app.isHidden } : app))
    );
  };

  const handleUpdateApp = (updated: HiddenAppItem) => {
    saveApps(apps.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleAddCustomApp = () => {
    if (!customAppName.trim()) return;
    const newApp: HiddenAppItem = {
      id: `app-custom-${Date.now()}`,
      name: customAppName.trim(),
      packageName: customAppPackage.trim() || `com.${customAppName.toLowerCase().replace(/\s+/g, '')}.app`,
      category: 'Tools',
      isHidden: true,
      isDisguised: false,
      disguisedName: 'Simple Utility',
      disguisedIcon: 'Calculator',
      iconColor: '#10b981',
      iconBg: '#06291a',
      originalIcon: 'Smartphone',
      appSize: '35.4 MB',
      lastOpened: 'Just now',
    };
    saveApps([newApp, ...apps]);
    setCustomAppName('');
    setCustomAppPackage('');
    setIsAddingApp(false);
  };

  // Note operations
  const handleSaveNote = () => {
    if (!newNoteTitle.trim()) return;
    if (editingNote) {
      saveNotes(
        notes.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                title: newNoteTitle.trim(),
                content: newNoteContent,
                category: newNoteCategory,
                updatedAt: 'Just now',
              }
            : n
        )
      );
    } else {
      const newNote: SecretNote = {
        id: `note-${Date.now()}`,
        title: newNoteTitle.trim(),
        content: newNoteContent,
        category: newNoteCategory,
        updatedAt: 'Just now',
        isPinned: false,
      };
      saveNotes([newNote, ...notes]);
    }
    setEditingNote(null);
    setIsCreatingNote(false);
    setNewNoteTitle('');
    setNewNoteContent('');
  };

  const handleDeleteNote = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id));
  };

  const handleCopyNote = (note: SecretNote) => {
    navigator.clipboard?.writeText(note.content);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Filtered Media
  const photosList = mediaList.filter((m) => m.type === 'image');
  const videosList = mediaList.filter((m) => m.type === 'video');

  const filteredPhotos = photosList.filter((item) => {
    const matchesAlbum =
      selectedAlbum === 'all' ||
      (selectedAlbum === 'favorites' ? item.isFavorite : item.album === selectedAlbum);
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.originalFileName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAlbum && matchesSearch;
  });

  const filteredVideos = videosList.filter((item) => {
    const matchesAlbum = selectedAlbum === 'all' || item.album === selectedAlbum;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.originalFileName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAlbum && matchesSearch;
  });

  const filteredApps = apps.filter((app) => {
    const matchesCat = appCategoryFilter === 'All' || app.category === appCategoryFilter;
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Calculate storage usage
  const totalSizeBytes = mediaList.reduce((acc, curr) => acc + curr.sizeBytes, 0);
  const totalStorageMb = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="flex-1 flex flex-col bg-[#121214] text-white overflow-hidden select-none font-sans">
      {/* Top Application Bar */}
      <header className="bg-neutral-900/90 border-b border-neutral-800/80 px-4 py-2.5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">Calculator Vault</h1>
              {isDecoyMode && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  Decoy Mode
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              {photosList.length} Photos • {videosList.length} Videos • {apps.filter(a => a.isHidden).length} Hidden Apps
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Media</span>
          </button>

          {/* Panic Lock Back to Calculator Button */}
          <button
            onClick={onLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-rose-950/80 hover:text-rose-400 text-neutral-300 text-xs font-medium border border-neutral-700 transition-colors cursor-pointer"
            title="Lock back to Calculator immediately"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline font-semibold">Lock</span>
          </button>
        </div>
      </header>

      {/* Primary Tab Navigation */}
      <nav className="bg-neutral-900 border-b border-neutral-800/80 px-2 py-1 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
        <button
          onClick={() => { setActiveTab('photos'); setSelectedAlbum('all'); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'photos'
              ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-inner'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Photos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 ml-0.5">
            {photosList.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveTab('videos'); setSelectedAlbum('all'); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'videos'
              ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-inner'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <VideoIcon className="w-3.5 h-3.5" />
          <span>Videos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 ml-0.5">
            {videosList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('apps')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'apps'
              ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-inner'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Hide Apps</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold ml-0.5">
            {apps.filter((a) => a.isHidden).length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'notes'
              ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-inner'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Secret Notes</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-800 text-neutral-400 ml-0.5">
            {notes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('intruders')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'intruders'
              ? 'bg-neutral-800 text-rose-400 font-semibold shadow-inner'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Intruders</span>
          {intruders.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 font-bold ml-0.5">
              {intruders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-inner'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Tab Content Body */}
      <main className="flex-1 overflow-y-auto p-4">
        {/* ================= PHOTOS TAB ================= */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            {/* Album Selector & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedAlbum('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    selectedAlbum === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  All ({photosList.length})
                </button>
                <button
                  onClick={() => setSelectedAlbum('favorites')}
                  className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                    selectedAlbum === 'favorites'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                  Favorites ({photosList.filter((p) => p.isFavorite).length})
                </button>
                {albums
                  .filter((a) => a.type === 'image' || a.type === 'mixed')
                  .map((alb) => (
                    <button
                      key={alb.id}
                      onClick={() => setSelectedAlbum(alb.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        selectedAlbum === alb.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {alb.name}
                    </button>
                  ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search hidden photos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Photos Grid */}
            {filteredPhotos.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-3xl p-8 bg-neutral-900/30">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
                <p className="text-sm font-semibold text-neutral-300">No hidden photos found</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  Import photos from your camera or gallery to encrypt and hide them behind the calculator.
                </p>
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-all"
                >
                  Import Photos Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredPhotos.map((photo) => {
                  const fullIndex = mediaList.findIndex((m) => m.id === photo.id);
                  return (
                    <div
                      key={photo.id}
                      onClick={() => setViewingMediaIndex(fullIndex)}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 cursor-pointer transition-all shadow-md"
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />

                      {/* Favorite Heart Tag */}
                      {photo.isFavorite && (
                        <div className="absolute top-2 left-2 p-1 rounded-full bg-black/60 backdrop-blur-sm text-rose-500">
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                        <p className="text-xs font-medium text-white truncate">{photo.title}</p>
                        <p className="text-[10px] text-neutral-400">{photo.dateAdded}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= VIDEOS TAB ================= */}
        {activeTab === 'videos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Hidden Video Clips ({filteredVideos.length})
              </span>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import Video</span>
              </button>
            </div>

            {filteredVideos.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-3xl p-8 bg-neutral-900/30">
                <VideoIcon className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
                <p className="text-sm font-semibold text-neutral-300">No secret videos in vault</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  Add confidential MP4 or camera recordings. They will be encrypted and hidden from video players.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredVideos.map((video) => {
                  const fullIndex = mediaList.findIndex((m) => m.id === video.id);
                  return (
                    <div
                      key={video.id}
                      onClick={() => setViewingMediaIndex(fullIndex)}
                      className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg flex flex-col"
                    >
                      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                        <img
                          src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80'}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Duration pill */}
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-neutral-200">
                          {video.duration || '0:15'}
                        </div>
                      </div>

                      <div className="p-3">
                        <h4 className="text-xs font-semibold text-white truncate">{video.title}</h4>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1">
                          <span>{video.dateAdded}</span>
                          <span>{(video.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= HIDDEN APPS TAB ================= */}
        {activeTab === 'apps' && (
          <div className="space-y-4">
            {/* Apps Header Stats & Action */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-900 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Installed Apps Hider & Camouflage</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Hidden apps are removed from the Android launcher and run inside this secret vault.
                </p>
              </div>

              <button
                onClick={() => setIsAddingApp(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Hide Another App</span>
              </button>
            </div>

            {/* Category Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['All', 'Chat', 'Social', 'Banking', 'Media', 'Dating'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAppCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      appCategoryFilter === cat
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Custom App Creator Drawer */}
            {isAddingApp && (
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Add App from Device to Vault</span>
                  <button onClick={() => setIsAddingApp(false)} className="text-neutral-400 hover:text-white">
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="App Name (e.g. Signal, Netflix)"
                    value={customAppName}
                    onChange={(e) => setCustomAppName(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Package ID (optional, e.g. org.thoughtcrime.securesms)"
                    value={customAppPackage}
                    onChange={(e) => setCustomAppPackage(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAddingApp(false)}
                    className="px-3 py-1.5 rounded-full text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCustomApp}
                    className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md"
                  >
                    Hide in Vault
                  </button>
                </div>
              </div>
            )}

            {/* Apps List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    app.isHidden
                      ? 'bg-neutral-900/90 border-emerald-500/30 shadow-md'
                      : 'bg-neutral-900/40 border-neutral-800 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow"
                      style={{ backgroundColor: app.iconColor }}
                    >
                      {app.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{app.name}</h4>
                        {app.isDisguised && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-semibold">
                            Camouflaged
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {app.isDisguised ? `Appears as: "${app.disguisedName}"` : app.packageName}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                        <span>{app.appSize}</span>
                        <span>•</span>
                        <span>{app.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Disguise Setup Button */}
                    <button
                      onClick={() => setDisguiseAppTarget(app)}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Camouflage & Stealth Icon"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </button>

                    {/* Launch Incognito Button */}
                    <button
                      onClick={() => setLaunchingApp(app)}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-white transition-colors cursor-pointer"
                      title="Launch Privately inside Vault"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    {/* Hidden Toggle Switch */}
                    <button
                      onClick={() => handleToggleHideApp(app.id)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        app.isHidden ? 'bg-emerald-600' : 'bg-neutral-700'
                      }`}
                      title={app.isHidden ? 'Hidden from launcher' : 'Visible on phone'}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                          app.isHidden ? 'right-0.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECRET NOTES TAB ================= */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Private Encrypted Notes</h3>
                <p className="text-xs text-neutral-400">Store crypto seeds, card PINs, and confidential text</p>
              </div>
              <button
                onClick={() => {
                  setEditingNote(null);
                  setNewNoteTitle('');
                  setNewNoteContent('');
                  setIsCreatingNote(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Secret Note</span>
              </button>
            </div>

            {/* Note Editor Drawer */}
            {isCreatingNote && (
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {editingNote ? 'Edit Secret Note' : 'Create Encrypted Note'}
                  </span>
                  <button onClick={() => setIsCreatingNote(false)} className="text-neutral-400 hover:text-white">
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Note Title"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <textarea
                    rows={4}
                    placeholder="Secret content (will be encrypted with AES-256)..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {(['Passwords', 'Cards', 'Personal', 'General'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setNewNoteCategory(cat)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer ${
                          newNoteCategory === cat ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCreatingNote(false)}
                      className="px-3 py-1.5 rounded-full text-xs text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-emerald-400 text-[10px] font-semibold">
                        {note.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyNote(note)}
                          className="p-1 rounded text-neutral-400 hover:text-white cursor-pointer"
                          title="Copy content"
                        >
                          {copiedNoteId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 rounded text-neutral-400 hover:text-rose-400 cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1.5">{note.title}</h4>
                    <p className="text-[11px] text-neutral-400 font-mono line-clamp-3 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-3 pt-2 border-t border-neutral-800/60">
                    Updated {note.updatedAt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= INTRUDERS LOG TAB ================= */}
        {activeTab === 'intruders' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Break-in & Intruder Capture</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Takes a silent selfie when someone inputs the wrong PIN into the calculator.
                </p>
              </div>
              {intruders.length > 0 && (
                <button
                  onClick={() => saveIntruders([])}
                  className="px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-rose-950 text-neutral-300 hover:text-rose-400 text-xs font-medium cursor-pointer"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {intruders.length === 0 ? (
              <div className="py-16 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-3xl p-8 bg-neutral-900/30">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p className="text-sm font-semibold text-neutral-300">No Break-in Attempts</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  Your calculator vault is fully secured. If someone enters incorrect passcodes, their photo and timestamp will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {intruders.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-neutral-900 border border-rose-950/60 flex items-center gap-3.5"
                  >
                    <img
                      src={item.snapshotUrl}
                      alt="Intruder Snapshot"
                      className="w-16 h-16 rounded-xl object-cover border border-rose-500/30 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-rose-400 text-xs font-bold mb-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Break-in Attempt</span>
                      </div>
                      <p className="text-[11px] text-white font-medium">{item.timestamp}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        Wrong PIN typed: <span className="text-rose-300">"{item.attemptedCode}"</span>
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= SETTINGS TAB ================= */}
        {activeTab === 'settings' && (
          <div className="space-y-4 max-w-xl mx-auto">
            {/* Master PIN configuration */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Calculator Master Unlock PIN
                </h4>
              </div>
              <p className="text-xs text-neutral-400">
                Type this number on the calculator and tap <span className="text-emerald-400 font-bold">=</span> to unlock this vault.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={8}
                  value={newMasterPin}
                  onChange={(e) => setNewMasterPin(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-sm font-mono text-white text-center tracking-widest focus:outline-none focus:border-emerald-500"
                  placeholder="Master PIN"
                />
                <button
                  onClick={() => {
                    if (newMasterPin.length >= 4) {
                      onUpdateConfig({ ...config, secretCalculatorCode: newMasterPin });
                      setPinSavedToast(true);
                      setTimeout(() => setPinSavedToast(false), 2000);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Save PIN
                </button>
              </div>
              {pinSavedToast && (
                <div className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Master Calculator PIN updated to {newMasterPin}</span>
                </div>
              )}
            </div>

            {/* Decoy PIN configuration */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Decoy / Fake PIN (Duress Protection)
                </h4>
              </div>
              <p className="text-xs text-neutral-400">
                If someone forces you to open the calculator vault, enter this Decoy PIN. It opens an empty decoy vault to protect your real private media!
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={8}
                  value={newDecoyPin}
                  onChange={(e) => setNewDecoyPin(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-sm font-mono text-white text-center tracking-widest focus:outline-none focus:border-amber-500"
                  placeholder="Decoy PIN (e.g. 1111)"
                />
                <button
                  onClick={() => {
                    if (newDecoyPin.length >= 4) {
                      onUpdateConfig({ ...config, decoyCalculatorCode: newDecoyPin });
                      alert(`Decoy PIN set to "${newDecoyPin}". Entering this on calculator opens a fake empty vault.`);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Decoy
                </button>
              </div>
            </div>

            {/* App Camouflage Icon Picker */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Launcher Icon Camouflage
                </h4>
              </div>
              <p className="text-xs text-neutral-400">
                Disguise this Vault app on your phone's home screen under a different identity:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(['calculator', 'weather', 'notes', 'clock', 'radio', 'compass'] as CamouflageIcon[]).map((iconKey) => (
                  <button
                    key={iconKey}
                    onClick={() => onUpdateConfig({ ...config, disguiseIcon: iconKey })}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      config.disguiseIcon === iconKey
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="capitalize text-[11px] font-semibold">{iconKey}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Switches */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Security Protections
              </h4>

              <div className="flex items-center justify-between py-1">
                <div>
                  <span className="text-xs font-medium text-white block">Flip Down to Panic Lock</span>
                  <span className="text-[11px] text-neutral-400">Instantly returns to calculator if phone is flipped down</span>
                </div>
                <button
                  onClick={() => onUpdateConfig({ ...config, flipToLockEnabled: !config.flipToLockEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    config.flipToLockEnabled ? 'bg-emerald-600' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      config.flipToLockEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between py-1 border-t border-neutral-800">
                <div>
                  <span className="text-xs font-medium text-white block">Intruder Selfie Capture</span>
                  <span className="text-[11px] text-neutral-400">Capture photo when wrong PIN entered 2+ times</span>
                </div>
                <button
                  onClick={() => onUpdateConfig({ ...config, intruderSelfieEnabled: !config.intruderSelfieEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    config.intruderSelfieEnabled ? 'bg-emerald-600' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                      config.intruderSelfieEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Storage overview */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-neutral-400">Encrypted Vault Storage</span>
                <span className="text-white font-mono">{totalStorageMb} MB Used</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: '45%' }} title="Photos" />
                <div className="bg-indigo-500 h-full" style={{ width: '35%' }} title="Videos" />
                <div className="bg-amber-500 h-full" style={{ width: '10%' }} title="Apps & Notes" />
              </div>
              <div className="flex items-center gap-4 text-[10px] text-neutral-400 mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Photos
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Videos
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Apps/Notes
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Lightbox / Video Player Modal */}
      {viewingMediaIndex !== null && (
        <MediaViewerModal
          mediaList={mediaList}
          initialIndex={viewingMediaIndex}
          onClose={() => setViewingMediaIndex(null)}
          onToggleFavorite={handleToggleFavorite}
          onUnhideMedia={handleUnhideMedia}
          onDeleteMedia={handleDeleteMedia}
        />
      )}

      {/* File Import Modal */}
      {isImportModalOpen && (
        <ImportMediaModal
          albums={albums}
          onClose={() => setIsImportModalOpen(false)}
          onImportItems={handleImportItems}
        />
      )}

      {/* App Disguise Modal */}
      {disguiseAppTarget && (
        <AppDisguiseModal
          app={disguiseAppTarget}
          onClose={() => setDisguiseAppTarget(null)}
          onUpdateApp={handleUpdateApp}
          onLaunchIncognito={(app) => {
            setDisguiseAppTarget(null);
            setLaunchingApp(app);
          }}
        />
      )}

      {/* Simulated Sandbox App Launch Modal */}
      {launchingApp && (
        <SimulatedAppLaunchModal
          app={launchingApp}
          onClose={() => setLaunchingApp(null)}
          onLockToCalculator={() => {
            setLaunchingApp(null);
            onLock();
          }}
        />
      )}
    </div>
  );
};
