import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

// Severity → visual config
const SEV_CONFIG = {
  CRITICAL: { color: '#C13B2A', bg: '#FDF1EF', size: 26, label: 'Critical (9-10)', ring: true },
  HIGH:     { color: '#D4730A', bg: '#FEF3E7', size: 22, label: 'High (7-8)',      ring: false },
  MEDIUM:   { color: '#D4730A', bg: '#FEF3E7', size: 18, label: 'Medium (4-6)',    ring: false },
  LOW:      { color: '#1A7A4A', bg: '#E8F5EE', size: 14, label: 'Low (1-3)',       ring: false },
  RESOLVED: { color: '#1A7A4A', bg: '#E8F5EE', size: 14, label: 'Resolved',        ring: false },
  GHOST:    { color: '#8B1A1A', bg: '#F5EAEA', size: 22, label: 'Ghost Flagged',   ring: true  },
  PREDICTED:{ color: '#6B50B8', bg: '#EDE9F8', size: 16, label: 'AI Prediction',   ring: false },
};

const STATUS_LABELS = {
  UNASSIGNED:      'Unassigned',
  ASSIGNED:        'Assigned',
  IN_PROGRESS:     'In Progress',
  RESOLVED:        'Resolved',
  GHOST_FLAGGED:   'Ghost Flagged',
  CLOSED_OVERRIDE: 'Closed',
};

const getSevKey = (severity, status) => {
  if (status === 'RESOLVED' || status === 'CLOSED_OVERRIDE') return 'RESOLVED';
  if (status === 'GHOST_FLAGGED') return 'GHOST';
  if (severity >= 9) return 'CRITICAL';
  if (severity >= 7) return 'HIGH';
  if (severity >= 4) return 'MEDIUM';
  return 'LOW';
};

const createPin = (cfg, isPredicted = false) => {
  const { color, size, ring } = cfg;
  const pulse = ring
    ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${color};opacity:0.5;animation:pulse 1.5s infinite;"></div>`
    : '';
  return L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulse}
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};border:2.5px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          ${isPredicted ? `border-style:dashed;background:white;` : ''}
          display:flex;align-items:center;justify-content:center;
        ">
          ${isPredicted ? `<div style="width:${size * 0.5}px;height:${size * 0.5}px;border-radius:50%;background:${color};"></div>` : ''}
        </div>
      </div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor:[0, -size],
    tooltipAnchor: [size / 2 + 2, -size / 2],
  });
};

function SetView({ center, zoom }) {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom); }, [center, zoom, map]);
  return null;
}

function Legend() {
  const entries = [
    { color: '#C13B2A', label: 'Critical (sev 9–10)', ring: true },
    { color: '#D4730A', label: 'High / Medium',        ring: false },
    { color: '#1A7A4A', label: 'Low / Resolved',       ring: false },
    { color: '#8B1A1A', label: 'Ghost Flagged',         ring: true  },
    { color: '#6B50B8', label: 'AI Prediction',         dashed: true },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 28, right: 10, zIndex: 999,
      background: 'rgba(255,255,255,0.95)', border: '1px solid #E5E2DE',
      borderRadius: 8, padding: '10px 12px', fontSize: 11, lineHeight: '18px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.12)', minWidth: 150,
    }}>
      <p style={{ fontWeight: 700, color: '#4A4A48', marginBottom: 6, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Legend</p>
      {entries.map(e => (
        <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: e.dashed ? 'white' : e.color,
            border: `2px ${e.dashed ? 'dashed' : 'solid'} ${e.color}`,
            boxShadow: e.ring ? `0 0 0 2px ${e.color}40` : 'none',
            flexShrink: 0,
          }} />
          <span style={{ color: '#4A4A48' }}>{e.label}</span>
        </div>
      ))}
    </div>
  );
}

const SEV_BAR = (s) => {
  const pct = (s / 10) * 100;
  const clr = s >= 9 ? '#C13B2A' : s >= 7 ? '#D4730A' : s >= 4 ? '#D4730A' : '#1A7A4A';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
      <div style={{ flex: 1, height: 4, background: '#F0EDE9', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: clr, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color: clr, fontWeight: 700, minWidth: 30 }}>{s}/10</span>
    </div>
  );
};

export default function CommunityMap({
  tickets = [], predictions = [],
  center = [22.5726, 88.3639], zoom = 13,
  onTicketClick, height = '400px',
}) {
  return (
    <div style={{ height, width: '100%', border: '1px solid #E5E2DE', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.4);opacity:0.2} }
        .leaflet-tooltip { padding:3px 7px!important; border-radius:4px!important; font-size:10px!important; white-space:nowrap!important; }
        .leaflet-popup-content-wrapper { border-radius:8px!important; box-shadow:0 4px 16px rgba(0,0,0,0.15)!important; }
        .leaflet-popup-content { margin:12px 14px!important; }
      `}</style>

      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <SetView center={center} zoom={zoom} />

        {/* CartoDB light tiles — cleaner than OSM */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {tickets.map(ticket => {
          if (!ticket.location?.lat) return null;
          const key = getSevKey(ticket.severity, ticket.status);
          const cfg = SEV_CONFIG[key];
          return (
            <Marker
              key={ticket.publicId || ticket.id}
              position={[ticket.location.lat, ticket.location.lng]}
              icon={createPin(cfg)}
            >
              {/* Permanent label — ticket ID */}
              <Tooltip permanent direction="right" offset={[4, 0]}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: cfg.color }}>
                  {ticket.publicId?.split('-').pop()}
                </span>
              </Tooltip>

              <Popup>
                <div style={{ minWidth: 200, fontFamily: 'system-ui, sans-serif' }}>
                  {/* Header strip */}
                  <div style={{ background: cfg.color, margin: '-12px -14px 10px', padding: '8px 12px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>{ticket.publicId}</span>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10 }}>
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                  </div>

                  <p style={{ fontWeight: 700, color: '#4A4A48', fontSize: 13, marginBottom: 2, textTransform: 'capitalize' }}>
                    {ticket.issueType?.replace(/_/g, ' ')}
                  </p>
                  <p style={{ color: '#7A7875', fontSize: 11, marginBottom: 6 }}>
                    {ticket.location?.address?.substring(0, 70)}{ticket.location?.address?.length > 70 ? '…' : ''}
                  </p>

                  {SEV_BAR(ticket.severity)}

                  <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, color: '#7A7875' }}>
                    <span>👍 {ticket.upvoteCount || 0} upvotes</span>
                    {ticket.assignedOfficerName && <span>· {ticket.assignedOfficerName}</span>}
                  </div>

                  {ticket.description && (
                    <p style={{ fontSize: 11, color: '#7A7875', marginTop: 6, borderTop: '1px solid #F0EDE9', paddingTop: 6 }}>
                      {ticket.description?.substring(0, 100)}{ticket.description?.length > 100 ? '…' : ''}
                    </p>
                  )}

                  {onTicketClick && (
                    <button onClick={() => onTicketClick(ticket)} style={{
                      marginTop: 8, color: 'white', fontSize: 11, fontWeight: 600,
                      background: cfg.color, border: 'none', cursor: 'pointer', padding: '5px 10px',
                      borderRadius: 4, width: '100%',
                    }}>
                      View full ticket →
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
            icon={createPin(SEV_CONFIG.PREDICTED, true)}
          >
            <Tooltip permanent direction="right" offset={[4, 0]}>
              <span style={{ color: '#6B50B8', fontWeight: 600 }}>AI</span>
            </Tooltip>
            <Popup>
              <div style={{ minWidth: 190, fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ background: '#6B50B8', margin: '-12px -14px 10px', padding: '8px 12px', borderRadius: '8px 8px 0 0' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>◆ AI Prediction</span>
                </div>
                <p style={{ fontWeight: 700, color: '#4A4A48', fontSize: 13, marginBottom: 2, textTransform: 'capitalize' }}>
                  {pred.issueType?.replace(/_/g, ' ')}
                </p>
                <p style={{ color: '#B8B5B0', fontSize: 11, marginBottom: 6 }}>{pred.location}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: '#6B50B8', fontWeight: 700 }}>{pred.probability}% probability</span>
                  <span style={{ color: '#7A7875' }}>{pred.timeframe}</span>
                </div>
                {pred.reason && (
                  <p style={{ fontSize: 11, color: '#7A7875', marginTop: 6, borderTop: '1px solid #F0EDE9', paddingTop: 6 }}>
                    {pred.reason}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <Legend />
    </div>
  );
}
