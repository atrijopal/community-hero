import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconPlus, IconX, IconArrowRight, IconAlertTriangle } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmModal from '../../components/shared/ConfirmModal';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { timeAgo } from '../../utils/formatters';

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
              className="px-5 py-3 border transition-colors hover:bg-surface-raised"
              style={{ borderColor: '#E5E2DE', color: '#7A7875', borderRadius: '6px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OfficerPanel({ officer, onClose, onDeactivate }) {
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!officer) return;
    setLoading(true);
    api.get('/tickets', { params: { officerId: officer.id, limit: 20 } })
      .then(r => setTickets(r.data.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [officer?.id]);

  if (!officer) return null;

  const scoreColor = (s) => s >= 90 ? '#1A7A4A' : s >= 70 ? '#D4730A' : '#C13B2A';
  const scoreBg    = (s) => s >= 90 ? '#E8F5EE' : s >= 70 ? '#FEF3E7' : '#FDF1EF';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }} onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 h-full z-50 flex flex-col bg-white shadow-2xl"
        style={{ width: 420, borderLeft: '1px solid #E5E2DE' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E5E2DE' }}>
          <div>
            <h2 className="font-semibold text-base" style={{ color: '#4A4A48' }}>{officer.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{officer.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
            <IconX size={18} stroke={1.5} style={{ color: '#7A7875' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Active', value: officer.activeCaseCount ?? 0, color: '#4A4A48' },
              { label: 'Resolved', value: officer.resolvedCount ?? 0, color: '#1A7A4A' },
              { label: 'Total', value: officer.totalAssigned ?? 0, color: '#7A7875' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 border" style={{ borderColor: '#E5E2DE', borderRadius: '6px' }}>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#B8B5B0' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b" style={{ borderColor: '#F0EDE9' }}>
              <span style={{ color: '#7A7875' }}>Designation</span>
              <span style={{ color: '#4A4A48' }}>{officer.designation}</span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: '#F0EDE9' }}>
              <span style={{ color: '#7A7875' }}>Department</span>
              <span style={{ color: '#4A4A48' }}>{officer.departmentId?.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: '#F0EDE9' }}>
              <span style={{ color: '#7A7875' }}>Accountability</span>
              <span className="font-semibold px-2 py-0.5 text-xs" style={{
                color: scoreColor(officer.accountabilityScore ?? 100),
                backgroundColor: scoreBg(officer.accountabilityScore ?? 100),
                borderRadius: '4px',
              }}>
                {officer.accountabilityScore ?? 100}%
              </span>
            </div>
            <div className="flex justify-between py-2 border-b" style={{ borderColor: '#F0EDE9' }}>
              <span style={{ color: '#7A7875' }}>Performance</span>
              <span className="font-semibold px-2 py-0.5 text-xs" style={{
                color: scoreColor(officer.performanceScore ?? 100),
                backgroundColor: scoreBg(officer.performanceScore ?? 100),
                borderRadius: '4px',
              }}>
                {officer.performanceScore ?? 100}%
              </span>
            </div>
            {(officer.ghostClosureCount ?? 0) > 0 && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: '#F0EDE9' }}>
                <span style={{ color: '#7A7875' }}>Ghost Closures</span>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#C13B2A' }}>
                  <IconAlertTriangle size={12} stroke={2} /> {officer.ghostClosureCount}
                </span>
              </div>
            )}
            {officer.wardIds?.length > 0 && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: '#F0EDE9' }}>
                <span style={{ color: '#7A7875' }}>Wards</span>
                <span style={{ color: '#4A4A48' }}>{officer.wardIds.join(', ')}</span>
              </div>
            )}
            {officer.phone && (
              <div className="flex justify-between py-2 border-b" style={{ borderColor: '#F0EDE9' }}>
                <span style={{ color: '#7A7875' }}>Phone</span>
                <span style={{ color: '#4A4A48' }}>{officer.phone}</span>
              </div>
            )}
            <div className="flex justify-between py-2" style={{ borderColor: '#F0EDE9' }}>
              <span style={{ color: '#7A7875' }}>Status</span>
              <span className="text-xs font-medium px-2 py-0.5" style={{
                borderRadius: '4px',
                backgroundColor: officer.status === 'active' ? '#E8F5EE' : officer.status === 'on_leave' ? '#FFF8E0' : '#FDF1EF',
                color: officer.status === 'active' ? '#1A7A4A' : officer.status === 'on_leave' ? '#8B6600' : '#C13B2A',
              }}>
                {officer.status}
              </span>
            </div>
          </div>

          {/* Tickets */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#4A4A48' }}>Assigned Tickets</h3>
            {loading ? (
              <div className="text-center py-6"><LoadingSpinner /></div>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: '#B8B5B0' }}>No tickets assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map(t => (
                  <Link key={t.id} to={`/track/${t.publicId}`} target="_blank"
                    className="flex items-center justify-between p-3 border rounded group transition-colors hover:border-gray-300"
                    style={{ borderColor: '#E5E2DE', borderRadius: '6px', display: 'flex' }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusBadge status={t.status} size="sm" />
                        <span className="text-xs font-mono" style={{ color: '#B8B5B0' }}>{t.publicId}</span>
                      </div>
                      <p className="text-sm font-medium truncate" style={{ color: '#4A4A48' }}>{t.issueType?.replace(/_/g,' ')}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#B8B5B0' }}>{timeAgo(t.createdAt)} · Sev {t.severity}/10</p>
                    </div>
                    <IconArrowRight size={14} stroke={1.5} style={{ color: '#B8B5B0', flexShrink: 0 }} className="group-hover:text-gray-500 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer action */}
        {officer.status === 'active' && (
          <div className="px-5 py-4 border-t" style={{ borderColor: '#E5E2DE' }}>
            <button onClick={() => { onClose(); onDeactivate(officer); }}
              className="w-full py-2.5 text-sm font-medium border transition-colors hover:bg-red-50"
              style={{ borderColor: '#E5E2DE', color: '#C13B2A', borderRadius: '6px' }}>
              Deactivate Officer
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function StaffManagement() {
  const [officers, setOfficers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [deactivating, setDeactivating] = useState(null);
  const [selected, setSelected]     = useState(null);

  const fetchOfficers = async () => {
    try {
      const res = await api.get('/staff/officers', { params: { limit: 100 } });
      // Deduplicate by email — keep the doc with most recent updatedAt (real Firebase UID wins)
      const seen = new Map();
      for (const o of (res.data.officers || [])) {
        const key = o.email?.toLowerCase();
        if (!seen.has(key) || (o.updatedAt ?? '') > (seen.get(key).updatedAt ?? '')) {
          seen.set(key, o);
        }
      }
      setOfficers([...seen.values()]);
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

      <OfficerPanel
        officer={selected}
        onClose={() => setSelected(null)}
        onDeactivate={(o) => setDeactivating(o)}
      />

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
                  {['Name','Designation','Department','Active Cases','Resolved','Accountability','Status',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: '#7A7875' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {officers.map(o => (
                  <tr key={o.id}
                    onClick={() => setSelected(o)}
                    className={`border-b transition-colors cursor-pointer hover:bg-gray-50 ${o.status !== 'active' ? 'opacity-60' : ''}`}
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
                      <IconArrowRight size={14} stroke={1.5} style={{ color: '#B8B5B0' }} />
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
