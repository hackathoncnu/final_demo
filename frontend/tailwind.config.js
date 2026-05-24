/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF',
        'primary-hover': '#1E3A8A',
        secondary: '#0F766E',
        'secondary-hover': '#115E59',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'text-primary': '#0F172A',
        'text-muted': '#64748B',
        'border-warm': '#E2E8F0',
        'border-strong': '#CBD5E1',
        danger: '#DC2626',
        urgent: '#B91C1C'
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        card: '6px'
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
}
