/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },
        background: {
          light: '#F8FAFC',
          dark: '#0B0D12',
        },
        card: {
          light: '#FFFFFF',
          dark: '#1E293B',
        },
        tier: {
          free: '#58CC02',
          bronze: '#CD7F32',
          silver: '#B4B4B4',
          gold: '#FFD700',
        }
      },
      fontSize: {
        xs: ['10px', '14px'],
        sm: ['12px', '18px'],
        base: ['14px', '22px'],
        lg: ['16px', '26px'],
        xl: ['18px', '26px'],
        '2xl': ['22px', '30px'],
        '3xl': ['28px', '34px'],
        '4xl': ['34px', '38px'],
      },
    },
  },
  plugins: [],
};
