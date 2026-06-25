// Semantic status color map — per design doc §3
// Each status gets: 10% bg, full-saturation text, status dot
const STATUS = {
  UNASSIGNED:      { label: 'UNASSIGNED',       bg: '#F2F2F0', text: '#5F5E5A', dot: '#B8B5B0' },
  ASSIGNED:        { label: 'ASSIGNED',         bg: '#EBF1F8', text: '#2D6A9F', dot: '#2D6A9F' },
  IN_PROGRESS:     { label: 'IN PROGRESS',      bg: '#EBF1F8', text: '#2D6A9F', dot: '#2D6A9F' },
  RESOLVED:        { label: 'RESOLVED',         bg: '#EBF5EF', text: '#1A7A4A', dot: '#1A7A4A' },
  ESCALATED:       { label: 'ESCALATED',        bg: '#FEF3E7', text: '#D4730A', dot: '#D4730A' },
  GHOST_FLAGGED:   { label: 'GHOST FLAGGED',    bg: '#F5EAEA', text: '#8B1A1A', dot: '#8B1A1A' },
  RTI_FILED:       { label: 'RTI FILED',        bg: '#FDF1EF', text: '#C13B2A', dot: '#C13B2A' },
  CLOSED_OVERRIDE: { label: 'CLOSED',           bg: '#F2F2F0', text: '#5F5E5A', dot: '#B8B5B0' },
  REJECTED:        { label: 'REJECTED',         bg: '#F5EAEA', text: '#8B1A1A', dot: '#8B1A1A' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const s = STATUS[status] || { label: status?.replace(/_/g,' ') || '—', bg: '#F2F2F0', text: '#5F5E5A', dot: '#B8B5B0' };
  const pad = size === 'lg' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tracking-wide ${pad}`}
      style={{ backgroundColor: s.bg, color: s.text, borderRadius: '4px' }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
      {s.label}
    </span>
  );
}
