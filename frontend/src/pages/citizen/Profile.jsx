import { IconTicket, IconCircleCheck, IconStar, IconMedal, IconFlame, IconThumbUp } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { useGamification } from '../../hooks/useGamification';
import { useMyTickets } from '../../hooks/useTicket';
import { levelName } from '../../utils/formatters';

const BADGE_META = {
  pothole_hunter:     { label: 'Pothole Hunter',   desc: '5+ potholes reported' },
  light_keeper:       { label: 'Light Keeper',      desc: '3+ streetlight issues' },
  ghost_buster:       { label: 'Ghost Buster',      desc: '2+ ghost catches' },
  monsoon_watch:      { label: 'Monsoon Watch',     desc: '3+ waterlogging reports' },
  first_responder:    { label: 'First Responder',   desc: 'First in ward to report' },
  rti_warrior:        { label: 'RTI Warrior',       desc: 'Filed first RTI' },
  streak_master:      { label: 'Streak Master',     desc: '14-day reporting streak' },
  explorer:           { label: 'Explorer',          desc: '5 different zones' },
  community_champion: { label: 'Champion',          desc: 'Top 10 leaderboard' },
  data_defender:      { label: 'Data Defender',     desc: '10+ verifications' },
  night_watch:        { label: 'Night Watch',       desc: '5 night reports' },
  green_guardian:     { label: 'Green Guardian',    desc: '3+ environment issues' },
};

export default function Profile() {
  const { user }         = useAuth();
  const { gamification } = useGamification(user?.uid);
  const { tickets }      = useMyTickets(user?.uid);
  const resolved         = tickets.filter(t => ['RESOLVED','CLOSED_OVERRIDE'].includes(t.status));
  const xp               = gamification?.xp || 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Profile header — civic red, not blue gradient */}
        <div className="p-5 border" style={{ backgroundColor: '#C13B2A', borderColor: '#9A2D1F', borderRadius: '8px' }}>
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full border-2 border-white/30 object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-2 border-white/30"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }}>
                {(user?.displayName?.[0] || 'C').toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-white">{user?.displayName || 'Civic Hero'}</p>
              <p className="text-sm text-white/70">{user?.email}</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: '#FFD580' }}>
                Level {gamification?.level || 1} — {levelName(xp)}
              </p>
            </div>
          </div>
          {/* XP bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>{xp % 500} / 500 XP to next level</span>
              <span>{xp} total XP</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <div className="h-1.5 rounded-full bg-white transition-all" style={{ width: `${((xp % 500) / 500) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Impact stats */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7A7875' }}>My Impact</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Reported',  value: tickets.length,                        color: '#4A4A48', icon: IconTicket },
              { label: 'Resolved',  value: resolved.length,                       color: '#1A7A4A', icon: IconCircleCheck },
              { label: 'Total XP',  value: xp,                                    color: '#6B50B8', icon: IconStar },
              { label: 'Badges',    value: gamification?.badges?.length || 0,     color: '#D4730A', icon: IconMedal },
              { label: 'Streak',    value: `${gamification?.streak || 0}d`,       color: '#C13B2A', icon: IconFlame },
              { label: 'Upvotes',   value: gamification?.impactStats?.upvotesGiven || 0, color: '#2D6A9F', icon: IconThumbUp },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-white border p-3 text-center" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
                <Icon size={18} stroke={1.5} style={{ color, margin: '0 auto 4px' }} />
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        {gamification?.badges?.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7A7875' }}>
              Badges Earned ({gamification.badges.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {gamification.badges.map(b => {
                const meta = BADGE_META[b] || { label: b, desc: '' };
                return (
                  <div key={b} className="bg-white border p-3 flex items-center gap-3"
                    style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#FDF1EF' }}>
                      <IconMedal size={16} stroke={1.5} style={{ color: '#C13B2A' }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#4A4A48' }}>{meta.label}</p>
                      <p className="text-xs" style={{ color: '#7A7875' }}>{meta.desc}</p>
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
