import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Crosshair, Search, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

// Custom home icon for delivery location
const deliveryPinIcon = L.divIcon({
  className: 'checkout-delivery-pin',
  html: `<div style="
    width: 32px; height: 32px; border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    display: flex; align-items: center; justify-content: center;
    cursor: grab;
  ">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
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

/** Handles map clicks to update marker location */
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Programmatically recenters the map when position updates externally */
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export function CheckoutMapPicker({ initialCoords, onChange, onAddressSelect }: CheckoutMapPickerProps) {
  const [position, setPosition] = useState<[number, number]>([initialCoords.lat, initialCoords.lng]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const markerRef = useRef<L.Marker | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal position if initialCoords change
  useEffect(() => {
    setPosition([initialCoords.lat, initialCoords.lng]);
  }, [initialCoords.lat, initialCoords.lng]);

  const updatePosition = useCallback((lat: number, lng: number, addressName?: string) => {
    const newPos: [number, number] = [lat, lng];
    setPosition(newPos);
    onChange({ lat, lng });

    if (addressName && onAddressSelect) {
      onAddressSelect(addressName);
    }
  }, [onChange, onAddressSelect]);

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const latLng = marker.getLatLng();
      updatePosition(latLng.lat, latLng.lng);
    }
  };

  // Debounced search query fetching via OpenStreetMap Nominatim
  const fetchSearchResults = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
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
    }, 400);
  };

  const handleSelectResult = (item: NominatimResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    updatePosition(lat, lng, item.display_name);
    setSearchQuery(item.display_name.split(',')[0]);
    setIsDropdownOpen(false);
    toast.success('Map pin updated to selected location');
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast.info('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updatePosition(pos.coords.latitude, pos.coords.longitude);
        toast.success('Location updated to your current position');
      },
      (err) => {
        console.error(err);
        toast.error('Could not detect location. Please select manually on the map.');
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

  return (
    <div className="space-y-3">
      {/* Search Input with Live Dropdown Panel */}
      <div className="relative">
        <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground mb-1.5">
          <Search className="h-3.5 w-3.5 text-primary" /> Search Location & Address
        </label>
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search city, area, or street (e.g., GEC Circle, Chattogram)"
            className="pr-9 focus-visible:ring-primary h-10 text-xs"
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
          <div className="absolute top-full left-0 right-0 z-[2000] mt-1 bg-card border border-border rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-border/60 animate-in fade-in zoom-in-95 duration-150">
            {searchResults.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelectResult(item)}
                className="w-full text-left p-3 hover:bg-primary/5 transition-colors flex items-start gap-2.5 group"
              >
                <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs leading-normal font-medium text-foreground line-clamp-2">
                  {item.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Pin delivery location on map
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLocateMe}
          className="h-7 text-xs rounded-full gap-1 border-primary/30 text-primary hover:bg-primary/10"
        >
          <Crosshair className="h-3 w-3" /> Locate Me
        </Button>
      </div>

      {/* Map Display */}
      <div className="relative h-48 w-full rounded-xl overflow-hidden border border-border shadow-sm">
        <MapContainer
          center={position}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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

        <div className="absolute bottom-2 left-2 z-[1000] bg-card/90 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-mono border border-border/60 shadow-sm flex items-center gap-1">
          <Navigation className="h-3 w-3 text-primary animate-pulse" />
          <span>
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground italic">
        Click anywhere on the map, drag the green pin, or use the search box to set your exact location.
      </p>
    </div>
  );
}
