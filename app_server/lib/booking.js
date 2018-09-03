// Booking rules that don't need the database: validating what the visitor
// picked, pricing it, and listing the showtimes on offer.

const MAX_SEATS = 10;
const SEAT_CLASSES = ["gold", "silver"];
const TAX_RATE = 0.05;
const SHOW_TIMES = ["13:00", "16:30", "20:00", "22:45"];
const DAYS_AHEAD = 3;

// Parses the fields that travel between pages (query string or form body).
// Only the fields listed in `required` must be present.
function parseBooking(input, required) {
  const source = input || {};
  const errors = [];
  const booking = {};

  const movie = typeof source.movie === "string" ? source.movie.trim() : "";
  if (movie) booking.movie = movie;
  else if (required.includes("movie")) errors.push("Pick a film first.");

  if (source.seats !== undefined && source.seats !== "") {
    const seats = Number(source.seats);
    if (Number.isInteger(seats) && seats >= 1 && seats <= MAX_SEATS) booking.seats = seats;
    else errors.push(`Choose between 1 and ${MAX_SEATS} seats.`);
  } else if (required.includes("seats")) {
    errors.push("Choose how many seats you need.");
  }

  if (source.seatClass !== undefined && source.seatClass !== "") {
    if (SEAT_CLASSES.includes(source.seatClass)) booking.seatClass = source.seatClass;
    else errors.push("Seat class must be gold or silver.");
  } else if (required.includes("seatClass")) {
    errors.push("Choose gold or silver seats.");
  }

  const cinema = typeof source.cinema === "string" ? source.cinema.trim() : "";
  if (cinema) booking.cinema = cinema;
  else if (required.includes("cinema")) errors.push("Pick a cinema.");

  if (source.showtime) {
    const showtime = new Date(source.showtime);
    if (Number.isNaN(showtime.getTime())) errors.push("That showtime isn't valid.");
    else booking.showtime = showtime;
  } else if (required.includes("showtime")) {
    errors.push("Pick a showtime.");
  }

  return { booking, errors };
}

// Prices are whole rupees. The price always comes from the cinema record on
// the server, never from the form.
function quote(cinema, seats, seatClass) {
  const unitPrice = seatClass === "gold" ? cinema.goldPrice : cinema.silverPrice;
  const subtotal = unitPrice * seats;
  const tax = Math.round(subtotal * TAX_RATE);
  return { unitPrice, subtotal, tax, total: subtotal + tax };
}

// The next few days of screenings, starting tomorrow so a slot is never in
// the past when the page renders. Times are local to the server.
function upcomingShowtimes(now) {
  const slots = [];
  for (let day = 1; day <= DAYS_AHEAD; day++) {
    for (const time of SHOW_TIMES) {
      const [hours, minutes] = time.split(":").map(Number);
      const slot = new Date(now);
      slot.setDate(slot.getDate() + day);
      slot.setHours(hours, minutes, 0, 0);
      slots.push(slot);
    }
  }
  return slots;
}

function isOfferedShowtime(showtime, now) {
  return upcomingShowtimes(now).some((slot) => slot.getTime() === showtime.getTime());
}

// Builds the query string that carries a partial booking to the next page.
function bookingQuery(booking) {
  const params = new URLSearchParams();
  for (const key of ["movie", "seats", "seatClass", "cinema"]) {
    if (booking[key] !== undefined) params.set(key, String(booking[key]));
  }
  if (booking.showtime) params.set("showtime", booking.showtime.toISOString());
  return params.toString();
}

module.exports = {
  MAX_SEATS,
  SEAT_CLASSES,
  TAX_RATE,
  parseBooking,
  quote,
  upcomingShowtimes,
  isOfferedShowtime,
  bookingQuery,
};
