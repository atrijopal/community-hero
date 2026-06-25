import { TICKET_STATUS_LABELS } from '../../utils/constants';

const COLOR_MAP = {
  gray:   'bg-gray-100 text-gray-700',
  blue:   'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  green:  'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
  purple: 'bg-purple-100 text-purple-700',
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-800',
};

export default function StatusBadge({ status, size = 'sm' }) {
  const info  = TICKET_STATUS_LABELS[status] || { label: status, color: 'gray' };
  const color = COLOR_MAP[info.color] || COLOR_MAP.gray;
  const sz    = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${color} ${sz}`}>
      {info.label}
    </span>
  );
}
