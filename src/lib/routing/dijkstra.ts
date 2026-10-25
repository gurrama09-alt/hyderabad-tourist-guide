import {
  JourneyOption,
  RouteLeg,
  TransportStation,
  TouristPlace,
  TransportType
} from '@/types';
import {
  METRO_RED_STATIONS,
  METRO_BLUE_STATIONS,
  METRO_GREEN_STATIONS,
  BUS_ROUTES,
  TOURIST_PLACES
} from '@/lib/data/seedData';

// Haversine formula for distance between two lat/lng coordinates in km
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// Calculate official Metro fare based on HMRL distance slab
export function getMetroFare(distanceKm: number): number {
  if (distanceKm <= 2) return 20;
  if (distanceKm <= 4) return 30;
  if (distanceKm <= 6) return 35;
  if (distanceKm <= 9) return 40;
  if (distanceKm <= 12) return 45;
  if (distanceKm <= 15) return 50;
  if (distanceKm <= 18) return 55;
  return 60;
}

// Find nearest station to given coordinates
export function findNearestStation(
  lat: number,
  lng: number,
  stations: TransportStation[]
): { station: TransportStation; distanceKm: number } {
  let nearest = stations[0];
  let minDistance = calculateHaversineDistanceKm(lat, lng, nearest.latitude, nearest.longitude);

  for (let i = 1; i < stations.length; i++) {
    const dist = calculateHaversineDistanceKm(lat, lng, stations[i].latitude, stations[i].longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = stations[i];
    }
  }

  return { station: nearest, distanceKm: minDistance };
}

// All combined metro stations without duplicate IDs
const ALL_METRO_STATIONS: TransportStation[] = (() => {
  const map = new Map<string, TransportStation>();
  [...METRO_RED_STATIONS, ...METRO_BLUE_STATIONS, ...METRO_GREEN_STATIONS].forEach(st => {
    if (!map.has(st.id)) map.set(st.id, st);
  });
  return Array.from(map.values());
})();

interface MetroRouteResult {
  fromStation: TransportStation;
  toStation: TransportStation;
  totalDistanceKm: number;
  totalDurationMins: number;
  legs: {
    lineName: string;
    lineColor: string;
    from: TransportStation;
    to: TransportStation;
    stationNames: string[];
    distanceKm: number;
    durationMins: number;
  }[];
  transfers: number;
}

// Check which line contains a station
function getLineOfStation(stationId: string): string[] {
  const lines: string[] = [];
  if (METRO_RED_STATIONS.some(s => s.id === stationId)) lines.push('Red');
  if (METRO_BLUE_STATIONS.some(s => s.id === stationId)) lines.push('Blue');
  if (METRO_GREEN_STATIONS.some(s => s.id === stationId)) lines.push('Green');
  return lines;
}

function getStationsForLine(line: string): TransportStation[] {
  if (line === 'Red') return METRO_RED_STATIONS;
  if (line === 'Blue') return METRO_BLUE_STATIONS;
  return METRO_GREEN_STATIONS;
}

function getLineColor(line: string): string {
  if (line === 'Red') return '#EF4444';
  if (line === 'Blue') return '#3B82F6';
  return '#10B981';
}

// Build Metro path between two metro stations
export function solveMetroRoute(startStation: TransportStation, endStation: TransportStation): MetroRouteResult {
  const startLines = getLineOfStation(startStation.id);
  const endLines = getLineOfStation(endStation.id);

  // Check if directly on same line
  const commonLine = startLines.find(l => endLines.includes(l));

  if (commonLine) {
    const lineStations = getStationsForLine(commonLine);
    const startIndex = lineStations.findIndex(s => s.id === startStation.id);
    const endIndex = lineStations.findIndex(s => s.id === endStation.id);

    const step = startIndex <= endIndex ? 1 : -1;
    const passedStations: TransportStation[] = [];
    for (let i = startIndex; i !== endIndex + step; i += step) {
      passedStations.push(lineStations[i]);
    }

    const stopsCount = Math.abs(endIndex - startIndex);
    const distanceKm = parseFloat((stopsCount * 1.15).toFixed(1));
    const durationMins = Math.max(2, stopsCount * 2);

    return {
      fromStation: startStation,
      toStation: endStation,
      totalDistanceKm: distanceKm,
      totalDurationMins: durationMins,
      transfers: 0,
      legs: [
        {
          lineName: `HMRL ${commonLine} Line`,
          lineColor: getLineColor(commonLine),
          from: startStation,
          to: endStation,
          stationNames: passedStations.map(s => s.name),
          distanceKm,
          durationMins,
        },
      ],
    };
  }

  // Needs interchange
  // Ameerpet connects Red & Blue
  // Parade Grounds connects Blue & Green
  // MGBS connects Red & Green
  let interchangeStationId = 'st_ameerpet';

  if ((startLines.includes('Red') && endLines.includes('Green')) || (startLines.includes('Green') && endLines.includes('Red'))) {
    interchangeStationId = 'st_mgbs';
  } else if ((startLines.includes('Blue') && endLines.includes('Green')) || (startLines.includes('Green') && endLines.includes('Blue'))) {
    interchangeStationId = 'st_parade_grounds';
  }

  const interchange = ALL_METRO_STATIONS.find(s => s.id === interchangeStationId) || ALL_METRO_STATIONS[10];

  const leg1 = solveMetroRoute(startStation, interchange);
  const leg2 = solveMetroRoute(interchange, endStation);

  // 5 minute transfer penalty for interchange
  const totalDuration = leg1.totalDurationMins + leg2.totalDurationMins + 5;
  const totalDist = parseFloat((leg1.totalDistanceKm + leg2.totalDistanceKm).toFixed(1));

  return {
    fromStation: startStation,
    toStation: endStation,
    totalDistanceKm: totalDist,
    totalDurationMins: totalDuration,
    transfers: 1,
    legs: [...leg1.legs, ...leg2.legs],
  };
}

// Generate 4 multi-modal journey options comparing Fastest, Cheapest, Fewest Transfers, and Direct Road
export function planJourney(
  origin: { name: string; lat: number; lng: number },
  destination: { name: string; lat: number; lng: number }
): JourneyOption[] {
  const straightLineDist = calculateHaversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const roadDist = parseFloat((straightLineDist * 1.35).toFixed(1));
  const roadDurationMins = Math.round(roadDist * 3.2 + 8); // realistic Hyderabad road traffic ETA
  const nowISO = new Date().toISOString();

  // Find nearest metro stations to origin and destination
  const nearestToOrigin = findNearestStation(origin.lat, origin.lng, ALL_METRO_STATIONS);
  const nearestToDest = findNearestStation(destination.lat, destination.lng, ALL_METRO_STATIONS);

  // Metro Route Option (Fastest / Recommended)
  const metroSol = solveMetroRoute(nearestToOrigin.station, nearestToDest.station);
  const walkOriginKm = parseFloat((nearestToOrigin.distanceKm * 1.25).toFixed(1));
  const walkOriginMins = Math.round(walkOriginKm * 13);
  const walkDestKm = parseFloat((nearestToDest.distanceKm * 1.25).toFixed(1));
  const walkDestMins = Math.round(walkDestKm * 13);

  const metroFare = getMetroFare(metroSol.totalDistanceKm);
  const totalMetroDist = parseFloat((walkOriginKm + metroSol.totalDistanceKm + walkDestKm).toFixed(1));
  const totalMetroDuration = walkOriginMins + metroSol.totalDurationMins + walkDestMins;

  const metroLegs: RouteLeg[] = [];

  // Walking to station
  if (walkOriginKm > 0.1) {
    metroLegs.push({
      id: 'leg_walk_1',
      mode: 'walking',
      fromName: origin.name,
      toName: nearestToOrigin.station.name,
      fromCoords: [origin.lat, origin.lng],
      toCoords: [nearestToOrigin.station.latitude, nearestToOrigin.station.longitude],
      distanceKm: walkOriginKm,
      distanceType: 'walking',
      durationMins: walkOriginMins,
      fareInr: 0,
      fareType: 'official',
      instructions: [
        `Walk ${walkOriginKm} km (${walkOriginMins} min) from ${origin.name} to ${nearestToOrigin.station.name} Metro Station.`,
        'Follow designated pedestrian walkways and footbridges.',
      ],
    });
  }

  // Metro train legs
  metroSol.legs.forEach((mLeg, idx) => {
    metroLegs.push({
      id: `leg_metro_${idx}`,
      mode: 'metro',
      lineName: mLeg.lineName,
      lineColor: mLeg.lineColor,
      fromName: mLeg.from.name,
      toName: mLeg.to.name,
      fromCoords: [mLeg.from.latitude, mLeg.from.longitude],
      toCoords: [mLeg.to.latitude, mLeg.to.longitude],
      distanceKm: mLeg.distanceKm,
      distanceType: 'metro',
      durationMins: mLeg.durationMins,
      fareInr: idx === 0 ? metroFare : 0, // charged once via smartcard/token
      fareType: 'official',
      stopsPassed: mLeg.stationNames.length - 1,
      intermediateStops: mLeg.stationNames,
      instructions: [
        `Board ${mLeg.lineName} at ${mLeg.from.name}.`,
        `Ride for ${mLeg.stationNames.length - 1} stops via ${mLeg.stationNames.slice(1, -1).slice(0, 3).join(', ')}${mLeg.stationNames.length > 5 ? '...' : ''}.`,
        `Alight at ${mLeg.to.name}${idx < metroSol.legs.length - 1 ? ' and interchange to your connecting line at concourse level' : ''}.`,
      ],
    });
  });

  // Walking from station to destination
  if (walkDestKm > 0.1) {
    metroLegs.push({
      id: 'leg_walk_2',
      mode: 'walking',
      fromName: nearestToDest.station.name,
      toName: destination.name,
      fromCoords: [nearestToDest.station.latitude, nearestToDest.station.longitude],
      toCoords: [destination.lat, destination.lng],
      distanceKm: walkDestKm,
      distanceType: 'walking',
      durationMins: walkDestMins,
      fareInr: 0,
      fareType: 'official',
      instructions: [
        `Exit ${nearestToDest.station.name} via Gate A/B.`,
        `Walk ${walkDestKm} km (${walkDestMins} min) towards ${destination.name}.`,
      ],
    });
  }

  const optionFastest: JourneyOption = {
    id: 'opt_metro_fastest',
    title: 'Hyderabad Metro Transit',
    tag: 'fastest',
    tagLabel: 'Fastest & Reliable',
    totalDurationMins: totalMetroDuration,
    totalDistanceKm: totalMetroDist,
    totalCostInr: metroFare,
    transferCount: metroSol.transfers,
    legs: metroLegs,
    summary: `Fastest air-conditioned route avoiding traffic. Takes ${totalMetroDuration} mins with ${metroSol.transfers} metro interchange(s).`,
    lastUpdated: nowISO,
  };

  // Option 2: TGSRTC City Bus (Cheapest)
  const busRoute = BUS_ROUTES[0]; // sample Route 65 / city bus
  const busFare = 25; // standard TGSRTC bus fare
  const busDurationMins = Math.round(roadDist * 3.8 + 15); // includes stops and traffic

  const busLegs: RouteLeg[] = [
    {
      id: 'leg_bus_walk_1',
      mode: 'walking',
      fromName: origin.name,
      toName: `${origin.name} Bus Stand`,
      fromCoords: [origin.lat, origin.lng],
      toCoords: [origin.lat + 0.002, origin.lng + 0.002],
      distanceKm: 0.3,
      distanceType: 'walking',
      durationMins: 4,
      fareInr: 0,
      fareType: 'official',
      instructions: [`Walk 300m to the nearest TGSRTC bus stop.`],
    },
    {
      id: 'leg_bus_main',
      mode: 'bus',
      lineName: `TGSRTC Bus #${busRoute.route_number}`,
      lineColor: '#EA580C',
      fromName: `${origin.name} Bus Stand`,
      toName: `${destination.name} Stop`,
      fromCoords: [origin.lat + 0.002, origin.lng + 0.002],
      toCoords: [destination.lat - 0.002, destination.lng - 0.002],
      distanceKm: roadDist,
      distanceType: 'bus',
      durationMins: busDurationMins - 8,
      fareInr: busFare,
      fareType: 'official',
      stopsPassed: 6,
      instructions: [
        `Board TGSRTC Bus #${busRoute.route_number} towards ${destination.name}.`,
        'Purchase physical ticket or tap T-Tava travel card from the onboard bus conductor.',
        `Alight at ${destination.name} bus stop.`,
      ],
    },
    {
      id: 'leg_bus_walk_2',
      mode: 'walking',
      fromName: `${destination.name} Stop`,
      toName: destination.name,
      fromCoords: [destination.lat - 0.002, destination.lng - 0.002],
      toCoords: [destination.lat, destination.lng],
      distanceKm: 0.2,
      distanceType: 'walking',
      durationMins: 3,
      fareInr: 0,
      fareType: 'official',
      instructions: [`Walk 200m to the destination entrance.`],
    },
  ];

  const optionCheapest: JourneyOption = {
    id: 'opt_bus_cheapest',
    title: 'TGSRTC City Bus',
    tag: 'cheapest',
    tagLabel: 'Cheapest Option',
    totalDurationMins: busDurationMins,
    totalDistanceKm: parseFloat((roadDist + 0.5).toFixed(1)),
    totalCostInr: busFare,
    transferCount: 0,
    legs: busLegs,
    summary: `Budget-friendly non-stop public bus connecting direct heritage corridors. Total fare only ₹${busFare}.`,
    lastUpdated: nowISO,
  };

  // Option 3: Fewest Transfers (Direct Road / Auto Rickshaw)
  const autoFare = Math.round(30 + roadDist * 16);
  const optionAuto: JourneyOption = {
    id: 'opt_auto_direct',
    title: 'Auto Rickshaw (Direct)',
    tag: 'fewest_transfers',
    tagLabel: 'Direct & No Transfers',
    totalDurationMins: Math.round(roadDist * 3.3 + 5),
    totalDistanceKm: roadDist,
    totalCostInr: autoFare,
    transferCount: 0,
    legs: [
      {
        id: 'leg_auto_road',
        mode: 'road',
        fromName: origin.name,
        toName: destination.name,
        fromCoords: [origin.lat, origin.lng],
        toCoords: [destination.lat, destination.lng],
        distanceKm: roadDist,
        distanceType: 'road',
        durationMins: Math.round(roadDist * 3.3 + 5),
        fareInr: autoFare,
        fareType: 'estimated',
        instructions: [
          `Hail a local CNG Auto Rickshaw or book via Ola/Uber Auto.`,
          `Travel via city arterial roads directly to ${destination.name}.`,
          `Estimated meter fare ~₹${autoFare} (₹30 flag down + ₹16/km).`,
        ],
      },
    ],
    summary: `Door-to-door direct ride with zero transit interchanges. Great for families carrying luggage.`,
    lastUpdated: nowISO,
  };

  // Option 4: AC Cab / Taxi
  const cabFare = Math.round(70 + roadDist * 22);
  const optionCab: JourneyOption = {
    id: 'opt_cab_direct',
    title: 'AC Cab / Rideshare (Uber/Ola)',
    tag: 'direct_road',
    tagLabel: 'Comfortable & Private',
    totalDurationMins: roadDurationMins,
    totalDistanceKm: roadDist,
    totalCostInr: cabFare,
    transferCount: 0,
    legs: [
      {
        id: 'leg_cab_road',
        mode: 'road',
        fromName: origin.name,
        toName: destination.name,
        fromCoords: [origin.lat, origin.lng],
        toCoords: [destination.lat, destination.lng],
        distanceKm: roadDist,
        distanceType: 'road',
        durationMins: roadDurationMins,
        fareInr: cabFare,
        fareType: 'estimated',
        instructions: [
          `Book an AC Sedan or Hatchback via Uber or Ola app.`,
          `Direct point-to-point journey along major flyovers and arterial roads.`,
          `Fare estimated based on current standard non-surge rates (~₹${cabFare}).`,
        ],
      },
    ],
    summary: `Air-conditioned private ride direct to entrance gate. Tolls and parking extra if applicable.`,
    lastUpdated: nowISO,
  };

  // If distance is below 2km, prefer walking route as the first option
  if (straightLineDist < 2) {
    const walkDist = parseFloat((straightLineDist * 1.3).toFixed(1)); // walking path is ~30% longer than straight line
    const walkDuration = Math.round(walkDist * 13); // ~13 min per km walking pace

    const optionWalking: JourneyOption = {
      id: 'opt_walking_preferred',
      title: 'Walking Route (Recommended)',
      tag: 'fastest',
      tagLabel: '🚶 Walk — Under 2km',
      totalDurationMins: walkDuration,
      totalDistanceKm: walkDist,
      totalCostInr: 0,
      transferCount: 0,
      legs: [
        {
          id: 'leg_walk_direct',
          mode: 'walking',
          fromName: origin.name,
          toName: destination.name,
          fromCoords: [origin.lat, origin.lng],
          toCoords: [destination.lat, destination.lng],
          distanceKm: walkDist,
          distanceType: 'walking',
          durationMins: walkDuration,
          fareInr: 0,
          fareType: 'official',
          instructions: [
            `Walk ${walkDist} km (approx. ${walkDuration} minutes) directly from ${origin.name} to ${destination.name}.`,
            'Follow pedestrian walkways, heritage corridors, and footbridges.',
            'This distance is under 2 km — walking is the most convenient and free option!',
            'Stay on well-lit paths and use designated crossings at major junctions.',
          ],
        },
      ],
      summary: `Only ${walkDist} km away — walking is free, healthy, and avoids traffic. Estimated ${walkDuration} min walk through heritage corridors.`,
      lastUpdated: nowISO,
    };

    // Walking is preferred first, then other options
    return [optionWalking, optionCheapest, optionAuto, optionCab];
  }

  return [optionFastest, optionCheapest, optionAuto, optionCab];
}
