'use client';

import React, { useEffect, useRef } from 'react';
import { TouristPlace, TransportLine, TransportStation } from '@/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LeafletMapProps {
  places: TouristPlace[];
  selectedPlace: TouristPlace | null;
  onSelectPlace: (place: TouristPlace) => void;
  showMetro: boolean;
  showBus: boolean;
  showMMTS: boolean;
  showAmenities: boolean;
  metroLines: TransportLine[];
  userLocation: { lat: number; lng: number } | null;
  routePolyline?: [number, number][];
}

// Nearby Amenities Seed Data for Hyderabad
const AMENITIES = [
  { name: 'Hotel Shadab (Biryani & Mughlai)', type: 'restaurant', lat: 17.3685, lng: 78.4735 },
  { name: 'Paradise Biryani (Secunderabad)', type: 'restaurant', lat: 17.4419, lng: 78.4872 },
  { name: 'Nimrah Cafe & Bakery (Chai)', type: 'restaurant', lat: 17.3618, lng: 78.4749 },
  { name: 'Taj Falaknuma Palace (Luxury)', type: 'hotel', lat: 17.3312, lng: 78.4674 },
  { name: 'ITC Kohenur (HITEC City)', type: 'hotel', lat: 17.4328, lng: 78.3812 },
  { name: 'Osmania General Hospital', type: 'hospital', lat: 17.3712, lng: 78.4762 },
  { name: 'NIMS Hospital (Punjagutta)', type: 'hospital', lat: 17.4262, lng: 78.4526 },
  { name: 'Secunderabad Junction Railway', type: 'station', lat: 17.4345, lng: 78.5015 },
  { name: 'MG Bus Station (MGBS Central)', type: 'station', lat: 17.3781, lng: 78.4828 },
  { name: 'Hyderabad Deccan / Nampally', type: 'station', lat: 17.3918, lng: 78.4728 },
];

export default function LeafletMap({
  places,
  selectedPlace,
  onSelectPlace,
  showMetro,
  showBus,
  showMMTS,
  showAmenities,
  metroLines,
  userLocation,
  routePolyline,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center on Hussain Sagar / Central Hyderabad
    const map = L.map(mapContainerRef.current, {
      center: [17.385, 78.4867],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Force multiple size checks to guarantee map tiles render on mobile screens
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 800);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    // Responsive container observer for mobile view switches
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Layers and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. User Location Marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div style="position:relative; width:20px; height:20px;">
            <div style="position:absolute; inset:0; background:rgba(14,165,233,0.3); border-radius:50%; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute; inset:3px; background:#0284c7; border:2px solid white; border-radius:50%; box-shadow:0 0 10px rgba(0,0,0,0.4);"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon });
      userMarker.bindPopup('<b>Your Current Location</b><br/>GPS Enabled');
      group.addLayer(userMarker);
    }

    // 2. Metro Lines (Red, Blue, Green)
    if (showMetro) {
      metroLines
        .filter((line) => line.type === 'metro')
        .forEach((line) => {
          const coords: [number, number][] = line.stations.map((s) => [s.latitude, s.longitude]);

          const linePoly = L.polyline(coords, {
            color: line.color_hex,
            weight: 5,
            opacity: 0.9,
          });
          linePoly.bindTooltip(`<b>${line.name}</b><br/>Every ${line.frequency_mins} mins`, {
            sticky: true,
          });
          group.addLayer(linePoly);

          line.stations.forEach((st) => {
            const circle = L.circleMarker([st.latitude, st.longitude], {
              radius: st.is_interchange ? 6 : 4,
              fillColor: st.is_interchange ? '#D4AF37' : '#ffffff',
              color: line.color_hex,
              weight: 2,
              opacity: 1,
              fillOpacity: 0.9,
            });

            circle.bindPopup(`
              <div style="font-family:sans-serif; min-width:150px;">
                <strong style="color:${line.color_hex};">${st.name}</strong>
                <div style="font-size:11px; margin-top:3px; color:#cbd5e1;">
                  ${st.is_interchange ? '★ Major Metro Interchange' : 'HMRL Metro Station'}
                </div>
                <div style="font-size:10px; margin-top:2px; color:#86efac;">
                  Wheelchair Accessible: ${st.wheelchair_accessible ? 'Yes ✓' : 'No'}
                </div>
              </div>
            `);
            group.addLayer(circle);
          });
        });
    }

    // 2b. Local Rails (MMTS Corridors - Lingampalli ↔ Nampally & Falaknuma ↔ Secunderabad)
    if (showMMTS) {
      metroLines
        .filter((line) => line.type === 'mmts')
        .forEach((line) => {
          const coords: [number, number][] = line.stations.map((s) => [s.latitude, s.longitude]);

          // Draw Railway Track style dashed polyline
          const railTrackPoly = L.polyline(coords, {
            color: '#9333ea',
            weight: 4,
            opacity: 0.85,
            dashArray: '8, 6',
          });
          railTrackPoly.bindTooltip(`<b>🚆 ${line.name}</b><br/>Fare: ₹5 - ₹15`, {
            sticky: true,
          });
          group.addLayer(railTrackPoly);

          line.stations.forEach((st) => {
            const circle = L.circleMarker([st.latitude, st.longitude], {
              radius: st.is_interchange ? 5.5 : 3.5,
              fillColor: st.is_interchange ? '#D4AF37' : '#7c3aed',
              color: '#ffffff',
              weight: 1.5,
              opacity: 1,
              fillOpacity: 0.9,
            });

            circle.bindPopup(`
              <div style="font-family:sans-serif; min-width:150px;">
                <strong style="color:#a855f7;">🚆 ${st.name}</strong>
                <div style="font-size:11px; margin-top:2px; color:#cbd5e1;">
                  ${st.is_interchange ? '★ MMTS & Metro Interchange' : 'MMTS Local Suburban Station'}
                </div>
                <div style="font-size:10px; margin-top:2px; color:#facc15;">
                  South Central Railway • Fare: ₹5 - ₹15
                </div>
              </div>
            `);
            group.addLayer(circle);
          });
        });
    }

    // 3. Tourist Place Markers (Styled with Green & White)
    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const markerHtml = `
        <div style="
          width: 32px;
          height: 32px;
          background: ${isSelected ? '#D4AF37' : '#16A34A'};
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.45);
          cursor: pointer;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 13px;
            font-weight: bold;
          ">
            ★
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'place-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([place.latitude, place.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family:sans-serif; width:190px; padding:2px;">
          <img src="${place.cover_image}" style="width:100%; height:90px; object-fit:cover; border-radius:8px; margin-bottom:6px;" alt="${place.name}"/>
          <strong style="font-size:13px; color:#f8fafc;">${place.name}</strong>
          <div style="font-size:11px; color:#d4af37; font-weight:600; margin:3px 0;">
            ⭐ ${place.rating} • ${place.entry_fee_inr === 0 ? 'Free Entry' : '₹' + place.entry_fee_inr}
          </div>
          <div style="font-size:10px; color:#cbd5e1; line-height:1.3; margin-bottom:8px;">
            ${place.opening_hours.split('(')[0]}
          </div>
          <a href="/place/${place.slug}" style="display:inline-block; font-size:11px; background:#e11d48; color:white; padding:4px 8px; border-radius:6px; text-decoration:none; font-weight:600;">
            View Details & Directions →
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => onSelectPlace(place));
      group.addLayer(marker);
    });

    // 4. Nearby Amenities Layer (Restaurants, Hotels, Hospitals, Transport Stations)
    if (showAmenities) {
      AMENITIES.forEach((am) => {
        const typeColors: Record<string, string> = {
          restaurant: '#f59e0b',
          hotel: '#8b5cf6',
          hospital: '#ef4444',
          station: '#0284c7',
        };

        const typeLabels: Record<string, string> = {
          restaurant: '🍴 Dining / Biryani',
          hotel: '🏨 Hotel',
          hospital: '🏥 Hospital',
          station: '🚆 Transport Hub',
        };

        const amenCircle = L.circleMarker([am.lat, am.lng], {
          radius: 4.5,
          fillColor: typeColors[am.type] || '#ffffff',
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        });

        amenCircle.bindTooltip(`<b>${am.name}</b><br/>${typeLabels[am.type]}`, {
          sticky: true,
        });
        group.addLayer(amenCircle);
      });
    }

    // 5. Route Polyline (if provided from route planner)
    if (routePolyline && routePolyline.length > 1) {
      const routeLine = L.polyline(routePolyline, {
        color: '#d4af37',
        weight: 5,
        opacity: 0.9,
      });
      group.addLayer(routeLine);
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    }
  }, [
    places,
    selectedPlace,
    showMetro,
    showBus,
    showMMTS,
    showAmenities,
    metroLines,
    userLocation,
    routePolyline,
    onSelectPlace,
  ]);

  // Pan to selected place
  useEffect(() => {
    if (selectedPlace && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedPlace.latitude, selectedPlace.longitude], 14, {
        duration: 1.2,
      });
    }
  }, [selectedPlace]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[400px] rounded-2xl" />;
}
