const mongoose = require("mongoose");

require("./showtimedb");
require("./booking");
require("./usersdb");

const Cinema = mongoose.model("Cinema");
const { cinemas } = require("../data/catalog");

const DEFAULT_URI = "mongodb://localhost:27017/ticketing";

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

// Connects and, on an empty database, writes the demo catalogue so the
// pages have something to show. Seeding happens here, once, instead of in a
// GET handler.
async function connect(uri = process.env.MONGODB_URI || DEFAULT_URI) {
  await mongoose.connect(uri);
  if ((await Cinema.estimatedDocumentCount()) === 0) {
    await Cinema.insertMany(cinemas);
  }
  return mongoose.connection;
}

module.exports = { connect };
