import { IconTicket, IconCircleCheck, IconStar, IconMedal, IconFlame, IconThumbUp } from '@tabler/icons-react';
import Navbar from '../../components/shared/Navbar';
import { useAuth } from '../../hooks/useAuth';
import { useGamification } from '../../hooks/useGamification';
import { useMyTickets } from '../../hooks/useTicket';
import { levelName } from '../../utils/formatters';
import { useTranslateMap } from '../../hooks/useTranslate';

const STRINGS = {
  myImpact:     'My Impact',
  reported:     'Reported',
  resolved:     'Resolved',
  totalXp:      'Total XP',
  badges:       'Badges',
  streak:       'Streak',
  upvotes:      'Upvotes',
  badgesEarned: 'Badges Earned',
  xpToNext:     '/ 500 XP to next level',
  totalXpLabel: 'total XP',
  level:        'Level',
  civicHero:    'Civic Hero',
  // badge labels
  pothole_hunter:     'Pothole Hunter',
  pothole_hunter_d:   '5+ potholes reported',
  light_keeper:       'Light Keeper',
  light_keeper_d:     '3+ streetlight issues',
  ghost_buster:       'Ghost Buster',
  ghost_buster_d:     '2+ ghost catches',
  monsoon_watch:      'Monsoon Watch',
  monsoon_watch_d:    '3+ waterlogging reports',
  first_responder:    'First Responder',
  first_responder_d:  'First in ward to report',
  rti_warrior:        'RTI Warrior',
  rti_warrior_d:      'Filed first RTI',
  streak_master:      'Streak Master',
  streak_master_d:    '14-day reporting streak',
  explorer:           'Explorer',
  explorer_d:         '5 different zones',
  champion:           'Champion',
  champion_d:         'Top 10 leaderboard',
  data_defender:      'Data Defender',
  data_defender_d:    '10+ verifications',
  night_watch:        'Night Watch',
  night_watch_d:      '5 night reports',
  green_guardian:     'Green Guardian',
  green_guardian_d:   '3+ environment issues',
};

export default function Profile() {
  const { user }         = useAuth();
  const { gamification } = useGamification(user?.uid);
  const { tickets }      = useMyTickets(user?.uid);
  const resolved         = tickets.filter(t => ['RESOLVED','CLOSED_OVERRIDE'].includes(t.status));
  const xp               = gamification?.xp || 0;
  const tr               = useTranslateMap(STRINGS);

  const BADGE_META = {
    pothole_hunter:     { label: tr.pothole_hunter,    desc: tr.pothole_hunter_d },
    light_keeper:       { label: tr.light_keeper,      desc: tr.light_keeper_d },
    ghost_buster:       { label: tr.ghost_buster,      desc: tr.ghost_buster_d },
    monsoon_watch:      { label: tr.monsoon_watch,     desc: tr.monsoon_watch_d },
    first_responder:    { label: tr.first_responder,   desc: tr.first_responder_d },
    rti_warrior:        { label: tr.rti_warrior,       desc: tr.rti_warrior_d },
    streak_master:      { label: tr.streak_master,     desc: tr.streak_master_d },
    explorer:           { label: tr.explorer,          desc: tr.explorer_d },
    community_champion: { label: tr.champion,          desc: tr.champion_d },
    data_defender:      { label: tr.data_defender,     desc: tr.data_defender_d },
    night_watch:        { label: tr.night_watch,       desc: tr.night_watch_d },
    green_guardian:     { label: tr.green_guardian,    desc: tr.green_guardian_d },
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

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
              <p className="text-lg font-semibold text-white">{user?.displayName || tr.civicHero}</p>
              <p className="text-sm text-white/70">{user?.email}</p>
              <p className="text-sm font-medium mt-0.5" style={{ color: '#FFD580' }}>
                {tr.level} {gamification?.level || 1} — {levelName(xp)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>{xp % 500} {tr.xpToNext}</span>
              <span>{xp} {tr.totalXpLabel}</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <div className="h-1.5 rounded-full bg-white transition-all" style={{ width: `${((xp % 500) / 500) * 100}%` }} />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7A7875' }}>{tr.myImpact}</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { labelKey: 'reported', value: tickets.length,                                color: '#4A4A48', icon: IconTicket },
              { labelKey: 'resolved', value: resolved.length,                               color: '#1A7A4A', icon: IconCircleCheck },
              { labelKey: 'totalXp',  value: xp,                                            color: '#6B50B8', icon: IconStar },
              { labelKey: 'badges',   value: gamification?.badges?.length || 0,             color: '#D4730A', icon: IconMedal },
              { labelKey: 'streak',   value: `${gamification?.streak || 0}d`,               color: '#C13B2A', icon: IconFlame },
              { labelKey: 'upvotes',  value: gamification?.impactStats?.upvotesGiven || 0,  color: '#2D6A9F', icon: IconThumbUp },
            ].map(({ labelKey, value, color, icon: Icon }) => (
              <div key={labelKey} className="bg-white border p-3 text-center" style={{ borderColor: '#E5E2DE', borderRadius: '8px' }}>
                <Icon size={18} stroke={1.5} style={{ color, margin: '0 auto 4px' }} />
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#7A7875' }}>{tr[labelKey]}</p>
              </div>
            ))}
          </div>
        </div>

        {gamification?.badges?.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#7A7875' }}>
              {tr.badgesEarned} ({gamification.badges.length})
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
