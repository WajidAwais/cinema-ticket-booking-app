const mongoose = require("mongoose");
const Cinema = mongoose.model("Cinema");
const { parseBooking, bookingQuery, upcomingShowtimes } = require("../lib/booking");

module.exports.list = async function (req, res) {
  const { booking } = parseBooking(req.query, []);
  const filter = booking.movie ? { "movList.title": booking.movie } : {};
  const cinemas = await Cinema.find(filter, { movList: 0 }).sort({ id: 1 }).lean();
  res.render("cinemalist.html", {
    title: "Cinemas",
    booking,
    cinemas,
    query: bookingQuery(booking),
  });
};

module.exports.showtimes = async function (req, res, next) {
  const cinema = await Cinema.findOne({ cinema_name: req.params.cinema_name }).lean();
  if (!cinema) return next();
  const { booking } = parseBooking(req.query, []);
  const movies = cinema.movList.map((m) => m.title);
  if (booking.movie && !movies.includes(booking.movie)) delete booking.movie;
  res.render("select.html", {
    title: `Showtimes at ${cinema.cinema_name}`,
    cinema,
    movies,
    booking,
    showtimes: upcomingShowtimes(new Date()),
  });
};

// Old links pointed here; the cinema page lives under /select.html now.
module.exports.redirectToShowtimes = function (req, res) {
  const query = new URLSearchParams(req.query).toString();
  const path = `/select.html/${encodeURIComponent(req.params.cinema_name)}`;
  res.redirect(301, query ? `${path}?${query}` : path);
};
