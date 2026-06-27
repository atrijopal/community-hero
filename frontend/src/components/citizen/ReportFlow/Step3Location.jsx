import { useState, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { IconCurrentLocation, IconSearch, IconMapPin } from '@tabler/icons-react';
import { useTranslateMap } from '../../../hooks/useTranslate';

const GKEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

const CITY_CENTRES = {
  Kolkata:   { lat: 22.5726, lng: 88.3639 },
  Mumbai:    { lat: 19.0760, lng: 72.8777 },
  Delhi:     { lat: 28.6139, lng: 77.2090 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Chennai:   { lat: 13.0827, lng: 80.2707 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Pune:      { lat: 18.5204, lng: 73.8567 },
};

const MAP_OPTS = {
  streetViewControl: false, mapTypeControl: false,
  fullscreenControl: false, scaleControl: false,
  clickableIcons: false,
  styles: [
    { featureType: 'poi',              elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit.station',  elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ],
};

const STRINGS = {
  title:             'Set Location',
  subtitle:          'Search an address, use GPS, or tap the map',
  searchLabel:       'Search Address / Landmark',
  searchPlaceholder: 'e.g. Brabourn Road, Lake Town, Ward 82…',
  findBtn:           'Find',
  searching:         '…',
  gpsBtn:            'Use My Current Location',
  gettingLocation:   'Getting location…',
  manualLabel:       'Or type address manually',
  manualPlaceholder: 'Full address if map search doesn\'t work…',
  manualNote:        'City-centre coordinates used for mapping. Officers will use your text to locate the issue.',
  orTapMap:          'or tap the map',
  loadingMap:        'Loading map…',
  addressNotFound:   'Address not found. Your text will be saved as typed.',
  gettingAddress:    'Getting address from Google Maps…',
  manualSaved:       'Manual address saved',
  locationPinned:    'Location pinned ✓',
  wardLabel:         'Ward',
  cityLabel:         'City',
  setLocationBtn:    'Set Location →',
};

async function reverseGeocode(lat, lng) {
  try {
    const res  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GKEY}`);
    const data = await res.json();
    if (data.status === 'OK' && data.results[0]) return data.results[0].formatted_address;
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function forwardGeocode(query) {
  try {
    const res  = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GKEY}`);
    const data = await res.json();
    if (data.status === 'OK' && data.results[0]) {
      const loc = data.results[0].geometry.location;
      return { lat: loc.lat, lng: loc.lng, display: data.results[0].formatted_address };
    }
    return null;
  } catch {
    return null;
  }
}

const inputStyle = {
  border: '1px solid #E5E2DE', borderRadius: '6px', padding: '10px 12px',
  fontSize: 14, width: '100%', outline: 'none', color: '#4A4A48',
};

export default function Step3Location({ onNext }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GKEY });
  const tr           = useTranslateMap(STRINGS);

  const [position, setPosition]           = useState(null);
  const [address, setAddress]             = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [ward, setWard]                   = useState('');
  const [city, setCity]                   = useState('Kolkata');
  const [loading, setLoading]             = useState(false);
  const [gpsLoading, setGpsLoading]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searching, setSearching]         = useState(false);
  const [searchErr, setSearchErr]         = useState('');
  const [mapCenter, setMapCenter]         = useState(CITY_CENTRES.Kolkata);

  const handleMapClick = useCallback(async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPosition({ lat, lng });
    setManualAddress('');
    setLoading(true);
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
    setSearchQuery(addr);
    setLoading(false);
  }, []);

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        const pos = { lat, lng };
        setPosition(pos);
        setMapCenter(pos);
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
      const pos = { lat: result.lat, lng: result.lng };
      setPosition(pos);
      setMapCenter(pos);
      setAddress(result.display);
      setManualAddress('');
      setSearchErr('');
    } else {
      setSearchErr(tr.addressNotFound);
      setManualAddress(searchQuery);
      setPosition(null);
    }
    setSearching(false);
  };

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

  const pinIcon = isLoaded ? {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28S32 28 32 16C32 7.16 24.84 0 16 0z" fill="#C13B2A"/>
        <circle cx="16" cy="16" r="7" fill="white"/>
      </svg>`)}`,
    scaledSize: new window.google.maps.Size(32, 44),
    anchor:     new window.google.maps.Point(16, 44),
  } : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#4A4A48' }}>{tr.title}</h2>
        <p className="text-sm" style={{ color: '#7A7875' }}>{tr.subtitle}</p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          {tr.searchLabel}
        </label>
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={tr.searchPlaceholder}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleSearch} disabled={searching || !searchQuery.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#4A4A48', borderRadius: '6px', whiteSpace: 'nowrap' }}>
            <IconSearch size={14} stroke={2} />
            {searching ? tr.searching : tr.findBtn}
          </button>
        </div>
        {searchErr && (
          <p className="mt-1.5 text-xs px-2 py-1.5" style={{ color: '#8B6600', backgroundColor: '#FFF8E0', borderRadius: '4px' }}>
            {searchErr}
          </p>
        )}
      </div>

      <button onClick={handleGPS} disabled={gpsLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium border transition"
        style={{ borderColor: '#C13B2A', color: '#C13B2A', borderRadius: '6px', backgroundColor: 'white' }}>
        <IconCurrentLocation size={15} stroke={1.5} />
        {gpsLoading ? tr.gettingLocation : tr.gpsBtn}
      </button>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#7A7875' }}>
          {tr.manualLabel}
        </label>
        <input
          value={manualAddress}
          onChange={e => { setManualAddress(e.target.value); if (e.target.value) { setPosition(null); setAddress(''); } }}
          placeholder={tr.manualPlaceholder}
          style={inputStyle}
        />
        {manualAddress && (
          <p className="text-xs mt-1" style={{ color: '#7A7875' }}>{tr.manualNote}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: '#E5E2DE' }} />
        <span className="text-xs" style={{ color: '#B8B5B0' }}>{tr.orTapMap}</span>
        <div className="flex-1 h-px" style={{ backgroundColor: '#E5E2DE' }} />
      </div>

      <div className="overflow-hidden border" style={{ height: 260, borderRadius: '8px', borderColor: '#E5E2DE' }}>
        {!isLoaded ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3F0' }}>
            <p style={{ color: '#B8B5B0', fontSize: 13 }}>{tr.loadingMap}</p>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ height: '100%', width: '100%' }}
            center={mapCenter}
            zoom={14}
            options={MAP_OPTS}
            onClick={handleMapClick}
          >
            {position && pinIcon && <Marker position={position} icon={pinIcon} />}
          </GoogleMap>
        )}
      </div>

      {hasLocation && (
        <div className="flex items-start gap-2 border p-3 text-sm"
          style={{ backgroundColor: '#E8F5EE', borderColor: '#A7D5B9', borderRadius: '6px' }}>
          <IconMapPin size={15} stroke={1.5} style={{ color: '#1A7A4A', flexShrink: 0, marginTop: 1 }} />
          <div className="min-w-0">
            {loading ? (
              <p className="text-xs" style={{ color: '#7A7875' }}>{tr.gettingAddress}</p>
            ) : (
              <>
                <p className="font-medium text-xs" style={{ color: '#1A7A4A' }}>
                  {manualAddress ? tr.manualSaved : tr.locationPinned}
                </p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#4A4A48' }}>
                  {manualAddress || address}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#4A4A48' }}>
            {tr.wardLabel} <span style={{ color: '#C13B2A' }}>*</span>
          </label>
          <input value={ward} onChange={e => setWard(e.target.value)} placeholder="e.g. 82" style={inputStyle} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#4A4A48' }}>
            {tr.cityLabel} <span style={{ color: '#C13B2A' }}>*</span>
          </label>
          <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
            {Object.keys(CITY_CENTRES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <button onClick={handleNext} disabled={!canProceed}
        className="w-full py-3.5 font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>
        {tr.setLocationBtn}
      </button>
    </div>
  );
}
