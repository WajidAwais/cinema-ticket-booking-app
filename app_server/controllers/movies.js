const mongoose = require("mongoose");
const Cinema = mongoose.model("Cinema");
const { parseBooking, bookingQuery, MAX_SEATS } = require("../lib/booking");

// Several cinemas screen the same film; the listing shows each title once.
module.exports.list = async function (req, res) {
  const cinemas = await Cinema.find({}, { movList: 1 }).lean();
  const byTitle = new Map();
  for (const cinema of cinemas) {
    for (const movie of cinema.movList) {
      if (!byTitle.has(movie.title)) byTitle.set(movie.title, movie);
    }
  }
  const movies = [...byTitle.values()].sort((a, b) => a.movieid - b.movieid);
  res.render("index.html", { title: "Now showing", movies });
};

async function findMovie(title) {
  const cinema = await Cinema.findOne({ "movList.title": title }, { "movList.$": 1 }).lean();
  return cinema ? cinema.movList[0] : null;
}

function renderSeatForm(res, status, movie, form, errors) {
  res.status(status).render("pop.html", { title: `Seats for ${movie.title}`, movie, form, errors, MAX_SEATS });
}

module.exports.seatForm = async function (req, res, next) {
  const movie = await findMovie(req.params.movie_title);
  if (!movie) return next();
  renderSeatForm(res, 200, movie, { seats: 2, seatClass: "gold" }, []);
};

module.exports.chooseSeats = async function (req, res, next) {
  const movie = await findMovie(req.params.movie_title);
  if (!movie) return next();
  const { booking, errors } = parseBooking(
    { ...req.body, movie: movie.title },
    ["movie", "seats", "seatClass"]
  );
  if (errors.length) return renderSeatForm(res, 400, movie, req.body || {}, errors);
  res.redirect(303, `/cinemalist.html?${bookingQuery(booking)}`);
};
