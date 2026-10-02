// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const HANGUL = '/[\u3131-\u318E\uAC00-\uD7A3]/';

export default defineConfig(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/.turbo/**',
      '**/ios/**',
      '**/android/**',
      'packages/shared/src/db.types.ts',
      'apps/mobile/expo-env.d.ts',
      'apps/mobile/nativewind-env.d.ts',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: { globals: globals.node },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // 비밀키를 쓰는 어댑터와 서버 코드는 앱 번들에 들어가면 안 된다(CLAUDE.md 보안 규칙).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@eloria/providers', '@eloria/providers/*'],
              message: '앱은 packages/providers를 import할 수 없습니다. API 서버를 거치세요.',
            },
            {
              group: ['@eloria/api', '@eloria/api/*'],
              message: '앱은 apps/api를 import할 수 없습니다.',
            },
          ],
        },
      ],
    },
  },
  {
    // UI 문자열은 src/i18n/ko.ts에만 둔다(CLAUDE.md 앱 규칙).
    files: ['apps/mobile/**/*.tsx'],
    ignores: ['apps/mobile/src/i18n/**', 'apps/mobile/**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `JSXText[value=${HANGUL}]`,
          message: '한국어 문자열은 src/i18n/ko.ts에 두고 가져다 쓰세요.',
        },
        {
          selector: `Literal[value=${HANGUL}]`,
          message: '한국어 문자열은 src/i18n/ko.ts에 두고 가져다 쓰세요.',
        },
      ],
    },
  },
);
