/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Matching Setorial's gamified palette for consistent branding
                primary: {
                    DEFAULT: '#1CB0F6', // Setorial Blue
                    dark: '#1899D6',
                },
                secondary: {
                    DEFAULT: '#58CC02', // Setorial Green
                    dark: '#58A700',
                },
                accent: {
                    DEFAULT: '#FFC800', // Setorial Gold
                    dark: '#EAA300',
                },
                slate: {
                    900: '#0B0D12', // Deep Background
                    800: '#1E222B', // Cards
                    700: '#272B36', // Borders
                }
            },
        },
    },
    plugins: [],
}
