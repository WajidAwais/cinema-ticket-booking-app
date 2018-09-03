const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: ["node_modules/", "project_venv/", "public/js/jquery/", "public/js/bootstrap/", "public/js/plugins/", "public/js/active.js"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },
  {
    files: ["public/js/**/*.js"],
    languageOptions: { sourceType: "script", globals: globals.browser },
  },
];
