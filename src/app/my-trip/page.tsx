'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { TOURIST_PLACES } from '@/lib/data/seedData';
import { getSavedItineraries, removeItineraryLocally, downloadAllForOffline } from '@/lib/offline/db';
import { Itinerary, TouristPlace } from '@/types';
import {
  BookmarkCheck,
  CalendarDays,
  Trash2,
  Navigation,
  Download,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

export default function MyTripPage() {
  const { t, savedPlaceIds, toggleSavePlace, offlineLastUpdated, places } = useApp();
  const allPlaces = places || TOURIST_PLACES;

  const [activeTab, setActiveTab] = useState<'saved' | 'itineraries' | 'offline'>('saved');
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [caching, setCaching] = useState<boolean>(false);
  const [cachedSuccess, setCachedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setItineraries(getSavedItineraries());
  }, []);

  // Filter saved places objects
  const savedPlaces: TouristPlace[] = allPlaces.filter((p) =>
    savedPlaceIds.includes(p.id)
  );

  const handleDeleteItinerary = (id: string) => {
    removeItineraryLocally(id);
    setItineraries(itineraries.filter((it) => it.id !== id));
  };

  const handleRefreshCache = async () => {
    setCaching(true);
    await downloadAllForOffline();
    setCaching(false);
    setCachedSuccess(true);
    setTimeout(() => setCachedSuccess(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <BookmarkCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          <span>My Hyderabad Trip</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Access your bookmarked places, custom day schedules, and offline-downloaded transit maps.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'saved'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Saved Places ({savedPlaces.length})
        </button>

        <button
          onClick={() => setActiveTab('itineraries')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'itineraries'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Saved Itineraries ({itineraries.length})
        </button>

        <button
          onClick={() => setActiveTab('offline')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'offline'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          Offline Cache Manager
        </button>
      </div>

      {/* Tab 1: Saved Places */}
      {activeTab === 'saved' && (
        <section className="space-y-4">
          {savedPlaces.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border/60 rounded-3xl space-y-3">
              <BookmarkCheck className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
              <h3 className="font-semibold text-base">No saved places yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Explore the attractions catalog or map and tap the bookmark icon to save places for quick access during your tour.
              </p>
              <Link
                href="/"
                className="inline-block mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                Browse Attractions
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedPlaces.map((place) => (
                <div
                  key={place.id}
                  className="rounded-2xl overflow-hidden bg-card border border-border/60 hover:border-nizami/40 transition-all flex flex-col justify-between shadow-sm"
                >
                  <div className="relative h-40 w-full bg-muted">
                    <img
                      src={place.cover_image}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => toggleSavePlace(place.id)}
                      title="Remove bookmark"
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-nizami-gold hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
                      {place.neighbourhood}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-serif font-bold text-base text-foreground">
                        {place.name}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {place.entry_fee_inr === 0 ? 'Free Entry' : `₹${place.entry_fee_inr} fee`} • {place.opening_hours.split('(')[0]}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                      <Link
                        href={`/place/${place.slug}`}
                        className="py-1.5 rounded-lg border border-border text-center text-xs font-semibold hover:bg-card/80"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/routes?dest=${place.id}`}
                        className="py-1.5 rounded-lg bg-emerald-600 text-white text-center text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-1"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Route</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Saved Itineraries */}
      {activeTab === 'itineraries' && (
        <section className="space-y-4">
          {itineraries.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border/60 rounded-3xl space-y-3">
              <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
              <h3 className="font-semibold text-base">No saved itineraries</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Use our automated Trip Planner to generate a 1, 2, or 3-day visiting schedule and save it here.
              </p>
              <Link
                href="/trip-planner"
                className="inline-block mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                Go to Trip Planner
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {itineraries.map((itin) => (
                <div
                  key={itin.id}
                  className="p-5 rounded-3xl bg-card border border-border/60 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-nizami-gold">
                        {itin.daysCount} Day Schedule • {itin.items.length} Stops
                      </div>
                      <h3 className="font-serif font-bold text-lg text-foreground mt-0.5">
                        {itin.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {itin.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteItinerary(itin.id)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-card/80 transition-colors"
                      title="Delete itinerary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stops preview */}
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {itin.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="px-3 py-1.5 rounded-xl bg-background border border-border/60 text-xs shrink-0 flex items-center gap-1.5 font-medium"
                      >
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{item.place.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Est. Budget: ₹{itin.budgetInr}</span>
                    <Link
                      href="/trip-planner"
                      className="text-nizami-gold font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Open in Planner</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Offline Cache Manager */}
      {activeTab === 'offline' && (
        <section className="p-6 rounded-3xl bg-card border border-border/70 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-nizami/15 border border-nizami/30 flex items-center justify-center text-nizami-gold">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-foreground">
                Offline PWA Storage & Cache
              </h2>
              <p className="text-xs text-muted-foreground">
                All data is stored in browser IndexedDB & localStorage so you can navigate Hyderabad without internet connectivity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-background border border-border/60 space-y-1">
              <div className="text-muted-foreground uppercase text-[10px]">Cached Attractions</div>
              <div className="font-bold text-lg text-foreground font-mono">
                {allPlaces.length} Places
              </div>
              <div className="text-[10px] text-emerald-400">Complete photos & tips</div>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border/60 space-y-1">
              <div className="text-muted-foreground uppercase text-[10px]">Transit Stations</div>
              <div className="font-bold text-lg text-foreground font-mono">
                60 Metro Stations
              </div>
              <div className="text-[10px] text-emerald-400">Red, Blue, Green Lines</div>
            </div>

            <div className="p-4 rounded-2xl bg-background border border-border/60 space-y-1">
              <div className="text-muted-foreground uppercase text-[10px]">Last Synced</div>
              <div className="font-bold text-sm text-foreground font-mono truncate">
                {new Date(offlineLastUpdated).toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground">Verified Official</div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Offline bundle includes routing graph and fare slabs</span>
            </div>

            <button
              onClick={handleRefreshCache}
              disabled={caching}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              {cachedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cache Updated Successfully!</span>
                </>
              ) : (
                <>
                  <Download className={`w-4 h-4 ${caching ? 'animate-bounce' : ''}`} />
                  <span>{caching ? 'Re-caching Data...' : 'Refresh Offline Cache'}</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

    </div>
  );
}
