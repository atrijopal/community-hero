import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { timeAgo, issueTypeLabel } from '../../utils/formatters';
import { SEVERITY_COLOR } from '../../utils/constants';

export default function TicketCard({ ticket, linkBase = '/citizen/tickets', showOfficer = false }) {
  if (!ticket) return null;
  return (
    <Link
      to={`${linkBase}/${ticket.publicId}`}
      className="block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-400">{ticket.publicId}</span>
            <StatusBadge status={ticket.status} />
            {ticket.slaBreached && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">SLA ⚠</span>
            )}
          </div>
          <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
            {issueTypeLabel(ticket.issueType)}
          </p>
          <p className="text-sm text-gray-500 truncate mt-0.5">{ticket.location?.address}</p>
          {showOfficer && ticket.assignedOfficerName && (
            <p className="text-xs text-gray-400 mt-1">👤 {ticket.assignedOfficerName}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className={`w-1.5 h-10 rounded-full ${SEVERITY_COLOR(ticket.severity)}`} title={`Severity ${ticket.severity}/10`} />
          <span className="text-xs text-gray-400">{timeAgo(ticket.createdAt)}</span>
        </div>
      </div>
      {ticket.upvoteCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
          <span>👍 {ticket.upvoteCount} upvotes</span>
          <span>⚡ Severity {ticket.severity}/10</span>
          {ticket.ghostCount > 0 && <span className="text-red-500">👻 Ghost ×{ticket.ghostCount}</span>}
        </div>
      )}
    </Link>
  );
}
