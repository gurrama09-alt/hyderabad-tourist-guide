import { TouristPlace, Itinerary, ItineraryItem } from '@/types';
import { calculateHaversineDistanceKm } from '@/lib/routing/dijkstra';
import { TOURIST_PLACES } from '@/lib/data/seedData';

// Helper to convert minutes from midnight (e.g. 570) to readable AM/PM string (09:30 AM)
export function formatMinutesToTime(totalMins: number): string {
  const hours = Math.floor(totalMins / 60) % 24;
  const mins = totalMins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = mins < 10 ? `0${mins}` : mins;
  return `${displayHours}:${displayMins} ${period}`;
}

// Order a group of places using a greedy Nearest-Neighbor TSP heuristic
export function optimizePlacesSequence(places: TouristPlace[]): TouristPlace[] {
  if (places.length <= 1) return [...places];

  const unvisited = [...places];
  const ordered: TouristPlace[] = [];

  // Start with the earliest opening or first place
  unvisited.sort((a, b) => a.opening_time_mins - b.opening_time_mins);
  let current = unvisited.shift()!;
  ordered.push(current);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = calculateHaversineDistanceKm(
      current.latitude,
      current.longitude,
      unvisited[0].latitude,
      unvisited[0].longitude
    );

    for (let i = 1; i < unvisited.length; i++) {
      const dist = calculateHaversineDistanceKm(
        current.latitude,
        current.longitude,
        unvisited[i].latitude,
        unvisited[i].longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    current = unvisited.splice(nearestIndex, 1)[0];
    ordered.push(current);
  }

  return ordered;
}

// Generate an optimized 1, 2, or 3 day itinerary
export function generateCuratedItinerary(
  daysCount: 1 | 2 | 3,
  interests: string[] = ['all']
): Itinerary {
  let filteredPlaces = [...TOURIST_PLACES];

  if (!interests.includes('all') && interests.length > 0) {
    filteredPlaces = TOURIST_PLACES.filter(p => interests.includes(p.category_id));
  }

  // Pre-configured sensible groupings by geographical clusters in Hyderabad
  // Day 1: Old City Heritage (Charminar, Chowmahalla, Mecca Masjid, Salar Jung)
  // Day 2: Forts, Tombs & Hills (Golconda Fort, Qutb Shahi Tombs, Birla Mandir, Hussain Sagar)
  // Day 3: Cyberabad & Leisure (Shilparamam, Durgam Cheruvu, Ramoji Film City or Zoo)
  
  const day1Ids = ['charminar', 'mecca-masjid', 'chowmahalla-palace', 'salar-jung-museum'];
  const day2Ids = ['golconda-fort', 'qutb-shahi-tombs', 'birla-mandir', 'hussain-sagar'];
  const day3Ids = ['shilparamam', 'durgam-cheruvu', 'nehru-zoo', 'ramoji-film-city'];

  const itineraryItems: ItineraryItem[] = [];

  for (let day = 1; day <= daysCount; day++) {
    let dayPlaces: TouristPlace[] = [];
    const targetIds = day === 1 ? day1Ids : day === 2 ? day2Ids : day3Ids;

    targetIds.forEach(id => {
      const p = filteredPlaces.find(place => place.id === id);
      if (p) dayPlaces.push(p);
    });

    if (dayPlaces.length === 0) {
      dayPlaces = filteredPlaces.slice((day - 1) * 3, day * 3);
    }

    const orderedDayPlaces = optimizePlacesSequence(dayPlaces);

    // Schedule timeline starting at 09:30 AM (570 mins)
    let currentMins = 570;
    orderedDayPlaces.forEach((place, idx) => {
      // If current time is earlier than opening time, wait till open
      if (currentMins < place.opening_time_mins) {
        currentMins = place.opening_time_mins;
      }

      // Add lunch break around 1:00 PM (780 mins)
      if (currentMins >= 780 && currentMins < 840 && idx > 0) {
        currentMins += 45; // 45 min biryani break
      }

      const travelTime = idx === 0 ? 0 : Math.round(
        calculateHaversineDistanceKm(
          orderedDayPlaces[idx - 1].latitude,
          orderedDayPlaces[idx - 1].longitude,
          place.latitude,
          place.longitude
        ) * 4 + 10
      );

      currentMins += travelTime;

      itineraryItems.push({
        id: `item_${day}_${place.id}`,
        placeId: place.id,
        place,
        dayNumber: day,
        orderIndex: idx + 1,
        startTime: formatMinutesToTime(currentMins),
        durationMins: place.estimated_duration_mins,
        travelTimeFromPrevMins: travelTime,
        notes: place.visitor_tips[0] || 'Explore and enjoy the heritage!',
      });

      currentMins += place.estimated_duration_mins;
    });
  }

  const titles: Record<number, string> = {
    1: 'The Nizam Royal Highlights (1-Day Tour)',
    2: 'Heritage, Forts & Lakes of Hyderabad (2-Day Tour)',
    3: 'Ultimate Hyderabad: Jewels, Palaces & Cyberabad (3-Day Tour)',
  };

  const descriptions: Record<number, string> = {
    1: 'Experience the absolute best of Old City Hyderabad in 24 hours: Charminar, Mecca Masjid, Chowmahalla Palace, and the treasures of Salar Jung Museum.',
    2: 'A balanced two-day exploration covering Old City royalty on Day 1, followed by the acoustic marvel of Golconda Fort, Qutb Shahi Tombs, and sunset over Hussain Sagar on Day 2.',
    3: 'Comprehensive three-day deep dive spanning centuries of Nizam history, medieval diamond forts, high-tech crafts at Shilparamam, and iconic lakeside views.',
  };

  const budgetMultiplier = daysCount === 1 ? 1200 : daysCount === 2 ? 2600 : 4200;

  return {
    id: `itin_${daysCount}_days_${Date.now()}`,
    title: titles[daysCount],
    description: descriptions[daysCount],
    daysCount,
    budgetInr: budgetMultiplier,
    items: itineraryItems,
    isPublic: true,
    shareToken: `hyd-${daysCount}d-${Math.random().toString(36).substring(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
}
