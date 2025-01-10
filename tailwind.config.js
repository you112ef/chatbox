/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: ['./src/renderer/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            keyframes: {
                flash: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.3' }
                }
            },
            animation: {
                flash: 'flash 0.5s ease-in-out 2'
            }
        }
    },
    plugins: [
        require('tailwindcss-animate'),
        require('tailwind-scrollbar'),
    ],
    corePlugins: {
        preflight: false,
    },
}
