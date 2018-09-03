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

// Writes the demo catalogue into an empty database so the pages have
// something to show. Seeding happens here, at startup, not in a GET handler.
async function seedCatalog() {
  if ((await Cinema.estimatedDocumentCount()) === 0) {
    await Cinema.insertMany(cinemas);
  }
}

async function connect(uri = process.env.MONGODB_URI || DEFAULT_URI) {
  await mongoose.connect(uri);
  await seedCatalog();
  return mongoose.connection;
}

module.exports = { connect, seedCatalog };
