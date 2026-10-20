/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#000000",
                "background-light": "#ffffff",
                "background-dark": "#191919",
                "off-white": "#f7f7f7",
                "neutral-50": "#fafafa",
                "neutral-100": "#f5f5f5",
                "neutral-200": "#e5e5e5",
                "neutral-300": "#d4d4d4",
                "neutral-400": "#a3a3a3",
                "neutral-500": "#737373",
                "neutral-600": "#525252",
                "neutral-900": "#171717",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.125rem",
                "none": "0",
                "sm": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
