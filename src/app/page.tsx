'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { CATEGORIES, TOURIST_PLACES, TRAVEL_ALERTS } from '@/lib/data/seedData';
import { calculateHaversineDistanceKm } from '@/lib/routing/dijkstra';
import {
  Search,
  MapPin,
  Clock,
  IndianRupee,
  Star,
  Navigation,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Accessibility,
  AlertCircle,
  ShieldCheck,
  Compass,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  const { t, userCoords, requestUserLocation, toggleSavePlace, isPlaceSaved, offlineLastUpdated, places } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterOpenNow, setFilterOpenNow] = useState<boolean>(false);
  const [filterFreeOnly, setFilterFreeOnly] = useState<boolean>(false);
  const [filterAccessibleOnly, setFilterAccessibleOnly] = useState<boolean>(false);

  // Current time in minutes from midnight (for Open Now check)
  const currentMinutesFromMidnight = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    return (places || TOURIST_PLACES).filter((place) => {
      // Category filter
      if (selectedCategory !== 'all' && place.category_id !== selectedCategory) {
        return false;
      }

      // Free filter
      if (filterFreeOnly && place.entry_fee_inr > 0) {
        return false;
      }

      // Accessibility filter
      if (filterAccessibleOnly && !place.wheelchair_accessible) {
        return false;
      }

      // Open now filter
      if (filterOpenNow) {
        const isOpen =
          currentMinutesFromMidnight >= place.opening_time_mins &&
          currentMinutesFromMidnight <= place.closing_time_mins;
        if (!isOpen) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = place.name.toLowerCase().includes(q);
        const matchesNeighbourhood = place.neighbourhood.toLowerCase().includes(q);
        const matchesMetro = place.nearest_metro_station?.toLowerCase().includes(q);
        const matchesDesc = place.description.toLowerCase().includes(q);
        return matchesName || matchesNeighbourhood || matchesMetro || matchesDesc;
      }

      return true;
    }).map((place) => {
      // Calculate distance if GPS available
      const distanceKm = userCoords
        ? calculateHaversineDistanceKm(
            userCoords.lat,
            userCoords.lng,
            place.latitude,
            place.longitude
          )
        : null;
      return { ...place, distanceKm };
    }).sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return b.rating - a.rating;
    });
  }, [
    places,
    selectedCategory,
    filterFreeOnly,
    filterAccessibleOnly,
    filterOpenNow,
    searchQuery,
    currentMinutesFromMidnight,
    userCoords,
  ]);

  const activeAlert = TRAVEL_ALERTS.find((a) => a.is_active);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      
      {/* Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden nizami-gradient border border-nizami/25 p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nizami/20 border border-nizami/40 text-nizami-gold text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nizam Heritage & Smart Multi-Modal Transit</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Discover the Timeless Splendour of{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-nizami-gold to-amber-200 bg-clip-text text-transparent">
              Hyderabad
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 max-w-xl font-normal leading-relaxed">
            {t.appSubtitle}. Plan seamless journeys across HMRL Metro, MMTS trains, TGSRTC city buses, and heritage walking trails.
          </p>

          {/* Quick CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/routes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-green-glow hover:scale-105"
            >
              <Navigation className="w-4 h-4" />
              <span>{t.navRoutes}</span>
            </Link>

            <Link
              href="/trip-planner"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all backdrop-blur-md"
            >
              <Compass className="w-4 h-4 text-nizami-gold" />
              <span>{t.planTour}</span>
            </Link>

            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-nizami-gold font-medium hover:underline ml-1"
            >
              <span>{t.navExplore}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Decorative Charminar Silhouette Graphic Badge */}
        <div className="hidden md:flex absolute right-8 bottom-6 flex-col items-end opacity-85 text-right">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
            City Coordinates
          </span>
          <span className="text-sm font-semibold font-mono text-nizami-gold">
            17.3850° N, 78.4867° E
          </span>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.verifiedData}</span>
          </div>
        </div>
      </section>

      {/* Travel Alert Notice */}
      {activeAlert && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <div className="font-semibold text-amber-300 flex items-center gap-2">
              <span>{activeAlert.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                {activeAlert.affected_transport_line}
              </span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-xs">
              {activeAlert.message}
            </p>
          </div>
          <span className="text-[10px] text-zinc-400 shrink-0 font-mono hidden sm:block">
            {t.lastUpdated}: {new Date(activeAlert.last_updated).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Search & Smart Filters Bar */}
      <section className="space-y-4">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-muted-foreground absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-card border border-border/70 rounded-2xl pl-12 pr-12 py-3.5 text-sm sm:text-base text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-nizami-gold/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Toggle Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setFilterOpenNow(!filterOpenNow)}
            className={`px-3 py-1.5 rounded-xl border font-medium transition-colors flex items-center gap-1.5 ${
              filterOpenNow
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-card/70 text-muted-foreground border-border/60 hover:text-foreground'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t.openNow}</span>
          </button>

          <button
            onClick={() => setFilterFreeOnly(!filterFreeOnly)}
            className={`px-3 py-1.5 rounded-xl border font-medium transition-colors flex items-center gap-1.5 ${
              filterFreeOnly
                ? 'bg-nizami/20 text-nizami-gold border-nizami/40'
                : 'bg-card/70 text-muted-foreground border-border/60 hover:text-foreground'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            <span>{t.freeEntry}</span>
          </button>

          <button
            onClick={() => setFilterAccessibleOnly(!filterAccessibleOnly)}
            className={`px-3 py-1.5 rounded-xl border font-medium transition-colors flex items-center gap-1.5 ${
              filterAccessibleOnly
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-card/70 text-muted-foreground border-border/60 hover:text-foreground'
            }`}
          >
            <Accessibility className="w-3.5 h-3.5" />
            <span>Wheelchair Friendly</span>
          </button>

          {!userCoords && (
            <button
              onClick={requestUserLocation}
              className="px-3 py-1.5 rounded-xl border border-dashed border-nizami/40 text-nizami-gold font-medium hover:bg-nizami/10 transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Enable GPS for Exact Distance</span>
            </button>
          )}
        </div>

        {/* Category Horizontal Scroll Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-green-glow'
                : 'bg-card/80 text-muted-foreground border border-border/60 hover:text-foreground'
            }`}
          >
            {t.allCategories} ({(places || TOURIST_PLACES).length})
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap border transition-all ${
                  isSelected
                    ? 'bg-nizami/20 text-nizami-gold border-nizami-gold/50 font-semibold shadow-sm'
                    : 'bg-card/80 text-muted-foreground border-border/60 hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Places Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {userCoords ? 'Attractions Nearest To You' : t.popularPlaces}
            </h2>
            <p className="text-xs text-muted-foreground">
              Showing {filteredPlaces.length} verified destinations with travel info
            </p>
          </div>

          <Link
            href="/explore"
            className="text-xs font-semibold text-nizami-gold hover:underline flex items-center gap-1"
          >
            <span>View All on Interactive Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {filteredPlaces.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/60 rounded-3xl p-8">
            <Compass className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60 animate-spin" />
            <h3 className="font-semibold text-base">No attractions match your active filters</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Try resetting the search keyword or clearing the "Open Now" and "Free Entry" toggles.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setFilterOpenNow(false);
                setFilterFreeOnly(false);
                setFilterAccessibleOnly(false);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold hover:bg-card/80"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPlaces.map((place) => {
              const saved = isPlaceSaved(place.id);
              return (
                <div
                  key={place.id}
                  className="group relative rounded-2xl overflow-hidden bg-card border border-border/60 hover:border-nizami/40 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col"
                >
                  {/* Photo Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-muted">
                    <img
                      key={`${place.id}-${place.cover_image}`}
                      src={place.cover_image}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Bookmark Save Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSavePlace(place.id);
                      }}
                      title={saved ? 'Remove from My Trip' : 'Save to My Trip'}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-colors z-10"
                    >
                      {saved ? (
                        <BookmarkCheck className="w-4 h-4 text-nizami-gold" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>

                    {/* Category & Rating Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white font-medium text-[10px] tracking-wide uppercase backdrop-blur-sm shadow-sm">
                        {place.neighbourhood.split('/')[0]}
                      </span>
                      {place.wheelchair_accessible && (
                        <span
                          title="Wheelchair Accessible"
                          className="p-1 rounded-md bg-black/60 text-emerald-400 text-[10px] backdrop-blur-sm"
                        >
                          <Accessibility className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Bottom Photo Overlay Info */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-1 text-amber-300 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{place.rating}</span>
                        <span className="text-[10px] text-zinc-300 opacity-80">
                          ({(place.review_count / 1000).toFixed(1)}k)
                        </span>
                      </div>

                      {place.distanceKm !== null && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-emerald-300 text-[11px] font-mono">
                          <MapPin className="w-3 h-3" />
                          <span>{place.distanceKm} km away</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="font-serif font-bold text-base sm:text-lg text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {place.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {place.description}
                      </p>
                    </div>

                    {/* Timing & Fee Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 text-nizami-gold shrink-0" />
                        <span className="truncate">{place.opening_hours.split('(')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>
                          {place.entry_fee_inr === 0 ? 'Free Entry' : `₹${place.entry_fee_inr} per person`}
                        </span>
                      </div>
                    </div>

                    {/* Transit Station Badge */}
                    {place.nearest_metro_station && (
                      <div className="text-[11px] px-2.5 py-1 rounded-lg bg-card/90 border border-border/60 text-muted-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-metro-blue shrink-0" />
                        <span className="truncate">{place.nearest_metro_station}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Link
                        href={`/place/${place.slug}`}
                        className="w-full text-center py-2 rounded-xl bg-card border border-border/80 hover:border-nizami/50 text-foreground text-xs font-semibold transition-colors"
                      >
                        {t.viewDetails}
                      </Link>

                      <Link
                        href={`/routes?dest=${place.id}`}
                        className="w-full text-center py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{t.getDirections}</span>
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Freshness Badge Footer */}
      <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>
            {t.verifiedData}: Telangana Tourism, HMRL Gazette & South Central Railway
          </span>
        </div>
        <div className="font-mono text-[11px]">
          {t.lastUpdated}: {new Date(offlineLastUpdated).toLocaleDateString()}
        </div>
      </div>

    </div>
  );
}
