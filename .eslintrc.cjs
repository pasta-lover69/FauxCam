module.exports = {
  env: {
    browser: true,
    es2022: true,
    webextensions: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "script", // MV3 content scripts are not ES modules
  },
  rules: {
    // Correctness
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-undef": "error",
    "no-var": "error",
    "prefer-const": "error",

    // Safety
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",

    // Style
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "no-console": ["warn", { allow: ["warn", "info", "error"] }],

    // Async
    "no-async-promise-executor": "error",
    "require-await": "error",
  },
  // inject.js runs in page context — it only has access to standard Web APIs
  overrides: [
    {
      files: ["inject.js"],
      env: {
        browser: true,
        webextensions: false, // no chrome.* APIs in page context
      },
    },
  ],
};
