// Small shared page helpers.
// Bigger features like Supabase auth and database calls will be added in later phases.
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const yearTarget = document.querySelector("[data-current-year]");

    if (yearTarget) {
      yearTarget.textContent = new Date().getFullYear();
    }
  });
})();
