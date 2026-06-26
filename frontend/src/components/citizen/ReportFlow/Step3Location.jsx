import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { IconCurrentLocation } from '@tabler/icons-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ onSelect }) {
  useMapEvents({ click(e) { onSelect(e.latlng); } });
  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'User-Agent': 'CommunityHero/1.0' }
    });
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

const inputStyle = { border: '1px solid #E5E2DE', borderRadius: '6px', padding: '10px 12px', fontSize: 14, width: '100%', outline: 'none' };

export default function Step3Location({ onNext }) {
  const [position, setPosition] = useState(null);
  const [address, setAddress]   = useState('');
  const [ward, setWard]         = useState('');
  const [city, setCity]         = useState('Kolkata');
  const [loading, setLoading]   = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleMapClick = async (latlng) => {
    setPosition(latlng);
    setLoading(true);
    const addr = await reverseGeocode(latlng.lat, latlng.lng);
    setAddress(addr);
    setLoading(false);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const latlng = { lat, lng };
        setPosition(latlng);
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        setGpsLoading(false);
      },
      () => setGpsLoading(false)
    );
  };

  const canProceed = position && ward && city;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#4A4A48' }}>Set Location</h2>
        <p className="text-sm" style={{ color: '#7A7875' }}>Click on the map to pin the exact location</p>
      </div>

      <button
        onClick={handleGPS}
        disabled={gpsLoading}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium border transition"
        style={{ borderColor: '#C13B2A', color: '#C13B2A', borderRadius: '6px', backgroundColor: 'white' }}
      >
        <IconCurrentLocation size={15} stroke={1.5} />
        {gpsLoading ? 'Getting location…' : 'Use My Current Location'}
      </button>

      <div className="overflow-hidden border" style={{ height: 280, borderRadius: '8px', borderColor: '#E5E2DE' }}>
        <MapContainer
          center={position ? [position.lat, position.lng] : [22.5726, 88.3639]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationPicker onSelect={handleMapClick} />
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>

      {position && (
        <div className="border p-3 text-sm" style={{ backgroundColor: '#E8F5EE', borderColor: '#A7D5B9', borderRadius: '6px' }}>
          <p className="font-medium mb-1" style={{ color: '#1A7A4A' }}>Location selected</p>
          {loading ? (
            <p className="text-xs" style={{ color: '#7A7875' }}>Getting address…</p>
          ) : (
            <p className="text-xs" style={{ color: '#4A4A48' }}>{address}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4A4A48' }}>Ward <span style={{ color: '#C13B2A' }}>*</span></label>
          <input value={ward} onChange={e => setWard(e.target.value)} placeholder="e.g. Ward 82" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4A4A48' }}>City <span style={{ color: '#C13B2A' }}>*</span></label>
          <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
            {['Kolkata','Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => onNext({ lat: position.lat, lng: position.lng, ward, city, address })}
        disabled={!canProceed}
        className="w-full py-3.5 font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
      >
        Set Location →
      </button>
    </div>
  );
}
