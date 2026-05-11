import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { MapPin, KeyRound } from 'lucide-react';

interface Props {
  pickup: [number, number]; // [lng, lat]
  destination: [number, number]; // [lng, lat]
  progress: number; // 0..1
}

// Medical Mint inspired light map style
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f3faf6' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#1f4d3a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#dbece2' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cdebdf' }] },
  { featureType: 'landscape.natural', stylers: [{ color: '#e8f5ed' }] },
];

export const LiveDeliveryMap = ({ pickup, destination, progress }: Props) => {
  const { googleMapsKey, setGoogleMapsKey } = useAppStore();
  const [tempKey, setTempKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const driverMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeRef = useRef<google.maps.LatLngLiteral[]>([]);

  // pickup/destination come in as [lng, lat]
  const pickupLatLng: google.maps.LatLngLiteral = { lat: pickup[1], lng: pickup[0] };
  const destLatLng: google.maps.LatLngLiteral = { lat: destination[1], lng: destination[0] };

  useEffect(() => {
    if (!googleMapsKey || !mapContainer.current || mapRef.current) return;

    setOptions({ key: googleMapsKey, v: 'weekly' });

    let cancelled = false;

    (async () => {
      try {
        const [{ Map, Polyline }, { Marker }, { DirectionsService, TravelMode }, { LatLngBounds, SymbolPath }] = await Promise.all([
          importLibrary('maps'),
          importLibrary('marker'),
          importLibrary('routes'),
          importLibrary('core'),
        ]);

        if (cancelled || !mapContainer.current) return;

        const map = new Map(mapContainer.current, {
          center: pickupLatLng,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          styles: MAP_STYLE,
          backgroundColor: '#f3faf6',
        });
        mapRef.current = map;

        // Pickup marker (pharmacy)
        new Marker({
          position: pickupLatLng,
          map,
          title: 'Pharmacy',
          icon: {
            path: SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#0d9488',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        });
        // Destination marker
        new Marker({
          position: destLatLng,
          map,
          title: 'Delivery address',
          icon: {
            path: SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#14532d',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        });

        // Get route via Directions API
        let coords: google.maps.LatLngLiteral[] = [pickupLatLng, destLatLng];
        try {
          const directions = new DirectionsService();
          const result = await directions.route({
            origin: pickupLatLng,
            destination: destLatLng,
            travelMode: TravelMode.DRIVING,
          });
          const path = result.routes?.[0]?.overview_path;
          if (path && path.length > 1) coords = path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
        } catch (e) {
          console.warn('Google Directions failed', e);
        }
        routeRef.current = coords;

        // Glow + main route line
        new Polyline({
          path: coords,
          map,
          strokeColor: '#10b981',
          strokeOpacity: 0.2,
          strokeWeight: 12,
        });
        new Polyline({
          path: coords,
          map,
          strokeColor: '#10b981',
          strokeOpacity: 1,
          strokeWeight: 4,
        });

        // Fit bounds
        const bounds = new LatLngBounds();
        coords.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, 60);

        // Driver marker (animated)
        const startIdx = Math.min(coords.length - 1, Math.max(0, Math.floor(progress * (coords.length - 1))));
        driverMarkerRef.current = new Marker({
          position: coords[startIdx],
          map,
          title: 'Courier',
          icon: {
            path: SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 4,
          },
          zIndex: 999,
        });
      } catch (e) {
        console.error(e);
        setError('Failed to load Google Maps. Check that your API key is valid and has Maps JavaScript API + Directions API enabled.');
      }
    })();

    return () => {
      cancelled = true;
      driverMarkerRef.current?.setMap(null);
      driverMarkerRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsKey, pickup[0], pickup[1], destination[0], destination[1]]);

  // Update driver position when progress changes
  useEffect(() => {
    const coords = routeRef.current;
    if (!driverMarkerRef.current || coords.length === 0) return;
    const idx = Math.min(coords.length - 1, Math.max(0, Math.floor(progress * (coords.length - 1))));
    driverMarkerRef.current.setPosition(coords[idx]);
  }, [progress]);

  if (!googleMapsKey) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-gradient-soft">
        <div className="grid h-12 w-12 mx-auto place-items-center rounded-full bg-primary/15 text-primary mb-3">
          <KeyRound className="h-5 w-5" />
        </div>
        <h4 className="font-display font-semibold mb-1">Add your Google Maps API key</h4>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Get a key in <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noreferrer" className="text-primary underline">Google Cloud Console</a>.
          Enable <strong>Maps JavaScript API</strong> and <strong>Directions API</strong>, and restrict it to your domain.
        </p>
        <div className="flex gap-2 max-w-md mx-auto">
          <Input placeholder="AIzaSy..." value={tempKey} onChange={(e) => setTempKey(e.target.value)} />
          <Button onClick={() => setGoogleMapsKey(tempKey.trim())} disabled={!tempKey.trim()}>Save</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border shadow-card">
      <div ref={mapContainer} className="h-[420px] w-full bg-secondary" />
      <div className="absolute top-3 left-3 pill bg-card/90 backdrop-blur shadow-sm">
        <MapPin className="h-3 w-3 text-primary" />
        <span>Live tracking</span>
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft ml-1" />
      </div>
      {error && (
        <div className="absolute inset-x-3 bottom-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs p-3">
          {error}{' '}
          <button className="underline ml-1" onClick={() => { setGoogleMapsKey(''); setError(null); }}>Reset key</button>
        </div>
      )}
    </div>
  );
};
