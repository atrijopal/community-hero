import { useState, useEffect } from 'react';
import { IconPlus } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmModal from '../../components/shared/ConfirmModal';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const inputStyle = { border: '1px solid #E5E2DE', borderRadius: '6px', padding: '10px 12px', fontSize: 14, width: '100%', outline: 'none' };
const DEPTS = ['roads_infrastructure','water_supply','sanitation','electricity','parks_recreation','environment'];
const DESIGNATIONS = ['Junior Engineer','Senior Engineer','Inspector','Sub-Inspector','Electrician Grade 1','Sanitation Supervisor'];

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ borderRadius: '8px' }}>
        <h3 className="text-base font-semibold mb-5" style={{ color: '#4A4A48' }}>Add New Officer</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', key: 'name',     type: 'text',     placeholder: 'Rajesh Kumar' },
            { label: 'Email',     key: 'email',    type: 'email',    placeholder: 'officer@kmc.gov.in' },
            { label: 'Password',  key: 'password', type: 'password', placeholder: 'Min 8 characters' },
            { label: 'Phone',     key: 'phone',    type: 'tel',      placeholder: '+919876543210' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A48' }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder} required={f.key !== 'phone'} style={inputStyle} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A48' }}>Designation</label>
            <select value={form.designation} onChange={e => set('designation', e.target.value)} required style={inputStyle}>
              <option value="">Select designation</option>
              {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#4A4A48' }}>Department</label>
            <select value={form.departmentId} onChange={e => set('departmentId', e.target.value)} style={inputStyle}>
              {DEPTS.map(d => <option key={d} value={d}>{d.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-3 font-medium text-white transition-opacity disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>
              {loading ? 'Creating…' : 'Create Officer'}
            </button>
            <button type="button" onClick={onCancel}
              className="px-5 py-3 border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#E5E2DE', color: '#7A7875', borderRadius: '6px' }}>
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
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
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
          <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>Staff Management</h1>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>
            <IconPlus size={14} stroke={2} /> Add Officer
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="bg-white border overflow-hidden" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <table className="w-full text-sm">
              <thead className="border-b" style={{ backgroundColor: '#FAFAF9', borderColor: '#E5E2DE' }}>
                <tr>
                  {['Name','Designation','Department','Active Cases','Resolved','Accountability','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A7875' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {officers.map(o => (
                  <tr key={o.id} className={`border-b transition-colors hover:bg-gray-50 ${o.status !== 'active' ? 'opacity-60' : ''}`}
                    style={{ borderColor: '#E5E2DE' }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: '#4A4A48' }}>{o.name}</p>
                      <p className="text-xs" style={{ color: '#B8B5B0' }}>{o.email}</p>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#7A7875' }}>{o.designation}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#7A7875' }}>{o.departmentId?.replace(/_/g,' ')}</td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: '#4A4A48' }}>{o.activeCaseCount || 0}</td>
                    <td className="px-4 py-3 text-center font-medium" style={{ color: '#1A7A4A' }}>{o.resolvedCount || 0}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{
                        color: (o.accountabilityScore||100) >= 90 ? '#1A7A4A' : (o.accountabilityScore||100) >= 70 ? '#D4730A' : '#C13B2A'
                      }}>
                        {o.accountabilityScore || 100}%
                      </span>
                      {(o.ghostClosureCount||0) > 0 && <span className="ml-1 text-xs" style={{ color: '#C13B2A' }}>👻×{o.ghostClosureCount}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-1" style={{
                        borderRadius: '4px',
                        backgroundColor: o.status === 'active' ? '#E8F5EE' : o.status === 'on_leave' ? '#FFF8E0' : '#FDF1EF',
                        color: o.status === 'active' ? '#1A7A4A' : o.status === 'on_leave' ? '#8B6600' : '#C13B2A',
                      }}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {o.status === 'active' && (
                        <button onClick={() => setDeactivating(o)} className="text-xs transition-opacity hover:opacity-70" style={{ color: '#C13B2A' }}>
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
