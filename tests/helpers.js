// Boots the app in-process on a random port against a throwaway database.
// Integration tests need a MongoDB server: set MONGODB_URI to point at one.
const mongoose = require("mongoose");

const BASE_URI = process.env.MONGODB_URI;

async function startApp() {
  const uri = new URL(BASE_URI);
  uri.pathname = `/ticketing_test_${process.pid}_${Date.now()}`;
  const db = require("../app_server/models/db");
  await db.connect(uri.toString());
  const app = require("../app");
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    db,
    base,
    get: (path) => fetch(base + path, { redirect: "manual" }),
    post: (path, fields) =>
      fetch(base + path, {
        method: "POST",
        redirect: "manual",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(fields).toString(),
      }),
    async stop() {
      await new Promise((resolve) => server.close(resolve));
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    },
  };
}

module.exports = { startApp, hasDatabase: Boolean(BASE_URI) };
