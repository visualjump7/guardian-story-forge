import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        chewy: ['Chewy', 'cursive'],
        fredoka: ['Fredoka', 'sans-serif'],
        sans: ['Fredoka', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "story-magic-active": "hsl(var(--story-magic-active))",
        "story-magic-empty": "hsl(var(--story-magic-empty))",
        "story-choice-default": "hsl(var(--story-choice-default))",
        "story-choice-hover": "hsl(var(--story-choice-hover))",
        "story-choice-selected": "hsl(var(--story-choice-selected))",
        "warmth": {
          100: "hsl(var(--warmth-100))",
          200: "hsl(var(--warmth-200))",
          300: "hsl(var(--warmth-300))",
          400: "hsl(var(--warmth-400))",
          500: "hsl(var(--warmth-500))",
        },
        "clay": {
          100: "hsl(var(--clay-100))",
          200: "hsl(var(--clay-200))",
          300: "hsl(var(--clay-300))",
        },
        "gradient-character": {
          start: "hsl(var(--color-character-start))",
          end: "hsl(var(--color-character-end))",
        },
        "gradient-story": {
          start: "hsl(var(--color-story-start))",
          end: "hsl(var(--color-story-end))",
        },
        "gradient-mission": {
          start: "hsl(var(--color-mission-start))",
          end: "hsl(var(--color-mission-end))",
        },
        "gradient-art": {
          start: "hsl(var(--color-art-start))",
          end: "hsl(var(--color-art-end))",
        },
      },
      backgroundImage: {
        'gradient-character': 'var(--gradient-character)',
        'gradient-story': 'var(--gradient-story)',
        'gradient-mission': 'var(--gradient-mission)',
        'gradient-art': 'var(--gradient-art)',
      },
      boxShadow: {
        'gradient-character-glow': 'var(--gradient-character-glow)',
        'gradient-story-glow': 'var(--gradient-story-glow)',
        'gradient-mission-glow': 'var(--gradient-mission-glow)',
        'gradient-art-glow': 'var(--gradient-art-glow)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fadeInUp": {
          from: {
            opacity: "0",
            transform: "translateY(30px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slot-fill": {
          "0%": {
            transform: "scale(0.8) rotate(-5deg)",
            opacity: "0"
          },
          "50%": {
            transform: "scale(1.15) rotate(2deg)",
            opacity: "1"
          },
          "100%": {
            transform: "scale(1) rotate(0deg)",
            opacity: "1"
          }
        },
        "slot-glow": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(247, 191, 57, 0)"
          },
          "50%": {
            boxShadow: "0 0 20px 8px rgba(247, 191, 57, 0.6)"
          }
        },
        "sparkle-burst": {
          "0%": {
            transform: "scale(0.8)",
            opacity: "0"
          },
          "50%": {
            transform: "scale(1.2)",
            opacity: "1"
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1"
          }
        },
        "button-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 0 0 rgba(142, 69, 173, 0.4)"
          },
          "50%": {
            transform: "scale(1.02)",
            boxShadow: "0 0 20px 4px rgba(142, 69, 173, 0.6)"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fadeInUp": "fadeInUp 0.8s ease-out",
        "slot-fill": "slot-fill 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "slot-glow": "slot-glow 0.8s ease-in-out",
        "sparkle-burst": "sparkle-burst 0.5s ease-out",
        "button-pulse": "button-pulse 2.5s ease-in-out infinite"
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
