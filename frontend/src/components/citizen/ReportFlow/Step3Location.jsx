import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ onSelect }) {
  useMapEvents({
    click(e) { onSelect(e.latlng); }
  });
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
        <h2 className="text-xl font-bold text-gray-900 mb-1">📍 Set Location</h2>
        <p className="text-sm text-gray-500">Click on the map to pin the exact location</p>
      </div>

      <button
        onClick={handleGPS}
        disabled={gpsLoading}
        className="w-full flex items-center justify-center gap-2 border-2 border-blue-200 text-blue-700 py-3 rounded-xl font-medium hover:bg-blue-50 transition text-sm"
      >
        {gpsLoading ? '📡 Getting location...' : '📡 Use My Current Location'}
      </button>

      <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 280 }}>
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
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
          <p className="font-medium text-green-700 mb-1">✅ Location selected</p>
          {loading ? (
            <p className="text-gray-400 text-xs">Getting address...</p>
          ) : (
            <p className="text-gray-600 text-xs">{address}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Ward <span className="text-red-500">*</span></label>
          <input
            value={ward} onChange={e => setWard(e.target.value)}
            placeholder="e.g. Ward 82"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
          <select
            value={city} onChange={e => setCity(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {['Kolkata','Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => onNext({ lat: position.lat, lng: position.lng, ward, city, address })}
        disabled={!canProceed}
        className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Set Location →
      </button>
    </div>
  );
}
