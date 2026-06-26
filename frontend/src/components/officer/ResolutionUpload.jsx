import { useState, useRef } from 'react';
import { IconCamera, IconSparkles } from '@tabler/icons-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ResolutionUpload({ ticketId, onSuccess }) {
  const [photo, setPhoto]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const fileRef               = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('File too large (max 10 MB)');
    if (!file.type.startsWith('image/')) return toast.error('Must be an image');
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!photo) return toast.error('Please attach a resolution photo');
    setLoading(true);
    const fd = new FormData();
    fd.append('photo', photo);
    fd.append('notes', notes);
    try {
      const res = await api.post(`/tickets/${ticketId}/resolution`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      if (res.data.status === 'RESOLVED' || res.data.evidenceReport?.decision === 'accept_resolution') {
        toast.success('Resolution accepted! Ticket resolved.');
        onSuccess(res.data);
      } else if (res.data.status === 'ESCALATED') {
        toast.error('Resolution rejected 3 times. Ticket escalated to admin.');
      } else {
        toast('Resolution submitted for review');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (result?.evidenceReport) {
    const r        = result.evidenceReport;
    const accepted = r.decision === 'accept_resolution';
    return (
      <div className="border-2 p-5" style={{
        borderColor: accepted ? '#A7D5B9' : '#E5C5BF',
        backgroundColor: accepted ? '#E8F5EE' : '#FDF1EF',
        borderRadius: '8px',
      }}>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-bold text-lg" style={{ color: '#4A4A48' }}>
            {accepted ? 'Resolution Accepted' : `Resolution Rejected (Attempt ${result.rejectionCount}/3)`}
          </h3>
        </div>
        <p className="text-sm mb-2" style={{ color: '#4A4A48' }}><span className="font-medium">AI Review:</span> {r.reason}</p>
        {r.rejection_reason && <p className="text-sm" style={{ color: '#C13B2A' }}>Reason: {r.rejection_reason}</p>}
        <div className="mt-3 text-xs grid grid-cols-2 gap-2" style={{ color: '#7A7875' }}>
          <span>Location match: {r.same_location ? '✓' : '✗'}</span>
          <span>Issue visible: {r.issue_visible_in_image1 ? '✓' : '✗'}</span>
          <span>Resolved in photo: {r.issue_resolved_in_image2 ? '✓' : '✗'}</span>
          <span>Confidence: {Math.round((r.confidence_score || 0) * 100)}%</span>
        </div>
        {!accepted && result.status !== 'ESCALATED' && (
          <button onClick={() => { setResult(null); setPhoto(null); setPreview(null); }}
            className="mt-4 px-4 py-2 text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border p-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
      <h3 className="font-semibold mb-4" style={{ color: '#4A4A48' }}>Submit Resolution</h3>

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        className="border-2 border-dashed p-6 text-center cursor-pointer transition mb-4"
        style={{
          borderColor: preview ? '#A7D5B9' : '#E5E2DE',
          backgroundColor: preview ? '#E8F5EE' : '#FAFAF9',
          borderRadius: '8px',
        }}
      >
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
        {preview ? (
          <img src={preview} alt="Resolution" className="w-full max-h-48 object-contain rounded-lg mx-auto" />
        ) : (
          <>
            <IconCamera size={36} stroke={1} style={{ color: '#B8B5B0', margin: '0 auto 8px' }} />
            <p className="font-medium" style={{ color: '#4A4A48' }}>Tap to take photo</p>
            <p className="text-xs mt-1" style={{ color: '#B8B5B0' }}>Or drag & drop · max 10 MB</p>
          </>
        )}
      </div>

      <textarea
        value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Resolution notes (what was done, materials used, etc.)…"
        rows={3}
        className="w-full px-4 py-3 text-sm resize-none mb-4"
        style={{ border: '1px solid #E5E2DE', borderRadius: '6px', outline: 'none' }}
      />

      <div className="flex items-start gap-2 p-3 text-xs mb-4" style={{ backgroundColor: '#EDE9F8', borderRadius: '6px', color: '#4A3870' }}>
        <IconSparkles size={14} stroke={1.5} style={{ color: '#6B50B8', flexShrink: 0, marginTop: 1 }} />
        <p>AI will compare your photo with the original report photo to verify the issue has been resolved. Make sure the location is clearly visible.</p>
      </div>

      <button onClick={handleSubmit} disabled={loading || !photo}
        className="w-full py-3.5 font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
        style={{ backgroundColor: '#1A7A4A', borderRadius: '6px' }}>
        {loading ? 'AI Reviewing…' : 'Submit Resolution'}
      </button>
    </div>
  );
}
