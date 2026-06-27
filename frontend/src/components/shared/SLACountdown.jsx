import { daysUntil, daysAgo } from '../../utils/formatters';
import { useTranslateMap } from '../../hooks/useTranslate';

const STRINGS = {
  breached:      'SLA Breached',
  daysOverdue:   'days overdue',
  dueToday:      'Due today',
  dayRemaining:  'day remaining',
  daysRemaining: 'days remaining',
};

export default function SLACountdown({ slaDeadline, slaBreached }) {
  const tr    = useTranslateMap(STRINGS);
  if (!slaDeadline) return null;
  const days  = daysUntil(slaDeadline);
  const since = daysAgo(slaDeadline);

  if (slaBreached || days < 0) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <span className="text-xs font-medium bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          ⚠️ {tr.breached} — {since} {tr.daysOverdue}
        </span>
      </div>
    );
  }

  const color = days <= 1 ? 'text-red-600 bg-red-50 border-red-200'
              : days <= 3 ? 'text-orange-600 bg-orange-50 border-orange-200'
              : 'text-green-700 bg-green-50 border-green-200';

  return (
    <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${color}`}>
      ⏱ {days === 0 ? tr.dueToday : `${days} ${days !== 1 ? tr.daysRemaining : tr.dayRemaining}`}
    </span>
  );
}
