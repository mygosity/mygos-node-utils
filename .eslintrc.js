module.exports = {
  extends: ['prettier'],
  plugins: ['prettier'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
  },
  rules: {
    'prettier/prettier': ['error'],
  },
};
