import Navbar from '../../components/shared/Navbar';
import { useDepartmentAnalytics, useTrendsAnalytics } from '../../hooks/useAnalytics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function Reports() {
  const { data: deptData, loading: dl } = useDepartmentAnalytics();
  const { data: trends,   loading: tl } = useTrendsAnalytics();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>Analytics & Reports</h1>

        {/* Trends */}
        <div className="bg-white border p-6" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#4A4A48' }}>Monthly Issue Trends</h3>
          {tl ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DE" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#7A7875' }} />
                <YAxis tick={{ fontSize: 12, fill: '#7A7875' }} />
                <Tooltip contentStyle={{ border: '1px solid #E5E2DE', borderRadius: '6px', fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="reported" stroke="#C13B2A" name="Reported" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="resolved" stroke="#1A7A4A" name="Resolved" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department performance */}
        <div className="bg-white border p-6" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#4A4A48' }}>Department Performance</h3>
          {dl ? <LoadingSpinner /> : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData?.departments || []}>
                  <XAxis dataKey="id" tick={{ fontSize: 10, fill: '#7A7875' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#7A7875' }} />
                  <Tooltip contentStyle={{ border: '1px solid #E5E2DE', borderRadius: '6px', fontSize: 12 }} />
                  <Bar dataKey="resolutionRate" fill="#1A7A4A" name="Resolution Rate %" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase" style={{ color: '#7A7875' }}>
                      <th className="pb-2">Department</th>
                      <th className="pb-2">Total</th>
                      <th className="pb-2">Resolved</th>
                      <th className="pb-2">Rate</th>
                      <th className="pb-2">Avg Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#E5E2DE' }}>
                    {(deptData?.departments || []).map(d => (
                      <tr key={d.id}>
                        <td className="py-2 font-medium capitalize" style={{ color: '#4A4A48' }}>{d.name}</td>
                        <td className="py-2" style={{ color: '#7A7875' }}>{d.total}</td>
                        <td className="py-2" style={{ color: '#1A7A4A' }}>{d.resolved}</td>
                        <td className="py-2">
                          <span className="font-bold" style={{
                            color: d.resolutionRate >= 80 ? '#1A7A4A' : d.resolutionRate >= 50 ? '#D4730A' : '#C13B2A'
                          }}>
                            {d.resolutionRate}%
                          </span>
                        </td>
                        <td className="py-2" style={{ color: '#7A7875' }}>{d.avgDays}d</td>
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
