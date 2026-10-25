import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback in-memory and local disk cache so data persists across requests & devices
let memoryCache: any[] | null = null;
let lastUpdatedTimestamp: string = new Date().toISOString();

function getStorageFilePath(): string {
  // Use /tmp on Vercel/serverless environments, or local temp
  const tmpDir = process.env.TMPDIR || process.env.TEMP || '/tmp';
  return path.join(tmpDir, 'hyd_shared_places.json');
}

function readLocalBackup(): any[] | null {
  if (memoryCache && memoryCache.length > 0) {
    return memoryCache;
  }
  try {
    const filePath = getStorageFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read local backup:', err);
  }
  return null;
}

function writeLocalBackup(places: any[]) {
  memoryCache = places;
  lastUpdatedTimestamp = new Date().toISOString();
  try {
    const filePath = getStorageFilePath();
    fs.writeFileSync(filePath, JSON.stringify(places), 'utf-8');
  } catch (err) {
    console.warn('Could not write local backup:', err);
  }
}

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// GET /api/places - Returns shared places for all viewers and devices
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('shared_places')
          .select('places_json, updated_at')
          .eq('id', 'global_places')
          .maybeSingle();

        if (!error && data && data.places_json) {
          const parsed = typeof data.places_json === 'string' ? JSON.parse(data.places_json) : data.places_json;
          if (Array.isArray(parsed) && parsed.length > 0) {
            writeLocalBackup(parsed);
            return NextResponse.json({
              places: parsed,
              updated_at: data.updated_at,
              source: 'supabase',
            });
          }
        }
      } catch (sbErr) {
        console.warn('Supabase fetch failed, falling back to cached places:', sbErr);
      }
    }

    // Fallback to local memory / file cache
    const backup = readLocalBackup();
    if (backup && backup.length > 0) {
      return NextResponse.json({
        places: backup,
        updated_at: lastUpdatedTimestamp,
        source: 'server-cache',
      });
    }

    return NextResponse.json({ places: null, source: 'seed' });
  } catch (err) {
    console.error('GET /api/places error:', err);
    return NextResponse.json({ places: null, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/places - Saves admin updates so all viewers see them
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { places } = body;

    if (!places || !Array.isArray(places)) {
      return NextResponse.json({ error: 'Invalid places data' }, { status: 400 });
    }

    // 1. Immediately store in server memory + file cache
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
              updated_at: new Date().toISOString(),
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

    return NextResponse.json({
      success: true,
      savedTo: supabaseSaved ? 'supabase' : 'server-cache',
      supabaseSaved,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('POST /api/places error:', err);
    return NextResponse.json({ error: 'Failed to save places' }, { status: 500 });
  }
}
