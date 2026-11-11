/**
 * 디자인 토큰(docs/DESIGN.md 2~3절, Figma "ARIN" 01 Brand).
 * 값을 바꾸면 DESIGN.md와 src/theme/tokens.json을 함께 고친다.
 */
const { colors, radius, fontFamily } = require('./src/theme/tokens.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      borderRadius: radius,
      fontFamily,
      spacing: { gutter: '24px' },
    },
  },
  plugins: [],
};
