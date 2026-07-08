// Protected account page behavior.
(function () {
  const elements = {};

  function getClient() {
    return window.PromptGalleryAuth?.getClient();
  }

  function makeUsername(email, id) {
    const prefix = String(email || "user")
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    const safePrefix = prefix.length >= 3 ? prefix.slice(0, 17) : "user";
    return `${safePrefix}_${String(id).replaceAll("-", "").slice(0, 12)}`;
  }

  function showStatus(message, type) {
    elements.status.textContent = message;
    elements.status.classList.toggle("is-error", type === "error");
    elements.status.classList.toggle("is-success", type === "success");
  }

  function setFormLoading(isLoading) {
    elements.form.querySelectorAll("button, input, textarea").forEach((field) => {
      field.disabled = isLoading;
    });
  }

  async function loadProfile(session) {
    const client = getClient();
    const user = session.user;

    const { data, error } = await client
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, website_url, role, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }

    const fallbackProfile = {
      id: user.id,
      username: makeUsername(user.email, user.id),
      display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "New user",
      avatar_url: user.user_metadata?.avatar_url || null,
      role: "user"
    };

    const { data: createdProfile, error: insertError } = await client
      .from("profiles")
      .insert(fallbackProfile)
      .select("id, username, display_name, avatar_url, bio, website_url, role, created_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    return createdProfile;
  }

  function renderProfile(session, profile) {
    const email = session.user.email || "";
    const displayName = profile.display_name || email.split("@")[0] || "Account";
    const initials = displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    elements.loading.hidden = true;
    elements.content.hidden = false;
    elements.avatar.textContent = initials || "PG";
    elements.name.textContent = displayName;
    elements.email.textContent = email;
    elements.role.textContent = profile.role || "user";
    elements.username.value = profile.username || "";
    elements.displayName.value = profile.display_name || "";
    elements.bio.value = profile.bio || "";
    elements.website.value = profile.website_url || "";
  }

  async function handleProfileUpdate(event) {
    event.preventDefault();

    const client = getClient();
    const session = window.PromptGalleryAuth.state.session || (await window.PromptGalleryAuth.loadSession());

    if (!client || !session) {
      showStatus("You need to be signed in to update your profile.", "error");
      return;
    }

    const updates = {
      username: elements.username.value.trim().toLowerCase(),
      display_name: elements.displayName.value.trim(),
      bio: elements.bio.value.trim() || null,
      website_url: elements.website.value.trim() || null
    };

    setFormLoading(true);

    const { data, error } = await client
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id)
      .select("id, username, display_name, avatar_url, bio, website_url, role, created_at")
      .single();

    setFormLoading(false);

    if (error) {
      showStatus(error.message, "error");
      return;
    }

    renderProfile(session, data);
    showStatus("Profile updated.", "success");
  }

  function cacheElements() {
    elements.loading = document.querySelector("[data-account-loading]");
    elements.content = document.querySelector("[data-account-content]");
    elements.status = document.querySelector("[data-account-status]");
    elements.avatar = document.querySelector("[data-account-avatar]");
    elements.name = document.querySelector("[data-account-name]");
    elements.email = document.querySelector("[data-account-email]");
    elements.role = document.querySelector("[data-account-role]");
    elements.form = document.querySelector("[data-profile-form]");
    elements.username = document.querySelector("[name='username']");
    elements.displayName = document.querySelector("[name='display_name']");
    elements.bio = document.querySelector("[name='bio']");
    elements.website = document.querySelector("[name='website_url']");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    cacheElements();

    const client = getClient();

    if (!client) {
      elements.loading.hidden = true;
      showStatus("Supabase is not configured yet. Add your Project URL and anon key first.", "error");
      return;
    }

    const session = await window.PromptGalleryAuth.requireSession();

    if (!session) {
      return;
    }

    try {
      const profile = await loadProfile(session);
      renderProfile(session, profile);
      elements.form.addEventListener("submit", handleProfileUpdate);
    } catch (error) {
      elements.loading.hidden = true;
      showStatus(error.message, "error");
    }
  });
})();
