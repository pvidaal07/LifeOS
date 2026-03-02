module.exports = {
  root: true,
  ignorePatterns: ['dist', 'coverage'],
  overrides: [
    {
      files: ['**/*.{js,mjs,cjs}'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
      extends: ['plugin:react-hooks/recommended'],
      rules: {
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
  ],
};
