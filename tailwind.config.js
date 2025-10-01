/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			black: {
  				'100': '#000000',
  				'200': '#000000',
  				'300': '#000000',
  				'400': '#000000',
  				'500': '#000000',
  				'600': '#333333',
  				'700': '#666666',
  				'800': '#999999',
  				'900': '#cccccc',
  				DEFAULT: '#000000'
  			},
  			oxford_blue: {
  				'100': '#04070c',
  				'200': '#080d19',
  				'300': '#0c1425',
  				'400': '#101b31',
  				'500': '#14213d',
  				'600': '#29447e',
  				'700': '#3e67bf',
  				'800': '#7e99d5',
  				'900': '#beccea',
  				DEFAULT: '#14213d'
  			},
  			orange_web: {
  				'100': '#362101',
  				'200': '#6b4201',
  				'300': '#a16402',
  				'400': '#d68502',
  				'500': '#fca311',
  				'600': '#fdb541',
  				'700': '#fec871',
  				'800': '#fedaa0',
  				'900': '#ffedd0',
  				DEFAULT: '#fca311'
  			},
  			platinum: {
  				'100': '#2e2e2e',
  				'200': '#5c5c5c',
  				'300': '#8a8a8a',
  				'400': '#b8b8b8',
  				'500': '#e5e5e5',
  				'600': '#ebebeb',
  				'700': '#f0f0f0',
  				'800': '#f5f5f5',
  				'900': '#fafafa',
  				DEFAULT: '#e5e5e5'
  			},
  			white: {
  				'100': '#333333',
  				'200': '#666666',
  				'300': '#999999',
  				'400': '#cccccc',
  				'500': '#ffffff',
  				'600': '#ffffff',
  				'700': '#ffffff',
  				'800': '#ffffff',
  				'900': '#ffffff',
  				DEFAULT: '#ffffff'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

