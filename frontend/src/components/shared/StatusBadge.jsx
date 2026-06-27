import { useLanguage } from '../../context/LanguageContext';
import { useT } from '../../utils/translations';

// Colors per status — not translated, just styling
const STATUS_STYLE = {
  UNASSIGNED:      { bg: '#F2F2F0', text: '#5F5E5A', dot: '#B8B5B0' },
  ASSIGNED:        { bg: '#EBF1F8', text: '#2D6A9F', dot: '#2D6A9F' },
  IN_PROGRESS:     { bg: '#EBF1F8', text: '#2D6A9F', dot: '#2D6A9F' },
  RESOLVED:        { bg: '#EBF5EF', text: '#1A7A4A', dot: '#1A7A4A' },
  ESCALATED:       { bg: '#FEF3E7', text: '#D4730A', dot: '#D4730A' },
  GHOST_FLAGGED:   { bg: '#F5EAEA', text: '#8B1A1A', dot: '#8B1A1A' },
  RTI_FILED:       { bg: '#FDF1EF', text: '#C13B2A', dot: '#C13B2A' },
  CLOSED_OVERRIDE: { bg: '#F2F2F0', text: '#5F5E5A', dot: '#B8B5B0' },
  REJECTED:        { bg: '#F5EAEA', text: '#8B1A1A', dot: '#8B1A1A' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const { lang } = useLanguage();
  const tr       = useT(lang);

  // Look up translated label from shared T object (already has all statuses)
  const label = tr[status] || status?.replace(/_/g, ' ') || '—';
  const s     = STATUS_STYLE[status] || { bg: '#F2F2F0', text: '#5F5E5A', dot: '#B8B5B0' };
  const pad   = size === 'lg' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-widest ${pad}`}
      style={{ backgroundColor: s.bg, color: s.text, borderRadius: '4px', fontSize: '10px' }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
      {label}
    </span>
  );
}
