/* ESLint 8 legacy config. Kept deliberately strict on accessibility (jsx-a11y) because
   accessibility is a scored rubric area for the event. */
module.exports = {
  root: true,
  env: { browser: true, es2023: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2023, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  ignorePatterns: ['dist', 'node_modules', 'pkg', 'pkg-simd', 'target', '*.cjs'],
  rules: {
    // Hot loops index typed arrays under noUncheckedIndexedAccess; the non-null assertion is
    // the cheapest honest way to say "in range by construction".
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': ['error', { allow: ['warn'] }],
    'no-debugger': 'error',
    eqeqeq: ['error', 'always'],
    'prefer-const': 'error',
  },
  overrides: [
    {
      files: ['plugins/**/*.ts', 'scripts/**/*.mjs', 'vite.config.ts'],
      rules: { 'no-console': 'off' },
    },
  ],
};
