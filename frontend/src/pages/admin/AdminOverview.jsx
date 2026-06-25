import { Link } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useOverviewAnalytics, useDepartmentAnalytics, useTrendsAnalytics } from '../../hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

function StatCard({ title, value, sub, icon, color = 'text-blue-600', bg = 'bg-blue-50' }) {
  return (
    <div className={`${bg} rounded-2xl p-5`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm font-medium text-gray-600">{title}</p>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminOverview() {
  const { data: overview, loading: ol } = useOverviewAnalytics();
  const { data: deptData, loading: dl }  = useDepartmentAnalytics();
  const { data: trends, loading: tl }    = useTrendsAnalytics();

  if (ol) return <div className="min-h-screen bg-gray-50"><Navbar /><LoadingSpinner text="Loading analytics..." /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">⚡ Admin Overview</h1>
          <Link to="/admin/unassigned" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            Assign Tickets →
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Issues"       value={overview?.total || 0}           icon="📋" color="text-blue-600"   bg="bg-blue-50" />
          <StatCard title="Resolved"           value={overview?.resolved || 0}         icon="✅" color="text-green-600"  bg="bg-green-50"
            sub={`${overview?.resolutionRate || 0}% rate`} />
          <StatCard title="Active Issues"      value={overview?.open || 0}             icon="⏳" color="text-orange-600" bg="bg-orange-50" />
          <StatCard title="SLA Breached"       value={overview?.slaBreached || 0}      icon="⚠️" color="text-red-600"    bg="bg-red-50" />
          <StatCard title="Ghost Issues"       value={overview?.ghosts || 0}           icon="👻" color="text-purple-600" bg="bg-purple-50" />
          <StatCard title="Avg Resolution"     value={`${overview?.avgResolutionDays || 0}d`} icon="📅" color="text-indigo-600" bg="bg-indigo-50" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/admin/unassigned', icon: '📥', label: 'Unassigned Queue' },
            { to: '/admin/staff',      icon: '👮', label: 'Staff Management' },
            { to: '/admin/predictions',icon: '🔮', label: 'AI Predictions' },
            { to: '/admin/map',        icon: '🗺️', label: 'Ward Map' },
          ].map(a => (
            <Link key={a.to} to={a.to} className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:border-blue-200 hover:shadow-sm transition">
              <span className="text-2xl block mb-1">{a.icon}</span>
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Trends chart */}
        {!tl && trends?.trends?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4">📈 Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trends.trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="reported" stroke="#1A73E8" name="Reported" strokeWidth={2} />
                <Line type="monotone" dataKey="resolved" stroke="#34A853" name="Resolved" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Department performance */}
        {!dl && deptData?.departments?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-4">🏢 Department Performance</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptData.departments}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="resolutionRate" fill="#1A73E8" name="Resolution Rate %" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
