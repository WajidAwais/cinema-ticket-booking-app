const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { startApp, hasDatabase } = require("./helpers");

const skip = hasDatabase ? false : "set MONGODB_URI to run the integration tests";

describe("booking app", { skip }, () => {
  let app;
  let Booking;
  let Cinema;

  before(async () => {
    app = await startApp();
    Booking = mongoose.model("Booking");
    Cinema = mongoose.model("Cinema");
  });
  after(() => app && app.stop());

  // Walks the pages the way a visitor does and returns the showtime offered.
  async function firstShowtime(cinema) {
    const res = await app.get(`/select.html/${encodeURIComponent(cinema)}`);
    const html = await res.text();
    return html.match(/name="showtime" value="([^"]+)"/)[1];
  }

  test("seeds the demo catalogue once", async () => {
    assert.equal(await Cinema.countDocuments(), 3);
    await app.db.seedCatalog();
    assert.equal(await Cinema.countDocuments(), 3);
  });

  for (const path of ["/", "/landing.html", "/user.html", "/index.html", "/cinemalist.html", "/watchhist.html"]) {
    test(`GET ${path} renders`, async () => {
      const res = await app.get(path);
      assert.equal(res.status, 200);
      assert.match(await res.text(), /<main id="main"/);
    });
  }

  test("browsing does not write to the database", async () => {
    const before = [await Booking.countDocuments(), await Cinema.countDocuments()];
    for (const path of ["/index.html", "/index.html/The%20Nun", "/pop.html/The%20Nun", "/cinemalist.html?movie=The+Nun", "/select.html/Seaview%20Screens", "/paymentsummary.html", "/watchhist.html"]) {
      const res = await app.get(path);
      assert.ok(res.status < 500, `${path} returned ${res.status}`);
    }
    assert.deepEqual([await Booking.countDocuments(), await Cinema.countDocuments()], before);
  });

  test("the film list shows each title once", async () => {
    const html = await (await app.get("/index.html")).text();
    const titles = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map((m) => m[1]);
    assert.equal(titles.length, 7);
    assert.equal(new Set(titles).size, titles.length);
  });

  test("choosing seats redirects to the cinemas showing that film", async () => {
    const res = await app.post("/pop.html/A%20Quiet%20Place", { seats: "4", seatClass: "gold" });
    assert.equal(res.status, 303);
    const location = res.headers.get("location");
    assert.equal(location, "/cinemalist.html?movie=A+Quiet+Place&seats=4&seatClass=gold");
    const html = await (await app.get(location)).text();
    assert.match(html, /Seaview Screens/);
    assert.match(html, /Blue Area Cineplex/);
    assert.doesNotMatch(html, /Mall Road Picture House/);
  });

  test("an invalid seat count re-renders the form with an error", async () => {
    const res = await app.post("/pop.html/The%20Nun", { seats: "40", seatClass: "gold" });
    assert.equal(res.status, 400);
    assert.match(await res.text(), /Choose between 1 and 10 seats/);
  });

  test("a booking is priced on the server and stored once", async () => {
    const showtime = await firstShowtime("Mall Road Picture House");
    const fields = { movie: "The Nun", cinema: "Mall Road Picture House", seats: "3", seatClass: "silver", showtime };

    const checkout = await app.get(`/payment.html?${new URLSearchParams(fields)}`);
    assert.equal(checkout.status, 200);
    assert.match(await checkout.text(), /Pay Rs 1,890/);

    const before = await Booking.countDocuments();
    // Extra price fields from the client must be ignored.
    const res = await app.post("/paymentsummary.html", { ...fields, total: "1", unitPrice: "1" });
    assert.equal(res.status, 303);
    assert.equal(await Booking.countDocuments(), before + 1);

    const id = res.headers.get("location").split("id=")[1];
    const stored = await Booking.findById(id).lean();
    assert.equal(stored.unitPrice, 600);
    assert.equal(stored.total, 1890);

    const summary = await (await app.get(res.headers.get("location"))).text();
    assert.match(summary, /You're booked for The Nun/);
    const history = await (await app.get("/watchhist.html")).text();
    assert.match(history, new RegExp(id.slice(-8).toUpperCase()));
  });

  test("a cinema that isn't showing the film is refused", async () => {
    const showtime = await firstShowtime("Seaview Screens");
    const res = await app.post("/paymentsummary.html", {
      movie: "The Nun", cinema: "Seaview Screens", seats: "1", seatClass: "gold", showtime,
    });
    assert.equal(res.status, 400);
    assert.match(await res.text(), /isn&#39;t showing The Nun/);
  });

  test("a showtime that isn't on offer is refused", async () => {
    const res = await app.post("/paymentsummary.html", {
      movie: "The Nun", cinema: "Mall Road Picture House", seats: "1", seatClass: "gold",
      showtime: "2020-01-01T13:00:00.000Z",
    });
    assert.equal(res.status, 400);
    assert.match(await res.text(), /no longer available/);
  });

  for (const path of ["/pop.html/No%20Such%20Film", "/select.html/Nowhere", "/paymentsummary.html?id=nope", "/paymentsummary.html?id=000000000000000000000000"]) {
    test(`GET ${path} is a 404`, async () => {
      const res = await app.get(path);
      assert.equal(res.status, 404);
      assert.match(await res.text(), /couldn&#39;t find that page/);
    });
  }
});
