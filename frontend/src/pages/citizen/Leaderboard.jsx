import { IconTrophy } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import { useLeaderboard } from '../../hooks/useGamification';
import { levelName } from '../../utils/formatters';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

export default function Leaderboard() {
  const { leaders, loading } = useLeaderboard();
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-5">
          <IconTrophy size={20} stroke={1.5} style={{ color: '#D4730A' }} />
          <h1 className="text-xl font-semibold" style={{ color: '#4A4A48' }}>Civic Leaderboard</h1>
        </div>
        {loading ? <LoadingSpinner /> : (
          <div className="space-y-2">
            {leaders.map((leader, i) => {
              const isMe = leader.uid === user?.uid;
              const medal = i === 0 ? '#D4730A' : i === 1 ? '#7A7875' : i === 2 ? '#D4730A' : null;
              return (
                <div key={leader.uid} className="bg-white border flex items-center gap-4 p-4 transition-colors"
                  style={{
                    borderColor: isMe ? '#C13B2A' : '#E5E2DE',
                    borderRadius: '8px',
                    backgroundColor: isMe ? '#FDF1EF' : 'white',
                  }}>
                  <div className="w-8 text-center font-bold shrink-0" style={{ color: medal || '#B8B5B0', fontSize: i < 3 ? 20 : 13 }}>
                    {i < 3 ? (i === 0 ? '1' : i === 1 ? '2' : '3') : `#${i+1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" style={{ color: '#4A4A48' }}>
                      {isMe ? `${user.displayName || 'You'} (You)` : `Civic Hero #${i + 1}`}
                    </p>
                    <p className="text-xs" style={{ color: '#7A7875' }}>
                      {levelName(leader.xp)} · {leader.badges?.length || 0} badges
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold" style={{ color: '#6B50B8' }}>{leader.xp} XP</p>
                    <p className="text-xs" style={{ color: '#B8B5B0' }}>Level {leader.level}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
