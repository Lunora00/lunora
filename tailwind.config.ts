import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    fontFamily: {
      sans: ['"DM Sans"', 'sans-serif'],
      serif: ['"DM Sans"', 'sans-serif'],
      mono: ['"DM Sans"', 'sans-serif'],
    },
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  corePlugins: {
    // Don't let Tailwind override our fonts
  },
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
}

export default config
