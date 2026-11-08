/* ESLint 8 legacy config. Accessibility rules (jsx-a11y) are on because accessibility is part of the challenge. */
module.exports = {
  root: true,
  env: { browser: true, es2023: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2023, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks', 'jsx-a11y'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended', 'plugin:jsx-a11y/recommended'],
  ignorePatterns: ['dist', 'node_modules', '*.cjs'],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': ['error', { allow: ['warn'] }],
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',
    // Scrollable regions must be keyboard-focusable (WCAG 2.1.1), so tabIndex is allowed on role="region".
    'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'region'] }],
  },
  overrides: [{ files: ['vite.config.ts', 'vitest.config.ts'], env: { node: true } }],
};
