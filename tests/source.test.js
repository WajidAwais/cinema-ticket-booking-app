// Guards against regressions that were found in this codebase's past: a
// connection string with credentials in the source, and model files each
// opening their own database connection.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const sourceFiles = [path.join(root, "app.js")];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".js")) sourceFiles.push(full);
  }
})(path.join(root, "app_server"));

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("no connection string carries a password", () => {
  const withCredentials = /mongodb(\+srv)?:\/\/[^/\s"']*:[^@\s"']+@/;
  const offenders = sourceFiles.filter((f) => withCredentials.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(offenders, []);
});

test("the database URI comes from the environment", () => {
  const db = fs.readFileSync(path.join(root, "app_server", "models", "db.js"), "utf8");
  assert.match(db, /process\.env\.MONGODB_URI/);
});

test("only db.js opens a connection", () => {
  const connecting = sourceFiles.filter((f) => /mongoose\.connect\(/.test(stripComments(fs.readFileSync(f, "utf8"))));
  assert.deepEqual(connecting.map((f) => path.relative(root, f)), [path.join("app_server", "models", "db.js")]);
});
