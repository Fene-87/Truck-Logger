import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

interface MapViewProps {
  route: { lat: number; lng: number; label: string }[];
  stops: { lat: number; lng: number; type: string; duration_min: number }[];
}

const icons = {
  start: new L.Icon({ iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png', iconSize: [25,41], iconAnchor: [12,41] }),
  pickup: new L.Icon({ iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png', iconSize: [25,41], iconAnchor: [12,41] }),
  dropoff: new L.Icon({ iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png', iconSize: [25,41], iconAnchor: [12,41] }),
  rest: new L.Icon({ iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-yellow.png', iconSize: [25,41], iconAnchor: [12,41] }),
  fuel: new L.Icon({ iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-violet.png', iconSize: [25,41], iconAnchor: [12,41] }),
  route: new L.Icon.Default(),
};

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [30, 30] });
    }
  }, [positions, map]);
  return null;
}

export default function MapView({ route, stops }: MapViewProps) {
  if (!route || route.length === 0) return null;
  const positions = route.map(point => [point.lat, point.lng] as [number, number]);
  const start = positions[0];

  return (
    <div style={{ height: 400, margin: '2rem 0', borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer center={start} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <FitBounds positions={positions} />
        <Polyline positions={positions} color="#1976d2" weight={6} opacity={0.8} />
        {/* Start, Pickup, Dropoff markers */}
        {route.length > 2 && (
          <Marker position={positions[0]} icon={icons.start}><Popup>Start</Popup></Marker>
        )}
        {route.length > 2 && (
          <Marker position={positions[1]} icon={icons.pickup}><Popup>Pickup</Popup></Marker>
        )}
        {route.length > 2 && (
          <Marker position={positions[positions.length-1]} icon={icons.dropoff}><Popup>Dropoff</Popup></Marker>
        )}
        {/* Stops */}
        {stops.map((stop, idx) => (
          <Marker position={[stop.lat, stop.lng]} icon={icons[stop.type as keyof typeof icons] || icons.route} key={idx}>
            <Popup>
              <b>{stop.type === 'rest' ? 'Rest Stop' : 'Fuel Stop'}</b><br />
              Duration: {stop.duration_min} min
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
