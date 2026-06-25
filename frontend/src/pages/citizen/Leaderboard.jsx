import Navbar from '../../components/shared/Navbar';
import { useLeaderboard } from '../../hooks/useGamification';
import { levelName } from '../../utils/formatters';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export default function Leaderboard() {
  const { leaders, loading } = useLeaderboard();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🏆 Civic Leaderboard</h1>
        {loading ? <LoadingSpinner /> : (
          <div className="space-y-2">
            {leaders.map((leader, i) => (
              <div
                key={leader.uid}
                className={`flex items-center gap-4 p-4 rounded-xl border transition ${
                  leader.uid === user?.uid
                    ? 'bg-blue-50 border-blue-200'
                    : i < 3 ? 'bg-white border-yellow-200' : 'bg-white border-gray-200'
                }`}
              >
                <span className="text-2xl font-bold w-8 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {leader.uid === user?.uid ? `${user.displayName || 'You'} (You)` : `Civic Hero #${i+1}`}
                  </p>
                  <p className="text-xs text-gray-500">{levelName(leader.xp)} · {leader.badges?.length || 0} badges</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-blue-600">{leader.xp} XP</p>
                  <p className="text-xs text-gray-400">Level {leader.level}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
