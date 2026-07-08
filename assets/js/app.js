// Small page helpers for Phase 2.
// Bigger features like search, auth, Supabase, likes, and admin tools come in later phases.
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const yearTarget = document.querySelector("[data-current-year]");

    if (yearTarget) {
      yearTarget.textContent = new Date().getFullYear();
    }
  });
})();
