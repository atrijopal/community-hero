module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand — civic red
        civic:         '#C13B2A',
        'civic-dark':  '#A02E20',
        'civic-bg':    '#FDF1EF',  // kept for backward compat
        'civic-tint':  '#FBEDEA',

        // Concrete greys (warm, never cool)
        concrete:        '#4A4A48',
        'concrete-mid':  '#7A7875',
        'concrete-light':'#B8B5B0',
        'concrete-bg':   '#F5F3F0',

        // Surface tokens
        surface:         '#FFFFFF',
        'surface-raised':'#FAFAF9',
        border:          '#E5E2DE',

        // Semantic palette (color encodes meaning only)
        danger:   '#C13B2A',   // critical / SLA breach / RTI / ghost
        warning:  '#D4730A',   // high severity / near-breach / pending
        success:  '#1A7A4A',   // resolved / verified / on-time
        info:     '#2D6A9F',   // ONLY: assigned / in-progress status
        predicted:'#6B50B8',   // ONLY: AI-generated output

        // Severity aliases
        critical: '#C13B2A',
        high:     '#D4730A',
        medium:   '#D4730A',
        low:      '#1A7A4A',
        resolved: '#1A7A4A',
        ghost:    '#8B1A1A',

        // ── Warm gray remap — replaces cool Tailwind default globally ──────────
        // All gray-* utilities (hover:bg-gray-50 etc.) now use warm concrete values.
        gray: {
          50:  '#FAFAF9',
          100: '#F5F3F0',
          200: '#E5E2DE',
          300: '#D6D2CC',
          400: '#B8B5B0',
          500: '#7A7875',
          600: '#5C5A57',
          700: '#4A4A48',
          800: '#2A2A28',
          900: '#1C1C1A',
          950: '#111110',
        },
        // Slate remapped to same warm values (slate-* → warm concrete)
        slate: {
          50:  '#FAFAF9',
          100: '#F5F3F0',
          200: '#E5E2DE',
          300: '#D6D2CC',
          400: '#B8B5B0',
          500: '#7A7875',
          600: '#5C5A57',
          700: '#4A4A48',
          800: '#2A2A28',
          900: '#1C1C1A',
          950: '#111110',
        },
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
