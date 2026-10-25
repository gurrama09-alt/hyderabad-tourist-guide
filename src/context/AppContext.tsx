'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, TouristPlace } from '@/types';
import {
  getSavedPlaceIds,
  toggleSavedPlaceId,
  getOfflineLastUpdated,
  getCustomPlaces,
  saveCustomPlaces,
  updateCustomPlace,
} from '@/lib/offline/db';
import { TOURIST_PLACES } from '@/lib/data/seedData';
import { TRANSLATIONS } from '@/lib/i18n/translations';

interface AppContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: typeof TRANSLATIONS.en;
  userCoords: { lat: number; lng: number } | null;
  requestUserLocation: () => void;
  savedPlaceIds: string[];
  toggleSavePlace: (id: string) => void;
  isPlaceSaved: (id: string) => boolean;
  places: TouristPlace[];
  updatePlace: (updated: TouristPlace) => void;
  resetPlaces: () => void;
  isOnline: boolean;
  offlineLastUpdated: string;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [places, setPlaces] = useState<TouristPlace[]>(TOURIST_PLACES);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineLastUpdated, setOfflineLastUpdated] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Hydrate language
    const storedLang = localStorage.getItem('hyd_user_language') as SupportedLanguage;
    if (storedLang && ['en', 'te', 'hi'].includes(storedLang)) {
      setLanguageState(storedLang);
    }

    // Hydrate theme
    const storedTheme = localStorage.getItem('hyd_theme') as 'dark' | 'light';
    if (storedTheme) {
      setTheme(storedTheme);
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.add('dark');
    }

    // Hydrate saved places
    setSavedPlaceIds(getSavedPlaceIds());
    setOfflineLastUpdated(getOfflineLastUpdated());

    // Hydrate customized places from localStorage
    setPlaces(getCustomPlaces());

    // Fetch latest shared places from server / Supabase so viewers see updates
    fetch('/api/places')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.places) && data.places.length > 0) {
          setPlaces(data.places);
          saveCustomPlaces(data.places);
        }
      })
      .catch((err) => console.warn('Could not sync shared places:', err));

    // Listen to custom updates and storage changes
    const handlePlacesChange = () => {
      setPlaces(getCustomPlaces());
    };
    window.addEventListener('hyd_places_updated', handlePlacesChange);
    window.addEventListener('storage', handlePlacesChange);

    // Online/Offline listener
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker if available
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('SW registration error:', err);
      });
    }

    return () => {
      window.removeEventListener('hyd_places_updated', handlePlacesChange);
      window.removeEventListener('storage', handlePlacesChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('hyd_user_language', lang);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('hyd_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const requestUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        err => {
          console.warn('Geolocation denied, default to Charminar GPS:', err);
          setUserCoords({ lat: 17.361564, lng: 78.474665 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const toggleSavePlace = (id: string) => {
    const updated = toggleSavedPlaceId(id);
    setSavedPlaceIds(updated);
  };

  const isPlaceSaved = (id: string) => savedPlaceIds.includes(id);

  const updatePlace = async (updated: TouristPlace) => {
    const list = updateCustomPlace(updated);
    setPlaces(list);

    // Sync to server / database so all viewers across other devices see the update
    try {
      await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places: list }),
      });
    } catch (err) {
      console.warn('Failed to sync place update to server:', err);
    }
  };

  const resetPlaces = async () => {
    saveCustomPlaces(TOURIST_PLACES);
    setPlaces(TOURIST_PLACES);
    try {
      await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places: TOURIST_PLACES }),
      });
    } catch (err) {
      console.warn('Failed to reset places on server:', err);
    }
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        userCoords,
        requestUserLocation,
        savedPlaceIds,
        toggleSavePlace,
        isPlaceSaved,
        places,
        updatePlace,
        resetPlaces,
        isOnline,
        offlineLastUpdated,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
