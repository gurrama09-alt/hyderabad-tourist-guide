'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { TOURIST_PLACES, TRANSPORT_LINES } from '@/lib/data/seedData';
import { TouristPlace } from '@/types';
import {
  Layers,
  MapPin,
  Crosshair,
  Search,
  Navigation,
  Clock,
  IndianRupee,
  Star,
  X,
  Compass,
  Train,
  Bus,
  Utensils,
  ChevronRight,
  Accessibility
} from 'lucide-react';

// Dynamic import with ssr: false for Leaflet
const DynamicLeafletMap = dynamic(
  () => import('@/components/map/LeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[450px] flex flex-col items-center justify-center bg-card/60 rounded-2xl border border-border/60">
        <Compass className="w-10 h-10 animate-spin text-nizami-gold mb-3" />
        <p className="text-sm font-semibold">Loading Hyderabad City Map...</p>
        <p className="text-xs text-muted-foreground mt-1">
          Rendering HMRL Metro lines & heritage locations
        </p>
      </div>
    ),
  }
);

export default function ExplorePage() {
  const { t, userCoords, requestUserLocation, toggleSavePlace, isPlaceSaved, places } = useApp();

  const currentPlaces = places || TOURIST_PLACES;
  const [selectedPlace, setSelectedPlace] = useState<TouristPlace | null>(currentPlaces[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMetro, setShowMetro] = useState(true);
  const [showBus, setShowBus] = useState(true);
  const [showMMTS, setShowMMTS] = useState(true);
  const [showAmenities, setShowAmenities] = useState(true);

  // Filter places for search dropdown
  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return currentPlaces;
    const q = searchQuery.toLowerCase();
    return currentPlaces.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.neighbourhood.toLowerCase().includes(q) ||
        p.nearest_metro_station?.toLowerCase().includes(q)
    );
  }, [searchQuery, currentPlaces]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden relative">
      
      {/* Left / Desktop Sidebar Panel */}
      <div className="w-full lg:w-96 flex flex-col border-r border-border/40 bg-card/70 backdrop-blur-md shrink-0 max-h-[45vh] lg:max-h-full lg:h-full z-20 overflow-y-auto">
        
        {/* Search & Header in Panel */}
        <div className="p-4 border-b border-border/40 space-y-3 sticky top-0 bg-card/95 z-10 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h1 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.navExplore}</span>
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-nizami/15 text-nizami-gold border border-nizami/30">
              {currentPlaces.length} Spots
            </span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter places or stations..."
              className="w-full bg-background/80 border border-border/70 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-nizami-gold"
            />
          </div>

          {/* Layer Toggles Strip */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <button
              onClick={() => setShowMetro(!showMetro)}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                showMetro
                  ? 'bg-emerald-600/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/40 font-semibold'
                  : 'bg-card text-muted-foreground border-border/60 opacity-60'
              }`}
            >
              <Train className="w-3 h-3 text-emerald-500" />
              <span>HMRL Metro</span>
            </button>

            <button
              onClick={() => setShowMMTS(!showMMTS)}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                showMMTS
                  ? 'bg-purple-600/20 text-purple-400 border-purple-500/40 font-semibold'
                  : 'bg-card text-muted-foreground border-border/60 opacity-60'
              }`}
            >
              <Train className="w-3 h-3 text-purple-400" />
              <span>MMTS Local Rail</span>
            </button>

            <button
              onClick={() => setShowBus(!showBus)}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                showBus
                  ? 'bg-tgsrtc/20 text-amber-400 border-tgsrtc/40 font-semibold'
                  : 'bg-card text-muted-foreground border-border/60 opacity-60'
              }`}
            >
              <Bus className="w-3 h-3" />
              <span>TGSRTC Buses</span>
            </button>

            <button
              onClick={() => setShowAmenities(!showAmenities)}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                showAmenities
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                  : 'bg-card text-muted-foreground border-border/60 opacity-60'
              }`}
            >
              <Utensils className="w-3 h-3" />
              <span>Food & Hubs</span>
            </button>
          </div>
        </div>

        {/* Selected Place Detail Preview in Desktop Panel */}
        {selectedPlace ? (
          <div className="p-4 space-y-4">
            <div className="relative h-44 rounded-2xl overflow-hidden bg-muted border border-border/60 shadow-sm">
              <img
                src={selectedPlace.cover_image}
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              <div className="absolute top-2.5 right-2.5">
                <button
                  onClick={() => toggleSavePlace(selectedPlace.id)}
                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <Star className={`w-4 h-4 ${isPlaceSaved(selectedPlace.id) ? 'fill-nizami-gold text-nizami-gold' : ''}`} />
                </button>
              </div>

              <div className="absolute bottom-2.5 left-3 right-3 text-white text-xs">
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-600">
                  {selectedPlace.neighbourhood}
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg mt-1 drop-shadow-sm">
                  {selectedPlace.name}
                </h3>
              </div>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center gap-2">
                <Clock className="w-4 h-4 text-nizami-gold shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-muted-foreground uppercase">Timings</div>
                  <div className="font-semibold text-foreground truncate">
                    {selectedPlace.opening_hours.split('(')[0]}
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Entry Fee</div>
                  <div className="font-semibold text-foreground">
                    {selectedPlace.entry_fee_inr === 0 ? 'Free' : `₹${selectedPlace.entry_fee_inr}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Nearest Transit Hub */}
            {selectedPlace.nearest_metro_station && (
              <div className="p-2.5 rounded-xl bg-card border border-border/60 text-xs flex items-center gap-2">
                <Train className="w-4 h-4 text-metro-blue shrink-0" />
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Nearest Metro</div>
                  <div className="font-medium text-foreground">{selectedPlace.nearest_metro_station}</div>
                </div>
              </div>
            )}

            {/* Visitor Tip */}
            {selectedPlace.visitor_tips.length > 0 && (
              <div className="p-3 rounded-xl bg-nizami/10 border border-nizami/25 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-nizami-gold">
                  Insider Tip
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedPlace.visitor_tips[0]}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href={`/place/${selectedPlace.slug}`}
                className="py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-card/80 text-foreground text-xs font-semibold text-center transition-colors"
              >
                Full Details
              </Link>

              <Link
                href={`/routes?dest=${selectedPlace.id}`}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Click on any map pin or select an attraction from below.
          </div>
        )}

        {/* All Places List inside panel */}
        <div className="p-4 border-t border-border/40 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            All Attractions ({filteredPlaces.length})
          </h4>
          <div className="space-y-1.5">
            {filteredPlaces.map((p) => {
              const isSelected = selectedPlace?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlace(p)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-nizami/15 text-nizami-gold border-nizami-gold/40 font-semibold'
                      : 'bg-card/50 text-muted-foreground border-border/40 hover:bg-card hover:text-foreground'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="text-foreground font-medium truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">{p.neighbourhood}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Main Map Canvas Area */}
      <div className="flex-1 relative min-h-[45vh] lg:h-full w-full">
        <DynamicLeafletMap
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={(p) => setSelectedPlace(p)}
          showMetro={showMetro}
          showBus={showBus}
          showMMTS={showMMTS}
          showAmenities={showAmenities}
          metroLines={TRANSPORT_LINES}
          userLocation={userCoords}
        />

        {/* Floating Map Controls Overlay */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {/* Locate Me GPS Button */}
          <button
            onClick={requestUserLocation}
            title="Recenter on current GPS location"
            className="p-3 rounded-xl bg-card/90 backdrop-blur-md border border-border/80 text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 shadow-md hover:scale-105 transition-all"
            aria-label="Find My Location"
          >
            <Crosshair className="w-5 h-5" />
          </button>
        </div>

        {/* Legend Overlay at bottom-right */}
        <div className="flex absolute bottom-4 right-4 z-20 flex-col gap-1 p-3.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border/80 text-[11px] shadow-lg max-w-xs">
          <span className="font-semibold text-foreground mb-1">Transit Network Legend</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 rounded bg-metro-red" />
            <span>Red Line (Miyapur ↔ LB Nagar)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 rounded bg-metro-blue" />
            <span>Blue Line (Nagole ↔ Raidurg)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 rounded bg-metro-green" />
            <span>Green Line (JBS ↔ MGBS)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 border-t-2 border-dashed border-purple-500" />
            <span className="text-purple-400 font-medium">MMTS Local Suburban Trains</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-nizami-gold" />
            <span>Ameerpet / MGBS Interchange</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span>Tourist Attraction Pin</span>
          </div>
        </div>

      </div>

    </div>
  );
}
