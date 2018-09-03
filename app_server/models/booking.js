const mongoose = require("mongoose");

// One confirmed ticket purchase. Prices are copied in at booking time so a
// later price change doesn't rewrite what the customer paid.
const bookingSchema = new mongoose.Schema(
  {
    movie: { type: String, required: true },
    cinema: { type: String, required: true },
    seatClass: { type: String, enum: ["gold", "silver"], required: true },
    seats: { type: Number, min: 1, max: 10, required: true },
    showtime: { type: Date, required: true },
    unitPrice: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
