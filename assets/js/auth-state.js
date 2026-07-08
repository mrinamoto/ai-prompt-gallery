// Shared Supabase Auth state helper.
// Keeps headers in sync and protects pages that require login.
(function () {
  const authState = {
    session: null,
    profile: null
  };

  function getSupabaseState() {
    return window.PromptGallerySupabase || { isConfigured: false, client: null };
  }

  function getClient() {
    const supabaseState = getSupabaseState();
    return supabaseState.isConfigured ? supabaseState.client : null;
  }

  function getRelativePageUrl(page) {
    return new URL(page, window.location.href).href;
  }

  function getAuthRedirectUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect") || "./account.html";
  }

  function redirectToAuth() {
    const currentPage = `${window.location.pathname}${window.location.search}`;
    window.location.href = `./auth.html?redirect=${encodeURIComponent(currentPage)}`;
  }

  function updateHeader(session) {
    const authLinks = document.querySelectorAll("[data-auth-link]");
    const logoutButtons = document.querySelectorAll("[data-logout]");

    authLinks.forEach((link) => {
      const label = link.querySelector("[data-auth-label]");
      const linkText = session?.user ? "Account" : "Sign in";

      if (session?.user) {
        link.setAttribute("href", "./account.html");
      } else {
        link.setAttribute("href", "./auth.html");
      }

      if (label) {
        label.textContent = linkText;
      } else {
        link.textContent = linkText;
      }
    });

    logoutButtons.forEach((button) => {
      button.hidden = !session?.user;
    });
  }

  async function loadSession() {
    const client = getClient();

    if (!client) {
      updateHeader(null);
      return null;
    }

    const { data, error } = await client.auth.getSession();

    if (error) {
      console.warn(error.message);
      updateHeader(null);
      return null;
    }

    authState.session = data.session;
    updateHeader(data.session);
    return data.session;
  }

  async function requireSession() {
    const client = getClient();

    if (!client) {
      return null;
    }

    const session = await loadSession();

    if (!session) {
      redirectToAuth();
      return null;
    }

    return session;
  }

  async function signOut() {
    const client = getClient();

    if (!client) {
      window.location.href = "./index.html";
      return;
    }

    await client.auth.signOut();
    window.location.href = "./index.html";
  }

  function bindSharedEvents() {
    document.addEventListener("click", function (event) {
      const logoutButton = event.target.closest("[data-logout]");

      if (logoutButton) {
        signOut();
      }
    });
  }

  function watchAuthChanges() {
    const client = getClient();

    if (!client) {
      return;
    }

    client.auth.onAuthStateChange(function (event, session) {
      authState.session = session;
      updateHeader(session);

      if (event === "SIGNED_OUT" && document.body.hasAttribute("data-requires-auth")) {
        redirectToAuth();
      }
    });
  }

  window.PromptGalleryAuth = {
    state: authState,
    getClient,
    getRelativePageUrl,
    getAuthRedirectUrl,
    loadSession,
    requireSession,
    signOut
  };

  document.addEventListener("DOMContentLoaded", async function () {
    bindSharedEvents();
    await loadSession();
    watchAuthChanges();

    if (document.body.hasAttribute("data-requires-auth")) {
      await requireSession();
    }
  });
})();
