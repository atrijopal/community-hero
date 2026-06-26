module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Denylist: generic Tailwind color classes that violate the civic design system.
    // Allowed exceptions: bg-white, bg-black, bg-transparent, bg-surface-raised, bg-civic-bg,
    //   text-white, text-black, border-white — these are intentional uses.
    // Blue is ONLY allowed in status badges for ASSIGNED/IN_PROGRESS (StatusBadge.jsx).
    'no-restricted-syntax': [
      'warn',
      {
        selector:
          'JSXAttribute[name.name="className"] Literal[value=/\\b(?:bg|text|border|ring|focus:ring|hover:bg|hover:text|hover:border)-(?:blue|indigo|gray|grey|slate|zinc|stone|neutral)-/]',
        message:
          'Civic design system: use inline hex or Tailwind civic/concrete/surface tokens. ' +
          'Blue is allowed ONLY in StatusBadge for ASSIGNED/IN_PROGRESS status. ' +
          'See tailwind.config.js for available tokens.',
      },
    ],
  },
};
