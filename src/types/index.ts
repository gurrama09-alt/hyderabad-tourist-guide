export type TransportType = 'metro' | 'mmts' | 'bus' | 'road' | 'walking';

export type UserRole = 'user' | 'admin';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface TouristPlace {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  description: string;
  history?: string;
  address: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  entry_fee_inr: number;
  entry_fee_foreign_inr?: number;
  opening_hours: string;
  opening_time_mins: number; // e.g. 540 for 9:00 AM
  closing_time_mins: number; // e.g. 1050 for 5:30 PM
  closed_on?: string | null;
  estimated_duration_mins: number;
  visitor_tips: string[];
  accessibility_info?: string;
  wheelchair_accessible: boolean;
  nearest_metro_station?: string;
  nearest_bus_stop?: string;
  phone?: string;
  website?: string;
  is_popular: boolean;
  rating: number;
  review_count: number;
  cover_image: string;
  photos?: string[];
  source: string;
  verified: boolean;
  last_updated: string;
}

export interface TransportStation {
  id: string;
  name: string;
  code?: string;
  latitude: number;
  longitude: number;
  transport_type: TransportType;
  is_interchange: boolean;
  interchange_lines?: string[];
  wheelchair_accessible: boolean;
  lift_available: boolean;
  source: string;
  verified: boolean;
  last_updated: string;
}

export interface TransportLine {
  id: string;
  name: string;
  type: TransportType;
  line_code: string;
  color_hex: string;
  description: string;
  frequency_mins: number;
  first_time: string;
  last_time: string;
  stations: TransportStation[];
  source: string;
  verified: boolean;
  last_updated: string;
}

export interface BusRoute {
  id: string;
  route_number: string;
  origin: string;
  destination: string;
  via?: string;
  frequency_mins: number;
  fare_min_inr: number;
  fare_max_inr: number;
  transport_type: TransportType;
  stops: { name: string; latitude: number; longitude: number; order: number }[];
  source: string;
  verified: boolean;
  last_updated: string;
}

export interface RouteLeg {
  id: string;
  mode: TransportType;
  lineName?: string;
  lineColor?: string;
  fromName: string;
  toName: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  distanceKm: number;
  distanceType: 'metro' | 'train' | 'bus' | 'road' | 'walking' | 'straight-line';
  durationMins: number;
  fareInr: number;
  fareType: 'official' | 'estimated';
  instructions: string[];
  stopsPassed?: number;
  intermediateStops?: string[];
}

export interface JourneyOption {
  id: string;
  title: string;
  tag: 'fastest' | 'cheapest' | 'fewest_transfers' | 'direct_road' | 'recommended';
  tagLabel: string;
  totalDurationMins: number;
  totalDistanceKm: number;
  totalCostInr: number;
  transferCount: number;
  legs: RouteLeg[];
  summary: string;
  lastUpdated: string;
}

export interface ItineraryItem {
  id: string;
  placeId: string;
  place: TouristPlace;
  dayNumber: number;
  orderIndex: number;
  startTime?: string;
  durationMins: number;
  travelTimeFromPrevMins?: number;
  notes?: string;
}

export interface Itinerary {
  id: string;
  title: string;
  description: string;
  daysCount: number;
  budgetInr: number;
  items: ItineraryItem[];
  isPublic: boolean;
  shareToken?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  place_id: string;
  user_name: string;
  rating: number;
  comment: string;
  verified_visit: boolean;
  created_at: string;
}

export interface UserReport {
  id: string;
  report_type: 'inaccurate_route' | 'wrong_hours' | 'place_correction' | 'other';
  target_type: string;
  target_id: string;
  description: string;
  suggested_fix?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface TravelAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  affected_transport_line?: string;
  affected_station?: string;
  valid_from: string;
  is_active: boolean;
  source: string;
  verified: boolean;
  last_updated: string;
}

export type SupportedLanguage = 'en' | 'te' | 'hi';
