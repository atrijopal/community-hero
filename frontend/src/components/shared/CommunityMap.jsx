import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

const GKEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

const KOLKATA = { lat: 22.5726, lng: 88.3639 };

const SEV_CONFIG = {
  CRITICAL:  { color: '#C13B2A', size: 28 },
  HIGH:      { color: '#D4730A', size: 22 },
  MEDIUM:    { color: '#D4730A', size: 17 },
  LOW:       { color: '#1A7A4A', size: 14 },
  RESOLVED:  { color: '#1A7A4A', size: 14 },
  GHOST:     { color: '#8B1A1A', size: 22 },
  PREDICTED: { color: '#6B50B8', size: 16 },
};

const STATUS_LABEL = {
  UNASSIGNED: 'Unassigned', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved', GHOST_FLAGGED: 'Ghost Flagged', CLOSED_OVERRIDE: 'Closed',
  ESCALATED: 'Escalated', RTI_FILED: 'RTI Filed',
};

function getSevKey(severity, status) {
  if (status === 'RESOLVED' || status === 'CLOSED_OVERRIDE') return 'RESOLVED';
  if (status === 'GHOST_FLAGGED') return 'GHOST';
  if (severity >= 9) return 'CRITICAL';
  if (severity >= 7) return 'HIGH';
  if (severity >= 4) return 'MEDIUM';
  return 'LOW';
}

function makeIcon(color, size, dashed = false) {
  const r  = size / 2 - 2;
  const cx = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${cx}" cy="${cx}" r="${r}"
      fill="${dashed ? 'white' : color}" stroke="${color}" stroke-width="2.5"
      ${dashed ? 'stroke-dasharray="4 2"' : ''}/>
    ${dashed ? `<circle cx="${cx}" cy="${cx}" r="${r * 0.45}" fill="${color}"/>` : ''}
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(size, size),
    anchor:     new window.google.maps.Point(cx, cx),
    labelOrigin: new window.google.maps.Point(cx, -6),
  };
}

const MAP_OPTS = {
  streetViewControl: false, mapTypeControl: false,
  fullscreenControl: true,  scaleControl: false, zoomControl: true,
  clickableIcons: false,
  styles: [
    { featureType: 'poi',             elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit.station', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'water',    elementType: 'geometry', stylers: [{ color: '#c9d8e8' }] },
    { featureType: 'landscape',elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
  ],
};

function Legend() {
  const entries = [
    { color: '#C13B2A', label: 'Critical (sev 9–10)', dashed: false },
    { color: '#D4730A', label: 'High / Medium',        dashed: false },
    { color: '#1A7A4A', label: 'Low / Resolved',       dashed: false },
    { color: '#8B1A1A', label: 'Ghost Flagged',        dashed: false },
    { color: '#6B50B8', label: 'AI Prediction',        dashed: true  },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 36, right: 12, zIndex: 10,
      background: 'rgba(255,255,255,0.96)', border: '1px solid #E5E2DE',
      borderRadius: 8, padding: '10px 14px', fontSize: 11, lineHeight: '22px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.14)', minWidth: 158, pointerEvents: 'none',
    }}>
      <p style={{ fontWeight: 700, color: '#4A4A48', marginBottom: 4, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Legend</p>
      {entries.map(e => (
        <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 11, height: 11, borderRadius: '50%', flexShrink: 0,
            background: e.dashed ? 'white' : e.color,
            border: `2px ${e.dashed ? 'dashed' : 'solid'} ${e.color}`,
          }} />
          <span style={{ color: '#4A4A48' }}>{e.label}</span>
        </div>
      ))}
    </div>
  );
}

function SevBar({ severity }) {
  const pct = (severity / 10) * 100;
  const clr = severity >= 9 ? '#C13B2A' : severity >= 7 ? '#D4730A' : '#1A7A4A';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
      <div style={{ flex: 1, height: 4, background: '#F0EDE9', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: clr, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color: clr, fontWeight: 700, minWidth: 30 }}>{severity}/10</span>
    </div>
  );
}

export default function CommunityMap({
  tickets = [], predictions = [],
  center = KOLKATA, zoom = 13,
  onTicketClick, height = '400px',
}) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GKEY, id: 'google-map-script' });
  const [selected, setSelected] = useState(null);
  const mapRef = useRef(null);

  const onLoad = useCallback(map => {
    mapRef.current = map;
  }, []);

  // Fit bounds to all markers whenever tickets change and map is ready
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    const located = tickets.filter(t => t.location?.lat && t.location?.lng);
    if (located.length === 0) {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(zoom);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    located.forEach(t => bounds.extend({ lat: t.location.lat, lng: t.location.lng }));
    predictions.forEach(p => p.lat && bounds.extend({ lat: p.lat, lng: p.lng }));
    mapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    // Don't over-zoom on a single marker
    const listener = window.google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
      if (mapRef.current.getZoom() > 15) mapRef.current.setZoom(15);
    });
    return () => window.google.maps.event.removeListener(listener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets.length, predictions.length, isLoaded]);

  if (!isLoaded) {
    return (
      <div style={{ height, width: '100%', border: '1px solid #E5E2DE', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F3F0' }}>
        <p style={{ color: '#B8B5B0', fontSize: 13 }}>Loading Google Maps…</p>
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%', border: '1px solid #E5E2DE', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ height: '100%', width: '100%' }}
        defaultCenter={KOLKATA}
        defaultZoom={12}
        options={MAP_OPTS}
        onLoad={onLoad}
        onClick={() => setSelected(null)}
      >
        {tickets.map(ticket => {
          if (!ticket.location?.lat) return null;
          const key = getSevKey(ticket.severity, ticket.status);
          const cfg = SEV_CONFIG[key];
          const isCritical = key === 'CRITICAL' || key === 'GHOST';
          return (
            <Marker
              key={ticket.publicId || ticket.id}
              position={{ lat: ticket.location.lat, lng: ticket.location.lng }}
              icon={makeIcon(cfg.color, cfg.size)}
              label={isCritical ? {
                text: ticket.publicId?.split('-').pop() || '',
                color: cfg.color,
                fontSize: '9px',
                fontWeight: '700',
              } : undefined}
              onClick={() => setSelected({ type: 'ticket', data: ticket })}
            />
          );
        })}

        {predictions.map((pred, i) => (
          <Marker
            key={`pred-${i}`}
            position={{ lat: pred.lat, lng: pred.lng }}
            icon={makeIcon('#6B50B8', 16, true)}
            onClick={() => setSelected({ type: 'pred', data: pred })}
          />
        ))}

        {selected?.type === 'ticket' && (() => {
          const t   = selected.data;
          const key = getSevKey(t.severity, t.status);
          const cfg = SEV_CONFIG[key];
          return (
            <InfoWindow
              position={{ lat: t.location.lat, lng: t.location.lng }}
              onCloseClick={() => setSelected(null)}
            >
              <div style={{ minWidth: 210, fontFamily: 'system-ui, sans-serif', paddingBottom: 4 }}>
                <div style={{ background: cfg.color, margin: '-8px -8px 10px', padding: '7px 10px',
                  borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>{t.publicId}</span>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10 }}>{STATUS_LABEL[t.status] || t.status}</span>
                </div>
                <p style={{ fontWeight: 700, color: '#4A4A48', fontSize: 13, marginBottom: 3, textTransform: 'capitalize' }}>
                  {t.issueType?.replace(/_/g, ' ')}
                </p>
                {t.location?.address && (
                  <p style={{ color: '#7A7875', fontSize: 11, marginBottom: 4 }}>
                    {t.location.address.substring(0, 75)}{t.location.address.length > 75 ? '…' : ''}
                  </p>
                )}
                <SevBar severity={t.severity} />
                <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: '#7A7875' }}>
                  <span>👍 {t.upvoteCount || 0}</span>
                  {t.assignedOfficerName && <span>· {t.assignedOfficerName}</span>}
                </div>
                {onTicketClick && (
                  <button onClick={() => onTicketClick(t)} style={{
                    marginTop: 8, color: 'white', fontSize: 11, fontWeight: 600,
                    background: cfg.color, border: 'none', cursor: 'pointer',
                    padding: '5px 10px', borderRadius: 4, width: '100%',
                  }}>
                    View full ticket →
                  </button>
                )}
              </div>
            </InfoWindow>
          );
        })()}

        {selected?.type === 'pred' && (
          <InfoWindow
            position={{ lat: selected.data.lat, lng: selected.data.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div style={{ minWidth: 190, fontFamily: 'system-ui, sans-serif', paddingBottom: 4 }}>
              <div style={{ background: '#6B50B8', margin: '-8px -8px 10px', padding: '7px 10px', borderRadius: '4px 4px 0 0' }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>◆ AI Prediction</span>
              </div>
              <p style={{ fontWeight: 700, color: '#4A4A48', fontSize: 13, textTransform: 'capitalize' }}>
                {selected.data.issueType?.replace(/_/g, ' ')}
              </p>
              <p style={{ color: '#B8B5B0', fontSize: 11, marginTop: 2 }}>{selected.data.location}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
                <span style={{ color: '#6B50B8', fontWeight: 700 }}>{selected.data.probability}% probability</span>
                <span style={{ color: '#7A7875' }}>{selected.data.timeframe}</span>
              </div>
              {selected.data.reason && (
                <p style={{ fontSize: 11, color: '#7A7875', marginTop: 6, borderTop: '1px solid #F0EDE9', paddingTop: 5 }}>
                  {selected.data.reason}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <Legend />
    </div>
  );
}
