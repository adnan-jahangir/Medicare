import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Crosshair, Search, Loader2, X, Layers, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  CHITTAGONG_MAP_CONFIG,
  MAP_PROVIDERS,
  CHITTAGONG_AREAS,
  parseChittagongCoords,
  getChittagongSearchUrl,
  type MapTileProvider,
} from '@/lib/chittagongMap';

// Custom high-contrast delivery pin icon
const deliveryPinIcon = L.divIcon({
  className: 'checkout-delivery-pin',
  html: `<div style="
    width: 38px; height: 38px; border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    border: 3px solid white;
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45);
    display: flex; align-items: center; justify-content: center;
    cursor: grab;
    transform: translate3d(0, 0, 0);
  ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface CheckoutMapPickerProps {
  initialCoords: { lat: number; lng: number };
  onChange: (coords: { lat: number; lng: number }) => void;
  onAddressSelect?: (address: string) => void;
}

/** Handles map clicks to update marker location strictly within Chittagong */
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Programmatically recenters the map when position updates */
function MapRecenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center, zoom, map]);
  return null;
}

export function CheckoutMapPicker({ initialCoords, onChange, onAddressSelect }: CheckoutMapPickerProps) {
  const safeInitial = useMemo(
    () => parseChittagongCoords(initialCoords),
    [initialCoords.lat, initialCoords.lng]
  );

  const [position, setPosition] = useState<[number, number]>(safeInitial);
  const [selectedLayer, setSelectedLayer] = useState<keyof typeof MAP_PROVIDERS>('google-streets');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAreaName, setSelectedAreaName] = useState<string>('GEC Circle');

  const markerRef = useRef<L.Marker | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal position if initialCoords change externally
  useEffect(() => {
    const next = parseChittagongCoords(initialCoords);
    setPosition(next);
  }, [initialCoords.lat, initialCoords.lng]);

  const updatePosition = useCallback(
    (lat: number, lng: number, addressName?: string) => {
      const validated = parseChittagongCoords({ lat, lng });
      setPosition(validated);
      onChange({ lat: validated[0], lng: validated[1] });

      if (addressName && onAddressSelect) {
        onAddressSelect(addressName);
      }
    },
    [onChange, onAddressSelect]
  );

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const latLng = marker.getLatLng();
      updatePosition(latLng.lat, latLng.lng);
      toast.success('Pin location updated', {
        description: `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)} (Chattogram)`,
      });
    }
  };

  // Debounced search bounded strictly to Chittagong
  const fetchSearchResults = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const url = getChittagongSearchUrl(query);
      const res = await fetch(url);
      const data: NominatimResult[] = await res.json();
      setSearchResults(data || []);
      setIsDropdownOpen(true);
    } catch (err) {
      console.error('Location search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchSearchResults(val);
    }, 350);
  };

  const handleSelectResult = (item: NominatimResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    updatePosition(lat, lng, item.display_name);
    setSearchQuery(item.display_name.split(',')[0]);
    setIsDropdownOpen(false);
    toast.success('Location updated', { description: item.display_name.split(',').slice(0, 2).join(',') });
  };

  const handleSelectArea = (area: typeof CHITTAGONG_AREAS[0]) => {
    setSelectedAreaName(area.name);
    updatePosition(area.coords[0], area.coords[1], `${area.name}, Chattogram`);
    toast.success(`Centered on ${area.name}`, { description: area.bnName });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast.info('Detecting your GPS location in Chittagong...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        // Check if inside Chittagong region
        if (userLat >= 22.0 && userLat <= 22.7 && userLng >= 91.5 && userLng <= 92.2) {
          updatePosition(userLat, userLng);
          toast.success('Located at your current Chittagong position');
        } else {
          toast.warning('Your GPS is outside Chittagong', {
            description: 'MedeCare currently serves Chittagong only. Showing Central Chittagong (GEC Circle).',
          });
          updatePosition(22.3592, 91.8215);
        }
      },
      (err) => {
        console.error(err);
        toast.error('Could not detect location. Please tap any area button or click on the map.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const eventHandlers = useMemo(
    () => ({
      dragend: handleDragEnd,
    }),
    []
  );

  const activeProvider: MapTileProvider = MAP_PROVIDERS[selectedLayer] || MAP_PROVIDERS['google-streets'];

  return (
    <div className="space-y-3.5">
      {/* Chittagong Notice & Search Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px] font-semibold py-0.5 px-2">
            📍 Chattogram Only
          </Badge>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Fast medicine delivery across Chittagong city
          </span>
        </div>

        {/* Map Type Switcher */}
        <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/60 text-[11px]">
          <button
            type="button"
            onClick={() => setSelectedLayer('google-streets')}
            className={`px-2 py-1 rounded-md font-medium transition-all ${
              selectedLayer === 'google-streets'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Google Map
          </button>
          <button
            type="button"
            onClick={() => setSelectedLayer('google-satellite')}
            className={`px-2 py-1 rounded-md font-medium transition-all ${
              selectedLayer === 'google-satellite'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setSelectedLayer('osm')}
            className={`px-2 py-1 rounded-md font-medium transition-all ${
              selectedLayer === 'osm'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            OSM
          </button>
        </div>
      </div>

      {/* Search Input with Live Chittagong Dropdown */}
      <div className="relative">
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search Chittagong areas, roads, or landmarks (e.g. GEC, Medical, Agrabad)..."
            className="pr-9 focus-visible:ring-primary h-10 text-xs rounded-xl"
          />
          <div className="absolute right-2.5 top-2.5 text-muted-foreground">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsDropdownOpen(false);
                }}
              >
                <X className="h-4 w-4 hover:text-foreground" />
              </button>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* Floating Results Dropdown */}
        {isDropdownOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-[2000] mt-1 bg-card border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-border/60 animate-in fade-in zoom-in-95 duration-150">
            {searchResults.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelectResult(item)}
                className="w-full text-left p-3 hover:bg-primary/5 transition-colors flex items-start gap-2.5 group"
              >
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground block truncate">
                    {item.display_name.split(',')[0]}
                  </span>
                  <span className="text-[11px] text-muted-foreground block truncate">
                    {item.display_name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chittagong Quick Area Selector Pills */}
      <div>
        <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
          <span>Popular Chittagong Areas (১ ক্লিকে লোকেশন নির্বাচন করুন):</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLocateMe}
            className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10 gap-1 rounded-full font-medium"
          >
            <Crosshair className="h-3 w-3" /> Auto Detect GPS
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pb-1 scrollbar-thin">
          {CHITTAGONG_AREAS.map((area) => {
            const isSelected = selectedAreaName === area.name;
            return (
              <button
                key={area.name}
                type="button"
                onClick={() => handleSelectArea(area)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                    : 'bg-card text-foreground/80 border-border hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                {isSelected && <Check className="h-3 w-3" />}
                <span>{area.name}</span>
                <span className="text-[10px] opacity-75">({area.bnName})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Map Display */}
      <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-border shadow-md">
        <MapContainer
          center={position}
          zoom={CHITTAGONG_MAP_CONFIG.defaultZoom}
          minZoom={CHITTAGONG_MAP_CONFIG.minZoom}
          maxZoom={CHITTAGONG_MAP_CONFIG.maxZoom}
          maxBounds={CHITTAGONG_MAP_CONFIG.bounds}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          className="z-0"
        >
          <TileLayer
            key={activeProvider.id}
            attribution={activeProvider.attribution}
            url={activeProvider.url}
            subdomains={activeProvider.subdomains || []}
            maxZoom={activeProvider.maxZoom}
          />
          <MapRecenter center={position} />
          <MapClickHandler onClick={updatePosition} />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={deliveryPinIcon}
          />
        </MapContainer>

        {/* Floating Coordinates & Info Badge */}
        <div className="absolute bottom-2.5 left-2.5 z-[1000] bg-card/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-mono border border-border/80 shadow-md flex items-center gap-1.5">
          <Navigation className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="font-semibold text-foreground">
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </span>
          <span className="text-[10px] text-muted-foreground border-l border-border pl-1.5">
            Chattogram
          </span>
        </div>

        {/* Map Drag Instructions Overlay */}
        <div className="absolute top-2.5 right-2.5 z-[1000] bg-card/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-muted-foreground border border-border/60 pointer-events-none hidden sm:block">
          Click or drag pin to exact building
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>📍 সবুজ পিনটি ক্লিক করে আপনার চট্টগ্রাম ঠিকানায় বসান।</span>
        <span className="font-medium text-primary">চট্টগ্রাম মহানগরীর সর্বত্র দ্রুত ডেলিভারি</span>
      </div>
    </div>
  );
}

export default CheckoutMapPicker;
