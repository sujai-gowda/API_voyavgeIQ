/** @type {import('tailwindcss').Config} */

// ── ARCTIC WHITE THEME ─────────────────────────────────
// Background : pure white  #ffffff
// Text       : deep navy   #0f172a
// Accent     : sky blue    #0ea5e9  (prices, highlights)
// Buttons    : deep navy   #0f172a  (CTA)
// Scores     : emerald / amber / rose  (functional badges)
// ────────────────────────────────────────────────────────

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {

        // brand  →  rich black for CTA and headings
        brand: {
          50:  '#F9FAFB',
          100: '#F3F4F6',   // Secondary button hover bg
          200: '#D1D5DB',   // Border color
          300: '#111111',   // Text — pure black
          400: '#111111',   // Text — pure black
          500: '#111111',   // Text — pure black
          600: '#111111',   // Text — pure black
          700: '#111111',
          800: '#111111',
          900: '#111111',
          950: '#111111',
        },

        // accent  →  emerald green
        accent: {
          50:  '#F0FDF4',
          100: '#E8FFF6',   // light accent bg
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#00A86B',   // primary emerald accent (Success/CTA)
          500: '#008F5A',   // primary emerald hover state
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          955: '#F3F4F6',
        },

        // dark  →  monochrome UI variables (white primary bg, black text)
        dark: {
          50:  '#111111',
          100: '#111111',   // Primary text
          200: '#111111',   // Secondary heading text — pure black
          300: '#111111',   // Secondary body text — pure black
          400: '#111111',   // Muted text — pure black
          500: '#111111',   // Placeholder text — pure black
          600: '#F1F3F5',   // Dividers
          700: '#D1D5DB',   // Border color
          800: '#FFFFFF',   // Card background
          900: '#FFFFFF',   // Page background
          950: '#F8F9FA',   // Secondary background
          955: '#F3F4F6',
        },
      },

      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },

      boxShadow: {
        // Subtle premium shadows
        'glass':       '0 1px 4px 0 rgba(17,17,17,0.04), 0 1px 2px -1px rgba(17,17,17,0.02)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255,255,255,0.90)',
        'card-hover':  '0 8px 30px 0 rgba(17,17,17,0.06)',
        'emerald-glow': '0 0 20px rgba(0,168,107,0.15)',
      },

      backgroundImage: {
        'radial-gradient': 'radial-gradient(circle at top, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
