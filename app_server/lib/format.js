// View helpers, exposed to every template through app.locals.

const showtimeFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

module.exports = {
  rupees: (amount) => `Rs ${Number(amount).toLocaleString("en-US")}`,
  showtime: (date) => showtimeFormat.format(new Date(date)),
  day: (date) => dayFormat.format(new Date(date)),
  time: (date) => timeFormat.format(new Date(date)),
  // Short, readable booking reference derived from the MongoDB id.
  reference: (id) => String(id).slice(-8).toUpperCase(),
};
