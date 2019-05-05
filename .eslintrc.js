module.exports = {
  parser: "@typescript-eslint/parser",
  'env': {
    'browser': true,
    'es6': true,
    'jest': true
  },
  'extends': 'standard',
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly'
  },
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module'
  },
  'rules': {
  }
}
