const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  parseBooking,
  quote,
  upcomingShowtimes,
  isOfferedShowtime,
  bookingQuery,
} = require("../app_server/lib/booking");

const ALL = ["movie", "seats", "seatClass", "cinema", "showtime"];

describe("parseBooking", () => {
  test("accepts a complete booking and converts types", () => {
    const { booking, errors } = parseBooking(
      { movie: " The Nun ", seats: "3", seatClass: "silver", cinema: "Seaview Screens", showtime: "2030-01-02T13:00:00.000Z" },
      ALL
    );
    assert.deepEqual(errors, []);
    assert.equal(booking.movie, "The Nun");
    assert.equal(booking.seats, 3);
    assert.equal(booking.showtime.toISOString(), "2030-01-02T13:00:00.000Z");
  });

  for (const seats of ["0", "11", "2.5", "two", "-1"]) {
    test(`rejects seats=${seats}`, () => {
      const { errors } = parseBooking({ movie: "x", seats, seatClass: "gold" }, ["movie", "seats", "seatClass"]);
      assert.equal(errors.length, 1);
      assert.match(errors[0], /between 1 and 10/);
    });
  }

  test("rejects an unknown seat class and a bad date", () => {
    const { errors } = parseBooking({ seatClass: "platinum", showtime: "soon" }, []);
    assert.equal(errors.length, 2);
  });

  test("reports each missing required field", () => {
    const { errors } = parseBooking({}, ALL);
    assert.equal(errors.length, 5);
  });

  test("ignores non-string values for text fields", () => {
    const { booking, errors } = parseBooking({ movie: ["a", "b"] }, ["movie"]);
    assert.equal(booking.movie, undefined);
    assert.equal(errors.length, 1);
  });
});

describe("quote", () => {
  const cinema = { goldPrice: 950, silverPrice: 600 };

  test("prices gold and silver seats with 5% tax", () => {
    assert.deepEqual(quote(cinema, 2, "gold"), { unitPrice: 950, subtotal: 1900, tax: 95, total: 1995 });
    assert.deepEqual(quote(cinema, 3, "silver"), { unitPrice: 600, subtotal: 1800, tax: 90, total: 1890 });
  });

  test("rounds tax to whole rupees", () => {
    assert.equal(quote({ goldPrice: 333, silverPrice: 0 }, 1, "gold").tax, 17);
  });
});

describe("showtimes", () => {
  const now = new Date(2030, 0, 1, 23, 30);

  test("offers four slots a day for three days, all in the future", () => {
    const slots = upcomingShowtimes(now);
    assert.equal(slots.length, 12);
    assert.ok(slots.every((slot) => slot > now));
    assert.equal(slots[0].getDate(), 2);
    assert.equal(slots[0].getHours(), 13);
  });

  test("only accepts a slot that is on offer", () => {
    const [first] = upcomingShowtimes(now);
    assert.equal(isOfferedShowtime(first, now), true);
    assert.equal(isOfferedShowtime(new Date(first.getTime() + 60_000), now), false);
  });
});

test("bookingQuery carries only known fields, in a stable order", () => {
  const query = bookingQuery({ seats: 2, movie: "A Quiet Place", total: 1, showtime: new Date("2030-01-02T13:00:00Z") });
  assert.equal(query, "movie=A+Quiet+Place&seats=2&showtime=2030-01-02T13%3A00%3A00.000Z");
});
