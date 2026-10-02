/**
 * 디자인 토큰(docs/DESIGN.md 2~3절). 값은 시안에서 추정한 시작값이며,
 * 디자이너가 확정하면 DESIGN.md와 src/theme/tokens.ts를 함께 바꾼다.
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
      spacing: { gutter: '20px' },
    },
  },
  plugins: [],
};
