const mongoose = require("mongoose");
const Cinema = mongoose.model("Cinema");
const Booking = mongoose.model("Booking");
const { parseBooking, quote, isOfferedShowtime, bookingQuery } = require("../lib/booking");

const REQUIRED = ["movie", "seats", "seatClass", "cinema", "showtime"];

// Checks a complete booking against the catalogue and prices it. Returns
// either { errors } or { booking, cinema, price }.
async function resolveBooking(input) {
  const { booking, errors } = parseBooking(input, REQUIRED);
  if (errors.length) return { booking, errors };
  const cinema = await Cinema.findOne({
    cinema_name: booking.cinema,
    "movList.title": booking.movie,
  }).lean();
  if (!cinema) return { booking, errors: [`${booking.cinema} isn't showing ${booking.movie}.`] };
  if (!isOfferedShowtime(booking.showtime, new Date())) {
    return { booking, errors: ["That showtime is no longer available. Please pick another."] };
  }
  return { booking, cinema, price: quote(cinema, booking.seats, booking.seatClass), errors: [] };
}

module.exports.checkout = async function (req, res) {
  const result = await resolveBooking(req.query);
  res.status(result.errors.length ? 400 : 200).render("payment.html", {
    title: "Payment",
    ...result,
    query: bookingQuery(result.booking),
  });
};

module.exports.create = async function (req, res) {
  const result = await resolveBooking(req.body);
  if (result.errors.length) {
    return res.status(400).render("payment.html", {
      title: "Payment",
      ...result,
      query: bookingQuery(result.booking),
    });
  }
  const { booking, price } = result;
  const saved = await Booking.create({
    ...booking,
    unitPrice: price.unitPrice,
    tax: price.tax,
    total: price.total,
  });
  res.redirect(303, `/paymentsummary.html?id=${saved.id}`);
};

module.exports.summary = async function (req, res, next) {
  if (!req.query.id) return res.redirect("/watchhist.html");
  if (!mongoose.isValidObjectId(req.query.id)) return next();
  const booking = await Booking.findById(req.query.id).lean();
  if (!booking) return next();
  res.render("paymentsummary.html", { title: "Booking confirmed", booking });
};

module.exports.history = async function (req, res) {
  const bookings = await Booking.find().sort({ createdAt: -1 }).limit(50).lean();
  res.render("watchhist.html", { title: "My bookings", bookings });
};
