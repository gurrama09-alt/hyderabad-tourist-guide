export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { TOURIST_PLACES } from '@/lib/data/seedData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback in-memory and local disk cache so data persists across requests & devices
let memoryCache: any[] | null = null;
let lastUpdatedTimestamp: string = new Date().toISOString();

function getPrimaryFilePath(): string {
  return path.join(process.cwd(), 'data', 'hyd_shared_places.json');
}

function getSecondaryFilePath(): string {
  const tmpDir = process.env.TMPDIR || process.env.TEMP || '/tmp';
  return path.join(tmpDir, 'hyd_shared_places.json');
}

function readLocalBackup(): any[] | null {
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }

  // 1. Try primary project directory
  try {
    const primary = getPrimaryFilePath();
    if (fs.existsSync(primary)) {
      const raw = fs.readFileSync(primary, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read primary backup:', err);
  }

  // 2. Try secondary temp directory
  try {
    const secondary = getSecondaryFilePath();
    if (fs.existsSync(secondary)) {
      const raw = fs.readFileSync(secondary, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read secondary backup:', err);
  }

  return null;
}

function writeLocalBackup(places: any[]) {
  memoryCache = places;
  lastUpdatedTimestamp = new Date().toISOString();

  // 1. Write to primary (data directory in project)
  try {
    const primary = getPrimaryFilePath();
    const dir = path.dirname(primary);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(primary, JSON.stringify(places, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write primary backup to data dir:', err);
  }

  // 2. Also write to secondary temp dir
  try {
    const secondary = getSecondaryFilePath();
    fs.writeFileSync(secondary, JSON.stringify(places), 'utf-8');
  } catch (err) {
    console.warn('Could not write secondary backup:', err);
  }
}

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

// GET /api/places - Returns shared places for all viewers and devices
// Supports lightweight polling: ?since=<ISO timestamp> returns changed: false if no changes
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sinceParam = url.searchParams.get('since');

    // 1. Check Supabase first if available
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('shared_places')
          .select('places_json, updated_at')
          .eq('id', 'global_places')
          .maybeSingle();

        if (!error && data && data.places_json) {
          // Lightweight poll: if client already has this version, return 200 with changed: false
          if (sinceParam && data.updated_at) {
            const sinceDate = new Date(sinceParam).getTime();
            const serverDate = new Date(data.updated_at).getTime();
            if (!isNaN(sinceDate) && !isNaN(serverDate) && sinceDate >= serverDate) {
              return NextResponse.json(
                { changed: false, updated_at: data.updated_at },
                { status: 200, headers: NO_CACHE_HEADERS }
              );
            }
          }

          const parsed = typeof data.places_json === 'string' ? JSON.parse(data.places_json) : data.places_json;
          if (Array.isArray(parsed) && parsed.length > 0) {
            writeLocalBackup(parsed);
            return NextResponse.json(
              {
                places: parsed,
                updated_at: data.updated_at,
                source: 'supabase',
                changed: true,
              },
              { headers: NO_CACHE_HEADERS }
            );
          }
        }
      } catch (sbErr) {
        console.warn('Supabase fetch failed, falling back to local storage:', sbErr);
      }
    }

    // 2. Check local disk / memory cache
    const backup = readLocalBackup();
    if (backup && backup.length > 0) {
      if (sinceParam) {
        const sinceDate = new Date(sinceParam).getTime();
        const serverDate = new Date(lastUpdatedTimestamp).getTime();
        if (!isNaN(sinceDate) && !isNaN(serverDate) && sinceDate >= serverDate) {
          return NextResponse.json(
            { changed: false, updated_at: lastUpdatedTimestamp },
            { status: 200, headers: NO_CACHE_HEADERS }
          );
        }
      }

      return NextResponse.json(
        {
          places: backup,
          updated_at: lastUpdatedTimestamp,
          source: 'local-file',
          changed: true,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // 3. Fallback to seed data so client always has complete initialized place dataset
    return NextResponse.json(
      {
        places: TOURIST_PLACES,
        updated_at: lastUpdatedTimestamp,
        source: 'seed',
        changed: true,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    console.error('GET /api/places error:', err);
    return NextResponse.json(
      { places: null, error: 'Server error' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

// POST /api/places - Saves admin updates so all viewers see them
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { places } = body;

    if (!places || !Array.isArray(places)) {
      return NextResponse.json(
        { error: 'Invalid places data' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // 1. Immediately store in server memory + project disk file
    writeLocalBackup(places);

    // 2. Persist to Supabase if available
    let supabaseSaved = false;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('shared_places')
          .upsert(
            {
              id: 'global_places',
              places_json: JSON.stringify(places),
              updated_at: lastUpdatedTimestamp,
            },
            { onConflict: 'id' }
          );

        if (!error) {
          supabaseSaved = true;
        } else {
          console.warn('Supabase shared_places upsert note:', error.message);
        }
      } catch (sbErr) {
        console.warn('Supabase upsert exception:', sbErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        savedTo: supabaseSaved ? 'supabase' : 'local-file',
        supabaseSaved,
        updated_at: lastUpdatedTimestamp,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    console.error('POST /api/places error:', err);
    return NextResponse.json(
      { error: 'Failed to save places' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
