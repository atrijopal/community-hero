import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { IconCurrentLocation, IconSearch, IconMapPin } from '@tabler/icons-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Fallback coords when user types address but doesn't pin map
const CITY_CENTRES = {
  Kolkata:   { lat: 22.5726, lng: 88.3639 },
  Mumbai:    { lat: 19.0760, lng: 72.8777 },
  Delhi:     { lat: 28.6139, lng: 77.2090 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai:   { lat: 13.0827, lng: 80.2707 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Pune:      { lat: 18.5204, lng: 73.8567 },
};

function LocationPicker({ onSelect }) {
  useMapEvents({ click(e) { onSelect(e.latlng); } });
  return null;
}

function MapSync({ position }) {
  const map  = useMap();
  const prev = useRef(null);
  if (position && (prev.current?.lat !== position.lat || prev.current?.lng !== position.lng)) {
    map.flyTo([position.lat, position.lng], 16, { duration: 0.8 });
    prev.current = position;
  }
  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
      headers: { 'User-Agent': 'CommunityHero/1.0' },
    });
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

async function forwardGeocode(query) {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'CommunityHero/1.0' } },
    );
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
  } catch {
    return null;
  }
}

const inputStyle = { border: '1px solid #E5E2DE', borderRadius: '6px', padding: '10px 12px', fontSize: 14, width: '100%', outline: 'none', color: '#4A4A48' };

export default function Step3Location({ onNext }) {
  const [position, setPosition]       = useState(null);
  const [address, setAddress]         = useState('');
  const [manualAddress, setManualAddress] = useState(''); // user-typed, not geocoded
  const [ward, setWard]               = useState('');
  const [city, setCity]               = useState('Kolkata');
  const [loading, setLoading]         = useState(false);
  const [gpsLoading, setGpsLoading]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching]     = useState(false);
  const [searchErr, setSearchErr]     = useState('');

  const handleMapClick = async (latlng) => {
    setPosition(latlng);
    setManualAddress('');
    setLoading(true);
    const addr = await reverseGeocode(latlng.lat, latlng.lng);
    setAddress(addr);
    setSearchQuery(addr);
    setLoading(false);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition({ lat, lng });
        setManualAddress('');
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        setSearchQuery(addr);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchErr('');
    const result = await forwardGeocode(`${searchQuery}, ${city}, India`);
    if (result) {
      setPosition({ lat: result.lat, lng: result.lng });
      setAddress(result.display);
      setManualAddress('');
      setSearchErr('');
    } else {
      setSearchErr('Address not found on map. Your text will be saved as-is.');
      setManualAddress(searchQuery);
      setPosition(null);
    }
    setSearching(false);
  };

  // canProceed: either map pin set OR manual address typed
  const hasLocation = (position && address) || manualAddress.trim();
  const canProceed  = !!hasLocation && ward.trim() && city;

  const handleNext = () => {
    const centre = CITY_CENTRES[city] || CITY_CENTRES.Kolkata;
    onNext({
      lat:     position?.lat ?? centre.lat,
      lng:     position?.lng ?? centre.lng,
      ward,
      city,
      address: manualAddress || address,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#4A4A48' }}>Set Location</h2>
        <p className="text-sm" style={{ color: '#7A7875' }}>Search an address, use GPS, or tap the map</p>
      </div>

      {/* Address search */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          Search Address / Landmark
        </label>
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. Brabourn Road, Lake Town, Ward 82…"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#4A4A48', borderRadius: '6px', whiteSpace: 'nowrap' }}
          >
            <IconSearch size={14} stroke={2} />
            {searching ? '…' : 'Find'}
          </button>
        </div>
        {searchErr && (
          <p className="mt-1.5 text-xs px-2 py-1.5" style={{ color: '#8B6600', backgroundColor: '#FFF8E0', borderRadius: '4px' }}>
            {searchErr}
          </p>
        )}
      </div>

      {/* GPS */}
      <button
        onClick={handleGPS}
        disabled={gpsLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium border transition"
        style={{ borderColor: '#C13B2A', color: '#C13B2A', borderRadius: '6px', backgroundColor: 'white' }}
      >
        <IconCurrentLocation size={15} stroke={1.5} />
        {gpsLoading ? 'Getting location…' : 'Use My Current Location'}
      </button>

      {/* Manual address fallback */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          Or type address manually
        </label>
        <input
          value={manualAddress}
          onChange={e => { setManualAddress(e.target.value); if (e.target.value) { setPosition(null); setAddress(''); } }}
          placeholder="Full address if map search doesn't work…"
          style={inputStyle}
        />
        {manualAddress && (
          <p className="text-xs mt-1" style={{ color: '#7A7875' }}>
            City-centre coordinates will be used for mapping. Officers will use the text address to locate the issue.
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: '#E5E2DE' }} />
        <span className="text-xs" style={{ color: '#B8B5B0' }}>or tap the map</span>
        <div className="flex-1 h-px" style={{ backgroundColor: '#E5E2DE' }} />
      </div>

      {/* Map */}
      <div className="overflow-hidden border" style={{ height: 240, borderRadius: '8px', borderColor: '#E5E2DE' }}>
        <MapContainer
          center={[22.5726, 88.3639]}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationPicker onSelect={handleMapClick} />
          <MapSync position={position} />
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>

      {/* Confirmed location badge */}
      {hasLocation && (
        <div className="flex items-start gap-2 border p-3 text-sm"
          style={{ backgroundColor: '#E8F5EE', borderColor: '#A7D5B9', borderRadius: '6px' }}>
          <IconMapPin size={15} stroke={1.5} style={{ color: '#1A7A4A', flexShrink: 0, marginTop: 1 }} />
          <div className="min-w-0">
            {loading ? (
              <p className="text-xs" style={{ color: '#7A7875' }}>Getting address…</p>
            ) : (
              <>
                <p className="font-medium text-xs" style={{ color: '#1A7A4A' }}>
                  {manualAddress ? 'Manual address saved' : 'Location pinned on map'}
                </p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#4A4A48' }}>
                  {manualAddress || address}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ward + City */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#4A4A48' }}>
            Ward <span style={{ color: '#C13B2A' }}>*</span>
          </label>
          <input value={ward} onChange={e => setWard(e.target.value)} placeholder="e.g. 82" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#4A4A48' }}>
            City <span style={{ color: '#C13B2A' }}>*</span>
          </label>
          <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
            {['Kolkata','Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!canProceed}
        className="w-full py-3.5 font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}
      >
        Set Location →
      </button>
    </div>
  );
}
