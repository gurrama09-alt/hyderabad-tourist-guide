'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { SupportedLanguage } from '@/types';
import {
  Compass,
  Moon,
  Sun,
  Globe,
  Wifi,
  WifiOff,
  Download,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { downloadAllForOffline } from '@/lib/offline/db';

export function Header() {
  const {
    language,
    setLanguage,
    t,
    theme,
    toggleTheme,
    isOnline,
    userCoords,
    requestUserLocation,
    offlineLastUpdated
  } = useApp();

  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    const res = await downloadAllForOffline();
    setDownloading(false);
    if (res.success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl green-gradient flex items-center justify-center text-white shadow-green-glow transition-transform group-hover:scale-105">
            <Compass className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Hyderabad
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Guide
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block">
              Nizami Heritage • Metro • Buses • Planner
            </p>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Geolocation Button */}
          <button
            onClick={requestUserLocation}
            title={userCoords ? 'GPS Active' : 'Enable Current Location'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              userCoords
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-card/60 text-muted-foreground border-border/60 hover:text-foreground'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {userCoords ? 'Location On' : t.nearMe}
            </span>
          </button>

          {/* Offline Guide Cache Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            title="Download places and transit routes for 100% offline travel"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-card/60 border border-border/60 hover:border-nizami/40 text-foreground transition-colors"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{t.offlineReady}</span>
              </>
            ) : (
              <>
                <Download className={`w-3.5 h-3.5 ${downloading ? 'animate-bounce' : 'text-nizami-gold'}`} />
                <span>{downloading ? 'Caching...' : t.downloadOffline}</span>
              </>
            )}
          </button>

          {/* Network Status Pill */}
          <div
            title={isOnline ? 'Online - Live Supabase Connected' : 'Offline - Loaded from Local Cache'}
            className={`p-2 rounded-lg border text-xs flex items-center justify-center ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>

          {/* Language Switcher */}
          <div className="relative flex items-center">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="appearance-none bg-card/80 border border-border/60 text-foreground text-xs font-semibold py-1.5 pl-7 pr-4 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-nizami-gold hover:border-nizami/40"
              aria-label="Select Language"
            >
              <option value="en">English (EN)</option>
              <option value="te">తెలుగు (TE)</option>
              <option value="hi">हिंदी (HI)</option>
            </select>
            <Globe className="w-3.5 h-3.5 text-nizami-gold absolute left-2 pointer-events-none" />
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark/Light Mode"
            className="p-2 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

        </div>

      </div>
    </header>
  );
}
