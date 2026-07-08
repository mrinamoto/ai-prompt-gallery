// Handles light and dark mode for the whole website.
(function () {
  const storageKey = "ai-prompt-gallery-theme";
  const root = document.documentElement;
  const savedTheme = localStorage.getItem(storageKey);
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  function getStartingTheme() {
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return systemPrefersDark ? "dark" : "light";
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem(storageKey, theme);
    updateToggleLabels(theme);
  }

  function updateToggleLabels(theme) {
    const buttons = document.querySelectorAll("[data-theme-toggle]");
    const nextTheme = theme === "dark" ? "light" : "dark";

    buttons.forEach((button) => {
      button.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
      button.setAttribute("title", `Switch to ${nextTheme} mode`);
    });
  }

  setTheme(getStartingTheme());

  document.addEventListener("DOMContentLoaded", function () {
    updateToggleLabels(root.dataset.theme);

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", function () {
        const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
      });
    });
  });
})();
