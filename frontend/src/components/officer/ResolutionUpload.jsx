import { useState, useRef } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ResolutionUpload({ ticketId, onSuccess }) {
  const [photo, setPhoto]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [notes, setNotes]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const fileRef                 = useRef();

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
      const res = await api.post(`/tickets/${ticketId}/resolution`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data);
      if (res.data.status === 'RESOLVED' || res.data.evidenceReport?.decision === 'accept_resolution') {
        toast.success('Resolution accepted! Ticket resolved.');
        onSuccess(res.data);
      } else if (res.data.status === 'ESCALATED') {
        toast.error('Resolution rejected 3 times. Ticket escalated to admin.');
      } else {
        toast('Resolution submitted for review', { icon: '🔍' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (result?.evidenceReport) {
    const r = result.evidenceReport;
    const accepted = r.decision === 'accept_resolution';
    return (
      <div className={`rounded-2xl border-2 p-5 ${accepted ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{accepted ? '✅' : '❌'}</span>
          <h3 className="font-bold text-gray-900 text-lg">
            {accepted ? 'Resolution Accepted' : `Resolution Rejected (Attempt ${result.rejectionCount}/3)`}
          </h3>
        </div>
        <p className="text-sm text-gray-700 mb-2"><span className="font-medium">AI Review:</span> {r.reason}</p>
        {r.rejection_reason && <p className="text-sm text-red-700">Reason: {r.rejection_reason}</p>}
        <div className="mt-3 text-xs text-gray-500 grid grid-cols-2 gap-2">
          <span>Location match: {r.same_location ? '✅' : '❌'}</span>
          <span>Issue visible: {r.issue_visible_in_image1 ? '✅' : '❌'}</span>
          <span>Resolved in photo: {r.issue_resolved_in_image2 ? '✅' : '❌'}</span>
          <span>Confidence: {Math.round((r.confidence_score || 0) * 100)}%</span>
        </div>
        {!accepted && result.status !== 'ESCALATED' && (
          <button onClick={() => { setResult(null); setPhoto(null); setPreview(null); }}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition">
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="font-bold text-gray-800 mb-4">📸 Submit Resolution</h3>

      {/* Photo upload */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition mb-4 ${
          preview ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
        }`}
      >
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
        {preview ? (
          <img src={preview} alt="Resolution" className="w-full max-h-48 object-contain rounded-lg mx-auto" />
        ) : (
          <>
            <p className="text-4xl mb-2">📷</p>
            <p className="font-medium text-gray-700">Tap to take photo</p>
            <p className="text-xs text-gray-400 mt-1">Or drag & drop · max 10 MB</p>
          </>
        )}
      </div>

      {/* Notes */}
      <textarea
        value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Resolution notes (what was done, materials used, etc.)..."
        rows={3}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
      />

      <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-3 text-xs text-blue-700 mb-4">
        <span className="text-lg">🤖</span>
        <p>AI will compare your photo with the original report photo to verify the issue has been resolved. Make sure the location is clearly visible.</p>
      </div>

      <button onClick={handleSubmit} disabled={loading || !photo}
        className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 hover:bg-green-700 transition">
        {loading ? '🔄 AI Reviewing...' : '✅ Submit Resolution'}
      </button>
    </div>
  );
}
