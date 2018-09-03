// Show a pending state on forms that hit the server, and stop double submits.
document.querySelectorAll("form[data-pending-label]").forEach(function (form) {
  form.addEventListener("submit", function () {
    var button = form.querySelector("button[type=submit]");
    if (!button) return;
    button.disabled = true;
    button.textContent = form.getAttribute("data-pending-label");
    form.setAttribute("aria-busy", "true");
  });
});
