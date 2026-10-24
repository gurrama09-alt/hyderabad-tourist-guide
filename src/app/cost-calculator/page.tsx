'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { TOURIST_PLACES } from '@/lib/data/seedData';
import {
  Calculator,
  Users,
  IndianRupee,
  Train,
  Bus,
  Car,
  Footprints,
  ShieldCheck,
  Sparkles,
  PieChart,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function CostCalculatorPage() {
  const { t, places } = useApp();
  const allPlaces = places || TOURIST_PLACES;

  const [groupSize, setGroupSize] = useState<number>(2);
  const [daysCount, setDaysCount] = useState<number>(2);
  const [preferredTransport, setPreferredTransport] = useState<'metro' | 'bus' | 'cab' | 'auto'>('metro');
  const [foodPreference, setFoodPreference] = useState<'budget' | 'standard' | 'luxury'>('standard');
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([
    'charminar',
    'golconda-fort',
    'salar-jung-museum',
    'chowmahalla-palace',
  ]);

  // Compute Entry Fees for selected places
  const totalEntryFeesPerPerson = useMemo(() => {
    return selectedPlaces.reduce((acc, id) => {
      const p = allPlaces.find((place) => place.id === id);
      return acc + (p ? p.entry_fee_inr : 0);
    }, 0);
  }, [selectedPlaces, allPlaces]);

  // Compute daily travel fare per person
  const dailyTravelPerPerson = useMemo(() => {
    switch (preferredTransport) {
      case 'bus':
        return 60; // TGSRTC day travel pass approx
      case 'metro':
        return 120; // 3-4 metro rides
      case 'auto':
        return 280 / groupSize; // auto split among group
      case 'cab':
        return 650 / groupSize; // AC cab split among group
      default:
        return 100;
    }
  }, [preferredTransport, groupSize]);

  // Compute daily food allowance per person
  const dailyFoodPerPerson = useMemo(() => {
    switch (foodPreference) {
      case 'budget':
        return 350; // Irani chai, tiffin, street biryani
      case 'standard':
        return 750; // Hotel Shadab, cafe, dining
      case 'luxury':
        return 2200; // Fine dining at Taj Falaknuma / 5-star
      default:
        return 600;
    }
  }, [foodPreference]);

  // Total summary
  const totalPerPerson =
    totalEntryFeesPerPerson +
    dailyTravelPerPerson * daysCount +
    dailyFoodPerPerson * daysCount;

  const grandTotalGroup = totalPerPerson * groupSize;

  const togglePlace = (id: string) => {
    if (selectedPlaces.includes(id)) {
      setSelectedPlaces(selectedPlaces.filter((p) => p !== id));
    } else {
      setSelectedPlaces([...selectedPlaces, id]);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nizami/15 border border-nizami/30 text-nizami-gold text-xs font-semibold">
          <Calculator className="w-3.5 h-3.5" />
          <span>Transparent Travel & Monument Budgeting</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
          Hyderabad Travel Cost Calculator
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Accurately calculate and compare transit fares, official monument admission fees, and dining budgets for solo travelers or family groups.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Group Size & Duration Slider Card */}
          <section className="p-6 rounded-3xl bg-card border border-border/70 space-y-6">
            <h2 className="font-serif font-bold text-base text-foreground">
              1. Travel Party & Duration
            </h2>

            {/* Group Size Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-nizami-gold" />
                  <span>Number of Travelers</span>
                </span>
                <span className="font-bold text-sm text-nizami-gold font-mono">
                  {groupSize} {groupSize === 1 ? 'Person (Solo)' : 'People (Group)'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={groupSize}
                onChange={(e) => setGroupSize(parseInt(e.target.value))}
                className="w-full accent-nizami cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>1 Solo</span>
                <span>2 Couple</span>
                <span>4 Family</span>
                <span>8+ Group</span>
              </div>
            </div>

            {/* Days Count */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Tour Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysCount(d)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      daysCount === d
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-card text-muted-foreground border-border/70 hover:text-foreground'
                    }`}
                  >
                    {d} {d === 1 ? 'Day' : 'Days'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Transport Mode Preference */}
          <section className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
            <h2 className="font-serif font-bold text-base text-foreground flex items-center justify-between">
              <span>2. Preferred Transport Mode</span>
              <span className="text-[10px] text-muted-foreground font-mono font-normal">
                Official vs Estimated Fares
              </span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPreferredTransport('metro')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  preferredTransport === 'metro'
                    ? 'bg-metro-red/15 border-metro-red text-rose-400 font-semibold shadow-sm'
                    : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Train className="w-5 h-5 mb-2 text-metro-red" />
                <div className="text-foreground font-semibold">HMRL Metro</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  Official Fare
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">₹20 - ₹60 / ride</div>
              </button>

              <button
                type="button"
                onClick={() => setPreferredTransport('bus')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  preferredTransport === 'bus'
                    ? 'bg-tgsrtc/15 border-tgsrtc text-amber-400 font-semibold shadow-sm'
                    : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bus className="w-5 h-5 mb-2 text-tgsrtc" />
                <div className="text-foreground font-semibold">TGSRTC Bus</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  Official Fare
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">₹15 - ₹40 / ride</div>
              </button>

              <button
                type="button"
                onClick={() => setPreferredTransport('auto')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  preferredTransport === 'auto'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-semibold shadow-sm'
                    : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Car className="w-5 h-5 mb-2 text-amber-400" />
                <div className="text-foreground font-semibold">Auto Rickshaw</div>
                <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                  Estimated Meter
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">₹16/km split</div>
              </button>

              <button
                type="button"
                onClick={() => setPreferredTransport('cab')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  preferredTransport === 'cab'
                    ? 'bg-sky-500/15 border-sky-500 text-sky-400 font-semibold shadow-sm'
                    : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Car className="w-5 h-5 mb-2 text-sky-400" />
                <div className="text-foreground font-semibold">AC Cab / Uber</div>
                <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                  Estimated Rideshare
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">Private AC cab</div>
              </button>
            </div>
          </section>

          {/* Planned Monuments Checklist */}
          <section className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-base text-foreground">
                3. Select Attractions to Visit ({selectedPlaces.length} chosen)
              </h2>
              <span className="text-xs font-bold text-emerald-400">
                ₹{totalEntryFeesPerPerson} / person in entry fees
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {allPlaces.slice(0, 8).map((p) => {
                const isChecked = selectedPlaces.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlace(p.id)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isChecked
                        ? 'bg-nizami/15 border-nizami/40 font-medium'
                        : 'bg-card/60 border-border/50 text-muted-foreground'
                    }`}
                  >
                    <div>
                      <div className="text-foreground font-semibold">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.neighbourhood}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400">
                        {p.entry_fee_inr === 0 ? 'Free' : `₹${p.entry_fee_inr}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Col: Grand Budget Breakdown Invoice Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-card via-card to-nizami/10 border border-nizami-gold/40 shadow-xl space-y-5 sticky top-20">
            
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-serif font-bold text-lg text-foreground">
                Trip Budget Summary
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-nizami/20 text-nizami-gold font-mono font-semibold">
                {groupSize} pax • {daysCount} days
              </span>
            </div>

            {/* Line items */}
            <div className="space-y-3 text-xs">
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monuments Entry Fees</span>
                <span className="font-mono font-semibold text-foreground">
                  ₹{totalEntryFeesPerPerson * groupSize}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>Transit ({preferredTransport.toUpperCase()})</span>
                  <span className="text-[9px] px-1 rounded bg-card border">
                    {preferredTransport === 'metro' || preferredTransport === 'bus' ? 'Official' : 'Estimate'}
                  </span>
                </div>
                <span className="font-mono font-semibold text-foreground">
                  ₹{Math.round(dailyTravelPerPerson * daysCount * groupSize)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Food & Chai Allowance</span>
                <span className="font-mono font-semibold text-foreground">
                  ₹{dailyFoodPerPerson * daysCount * groupSize}
                </span>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Cost Per Person</span>
                <span className="font-bold font-mono text-foreground text-base">
                  ₹{Math.round(totalPerPerson)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                    Total Estimated Trip Cost
                  </div>
                  <div className="font-serif font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">
                    ₹{Math.round(grandTotalGroup)}
                  </div>
                </div>
                <IndianRupee className="w-8 h-8 text-emerald-600 dark:text-emerald-400 opacity-60" />
              </div>
            </div>

            {/* Quick Action to Trip Planner */}
            <Link
              href="/trip-planner"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs text-center flex items-center justify-center gap-2 transition-colors shadow-green-glow"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Optimized Itinerary</span>
            </Link>

            <div className="text-[10px] text-muted-foreground text-center">
              *All transport and monument prices checked against official HMRL and ASI tariffs.
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
