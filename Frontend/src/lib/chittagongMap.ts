/**
 * Chittagong (Chattogram) Map Configuration and Utilities for MedeCare
 * Provides Google Maps high-resolution tile layers, strict Chittagong area bounds,
 * instant popular zone presets, and fail-safe coordinate parsing.
 */

export interface MapTileProvider {
  id: 'google-streets' | 'google-satellite' | 'osm';
  name: string;
  url: string;
  subdomains?: string[];
  maxZoom: number;
  attribution: string;
}

export const CHITTAGONG_MAP_CONFIG = {
  center: [22.3592, 91.8215] as [number, number], // GEC Circle, Central Chattogram
  minZoom: 11,
  maxZoom: 19,
  defaultZoom: 14,
  // Chittagong Metropolitan & District Bounding Box [South-West, North-East]
  bounds: [
    [22.1500, 91.6000], // Patenga / Sea Port / Anwara border
    [22.5500, 91.9800], // Hathazari / Raozan / Sitakunda border
  ] as [[number, number], [number, number]],
};

export const MAP_PROVIDERS: Record<string, MapTileProvider> = {
  'google-streets': {
    id: 'google-streets',
    name: 'Google Streets',
    url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps',
  },
  'google-satellite': {
    id: 'google-satellite',
    name: 'Satellite',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
    attribution: '&copy; Google Maps Satellite',
  },
  'osm': {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

export interface ChittagongArea {
  name: string;
  bnName: string;
  coords: [number, number];
  tag: string;
}

export const CHITTAGONG_AREAS: ChittagongArea[] = [
  { name: 'GEC Circle', bnName: 'জিইসি মোড়', coords: [22.3592, 91.8215], tag: 'Central' },
  { name: 'Panchlaish / Medical', bnName: 'পাঁচলাইশ (মেডিকেল)', coords: [22.3644, 91.8315], tag: 'Healthcare' },
  { name: 'Agrabad C/A', bnName: 'আগ্রাবাদ বা/এ', coords: [22.3255, 91.8120], tag: 'Commercial' },
  { name: 'Chawkbazar', bnName: 'চকবাজার', coords: [22.3582, 91.8412], tag: 'Education' },
  { name: 'Nasirabad / 2 No. Gate', bnName: 'নাসিরাবাদ (২নং গেট)', coords: [22.3712, 91.8228], tag: 'Central' },
  { name: 'Khulshi', bnName: 'খুলশী', coords: [22.3620, 91.8020], tag: 'Residential' },
  { name: 'Halishahar', bnName: 'হালিশহর', coords: [22.3385, 91.7760], tag: 'Residential' },
  { name: 'Bahaddarhat', bnName: 'বহদ্দারহাট', coords: [22.3740, 91.8490], tag: 'Hub' },
  { name: 'Muradpur', bnName: 'মুরাদপুর', coords: [22.3695, 91.8380], tag: 'Junction' },
  { name: 'Kotwali / New Market', bnName: 'কোতোয়ালী / নিউ মার্কেট', coords: [22.3360, 91.8340], tag: 'Downtown' },
  { name: 'Bayezid Bostami', bnName: 'বায়েজিদ বোস্তামী', coords: [22.3910, 91.8200], tag: 'Industrial' },
  { name: 'Patenga / Airport', bnName: 'পতেঙ্গা / এয়ারপোর্ট', coords: [22.2450, 91.7950], tag: 'Coastal' },
];

/**
 * Robust coordinate parser for Chittagong.
 * Automatically recognizes [lat, lng], [lng, lat], {lat, lng}, or GeoJSON,
 * ensuring coordinates never swap and never crash Leaflet Web Mercator projection.
 */
export function parseChittagongCoords(coord: unknown): [number, number] {
  if (!coord) return [...CHITTAGONG_MAP_CONFIG.center];

  let rawLat = 0;
  let rawLng = 0;

  if (Array.isArray(coord)) {
    const v0 = Number(coord[0]) || 0;
    const v1 = Number(coord[1]) || 0;

    // In Bangladesh: Latitude is ~20 to 26, Longitude is ~88 to 94
    if (v0 >= 20 && v0 <= 26 && v1 >= 88 && v1 <= 95) {
      // standard [lat, lng]
      rawLat = v0;
      rawLng = v1;
    } else if (v1 >= 20 && v1 <= 26 && v0 >= 88 && v0 <= 95) {
      // GeoJSON / Mongo format [lng, lat]
      rawLat = v1;
      rawLng = v0;
    } else {
      rawLat = v0;
      rawLng = v1;
    }
  } else if (typeof coord === 'object' && coord !== null) {
    const obj = coord as Record<string, unknown>;
    if (Array.isArray(obj.coordinates)) {
      return parseChittagongCoords(obj.coordinates);
    }
    const latCandidate = Number(obj.lat ?? obj.latitude) || 0;
    const lngCandidate = Number(obj.lng ?? obj.lon ?? obj.longitude) || 0;

    if (latCandidate >= 20 && latCandidate <= 26) {
      rawLat = latCandidate;
      rawLng = lngCandidate;
    } else if (lngCandidate >= 20 && lngCandidate <= 26) {
      rawLat = lngCandidate;
      rawLng = latCandidate;
    } else {
      rawLat = latCandidate;
      rawLng = lngCandidate;
    }
  }

  // Strict Chittagong validity verification
  // Chittagong sits roughly: Lat 22.10 to 22.65, Lng 91.60 to 92.10
  const isWithinChittagong =
    rawLat >= 22.0 && rawLat <= 22.7 && rawLng >= 91.5 && rawLng <= 92.2;

  if (!isWithinChittagong) {
    return [...CHITTAGONG_MAP_CONFIG.center];
  }

  return [rawLat, rawLng];
}

/**
 * Returns Nominatim geocoding search URL strictly bounded to Chittagong.
 */
export function getChittagongSearchUrl(query: string): string {
  const clean = query.trim();
  const lower = clean.toLowerCase();
  const queryWithContext =
    lower.includes('chittagong') || lower.includes('chattogram')
      ? clean
      : `${clean}, Chattogram, Bangladesh`;

  // viewbox=left,top,right,bottom (minLon, maxLat, maxLon, minLat)
  return `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    queryWithContext
  )}&viewbox=91.60,22.55,91.98,22.15&bounded=1&countrycodes=bd&limit=6`;
}
