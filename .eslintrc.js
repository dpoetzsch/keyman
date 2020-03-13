module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
  },
  plugins: [],
  extends: ["eslint:recommended", "prettier"],
  rules: {
    "no-unused-vars": ["off"],
  },
  globals: {
    imports: "readonly",
    print: "readonly",
    printerr: "readonly",
  },
  env: {
    es6: true,
  },
};
