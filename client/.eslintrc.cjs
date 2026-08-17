module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['airbnb', 'airbnb/hooks', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    'import/resolver': { node: { extensions: ['.js', '.jsx'] } },
  },
  rules: {
    'react/react-in-jsx-scope': 'off', // React 17+ JSX transform
    'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx'] }],
    'react/prop-types': 'off', // keep code lean; propTypes optional
    'no-console': 'off',
    'no-underscore-dangle': 'off',
    'jsx-a11y/anchor-is-valid': 'off', // react-router <Link> usage
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['vite.config.js'] }],
    'react/require-default-props': 'off',
  },
};
