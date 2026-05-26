/**
 * NS Power Outage Data Layer
 *
 * Architecture: two-tier
 *   Tier 1 — Local static snapshot (default, no network needed)
 *             src/data/nsOutageHistory.ts  (8,960 records, 2022-09 to 2026-04)
 *   Tier 2 — Live Datasette refresh (optional, network required)
 *             https://nsp.datasette.danp.net/outages/outage_summaries
 *
 * Source / credit: danp/nspoweroutages
 *   https://github.com/danp/nspoweroutages
 * Scraped from NS Power official outage map: outagemap.nspower.ca
 *
 * NOTE: Lat/lon values are approximate cluster centroids from the NS Power
 * public map. They are NOT precise addresses. The data is used here for
 * simulation and demo purposes — do NOT present as real-time or official.
 */

import { nsOutageHistory } from './nsOutageHistory';

export interface OutageRecord {
  id: number;
  resolved: 0 | 1;
  first_observed: string; // ISO datetime
  last_observed: string; // ISO datetime
  observations: number;   // number of scrape observations
  min_cust_aff: number;   // min customers affected
  max_cust_aff: number;   // max customers affected
  min_start: string;      // ISO datetime
  max_etr: string | null; // estimated time of restoration
  last_cause: string;
  longitude: number;
  latitude: number;
  county: string;
  neighborhood: string;
}

// -----------------------------------------------------------------------------
// In-memory cache — only used for live-refreshed data
// -----------------------------------------------------------------------------

let _liveCache: OutageRecord[] | null = null;
let _cacheTime = 0;
const LIVE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// -----------------------------------------------------------------------------
// Live fetch (Tier 2)
// -----------------------------------------------------------------------------

const DATASETTE_CSV_URL =
  'https://nsp.datasette.danp.net/outages/outage_summaries.csv?_stream=on';
const FETCH_TIMEOUT_MS = 60_000;

async function fetchLiveCSV(): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const response = await fetch(DATASETTE_CSV_URL, {
    headers: { Accept: 'text/csv' },
    signal: controller.signal,
  });
  clearTimeout(timer);
  if (!response.ok) {
    throw new Error(
      `NS Power Datasette unreachable: ${response.status} ${response.statusText}`
    );
  }
  return response.text();
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text: string): OutageRecord[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',');
  const rows: OutageRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }
    const lon = parseFloat(row['longitude']);
    const lat = parseFloat(row['latitude']);
    if (isNaN(lon) || isNaN(lat)) continue;
    rows.push({
      id: parseInt(row['id'], 10),
      resolved: row['resolved'] === '1' ? 1 : 0,
      first_observed: row['first_observed'],
      last_observed: row['last_observed'],
      observations: parseInt(row['observations'], 10) || 0,
      min_cust_aff: parseInt(row['min_cust_aff'], 10) || 0,
      max_cust_aff: parseInt(row['max_cust_aff'], 10) || 0,
      min_start: row['min_start'],
      max_etr: row['max_etr'] || null,
      last_cause: row['last_cause'],
      longitude: lon,
      latitude: lat,
      county: row['county'] || '',
      neighborhood: row['neighborhood'] || '',
    });
  }
  return rows;
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Return the local static snapshot — available immediately, no network.
 * This is the default dataset used by riskEngine and zone scoring.
 */
export function getLocalOutageRecords(): OutageRecord[] {
  return nsOutageHistory as OutageRecord[];
}

/**
 * Attempt to refresh from live Datasette.
 * On failure, silently falls back to the cached live data (or local snapshot).
 *
 * Call this on app load or when user requests fresh data:
 *   refreshLive().then(count => console.log(`Live: ${count} records`));
 */
export async function refreshLive(): Promise<OutageRecord[]> {
  try {
    const text = await fetchLiveCSV();
    _liveCache = parseCSV(text);
    _cacheTime = Date.now();
    return _liveCache;
  } catch (err) {
    console.warn('[outageFetcher] Live refresh failed, using local snapshot.', err);
    return _liveCache ?? (nsOutageHistory as OutageRecord[]);
  }
}

/**
 * Returns the currently active dataset:
 *   - Live cache (if refreshed within TTL)
 *   - Otherwise the local static snapshot
 */
export function getActiveOutageRecords(): OutageRecord[] {
  const now = Date.now();
  if (_liveCache && now - _cacheTime < LIVE_CACHE_TTL_MS) {
    return _liveCache;
  }
  return nsOutageHistory as OutageRecord[];
}

/** Synchronous access to live cache (may be null). */
export function getCachedLiveRecords(): OutageRecord[] | null {
  return _liveCache;
}