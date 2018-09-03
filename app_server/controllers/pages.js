// The account screens are static mock-ups: there is no sign-up, login or
// session handling behind them yet.
module.exports.landing = function (req, res) {
  res.render("landing.html", { title: "Welcome" });
};

module.exports.profile = function (req, res) {
  res.render("user.html", {
    title: "My profile",
    user: {
      name: "Demo User",
      city: "Lahore",
      email: "demo.user@example.com",
      phone: "000-0000000",
    },
  });
};
