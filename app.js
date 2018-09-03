const path = require("node:path");
const express = require("express");
const db = require("./app_server/models/db");
const routes = require("./app_server/routes/route");
const format = require("./app_server/lib/format");

const app = express();

app.set("views", path.join(__dirname, "app_server", "views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.locals.format = format;

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/", routes);

app.use((req, res) => {
  res.status(404).render("error.html", {
    title: "Not found",
    heading: "We couldn't find that page",
    message: "The film, cinema or booking you asked for doesn't exist.",
  });
});

// Express 5 forwards rejected promises from async handlers to here.
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).render("error.html", {
    title: "Something went wrong",
    heading: "Something went wrong",
    message: "The booking service hit an error. Please try again in a moment.",
  });
});

module.exports = app;

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  db.connect()
    .then(() => {
      app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
    })
    .catch((err) => {
      console.error("Could not connect to MongoDB:", err.message);
      process.exit(1);
    });
}
