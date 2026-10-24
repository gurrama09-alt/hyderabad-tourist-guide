'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { generateCuratedItinerary, optimizePlacesSequence, formatMinutesToTime } from '@/lib/itinerary/tspPlanner';
import { saveItineraryLocally } from '@/lib/offline/db';
import { calculateHaversineDistanceKm } from '@/lib/routing/dijkstra';
import { Itinerary, ItineraryItem, TouristPlace } from '@/types';
import { TOURIST_PLACES, CATEGORIES } from '@/lib/data/seedData';
import {
  CalendarDays,
  Sparkles,
  Clock,
  IndianRupee,
  Navigation,
  Share2,
  BookmarkCheck,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Compass,
  Printer,
  FileDown,
  ArrowUpDown,
  Search,
  Check,
  MapPin,
  Phone,
  Info,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function TripPlannerPage() {
  const { t, places } = useApp();

  const allPlaces = places || TOURIST_PLACES;

  // Mode: Curated AI Itineraries vs Custom One-by-One Destination Selection
  const [plannerMode, setPlannerMode] = useState<'curated' | 'custom'>('custom');

  // Curated AI state
  const [daysCount, setDaysCount] = useState<1 | 2 | 3>(1);
  const [curatedItinerary, setCuratedItinerary] = useState<Itinerary>(() => generateCuratedItinerary(1));
  const [activeDay, setActiveDay] = useState<number>(1);

  // Custom One-by-One state
  const [customPlaces, setCustomPlaces] = useState<TouristPlace[]>([
    TOURIST_PLACES[0], // Charminar
    TOURIST_PLACES[4], // Chowmahalla Palace
    TOURIST_PLACES[3], // Salar Jung Museum
    TOURIST_PLACES[1], // Golconda Fort
  ]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Add / remove place from custom list
  const handleToggleCustomPlace = (place: TouristPlace) => {
    const exists = customPlaces.some((p) => p.id === place.id);
    if (exists) {
      setCustomPlaces(customPlaces.filter((p) => p.id !== place.id));
    } else {
      setCustomPlaces([...customPlaces, place]);
    }
  };

  // Move place up or down in sequence
  const handleMovePlace = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= customPlaces.length) return;
    const updated = [...customPlaces];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setCustomPlaces(updated);
  };

  // Auto-optimize sequence with TSP Heuristic
  const handleOptimizeCustomSequence = () => {
    const optimized = optimizePlacesSequence(customPlaces);
    setCustomPlaces(optimized);
  };

  // Regenerate curated itinerary
  const handleGenerateCurated = (days: 1 | 2 | 3) => {
    setDaysCount(days);
    const generated = generateCuratedItinerary(days);
    setCuratedItinerary(generated);
    setActiveDay(1);
  };

  // Active itinerary object based on current mode
  const currentItinerary: Itinerary = useMemo(() => {
    if (plannerMode === 'curated') {
      return curatedItinerary;
    }

    // Build timeline for custom places starting at 09:30 AM
    let currentMins = 570;
    const items: ItineraryItem[] = customPlaces.map((place, idx) => {
      if (currentMins < place.opening_time_mins) {
        currentMins = place.opening_time_mins;
      }
      if (currentMins >= 780 && currentMins < 840 && idx > 0) {
        currentMins += 45; // 45 min Biryani lunch break
      }

      const travelTime =
        idx === 0
          ? 0
          : Math.round(
              calculateHaversineDistanceKm(
                customPlaces[idx - 1].latitude,
                customPlaces[idx - 1].longitude,
                place.latitude,
                place.longitude
              ) * 3.5 + 8
            );

      currentMins += travelTime;
      const startTime = formatMinutesToTime(currentMins);
      currentMins += place.estimated_duration_mins;

      return {
        id: `custom_${place.id}`,
        placeId: place.id,
        place,
        dayNumber: 1,
        orderIndex: idx + 1,
        startTime,
        durationMins: place.estimated_duration_mins,
        travelTimeFromPrevMins: travelTime,
        notes: place.visitor_tips[0] || 'Explore and enjoy the heritage!',
      };
    });

    return {
      id: `custom_itin_${Date.now()}`,
      title: 'Custom Curated Hyderabad Tour Plan',
      description: 'Personalized tour schedule featuring user-selected monuments and sights.',
      daysCount: 1,
      budgetInr: customPlaces.reduce((sum, p) => sum + p.entry_fee_inr, 0) + 400,
      items,
      isPublic: true,
      shareToken: `hyd-custom-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
  }, [plannerMode, curatedItinerary, customPlaces]);

  // Total metrics
  const totalFees = useMemo(() => {
    return currentItinerary.items.reduce((sum, item) => sum + item.place.entry_fee_inr, 0);
  }, [currentItinerary]);

  const totalDurationHours = useMemo(() => {
    const totalMins = currentItinerary.items.reduce(
      (sum, item) => sum + item.durationMins + (item.travelTimeFromPrevMins || 0),
      0
    );
    return (totalMins / 60).toFixed(1);
  }, [currentItinerary]);

  // Save itinerary to local storage
  const handleSaveItinerary = () => {
    saveItineraryLocally(currentItinerary);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Share link
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/my-trip?token=${currentItinerary.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Print as PDF
  const handleDownloadPDF = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Available places for custom search
  const availablePlaces = useMemo(() => {
    return allPlaces.filter((place) => {
      if (selectedCategory !== 'all' && place.category_id !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          place.name.toLowerCase().includes(q) ||
          place.neighbourhood.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allPlaces, selectedCategory, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Trip Planner & PDF Exporter</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Plan Your Hyderabad Visit
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Select destinations one-by-one or let our AI engine generate an optimized multi-day tour.
          </p>
        </div>

        {/* Planner Mode Toggle */}
        <div className="flex p-1 rounded-2xl bg-card border border-border/80 text-xs font-semibold shrink-0">
          <button
            onClick={() => setPlannerMode('custom')}
            className={`px-4 py-2 rounded-xl transition-all ${
              plannerMode === 'custom'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Custom Destination Builder
          </button>
          <button
            onClick={() => setPlannerMode('curated')}
            className={`px-4 py-2 rounded-xl transition-all ${
              plannerMode === 'curated'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            AI Multi-Day Plans
          </button>
        </div>
      </div>

      {/* Action Bar (Download PDF, Save, Share) */}
      <div className="p-4 rounded-3xl bg-card border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 shadow-sm no-print">
        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <span className="font-bold text-foreground">
            {currentItinerary.items.length} Destinations Selected
          </span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold font-mono">
            ₹{totalFees} Total Entry Fees
          </span>
          <span>•</span>
          <span className="font-mono">~{totalDurationHours} hrs duration</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-green-glow transition-all"
            title="Download formatted travel plan as PDF or print"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Trip Plan as PDF</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="px-3.5 py-2 rounded-xl border border-border/70 hover:bg-card text-xs font-semibold flex items-center gap-1.5 text-foreground"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Save Itinerary */}
          <button
            onClick={handleSaveItinerary}
            className="px-3.5 py-2 rounded-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODE 1: Custom One-by-One Destination Builder */}
      {plannerMode === 'custom' && (
        <section className="space-y-6 no-print">
          
          {/* Selected Itinerary Sequence Card */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div>
                <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-500" />
                  <span>Your Custom Trip Itinerary Sequence</span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Order of destinations. Reorder manually or let our TSP algorithm optimize the route.
                </p>
              </div>

              {customPlaces.length > 1 && (
                <button
                  onClick={handleOptimizeCustomSequence}
                  className="px-3.5 py-1.5 rounded-xl bg-nizami/15 border border-nizami/30 text-nizami-gold hover:bg-nizami/25 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Optimize Visiting Order (TSP)</span>
                </button>
              )}
            </div>

            {customPlaces.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl p-6">
                No destinations added yet. Browse the catalog below and tap "+ Add to Custom Trip" on any attraction!
              </div>
            ) : (
              <div className="space-y-2.5">
                {customPlaces.map((place, idx) => (
                  <div
                    key={place.id}
                    className="p-3.5 rounded-2xl bg-background border border-border/60 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        {idx + 1}
                      </span>
                      <img
                        src={place.cover_image}
                        alt=""
                        className="w-12 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <div className="font-bold text-sm text-foreground">{place.name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>{place.neighbourhood}</span>
                          <span>•</span>
                          <span className="font-mono text-emerald-400 font-semibold">
                            {place.entry_fee_inr === 0 ? 'Free' : `₹${place.entry_fee_inr}`}
                          </span>
                          <span>•</span>
                          <span>~{place.estimated_duration_mins} mins</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls: Move Up, Move Down, Remove */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMovePlace(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Earlier"
                        className="p-1.5 rounded-lg border border-border/60 hover:bg-card disabled:opacity-30 text-muted-foreground"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMovePlace(idx, 'down')}
                        disabled={idx === customPlaces.length - 1}
                        title="Move Later"
                        className="p-1.5 rounded-lg border border-border/60 hover:bg-card disabled:opacity-30 text-muted-foreground"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleCustomPlace(place)}
                        title="Remove from custom plan"
                        className="p-1.5 rounded-lg border border-border/60 hover:bg-rose-500/10 text-rose-400 transition-colors ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attraction Catalog to Add Destinations One-by-One */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-base text-foreground">
                  Browse & Add Destinations One-by-One
                </h3>
                <p className="text-xs text-muted-foreground">
                  Tap "+ Add to Custom Trip" to include any monument into your itinerary.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search destinations..."
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Attractions Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availablePlaces.map((place) => {
                const isSelected = customPlaces.some((p) => p.id === place.id);
                return (
                  <div
                    key={place.id}
                    className={`p-3 rounded-2xl border text-xs flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                        : 'bg-background border-border/60 hover:border-border'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <img
                        src={place.cover_image}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-bold text-foreground text-xs truncate">
                          {place.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {place.neighbourhood}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          {place.entry_fee_inr === 0 ? 'Free Entry' : `₹${place.entry_fee_inr} fee`} • ~{place.estimated_duration_mins}m
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-border/40 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {place.opening_hours.split('(')[0]}
                      </span>

                      <button
                        onClick={() => handleToggleCustomPlace(place)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {isSelected ? 'Remove -' : '+ Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* MODE 2: Curated Multi-Day Plans */}
      {plannerMode === 'curated' && (
        <section className="space-y-6 no-print">
          <div className="p-6 rounded-3xl bg-card border border-border/80 space-y-4">
            <h3 className="font-serif font-bold text-base text-foreground">
              Select Trip Length
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((d) => (
                <button
                  key={d}
                  onClick={() => handleGenerateCurated(d as 1 | 2 | 3)}
                  className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold border transition-all ${
                    daysCount === d
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-bold'
                      : 'bg-background text-muted-foreground border-border/60 hover:text-foreground'
                  }`}
                >
                  {d} {d === 1 ? 'Day (Express Highlights)' : 'Days (Comprehensive Tour)'}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* VISITING TIMELINE & PDF PRINTABLE AREA */}
      <section className="print-area space-y-6 p-6 sm:p-8 rounded-3xl bg-card border border-border/70 shadow-lg">
        
        {/* Printable Official Header */}
        <div className="border-b border-border/40 pb-5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-serif font-black text-xl shadow-sm">
                H
              </div>
              <div>
                <h2 className="font-serif font-extrabold text-xl sm:text-2xl text-foreground">
                  Hyderabad Official Tourist Travel Plan
                </h2>
                <p className="text-xs text-muted-foreground">
                  City of Pearls • Telangana Tourism & HMRL Transit Guide
                </p>
              </div>
            </div>

            <div className="text-right text-xs font-mono text-muted-foreground">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div className="text-emerald-500 font-semibold font-sans">Verified Itinerary ✓</div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground pt-1 italic">
            "{currentItinerary.title} - {currentItinerary.description}"
          </p>
        </div>

        {/* Timetable Items Sequence */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-600 before:via-emerald-400 before:to-emerald-700">
          {currentItinerary.items.map((item, idx) => (
            <div key={item.id} className="relative space-y-1.5">
              
              {/* Chronological Pin Badge */}
              <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md">
                {idx + 1}
              </div>

              {/* Transit connector leg */}
              {item.travelTimeFromPrevMins && item.travelTimeFromPrevMins > 0 ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-mono">
                  <Navigation className="w-3 h-3" />
                  <span>~{item.travelTimeFromPrevMins} min travel from previous attraction</span>
                </div>
              ) : null}

              {/* Place Box */}
              <div className="p-4 rounded-2xl bg-background border border-border/60 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      Stop #{item.orderIndex} • Expected Arrival: {item.startTime}
                    </span>
                    <h3 className="font-serif font-bold text-base text-foreground">
                      {item.place.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-card border border-border">
                      ~{item.durationMins}m visit
                    </span>
                    <span className="px-2 py-0.5 rounded bg-card border border-border text-emerald-400 font-semibold">
                      {item.place.entry_fee_inr === 0 ? 'Free Entry' : `₹${item.place.entry_fee_inr} fee`}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{item.place.address}</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/30">
                  <span className="font-semibold text-foreground">Visitor Tip: </span>
                  {item.notes}
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* Cost Breakdown & Emergency Helpline Box for PDF */}
        <div className="pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-background border border-border/60 space-y-1.5">
            <div className="font-bold text-foreground uppercase tracking-wider text-[11px]">
              Estimated Tour Budget Summary
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Monuments Entry Fee:</span>
              <span className="font-mono font-semibold text-foreground">₹{totalFees}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Public Transit / Metro Allowance:</span>
              <span className="font-mono font-semibold text-foreground">~₹250</span>
            </div>
            <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-border/40">
              <span>Total Estimated Day Budget:</span>
              <span className="font-mono text-sm">₹{totalFees + 250}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-border/60 space-y-1.5">
            <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Hyderabad Tourist Emergency Helplines</span>
            </div>
            <div className="text-[11px] text-muted-foreground space-y-1">
              <div>• Telangana Tourism Helpline: <strong className="text-foreground">1364</strong> / +91 40 2345 0165</div>
              <div>• HMRL Metro Operations: <strong className="text-foreground">040-2333 2555</strong></div>
              <div>• Police Emergency: <strong className="text-foreground">100 / 112</strong> • Women Safety: <strong className="text-foreground">1091</strong></div>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}
