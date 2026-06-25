import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import toast from 'react-hot-toast';

export default function Step5Submit({ photo, formData, location, contact, onReset }) {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [duplicate, setDuplicate] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('photo', photo);
      payload.append('data', JSON.stringify({
        ...formData,
        location,
        phone:       contact.phone  || '',
        email:       contact.email  || '',
        aiSuggested: formData.aiSuggested,
      }));

      const res = await api.post('/tickets', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success('Report submitted!');
    } catch (err) {
      if (err.response?.status === 409 && err.response.data.duplicate) {
        setDuplicate(err.response.data.existingTicket);
      } else {
        toast.error(err.response?.data?.error || 'Submission failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (duplicate) {
    return (
      <div className="space-y-5 text-center">
        <div className="text-5xl">🔄</div>
        <h2 className="text-xl font-bold text-gray-900">Issue Already Reported!</h2>
        <p className="text-gray-600 text-sm">AI detected this might be the same issue as an existing ticket.</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left">
          <p className="text-sm font-medium text-yellow-800 mb-1">Existing Ticket: {duplicate.publicId}</p>
          <p className="text-sm text-yellow-700">Issue: {duplicate.issueType} — Status: {duplicate.status}</p>
          <p className="text-xs text-yellow-600 mt-1">{duplicate.address}</p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/track/${duplicate.publicId}`}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition"
          >
            View Existing Ticket
          </Link>
          <button
            onClick={() => { setDuplicate(null); handleSubmit(); }}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition"
          >
            Submit Anyway
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-5 text-center">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900">Report Submitted!</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-sm text-gray-600 mb-2">Your Ticket ID</p>
          <p className="text-3xl font-bold text-blue-600 font-mono">{result.ticketId}</p>
          <p className="text-xs text-gray-500 mt-2">Save this ID to track your report</p>
        </div>
        <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium text-orange-600">UNASSIGNED — pending assignment</span></div>
          <div className="flex justify-between"><span className="text-gray-500">SLA Deadline</span><span className="font-medium">{new Date(result.slaDeadline).toDateString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">XP Earned</span><span className="font-medium text-green-600">+50 XP</span></div>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/track/${result.ticketId}`}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition"
          >
            Track Your Ticket
          </Link>
          <button
            onClick={onReset}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition"
          >
            Report Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">📤 Review & Submit</h2>
        <p className="text-sm text-gray-500">Confirm everything looks right before submitting</p>
      </div>

      <div className="space-y-3 bg-gray-50 rounded-xl p-4 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Issue Type</span><span className="font-medium capitalize">{formData.issueType?.replace(/_/g,' ')}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Severity</span><span className="font-medium">{formData.severity}/10</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Danger</span><span className={`font-medium capitalize ${formData.dangerLevel === 'critical' ? 'text-red-600' : formData.dangerLevel === 'moderate' ? 'text-yellow-600' : 'text-green-600'}`}>{formData.dangerLevel}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Department</span><span className="font-medium">{formData.departmentId?.replace(/_/g,' ')}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-medium text-right max-w-xs text-xs">{location?.address?.substring(0, 60)}...</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Ward</span><span className="font-medium">{location?.ward}</span></div>
        {contact?.phone && <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{contact.phone}</span></div>}
        {contact?.email && <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{contact.email}</span></div>}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
        📋 After submission: AI will check for duplicates → Officer assigned within SLA →
        You'll receive updates via notification/WhatsApp/email
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-green-700 transition disabled:opacity-50 shadow-md"
      >
        {loading ? '⏳ Submitting...' : '✅ Submit Report'}
      </button>
    </div>
  );
}
