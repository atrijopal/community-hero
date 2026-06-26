import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PIN_COLORS = {
  CRITICAL:  '#C13B2A',
  HIGH:      '#D4730A',
  MEDIUM:    '#D4730A',
  LOW:       '#1A7A4A',
  RESOLVED:  '#1A7A4A',
  PREDICTED: '#6B50B8',
  GHOST:     '#8B1A1A',
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
    <div style={{ height, width: '100%', border: '1px solid #E5E2DE', borderRadius: '8px', overflow: 'hidden' }}>
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
                <div style={{ fontSize: 13, minWidth: 176 }}>
                  <p style={{ fontWeight: 700, color: '#4A4A48', marginBottom: 2 }}>{ticket.publicId}</p>
                  <p style={{ color: '#7A7875', textTransform: 'capitalize' }}>{ticket.issueType?.replace('_', ' ')}</p>
                  <p style={{ color: '#B8B5B0', fontSize: 11, marginTop: 4 }}>{ticket.location?.address}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 11, color: '#7A7875' }}>
                    <span>Sev: {ticket.severity}/10</span>
                    <span>👍 {ticket.upvoteCount || 0}</span>
                  </div>
                  {onTicketClick && (
                    <button
                      onClick={() => onTicketClick(ticket)}
                      style={{ marginTop: 6, color: '#C13B2A', fontSize: 11, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
              <div style={{ fontSize: 13, minWidth: 176 }}>
                <p style={{ fontWeight: 700, color: '#6B50B8', marginBottom: 2 }}>◆ AI Prediction</p>
                <p style={{ color: '#4A4A48', textTransform: 'capitalize' }}>{pred.issueType?.replace('_', ' ')}</p>
                <p style={{ color: '#B8B5B0', fontSize: 11, marginTop: 4 }}>{pred.location}</p>
                <p style={{ color: '#6B50B8', fontSize: 11, marginTop: 4, fontWeight: 600 }}>{pred.probability}% probability</p>
                <p style={{ color: '#7A7875', fontSize: 11, marginTop: 2 }}>{pred.reason}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
