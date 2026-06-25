const gamification = [
  {
    uid: 'citizen_arjun_001',
    xp: 1250,
    level: 3,
    levelName: 'Active Resident',
    streak: 7,
    lastActivity: new Date().toISOString(),
    badges: ['pothole_hunter','first_responder','ghost_buster'],
    impactStats: {
      ticketsReported: 18,
      ticketsResolved: 12,
      ghostsCaught: 2,
      upvotesGiven: 34,
      verificationsDone: 8,
      rtiFiled: 1,
    },
    weeklyChallenge: {
      description: 'Report 3 waterlogging issues this week (Monsoon Watch)',
      progress: 2,
      target: 3,
      expiresAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    },
  },
  {
    uid: 'citizen_priya_002',
    xp: 4800,
    level: 10,
    levelName: 'Civic Hero',
    streak: 45,
    lastActivity: new Date().toISOString(),
    badges: [
      'pothole_hunter','light_keeper','ghost_buster','monsoon_watch',
      'first_responder','rti_warrior','streak_master','explorer',
      'community_champion','data_defender','night_watch','green_guardian',
    ],
    impactStats: {
      ticketsReported: 67,
      ticketsResolved: 51,
      ghostsCaught: 8,
      upvotesGiven: 143,
      verificationsDone: 29,
      rtiFiled: 4,
    },
    weeklyChallenge: {
      description: 'Verify 5 tickets reported by others',
      progress: 5,
      target: 5,
      completed: true,
    },
  },
];

module.exports = gamification;
