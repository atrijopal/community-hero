import Navbar from '../../components/shared/Navbar';
import { useDepartmentAnalytics, useTrendsAnalytics } from '../../hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function Reports() {
  const { data: deptData, loading: dl } = useDepartmentAnalytics();
  const { data: trends,   loading: tl } = useTrendsAnalytics();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 Analytics & Reports</h1>

        {/* Trends */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-4">📈 Monthly Issue Trends</h3>
          {tl ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reported" stroke="#1A73E8" name="Reported" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="resolved" stroke="#34A853" name="Resolved" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department performance */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-4">🏢 Department Performance</h3>
          {dl ? <LoadingSpinner /> : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData?.departments || []}>
                  <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="resolutionRate" fill="#1A73E8" name="Resolution Rate %" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Resolved</th>
                    <th className="pb-2">Rate</th>
                    <th className="pb-2">Avg Days</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(deptData?.departments || []).map(d => (
                      <tr key={d.id}>
                        <td className="py-2 font-medium capitalize">{d.name}</td>
                        <td className="py-2 text-gray-600">{d.total}</td>
                        <td className="py-2 text-green-600">{d.resolved}</td>
                        <td className="py-2">
                          <span className={`font-bold ${d.resolutionRate >= 80 ? 'text-green-600' : d.resolutionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {d.resolutionRate}%
                          </span>
                        </td>
                        <td className="py-2 text-gray-500">{d.avgDays}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
