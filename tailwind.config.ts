import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bebas Neue', 'Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // PourHub brand colors
        orange: {
          DEFAULT: "hsl(var(--orange))",
          dark: "hsl(var(--orange-dark))",
          light: "hsl(var(--orange-light))",
        },
        black: {
          DEFAULT: "hsl(var(--black))",
          pure: "hsl(var(--black-pure))",
          soft: "hsl(var(--black-soft))",
          card: "hsl(var(--black-card))",
        },
        gray: {
          dark: "hsl(var(--gray-dark))",
          mid: "hsl(var(--gray-mid))",
          light: "hsl(var(--gray-light))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow': '0 0 20px hsl(var(--orange) / 0.4)',
        'glow-sm': '0 0 10px hsl(var(--orange) / 0.3)',
        'dark': '0 10px 40px -10px hsl(0 0% 0% / 0.7)',
        'card': '0 4px 20px -5px hsl(0 0% 0% / 0.5)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--orange) / 0.4)" },
          "50%": { boxShadow: "0 0 30px hsl(var(--orange) / 0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      fontSize: {
        'touch': ['1rem', { lineHeight: '1.5' }],
        'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '0.02em' }],
        'display-lg': ['2.5rem', { lineHeight: '1.15', letterSpacing: '0.02em' }],
        'display-md': ['2rem', { lineHeight: '1.2', letterSpacing: '0.01em' }],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
