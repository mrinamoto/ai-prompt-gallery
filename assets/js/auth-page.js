// Authentication page behavior: sign up, login, forgot password, password reset, and Google login.
(function () {
  const elements = {};

  function getClient() {
    return window.PromptGalleryAuth?.getClient();
  }

  function getRedirectUrl() {
    return window.PromptGalleryAuth?.getAuthRedirectUrl() || "./account.html";
  }

  function getAbsoluteRedirect(page) {
    if (window.location.protocol === "file:") {
      return undefined;
    }

    return new URL(page, window.location.href).href;
  }

  function showStatus(message, type) {
    elements.status.textContent = message;
    elements.status.classList.toggle("is-error", type === "error");
    elements.status.classList.toggle("is-success", type === "success");
  }

  function setLoading(form, isLoading) {
    form.querySelectorAll("button, input").forEach((field) => {
      field.disabled = isLoading;
    });
  }

  function showMode(mode) {
    elements.tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.authMode === mode);
    });

    elements.forms.forEach((form) => {
      form.hidden = form.dataset.authForm !== mode;
    });

    showStatus("", "");
  }

  async function handleLogin(event) {
    event.preventDefault();

    const client = getClient();

    if (!client) {
      showStatus("Add your Supabase Project URL and anon key before logging in.", "error");
      return;
    }

    const form = event.currentTarget;
    const email = form.email.value.trim();
    const password = form.password.value;

    setLoading(form, true);

    const { error } = await client.auth.signInWithPassword({ email, password });

    setLoading(form, false);

    if (error) {
      showStatus(error.message, "error");
      return;
    }

    window.location.href = getRedirectUrl();
  }

  async function handleSignup(event) {
    event.preventDefault();

    const client = getClient();

    if (!client) {
      showStatus("Add your Supabase Project URL and anon key before signing up.", "error");
      return;
    }

    const form = event.currentTarget;
    const email = form.email.value.trim();
    const password = form.password.value;
    const displayName = form.display_name.value.trim();
    const username = form.username.value.trim().toLowerCase();

    if (password.length < 8) {
      showStatus("Use at least 8 characters for the password.", "error");
      return;
    }

    setLoading(form, true);

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          username
        },
        emailRedirectTo: getAbsoluteRedirect("./account.html")
      }
    });

    setLoading(form, false);

    if (error) {
      showStatus(error.message, "error");
      return;
    }

    if (data.session) {
      window.location.href = getRedirectUrl();
      return;
    }

    showStatus("Account created. Check your email to confirm your sign up.", "success");
  }

  async function handleForgotPassword(event) {
    event.preventDefault();

    const client = getClient();

    if (!client) {
      showStatus("Add your Supabase Project URL and anon key before sending a reset email.", "error");
      return;
    }

    const form = event.currentTarget;
    const email = form.email.value.trim();

    setLoading(form, true);

    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: getAbsoluteRedirect("./auth.html#reset-password")
    });

    setLoading(form, false);

    if (error) {
      showStatus(error.message, "error");
      return;
    }

    showStatus("Password reset email sent. Check your inbox.", "success");
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault();

    const client = getClient();

    if (!client) {
      showStatus("Supabase is not configured yet.", "error");
      return;
    }

    const form = event.currentTarget;
    const password = form.password.value;

    if (password.length < 8) {
      showStatus("Use at least 8 characters for the new password.", "error");
      return;
    }

    setLoading(form, true);

    const { error } = await client.auth.updateUser({ password });

    setLoading(form, false);

    if (error) {
      showStatus(error.message, "error");
      return;
    }

    showStatus("Password updated. You can continue to your account.", "success");
    window.setTimeout(function () {
      window.location.href = "./account.html";
    }, 900);
  }

  async function handleGoogleLogin() {
    const client = getClient();

    if (!client) {
      showStatus("Configure Supabase first, then enable Google in the Supabase dashboard.", "error");
      return;
    }

    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAbsoluteRedirect("./account.html")
      }
    });

    if (error) {
      showStatus(error.message, "error");
    }
  }

  function bindEvents() {
    elements.tabs.forEach((tab) => {
      tab.addEventListener("click", function () {
        showMode(tab.dataset.authMode);
      });
    });

    elements.loginForm.addEventListener("submit", handleLogin);
    elements.signupForm.addEventListener("submit", handleSignup);
    elements.forgotForm.addEventListener("submit", handleForgotPassword);
    elements.resetForm.addEventListener("submit", handlePasswordUpdate);
    elements.googleButton.addEventListener("click", handleGoogleLogin);
  }

  function cacheElements() {
    elements.status = document.querySelector("[data-auth-status]");
    elements.tabs = document.querySelectorAll("[data-auth-mode]");
    elements.forms = document.querySelectorAll("[data-auth-form]");
    elements.loginForm = document.querySelector("[data-auth-form='login']");
    elements.signupForm = document.querySelector("[data-auth-form='signup']");
    elements.forgotForm = document.querySelector("[data-auth-form='forgot']");
    elements.resetForm = document.querySelector("[data-auth-form='reset']");
    elements.googleButton = document.querySelector("[data-google-login]");
  }

  document.addEventListener("DOMContentLoaded", function () {
    cacheElements();
    bindEvents();

    const hash = window.location.hash;

    if (hash.includes("reset-password") || hash.includes("type=recovery")) {
      showMode("reset");
    } else {
      showMode("login");
    }

    if (!getClient()) {
      showStatus("Supabase is not configured yet. Paste your Project URL and anon key in assets/js/supabase-client.js.", "error");
    }
  });
})();
