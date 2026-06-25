module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand — RTI stamp red-orange (design doc §3)
        civic:         '#C13B2A',
        'civic-dark':  '#9A2D1F',
        'civic-bg':    '#FDF1EF',

        // Concrete greys (warm, never cool)
        concrete:       '#4A4A48',
        'concrete-mid': '#7A7875',
        'concrete-light':'#B8B5B0',
        'concrete-bg':  '#F5F3F0',

        // Surface tokens
        surface:        '#FFFFFF',
        'surface-raised':'#FAFAF9',
        border:         '#E5E2DE',

        // Semantic palette (color encodes meaning only)
        danger:   '#C13B2A',   // critical / SLA breach / RTI / ghost
        warning:  '#D4730A',   // high severity / near-breach / pending
        success:  '#1A7A4A',   // resolved / verified / on-time
        info:     '#2D6A9F',   // assigned / in-progress (ONLY these two states)
        predicted:'#6B50B8',   // AI outputs — never use for anything else

        // Severity aliases (map to semantic above)
        critical: '#C13B2A',
        high:     '#D4730A',
        medium:   '#D4730A',   // medium severity → amber/warning, NOT green
        low:      '#1A7A4A',
        resolved: '#1A7A4A',   // resolved status → green
        ghost:    '#8B1A1A',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      borderRadius: {
        badge: '4px',
        card:  '8px',
        btn:   '6px',
      },
    },
  },
  plugins: [],
};
