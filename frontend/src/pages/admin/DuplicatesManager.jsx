import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconCopy, IconTrash, IconArrowRight, IconAlertTriangle } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatusBadge from '../../components/shared/StatusBadge';
import ConfirmModal from '../../components/shared/ConfirmModal';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { timeAgo } from '../../utils/formatters';

function TicketMiniCard({ ticket, label, accent }) {
  if (!ticket) return <div className="flex-1 border p-4 text-sm text-center" style={{ borderColor: '#E5E2DE', borderRadius: '8px', color: '#B8B5B0' }}>Not found</div>;

  return (
    <div className="flex-1 border overflow-hidden" style={{ borderColor: accent || '#E5E2DE', borderRadius: '8px' }}>
      <div className="px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: accent || '#F5F3F0', color: accent ? 'white' : '#7A7875' }}>
        {label}
      </div>
      {ticket.photos?.report && (
        <img src={ticket.photos.report} alt="" className="w-full object-cover" style={{ height: 120 }} />
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} size="sm" />
          <span className="font-mono text-xs font-semibold" style={{ color: '#C13B2A' }}>{ticket.publicId}</span>
        </div>
        <p className="text-sm font-medium capitalize" style={{ color: '#4A4A48' }}>
          {ticket.issueType?.replace(/_/g, ' ')}
        </p>
        <p className="text-xs line-clamp-2" style={{ color: '#7A7875' }}>{ticket.description}</p>
        <div className="flex items-center justify-between text-xs" style={{ color: '#B8B5B0' }}>
          <span>Sev {ticket.severity}/10</span>
          <span>{timeAgo(ticket.createdAt)}</span>
        </div>
        {ticket.location?.address && (
          <p className="text-xs truncate" style={{ color: '#B8B5B0' }}>{ticket.location.address}</p>
        )}
        <Link to={`/track/${ticket.publicId}`} target="_blank"
          className="flex items-center gap-1 text-xs transition-colors hover:opacity-70"
          style={{ color: '#C13B2A' }}>
          View ticket <IconArrowRight size={11} stroke={2} />
        </Link>
      </div>
    </div>
  );
}

export default function DuplicatesManager() {
  const [pairs, setPairs]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [merging, setMerging]       = useState(null); // { duplicate, original }
  const [note, setNote]             = useState('');

  const fetchPairs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/agents/duplicates');
      setPairs(res.data.pairs || []);
    } catch {
      toast.error('Failed to load duplicates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPairs(); }, []);

  const handleMerge = async () => {
    if (!merging) return;
    try {
      await api.delete(`/agents/duplicates/${merging.duplicate.id}`, { data: { note } });
      toast.success(`${merging.duplicate.publicId} merged into ${merging.original.publicId}`);
      setMerging(null);
      setNote('');
      fetchPairs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Merge failed');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />

      {merging && (
        <ConfirmModal
          title="Merge Duplicate Ticket"
          message={`This will reject ${merging.duplicate.publicId} (citizen will be notified) and redirect activity to ${merging.original.publicId}. This cannot be undone.`}
          onConfirm={handleMerge}
          onCancel={() => { setMerging(null); setNote(''); }}
          confirmLabel="Merge & Notify Citizen"
          danger
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <IconCopy size={20} stroke={1.5} style={{ color: '#D4730A' }} />
              <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>Duplicate Manager</h1>
            </div>
            <p className="text-sm" style={{ color: '#7A7875' }}>
              Citizens who force-submitted over a detected duplicate. Merge the duplicate into the original and notify the reporter.
            </p>
          </div>
          <button onClick={fetchPairs} className="text-sm px-3 py-2 border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#E5E2DE', color: '#7A7875', borderRadius: '6px' }}>
            Refresh
          </button>
        </div>

        {/* How it works banner */}
        <div className="flex items-start gap-3 p-4 border-l-4 text-sm" style={{ backgroundColor: '#FEF3E7', borderColor: '#D4730A', borderRadius: '4px' }}>
          <IconAlertTriangle size={16} stroke={2} style={{ color: '#D4730A', flexShrink: 0, marginTop: 2 }} />
          <div style={{ color: '#8B6600' }}>
            <span className="font-semibold">How this works: </span>
            When a citizen submits a ticket after being warned about a duplicate, both tickets are tracked here.
            Merging rejects the duplicate, notifies the citizen via WhatsApp/email, and directs their upvotes to the original.
          </div>
        </div>

        {loading ? <LoadingSpinner /> : pairs.length === 0 ? (
          <div className="text-center py-16 bg-white border" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold" style={{ color: '#4A4A48' }}>No duplicate tickets</p>
            <p className="text-sm mt-1" style={{ color: '#B8B5B0' }}>All reports appear to be unique. AI duplicate detection is working.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pairs.map(({ duplicate, original }, i) => (
              <div key={i} className="bg-white border p-5 space-y-4" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
                {/* Match confidence header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-1" style={{
                      backgroundColor: '#FEF3E7', color: '#D4730A', borderRadius: '4px',
                    }}>
                      {duplicate.duplicateMatchConfidence || '?'}% AI Match
                    </span>
                    <span className="text-sm font-semibold" style={{ color: '#4A4A48' }}>
                      {duplicate.publicId} → {original?.publicId}
                    </span>
                  </div>
                  <button
                    onClick={() => setMerging({ duplicate, original })}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>
                    <IconTrash size={13} stroke={2} /> Merge & Delete
                  </button>
                </div>

                {/* Side-by-side */}
                <div className="flex gap-4">
                  <TicketMiniCard ticket={duplicate} label="DUPLICATE (new)" accent="#C13B2A" />
                  <div className="flex items-center justify-center shrink-0">
                    <div className="text-center">
                      <IconArrowRight size={20} stroke={1.5} style={{ color: '#B8B5B0' }} />
                      <p className="text-xs mt-1" style={{ color: '#B8B5B0' }}>merge into</p>
                    </div>
                  </div>
                  <TicketMiniCard ticket={original} label="ORIGINAL (keep)" accent="#1A7A4A" />
                </div>

                {/* Citizen info */}
                <div className="text-xs py-2 px-3 border-t" style={{ borderColor: '#F0EDE9', color: '#7A7875' }}>
                  Reporter: {duplicate.citizenEmail || duplicate.citizenPhone || 'anonymous'}
                  {' · '}Submitted {timeAgo(duplicate.createdAt)} · Will be notified on merge
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
