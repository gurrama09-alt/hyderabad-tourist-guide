'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { TOURIST_PLACES, METRO_RED_STATIONS, METRO_BLUE_STATIONS } from '@/lib/data/seedData';
import { planJourney } from '@/lib/routing/dijkstra';
import { JourneyOption, RouteLeg, TransportType } from '@/types';
import {
  Navigation,
  ArrowRight,
  Clock,
  IndianRupee,
  Train,
  Bus,
  Car,
  Footprints,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpDown,
  Compass,
  Repeat
} from 'lucide-react';

function RoutesContent() {
  const searchParams = useSearchParams();
  const initialDestId = searchParams?.get('dest') || 'golconda-fort';
  const initialOriginId = searchParams?.get('origin') || 'charminar';

  const { t, userCoords, offlineLastUpdated, places } = useApp();
  const allPlaces = places || TOURIST_PLACES;

  const [originPlaceId, setOriginPlaceId] = useState<string>(initialOriginId);
  const [destPlaceId, setDestPlaceId] = useState<string>(initialDestId);
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');

  // Find objects
  const originPlace = allPlaces.find((p) => p.id === originPlaceId) || allPlaces[0];
  const destPlace = allPlaces.find((p) => p.id === destPlaceId) || allPlaces[1];

  // Resolve coordinates
  const originCoords = useMemo(() => {
    if (useCurrentLocation && userCoords) {
      return { name: 'My Current Location (GPS)', lat: userCoords.lat, lng: userCoords.lng };
    }
    return { name: originPlace.name, lat: originPlace.latitude, lng: originPlace.longitude };
  }, [useCurrentLocation, userCoords, originPlace]);

  const destCoords = useMemo(() => {
    return { name: destPlace.name, lat: destPlace.latitude, lng: destPlace.longitude };
  }, [destPlace]);

  // Compute 4 routes using Dijkstra / Multi-Modal Routing Engine
  const journeyOptions = useMemo(() => {
    return planJourney(originCoords, destCoords);
  }, [originCoords, destCoords]);

  const activeOption =
    (selectedOptionId && journeyOptions.find((o) => o.id === selectedOptionId)) || journeyOptions[0];

  // Swap Origin and Destination
  const handleSwap = () => {
    if (useCurrentLocation) {
      setUseCurrentLocation(false);
    }
    const temp = originPlaceId;
    setOriginPlaceId(destPlaceId);
    setDestPlaceId(temp);
  };

  const getModeIcon = (mode: TransportType) => {
    switch (mode) {
      case 'metro':
        return <Train className="w-4 h-4 text-metro-red" />;
      case 'bus':
        return <Bus className="w-4 h-4 text-tgsrtc" />;
      case 'road':
        return <Car className="w-4 h-4 text-sky-400" />;
      case 'walking':
      default:
        return <Footprints className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      
      {/* Route Planner Header & Selection Form */}
      <section className="p-6 rounded-3xl bg-card border border-border/70 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Navigation className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span>Multi-Transport Route Planner</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare fastest Metro, cheapest TGSRTC Bus, and direct Road alternatives with transfer penalties
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.lastUpdated}: {new Date(offlineLastUpdated).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Origin & Destination Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
          
          {/* Origin Picker */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Start Location (Origin)</span>
              {userCoords && (
                <button
                  type="button"
                  onClick={() => setUseCurrentLocation(!useCurrentLocation)}
                  className={`text-[11px] font-medium transition-colors ${
                    useCurrentLocation ? 'text-emerald-400 font-bold' : 'text-nizami-gold hover:underline'
                  }`}
                >
                  {useCurrentLocation ? '✓ Using Current GPS' : 'Use Current GPS'}
                </button>
              )}
            </label>

            {useCurrentLocation ? (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium text-xs sm:text-sm flex items-center justify-between">
                <span>My Current GPS Location</span>
                <button
                  onClick={() => setUseCurrentLocation(false)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Choose place
                </button>
              </div>
            ) : (
              <select
                value={originPlaceId}
                onChange={(e) => setOriginPlaceId(e.target.value)}
                className="w-full bg-background border border-border/80 rounded-2xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nizami-gold"
              >
                {allPlaces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.neighbourhood.split('/')[0]})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center py-1">
            <button
              onClick={handleSwap}
              title="Swap origin and destination"
              className="p-2.5 rounded-full bg-card border border-border hover:border-nizami/40 hover:bg-card/80 text-foreground transition-all hover:rotate-180 duration-300"
            >
              <Repeat className="w-4 h-4 text-nizami-gold" />
            </button>
          </div>

          {/* Destination Picker */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Destination Attraction
            </label>
            <select
              value={destPlaceId}
              onChange={(e) => setDestPlaceId(e.target.value)}
              className="w-full bg-background border border-border/80 rounded-2xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-nizami-gold"
            >
              {allPlaces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.neighbourhood.split('/')[0]})
                </option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* Smart Route Comparison Cards (3+ Options) */}
      <section className="space-y-4">
        <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
          Smart Route Comparison ({journeyOptions.length} Options)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {journeyOptions.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedOptionId(opt.id)}
                className={`text-left p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-3 relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br from-card via-card to-nizami/10 border-nizami-gold shadow-glow ring-1 ring-nizami-gold'
                    : 'bg-card border-border/60 hover:border-border hover:bg-card/80'
                }`}
              >
                {/* Tag Pill */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      opt.tag === 'fastest'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : opt.tag === 'cheapest'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : opt.tag === 'fewest_transfers'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    }`}
                  >
                    {opt.tagLabel}
                  </span>
                  
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-nizami-gold" />
                  )}
                </div>

                <div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-foreground">
                    {opt.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {opt.summary}
                  </p>
                </div>

                {/* Duration & Cost Badges */}
                <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">{t.travelTime}</div>
                    <div className="font-bold text-foreground text-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-nizami-gold" />
                      <span>{opt.totalDurationMins} min</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase">{t.travelCost}</div>
                    <div className="font-bold text-foreground text-sm flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                      <span>₹{opt.totalCostInr}</span>
                    </div>
                  </div>
                </div>

                {/* Transfers & Distance info */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span>{opt.totalDistanceKm} km total</span>
                  <span>{opt.transferCount === 0 ? 'No Transfers' : `${opt.transferCount} Transfer`}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Side-by-Side Detailed Comparison Table */}
      <section className="p-6 rounded-3xl bg-card border border-border/60 overflow-hidden space-y-4">
        <h3 className="font-serif font-bold text-base text-foreground">
          Side-by-Side Route Comparison Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-muted/30">
              <tr>
                <th className="p-3">Option</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Est. Time</th>
                <th className="p-3">Distance & Label</th>
                <th className="p-3">Fare & Badge</th>
                <th className="p-3">Transfers</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {journeyOptions.map((opt) => (
                <tr
                  key={opt.id}
                  className={`hover:bg-card/80 transition-colors ${
                    selectedOptionId === opt.id ? 'bg-nizami/10 font-medium' : ''
                  }`}
                >
                  <td className="p-3 font-semibold text-foreground">{opt.title}</td>
                  <td className="p-3">
                    <span className="capitalize">{opt.legs.map((l) => l.mode).join(' → ')}</span>
                  </td>
                  <td className="p-3 font-semibold text-foreground">{opt.totalDurationMins} mins</td>
                  <td className="p-3">
                    <span className="font-mono">{opt.totalDistanceKm} km</span>
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-card border text-muted-foreground">
                      {opt.legs[0]?.distanceType}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-emerald-400">₹{opt.totalCostInr}</span>
                    <span
                      className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        opt.legs[0]?.fareType === 'official'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {opt.legs[0]?.fareType === 'official' ? t.officialFare : t.estimatedFare}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {opt.transferCount === 0 ? 'Direct (0)' : `${opt.transferCount} interchange`}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedOptionId(opt.id)}
                      className="px-3 py-1 rounded-lg bg-card border border-border hover:border-nizami-gold text-xs font-semibold"
                    >
                      {selectedOptionId === opt.id ? 'Selected' : 'View Steps'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Selected Route Step-by-Step Directions */}
      <section className="p-6 rounded-3xl bg-card border border-border/70 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-nizami-gold">
              Step-by-Step Journey Breakdown
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground mt-0.5">
              {activeOption.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
              Total Fare: ₹{activeOption.totalCostInr}
            </span>
            <span className="text-sm font-bold text-nizami-gold bg-nizami/10 px-3 py-1 rounded-xl border border-nizami/30">
              ETA: ~{activeOption.totalDurationMins} min
            </span>
          </div>
        </div>

        {/* Timeline of Steps */}
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-nizami-gold before:to-emerald-500">
          {activeOption.legs.map((leg, index) => (
            <div key={leg.id} className="relative space-y-2">
              
              {/* Timeline Dot Icon */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white shadow-md ${
                  leg.mode === 'metro'
                    ? 'bg-metro-red'
                    : leg.mode === 'bus'
                    ? 'bg-tgsrtc'
                    : leg.mode === 'road'
                    ? 'bg-sky-500'
                    : 'bg-emerald-600'
                }`}
              >
                {getModeIcon(leg.mode)}
              </div>

              {/* Leg Title & Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base text-foreground">
                    {leg.lineName || (leg.mode === 'walking' ? 'Walking Corridor' : 'Road Transit')}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-card border border-border/60 text-muted-foreground uppercase">
                    {leg.distanceType} distance
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>{leg.distanceKm} km</span>
                  <span>•</span>
                  <span>{leg.durationMins} min</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">
                    {leg.fareInr === 0 ? 'Free' : `₹${leg.fareInr}`}
                  </span>
                </div>
              </div>

              {/* Station From / To Details */}
              <div className="p-3.5 rounded-2xl bg-background border border-border/60 space-y-2 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <span className="text-muted-foreground text-xs">Board at:</span>
                  <span>{leg.fromName}</span>
                </div>

                <div className="flex items-center gap-2 text-foreground font-medium">
                  <span className="text-muted-foreground text-xs">Alight at:</span>
                  <span>{leg.toName}</span>
                </div>

                {/* Instructions */}
                <div className="pt-2 border-t border-border/40 space-y-1 text-xs text-muted-foreground">
                  {leg.instructions.map((inst, i) => (
                    <p key={i} className="leading-relaxed">
                      • {inst}
                    </p>
                  ))}
                </div>

                {/* Intermediate stops toggle if metro/bus */}
                {leg.intermediateStops && leg.intermediateStops.length > 2 && (
                  <div className="pt-2 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-nizami-gold">
                      {leg.intermediateStops.length - 1} stops sequence:
                    </span>{' '}
                    {leg.intermediateStops.join(' → ')}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

        {/* Data Integrity Footer Notice */}
        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Fares calculated according to official HMRL & TGSRTC fare charts.</span>
          </div>
          <div className="font-mono text-[11px]">
            Data last updated: {new Date(activeOption.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      </section>

    </div>
  );
}

export default function RoutesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
          <Compass className="w-10 h-10 animate-spin text-nizami-gold" />
          <p className="text-sm font-semibold">Computing Multi-Transport Routes...</p>
        </div>
      }
    >
      <RoutesContent />
    </Suspense>
  );
}

