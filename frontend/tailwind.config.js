module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand — RTI stamp red-orange (design doc §3)
        civic:         '#C13B2A',
        'civic-dark':  '#9A2D1F',
        'civic-bg':    '#FDF1EF',
        // Concrete greys
        concrete:      '#4A4A48',
        'concrete-mid':'#7A7875',
        'concrete-light':'#B8B5B0',
        'concrete-bg': '#F5F3F0',
        // Semantic ticket colors
        critical:      '#C13B2A',
        high:          '#D4730A',
        medium:        '#1A7A4A',
        resolved:      '#2D6A9F',
        predicted:     '#6B50B8',
        ghost:         '#8B1A1A',
        // Keep these for Landing page (purple theme)
        'brand-purple':'#7b39fc',
        'brand-dark':  '#2b2344',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        manrope: ['Manrope', 'sans-serif'],
        cabin:   ['Cabin', 'sans-serif'],
        serif:   ['"Instrument Serif"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
