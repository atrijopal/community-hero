import { useState, useEffect } from 'react';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmModal from '../../components/shared/ConfirmModal';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function OfficerForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', designation:'', departmentId:'roads_infrastructure', phone:'' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/staff/officers', form);
      toast.success('Officer created!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create officer');
    } finally { setLoading(false); }
  };

  const DEPTS = ['roads_infrastructure','water_supply','sanitation','electricity','parks_recreation','environment'];
  const DESIGNATIONS = ['Junior Engineer','Senior Engineer','Inspector','Sub-Inspector','Electrician Grade 1','Sanitation Supervisor'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-5">+ Add New Officer</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Rajesh Kumar' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'officer@kmc.gov.in' },
            { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 8 characters' },
            { label: 'Phone', key: 'phone', type: 'tel', placeholder: '+919876543210' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder} required={f.key !== 'phone'}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <select value={form.designation} onChange={e => set('designation', e.target.value)} required
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">Select designation</option>
              {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500">
              {DEPTS.map(d => <option key={d} value={d}>{d.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-blue-700 transition">
              {loading ? 'Creating...' : 'Create Officer'}
            </button>
            <button type="button" onClick={onCancel} className="px-5 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffManagement() {
  const [officers, setOfficers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [deactivating, setDeactivating] = useState(null);

  const fetchOfficers = async () => {
    try {
      const res = await api.get('/staff/officers', { params: { limit: 100 } });
      setOfficers(res.data.officers || []);
    } catch { toast.error('Failed to load officers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOfficers(); }, []);

  const handleDeactivate = async () => {
    try {
      await api.delete(`/staff/officers/${deactivating.id}`);
      toast.success('Officer deactivated');
      setDeactivating(null);
      fetchOfficers();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {showForm && <OfficerForm onSuccess={() => { setShowForm(false); fetchOfficers(); }} onCancel={() => setShowForm(false)} />}
      {deactivating && (
        <ConfirmModal
          title="Deactivate Officer"
          message={`Are you sure you want to deactivate ${deactivating.name}? They will no longer appear in assignment dropdowns.`}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivating(null)}
          confirmLabel="Deactivate"
          danger
        />
      )}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">👮 Staff Management</h1>
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            + Add Officer
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name','Designation','Department','Active Cases','Resolved','Accountability','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {officers.map(o => (
                  <tr key={o.id} className={`hover:bg-gray-50 transition ${o.status !== 'active' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{o.name}</p>
                      <p className="text-xs text-gray-400">{o.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{o.designation}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{o.departmentId?.replace(/_/g,' ')}</td>
                    <td className="px-4 py-3 text-center font-bold text-blue-600">{o.activeCaseCount || 0}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{o.resolvedCount || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${(o.accountabilityScore||100) >= 90 ? 'text-green-600' : (o.accountabilityScore||100) >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {o.accountabilityScore || 100}%
                      </span>
                      {(o.ghostClosureCount||0) > 0 && <span className="ml-1 text-xs text-red-500">👻×{o.ghostClosureCount}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${o.status === 'active' ? 'bg-green-100 text-green-700' : o.status === 'on_leave' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {o.status === 'active' && (
                        <button onClick={() => setDeactivating(o)} className="text-xs text-red-600 hover:underline">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
