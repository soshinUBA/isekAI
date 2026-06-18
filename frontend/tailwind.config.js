/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'slate-nav': '#1E2229',
        'canvas': '#F4F5F7',
        'primary': '#4F46E5',
        'primary-hover': '#4338CA',
        'success': '#10B981',
        'alert': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
