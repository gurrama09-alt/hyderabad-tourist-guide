-- ==============================================================================
-- HYDERABAD TOURIST GUIDE - SUPABASE DATABASE SCHEMA
-- Features: Strict types, RLS policies, indexes, integrity tracking (source, verified, last_updated)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Mirrors Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. PLACES
CREATE TABLE IF NOT EXISTS public.places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  history TEXT,
  address TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  entry_fee_inr NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
  entry_fee_foreign_inr NUMERIC(10,2) DEFAULT 0.00,
  opening_hours TEXT NOT NULL,
  opening_time_mins INT DEFAULT 540, -- 9:00 AM (mins from midnight)
  closing_time_mins INT DEFAULT 1020, -- 5:00 PM
  closed_on TEXT,
  estimated_duration_mins INT DEFAULT 90 NOT NULL,
  visitor_tips TEXT[] DEFAULT ARRAY[]::TEXT[],
  accessibility_info TEXT,
  wheelchair_accessible BOOLEAN DEFAULT FALSE NOT NULL,
  nearest_metro_station TEXT,
  nearest_bus_stop TEXT,
  phone TEXT,
  website TEXT,
  is_popular BOOLEAN DEFAULT FALSE NOT NULL,
  rating NUMERIC(3,2) DEFAULT 4.5 NOT NULL,
  review_count INT DEFAULT 0 NOT NULL,
  cover_image TEXT NOT NULL,
  source TEXT DEFAULT 'Telangana Tourism Dept' NOT NULL,
  verified BOOLEAN DEFAULT TRUE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. PLACE PHOTOS
CREATE TABLE IF NOT EXISTS public.place_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  is_cover BOOLEAN DEFAULT FALSE NOT NULL,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. TRANSPORT LINES (Metro Red, Blue, Green; MMTS corridors)
CREATE TABLE IF NOT EXISTS public.transport_lines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('metro', 'mmts', 'bus')),
  line_code TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  description TEXT,
  frequency_mins INT DEFAULT 5 NOT NULL,
  first_time TEXT DEFAULT '06:00 AM' NOT NULL,
  last_time TEXT DEFAULT '11:00 PM' NOT NULL,
  source TEXT DEFAULT 'HMRL / South Central Railway' NOT NULL,
  verified BOOLEAN DEFAULT TRUE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. STATIONS
CREATE TABLE IF NOT EXISTS public.stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  transport_type TEXT NOT NULL CHECK (transport_type IN ('metro', 'mmts', 'bus')),
  is_interchange BOOLEAN DEFAULT FALSE NOT NULL,
  interchange_lines TEXT[] DEFAULT ARRAY[]::TEXT[],
  wheelchair_accessible BOOLEAN DEFAULT TRUE NOT NULL,
  lift_available BOOLEAN DEFAULT TRUE NOT NULL,
  source TEXT DEFAULT 'HMRL / South Central Railway' NOT NULL,
  verified BOOLEAN DEFAULT TRUE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. LINE STATIONS
CREATE TABLE IF NOT EXISTS public.line_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id TEXT REFERENCES public.transport_lines(id) ON DELETE CASCADE NOT NULL,
  station_id TEXT REFERENCES public.stations(id) ON DELETE CASCADE NOT NULL,
  stop_order INT NOT NULL,
  distance_from_prev_km NUMERIC(5,2) DEFAULT 1.2 NOT NULL,
  time_from_prev_mins INT DEFAULT 2 NOT NULL,
  UNIQUE(line_id, station_id),
  UNIQUE(line_id, stop_order)
);

-- 10. BUS ROUTES & STOPS
CREATE TABLE IF NOT EXISTS public.bus_routes (
  id TEXT PRIMARY KEY,
  route_number TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  via TEXT,
  frequency_mins INT DEFAULT 15 NOT NULL,
  fare_min_inr NUMERIC(6,2) DEFAULT 15.00 NOT NULL,
  fare_max_inr NUMERIC(6,2) DEFAULT 45.00 NOT NULL,
  transport_type TEXT DEFAULT 'bus' NOT NULL,
  source TEXT DEFAULT 'TGSRTC Official / Open Data' NOT NULL,
  verified BOOLEAN DEFAULT TRUE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bus_stops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  landmark TEXT,
  source TEXT DEFAULT 'TGSRTC' NOT NULL,
  verified BOOLEAN DEFAULT TRUE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_route_id TEXT REFERENCES public.bus_routes(id) ON DELETE CASCADE NOT NULL,
  bus_stop_id TEXT REFERENCES public.bus_stops(id) ON DELETE CASCADE NOT NULL,
  stop_order INT NOT NULL,
  UNIQUE(bus_route_id, stop_order)
);

-- 11. FARES MATRIX
CREATE TABLE IF NOT EXISTS public.fares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transport_type TEXT NOT NULL,
  from_station_id TEXT REFERENCES public.stations(id) ON DELETE CASCADE,
  to_station_id TEXT REFERENCES public.stations(id) ON DELETE CASCADE,
  min_distance_km NUMERIC(5,2),
  max_distance_km NUMERIC(5,2),
  fare_inr NUMERIC(6,2) NOT NULL,
  fare_type TEXT NOT NULL CHECK (fare_type IN ('official', 'estimated')),
  source TEXT DEFAULT 'HMRL Official Chart / TGSRTC' NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. ITINERARIES
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  days_count INT DEFAULT 1 NOT NULL,
  budget_inr NUMERIC(10,2) DEFAULT 2000.00 NOT NULL,
  is_public BOOLEAN DEFAULT TRUE NOT NULL,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex') NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES public.itineraries(id) ON DELETE CASCADE NOT NULL,
  day_number INT NOT NULL,
  place_id TEXT REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  order_index INT NOT NULL,
  start_time TEXT,
  duration_mins INT DEFAULT 90 NOT NULL,
  notes TEXT
);

-- 13. USER SAVED PLACES (FAVOURITES)
CREATE TABLE IF NOT EXISTS public.favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  place_id TEXT REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, place_id)
);

-- 14. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT DEFAULT 'Visitor' NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  verified_visit BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. USER REPORTS & CORRECTIONS
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('inaccurate_route', 'wrong_hours', 'place_correction', 'other')),
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_fix TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 16. TRAVEL ALERTS & DISRUPTIONS
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  affected_transport_line TEXT,
  affected_station TEXT,
  valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  valid_to TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  source TEXT DEFAULT 'Telangana Traffic Police / HMRL' NOT NULL,
  verified BOOLEAN DEFAULT TRUE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: users can read public profiles; update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories & Places: Public Read, Admin Write
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can read places" ON public.places FOR SELECT USING (true);
CREATE POLICY "Admins can insert places" ON public.places FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update places" ON public.places FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete places" ON public.places FOR DELETE USING (public.is_admin());

-- Photos: Public Read, Logged in can add, Admin can delete
CREATE POLICY "Anyone can view photos" ON public.place_photos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload photos" ON public.place_photos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Uploader or admin can delete photos" ON public.place_photos FOR DELETE USING (auth.uid() = uploader_id OR public.is_admin());

-- Transport lines, stations, bus routes: Public Read, Admin Write
CREATE POLICY "Anyone can view transport lines" ON public.transport_lines FOR SELECT USING (true);
CREATE POLICY "Admin manage transport lines" ON public.transport_lines FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view stations" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Admin manage stations" ON public.stations FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view line stations" ON public.line_stations FOR SELECT USING (true);
CREATE POLICY "Admin manage line stations" ON public.line_stations FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view bus routes" ON public.bus_routes FOR SELECT USING (true);
CREATE POLICY "Admin manage bus routes" ON public.bus_routes FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view bus stops" ON public.bus_stops FOR SELECT USING (true);
CREATE POLICY "Admin manage bus stops" ON public.bus_stops FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view route stops" ON public.route_stops FOR SELECT USING (true);
CREATE POLICY "Admin manage route stops" ON public.route_stops FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view fares" ON public.fares FOR SELECT USING (true);
CREATE POLICY "Admin manage fares" ON public.fares FOR ALL USING (public.is_admin());

-- Itineraries: Public read if public, owner can do everything
CREATE POLICY "Anyone can read public itineraries" ON public.itineraries FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can create itineraries" ON public.itineraries FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their itineraries" ON public.itineraries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their itineraries" ON public.itineraries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read public itinerary items" ON public.itinerary_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.itineraries WHERE id = itinerary_items.itinerary_id AND (is_public = true OR auth.uid() = user_id))
);
CREATE POLICY "Users can manage their itinerary items" ON public.itinerary_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.itineraries WHERE id = itinerary_items.itinerary_id AND auth.uid() = user_id)
);

-- Favourites: User only
CREATE POLICY "Users can view own favourites" ON public.favourites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert favourites" ON public.favourites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete favourites" ON public.favourites FOR DELETE USING (auth.uid() = user_id);

-- Reviews: Public read, logged in create, owner/admin delete
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Author or admin can delete review" ON public.reviews FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Reports: User can submit, Admins can view/update
CREATE POLICY "Users can submit reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin can update reports" ON public.reports FOR UPDATE USING (public.is_admin());

-- Alerts: Public read active alerts, Admin manage
CREATE POLICY "Anyone can view active alerts" ON public.alerts FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin can manage alerts" ON public.alerts FOR ALL USING (public.is_admin());

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places(category_id);
CREATE INDEX IF NOT EXISTS idx_places_lat_lng ON public.places(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_stations_lat_lng ON public.stations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_line_stations_line ON public.line_stations(line_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_itin ON public.itinerary_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_reviews_place ON public.reviews(place_id);
