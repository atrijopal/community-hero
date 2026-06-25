import Navbar from '../../components/shared/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { useGamification } from '../../hooks/useGamification';
import { useMyTickets } from '../../hooks/useTicket';
import { levelName } from '../../utils/formatters';

const BADGE_META = {
  pothole_hunter:      { icon: '🕳️', label: 'Pothole Hunter', desc: '5+ potholes reported' },
  light_keeper:        { icon: '💡', label: 'Light Keeper',   desc: '3+ streetlight issues' },
  ghost_buster:        { icon: '👻', label: 'Ghost Buster',   desc: '2+ ghost catches' },
  monsoon_watch:       { icon: '🌊', label: 'Monsoon Watch',  desc: '3+ waterlogging reports' },
  first_responder:     { icon: '🚨', label: 'First Responder',desc: 'First in ward to report' },
  rti_warrior:         { icon: '⚖️', label: 'RTI Warrior',    desc: 'Filed first RTI' },
  streak_master:       { icon: '🔥', label: 'Streak Master',  desc: '14-day reporting streak' },
  explorer:            { icon: '🧭', label: 'Explorer',       desc: '5 different zones' },
  community_champion:  { icon: '🏆', label: 'Champion',       desc: 'Top 10 leaderboard' },
  data_defender:       { icon: '🛡️', label: 'Data Defender',  desc: '10+ verifications' },
  night_watch:         { icon: '🌙', label: 'Night Watch',    desc: '5 night reports' },
  green_guardian:      { icon: '🌿', label: 'Green Guardian', desc: '3+ environment issues' },
};

export default function Profile() {
  const { user }             = useAuth();
  const { gamification }     = useGamification(user?.uid);
  const { tickets }          = useMyTickets(user?.uid);
  const resolved             = tickets.filter(t => ['RESOLVED','CLOSED_OVERRIDE'].includes(t.status));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full border-2 border-white" />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">👤</div>
            )}
            <div>
              <p className="text-xl font-bold">{user?.displayName || 'Civic Hero'}</p>
              <p className="text-blue-200 text-sm">{user?.email}</p>
              <p className="text-yellow-300 text-sm font-medium mt-1">Level {gamification?.level} — {levelName(gamification?.xp || 0)}</p>
            </div>
          </div>
        </div>

        {/* Impact stats */}
        <div>
          <h2 className="font-bold text-gray-800 mb-3">My Impact</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Reported',  value: tickets.length, icon: '📋' },
              { label: 'Resolved',  value: resolved.length, icon: '✅' },
              { label: 'Total XP',  value: gamification?.xp || 0, icon: '⭐' },
              { label: 'Badges',    value: gamification?.badges?.length || 0, icon: '🏅' },
              { label: 'Streak',    value: `${gamification?.streak || 0}d`, icon: '🔥' },
              { label: 'Upvotes',   value: gamification?.impactStats?.upvotesGiven || 0, icon: '👍' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <p className="text-xl">{s.icon}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        {gamification?.badges?.length > 0 && (
          <div>
            <h2 className="font-bold text-gray-800 mb-3">Badges Earned ({gamification.badges.length})</h2>
            <div className="grid grid-cols-2 gap-3">
              {gamification.badges.map(b => {
                const meta = BADGE_META[b] || { icon: '🏅', label: b, desc: '' };
                return (
                  <div key={b} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                      <p className="text-xs text-gray-500">{meta.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
