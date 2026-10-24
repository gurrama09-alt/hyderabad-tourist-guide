import { TouristPlace, TransportLine, Itinerary, Review, UserReport } from '@/types';
import { TOURIST_PLACES, TRANSPORT_LINES } from '@/lib/data/seedData';

const DB_NAME = 'hyd_tourist_offline_db';
const DB_VERSION = 1;

interface OfflineDataSchema {
  places: TouristPlace[];
  transportLines: TransportLine[];
  savedPlaceIds: string[];
  savedItineraries: Itinerary[];
  pendingReports: UserReport[];
  pendingReviews: Review[];
  lastCachedTimestamp: string;
}

const STORAGE_KEYS = {
  SAVED_PLACES: 'hyd_saved_place_ids',
  SAVED_ITINERARIES: 'hyd_saved_itineraries',
  OFFLINE_CACHE: 'hyd_offline_cached_data',
  CUSTOM_PLACES: 'hyd_custom_places',
  LAST_UPDATED: 'hyd_offline_last_updated',
  LANGUAGE: 'hyd_user_language',
};

// Safe localStorage access with SSR check
export function getCustomPlaces(): TouristPlace[] {
  if (typeof window === 'undefined') return TOURIST_PLACES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PLACES);
    if (!raw) return TOURIST_PLACES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return TOURIST_PLACES;
  } catch {
    return TOURIST_PLACES;
  }
}

export function saveCustomPlaces(places: TouristPlace[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PLACES, JSON.stringify(places));
    // Trigger custom event so all open views / components update immediately
    window.dispatchEvent(new CustomEvent('hyd_places_updated', { detail: places }));
  } catch (err) {
    console.error('Failed to save custom places to localStorage', err);
  }
}

export function updateCustomPlace(updatedPlace: TouristPlace): TouristPlace[] {
  const current = getCustomPlaces();
  const index = current.findIndex((p) => p.id === updatedPlace.id);
  let updatedList: TouristPlace[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = {
      ...updatedPlace,
      verified: true,
      last_updated: new Date().toISOString(),
    };
  } else {
    updatedList = [
      ...current,
      {
        ...updatedPlace,
        verified: true,
        last_updated: new Date().toISOString(),
      },
    ];
  }
  saveCustomPlaces(updatedList);
  return updatedList;
}

// Safe localStorage access with SSR check
export function getSavedPlaceIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_PLACES);
    return raw ? JSON.parse(raw) : ['charminar', 'golconda-fort'];
  } catch {
    return ['charminar', 'golconda-fort'];
  }
}

export function toggleSavedPlaceId(id: string): string[] {
  if (typeof window === 'undefined') return [];
  const current = getSavedPlaceIds();
  const exists = current.includes(id);
  const updated = exists ? current.filter(x => x !== id) : [...current, id];
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_PLACES, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
  return updated;
}

export function isPlaceSaved(id: string): boolean {
  return getSavedPlaceIds().includes(id);
}

export function getSavedItineraries(): Itinerary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_ITINERARIES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveItineraryLocally(itinerary: Itinerary): void {
  if (typeof window === 'undefined') return;
  const current = getSavedItineraries();
  const existingIdx = current.findIndex(it => it.id === itinerary.id);
  let updated: Itinerary[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = itinerary;
  } else {
    updated = [itinerary, ...current];
  }
  localStorage.setItem(STORAGE_KEYS.SAVED_ITINERARIES, JSON.stringify(updated));
}

export function removeItineraryLocally(id: string): void {
  if (typeof window === 'undefined') return;
  const current = getSavedItineraries();
  const updated = current.filter(it => it.id !== id);
  localStorage.setItem(STORAGE_KEYS.SAVED_ITINERARIES, JSON.stringify(updated));
}

// Download & cache all guide data for 100% offline usage
export async function downloadAllForOffline(): Promise<{ success: boolean; timestamp: string }> {
  const timestamp = new Date().toISOString();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, timestamp);
      localStorage.setItem(STORAGE_KEYS.OFFLINE_CACHE, JSON.stringify({
        places: TOURIST_PLACES,
        transportLines: TRANSPORT_LINES,
      }));
      return { success: true, timestamp };
    } catch {
      return { success: false, timestamp };
    }
  }
  return { success: true, timestamp };
}

export function getOfflineLastUpdated(): string {
  if (typeof window === 'undefined') return new Date().toISOString();
  return localStorage.getItem(STORAGE_KEYS.LAST_UPDATED) || '2026-10-24T18:00:00Z';
}
