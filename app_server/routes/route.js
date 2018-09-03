const express = require("express");
const pages = require("../controllers/pages");
const movies = require("../controllers/movies");
const cinemas = require("../controllers/cinemas");
const bookings = require("../controllers/bookings");

const router = express.Router();

// The .html-style paths are kept from the original site so existing links
// keep working. The flow is: film -> seats -> cinema -> showtime -> payment.
router.get("/", pages.landing);
router.get("/landing.html", pages.landing);
router.get("/user.html", pages.profile);

router.get("/index.html", movies.list);
router.get("/index.html/:movie_title", (req, res) => res.redirect(301, "/index.html"));
router.get("/pop.html/:movie_title", movies.seatForm);
router.post("/pop.html/:movie_title", movies.chooseSeats);

router.get("/cinemalist.html", cinemas.list);
router.get("/cinemalist.html/:cinema_name", cinemas.redirectToShowtimes);
router.get("/select.html", (req, res) => res.redirect(301, "/cinemalist.html"));
router.get("/select.html/:cinema_name", cinemas.showtimes);

router.get("/payment.html", bookings.checkout);
router.post("/paymentsummary.html", bookings.create);
router.get("/paymentsummary.html", bookings.summary);
router.get("/watchhist.html", bookings.history);

module.exports = router;
