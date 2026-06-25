import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PIN_COLORS = {
  CRITICAL:  '#EA4335',
  HIGH:      '#FF6D00',
  MEDIUM:    '#FBBC04',
  LOW:       '#34A853',
  RESOLVED:  '#34A853',
  PREDICTED: '#1A73E8',
  GHOST:     '#7C3AED',
};

const getSeverityClass = (severity, status) => {
  if (status === 'RESOLVED' || status === 'CLOSED_OVERRIDE') return 'RESOLVED';
  if (status === 'GHOST_FLAGGED') return 'GHOST';
  if (severity >= 9) return 'CRITICAL';
  if (severity >= 7) return 'HIGH';
  if (severity >= 4) return 'MEDIUM';
  return 'LOW';
};

const createIcon = (color, isDashed = false) => L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid white;${isDashed ? 'border-style:dashed;' : ''}box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -18],
});

function SetView({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

export default function CommunityMap({
  tickets = [], predictions = [],
  center = [22.5726, 88.3639], zoom = 13,
  onTicketClick, height = '400px',
}) {
  return (
    <div style={{ height, width: '100%' }} className="rounded-xl overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <SetView center={center} zoom={zoom} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />

        {tickets.map(ticket => {
          if (!ticket.location?.lat) return null;
          const cls   = getSeverityClass(ticket.severity, ticket.status);
          const color = PIN_COLORS[cls];
          return (
            <Marker
              key={ticket.publicId || ticket.id}
              position={[ticket.location.lat, ticket.location.lng]}
              icon={createIcon(color)}
            >
              <Popup>
                <div className="text-sm min-w-44">
                  <p className="font-bold text-gray-900">{ticket.publicId}</p>
                  <p className="text-gray-600 capitalize">{ticket.issueType?.replace('_', ' ')}</p>
                  <p className="text-gray-500 text-xs mt-1">{ticket.location?.address}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="text-gray-500">Sev: {ticket.severity}/10</span>
                    <span className="text-gray-500">👍 {ticket.upvoteCount || 0}</span>
                  </div>
                  {onTicketClick && (
                    <button
                      onClick={() => onTicketClick(ticket)}
                      className="mt-2 text-blue-600 text-xs underline hover:text-blue-800"
                    >
                      View details →
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {predictions.map((pred, i) => (
          <Marker
            key={`pred-${i}`}
            position={[pred.lat, pred.lng]}
            icon={createIcon(PIN_COLORS.PREDICTED, true)}
          >
            <Popup>
              <div className="text-sm min-w-44">
                <p className="font-bold text-blue-700">🔵 AI Prediction</p>
                <p className="text-gray-700 capitalize">{pred.issueType?.replace('_', ' ')}</p>
                <p className="text-gray-500 text-xs mt-1">{pred.location}</p>
                <p className="text-blue-600 text-xs mt-1 font-medium">{pred.probability}% probability</p>
                <p className="text-gray-500 text-xs mt-1">{pred.reason}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
