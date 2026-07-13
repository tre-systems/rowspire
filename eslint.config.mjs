import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

const domainFacadeImports = [
  {
    group: ['**/schemas'],
    message: 'Import the consolidated domain model from types.ts.',
  },
];

const uiLayerImports = [
  {
    group: [
      '@/components/**',
      '@/hooks/**',
      '@/app/**',
      '**/components/**',
      '**/hooks/**',
      '**/app/**',
    ],
    message: 'Library code must not depend on UI layers.',
  },
];

const adapterImports = [
  {
    group: ['**/bindings', '**/ai.worker', '**/ai-worker-*', '**/wasm-ai-service'],
    message: 'UI code must use stores and application services instead of low-level adapters.',
  },
];

const shellImports = [
  {
    group: [
      'react',
      'react/**',
      'zustand',
      'zustand/**',
      'immer',
      '**/*-store',
      '**/*-service',
      '**/*-client',
      '**/*.worker',
      '**/bindings',
      '**/logic/ai-logic',
    ],
    message: 'Pure core code must not depend on stores, UI frameworks, or external adapters.',
  },
];

export default tseslint.config(
  {
    ignores: [
      '.wrangler/**',
      'node_modules/**',
      '*.config.mjs',
      'worker-configuration.d.ts',
      'public/**',
      'src/lib/wasm/**',
      'out/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'worker/target/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports', prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.type='Identifier'][callee.name=/^use[A-Z].*Store$/][arguments.length=0]",
          message: 'Subscribe to Zustand stores with a selector.',
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/types.ts', 'src/lib/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: domainFacadeImports,
        },
      ],
    },
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    ignores: ['src/lib/types.ts', 'src/lib/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [...domainFacadeImports, ...uiLayerImports],
        },
      ],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [...domainFacadeImports, ...adapterImports],
        },
      ],
    },
  },
  {
    files: [
      'src/lib/schemas.ts',
      'src/lib/game-logic.ts',
      'src/lib/game-presentation.ts',
      'src/lib/game-state-machine.ts',
      'src/lib/logic/board-logic.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [...domainFacadeImports, ...uiLayerImports, ...shellImports],
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
