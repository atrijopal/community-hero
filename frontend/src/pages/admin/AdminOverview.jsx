import { Link } from 'react-router-dom';
import {
  IconInbox, IconUsers, IconBrain, IconMapPin,
  IconChartBar, IconTicket, IconAlertTriangle, IconGhost,
  IconClock, IconCircleCheck,
} from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useOverviewAnalytics, useDepartmentAnalytics, useTrendsAnalytics } from '../../hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

// Dense metric — large numeral over uppercase label, hairline-separated
function Metric({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="py-4 px-5 border-r last:border-r-0 flex-1 min-w-0" style={{ borderColor: '#E5E2DE' }}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7A7875' }}>{label}</p>
        <Icon size={16} stroke={1.5} style={{ color: '#B8B5B0', flexShrink: 0 }} />
      </div>
      <p className="text-3xl font-bold leading-none mb-1" style={{ color }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: '#B8B5B0' }}>{sub}</p>}
    </div>
  );
}

export default function AdminOverview() {
  const { data: overview, loading: ol } = useOverviewAnalytics();
  const { data: deptData, loading: dl } = useDepartmentAnalytics();
  const { data: trends,   loading: tl } = useTrendsAnalytics();

  if (ol) return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <LoadingSpinner text="Loading analytics…" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>Admin Overview</h1>
            <p className="text-xs uppercase tracking-wider mt-0.5" style={{ color: '#B8B5B0' }}>Kolkata Municipal Corporation</p>
          </div>
          <Link to="/admin/unassigned"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C13B2A', borderRadius: '6px' }}>
            <IconInbox size={15} stroke={2} />
            Assign Tickets
          </Link>
        </div>

        {/* Metric strip — newspaper style, hairline borders, no pastel tiles */}
        <div className="bg-white border flex overflow-hidden" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
          <Metric label="Total Issues"    value={overview?.total || 0}           color="#4A4A48" icon={IconTicket} />
          <Metric label="Resolved"        value={overview?.resolved || 0}         color="#1A7A4A" icon={IconCircleCheck}
            sub={`${overview?.resolutionRate || 0}% rate`} />
          <Metric label="Active"          value={overview?.open || 0}             color="#D4730A" icon={IconClock} />
          <Metric label="SLA Breached"    value={overview?.slaBreached || 0}      color="#C13B2A" icon={IconAlertTriangle} />
          <Metric label="Ghost Issues"    value={overview?.ghosts || 0}           color="#8B1A1A" icon={IconGhost} />
          <Metric label="Avg Resolution"  value={`${overview?.avgResolutionDays || 0}d`} color="#4A4A48" icon={IconChartBar} />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/admin/unassigned',  icon: IconInbox,    label: 'Unassigned Queue' },
            { to: '/admin/staff',       icon: IconUsers,    label: 'Staff Management' },
            { to: '/admin/predictions', icon: IconBrain,    label: 'AI Predictions' },
            { to: '/admin/map',         icon: IconMapPin,   label: 'Ward Map' },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
              className="bg-white border flex items-center gap-3 p-4 transition-colors"
              style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#C13B2A'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E2DE'}>
              <Icon size={20} stroke={1.5} style={{ color: '#C13B2A' }} />
              <span className="text-sm font-medium" style={{ color: '#4A4A48' }}>{label}</span>
            </Link>
          ))}
        </div>

        {/* Trends chart */}
        {!tl && trends?.trends?.length > 0 && (
          <div className="bg-white border p-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#7A7875' }}>Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F3F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#B8B5B0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#B8B5B0' }} />
                <Tooltip contentStyle={{ border: '1px solid #E5E2DE', borderRadius: '6px', fontSize: 12 }} />
                <Line type="monotone" dataKey="reported" stroke="#C13B2A" name="Reported" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolved" stroke="#1A7A4A" name="Resolved" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Department performance */}
        {!dl && deptData?.departments?.length > 0 && (
          <div className="bg-white border p-5" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#7A7875' }}>Department Performance</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={deptData.departments}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#B8B5B0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#B8B5B0' }} />
                <Tooltip contentStyle={{ border: '1px solid #E5E2DE', borderRadius: '6px', fontSize: 12 }} />
                <Bar dataKey="resolutionRate" fill="#1A7A4A" name="Resolution Rate %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
