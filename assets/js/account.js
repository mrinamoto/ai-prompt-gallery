// Protected account page behavior for profiles, saved posts, liked posts, and collections.
(function () {
  const state = {
    session: null,
    profile: null,
    savedPosts: [],
    likedPosts: [],
    collections: []
  };

  const elements = {};

  const postSelect = `
    id,
    title,
    description,
    image_url,
    ai_tool,
    ai_model,
    aspect_ratio,
    views_count,
    likes_count,
    average_rating,
    categories(name, slug),
    post_tags(tags(name, slug))
  `;

  function getClient() {
    return window.PromptGalleryAuth?.getClient();
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact" }).format(Number(value) || 0);
  }

  function makeUsername(email, id) {
    const prefix = String(email || "user")
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    const safePrefix = prefix.length >= 3 ? prefix.slice(0, 17) : "user";
    return `${safePrefix}_${String(id).replaceAll("-", "").slice(0, 12)}`;
  }

  function showStatus(target, message, type) {
    target.textContent = message;
    target.classList.toggle("is-error", type === "error");
    target.classList.toggle("is-success", type === "success");
  }

  function setFormLoading(form, isLoading) {
    form.querySelectorAll("button, input, textarea, select").forEach((field) => {
      field.disabled = isLoading;
    });
  }

  function normalizePost(row) {
    const post = row.posts || row;
    const tags = Array.isArray(post.post_tags)
      ? post.post_tags.map((item) => item.tags?.name).filter(Boolean)
      : [];

    return {
      id: post.id,
      title: post.title,
      description: post.description,
      imageUrl: post.image_url,
      tool: post.ai_tool,
      model: post.ai_model,
      aspectRatio: post.aspect_ratio,
      views: post.views_count || 0,
      likes: post.likes_count || 0,
      rating: Number(post.average_rating) || 0,
      category: post.categories?.name || "Uncategorized",
      categorySlug: post.categories?.slug || "",
      tags
    };
  }

  function normalizeCollection(row) {
    const posts = Array.isArray(row.collection_posts)
      ? row.collection_posts
          .filter((item) => item.posts)
          .map((item) => ({
            addedAt: item.added_at,
            post: normalizePost(item)
          }))
      : [];

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      isPrivate: row.is_private,
      updatedAt: row.updated_at,
      posts
    };
  }

  function getPostUrl(post) {
    return `./post.html?id=${post.id}`;
  }

  function getPublicProfileUrl(profile) {
    if (profile.username) {
      return `./profile.html?username=${encodeURIComponent(profile.username)}`;
    }

    return `./profile.html?id=${encodeURIComponent(profile.id)}`;
  }

  function getCollectionUrl(collection) {
    return `./collection.html?id=${encodeURIComponent(collection.id)}`;
  }

  function getCollectionPicker(postId) {
    const selectorValue = window.CSS?.escape ? window.CSS.escape(postId) : String(postId).replace(/"/g, '\\"');
    return document.querySelector(`[data-collection-picker="${selectorValue}"]`);
  }

  async function loadProfile(session) {
    const client = getClient();
    const user = session.user;

    const { data, error } = await client.rpc("get_current_profile");

    if (error) {
      throw error;
    }

    if (data?.[0]) {
      return data[0];
    }

    const fallbackProfile = {
      id: user.id,
      username: makeUsername(user.email, user.id),
      display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "New user",
      avatar_url: user.user_metadata?.avatar_url || null
    };

    const { error: insertError } = await client.from("profiles").insert(fallbackProfile);

    if (insertError) {
      throw insertError;
    }

    const { data: createdProfile, error: profileError } = await client.rpc("get_current_profile");

    if (profileError) {
      throw profileError;
    }

    if (!createdProfile?.[0]) {
      throw new Error("Profile could not be loaded after creation.");
    }

    return createdProfile[0];
  }

  async function loadSavedPosts() {
    const { data, error } = await getClient()
      .from("saved_posts")
      .select(`id, created_at, posts(${postSelect})`)
      .eq("user_id", state.session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    state.savedPosts = (data || []).filter((row) => row.posts).map((row) => normalizePost(row));
  }

  async function loadLikedPosts() {
    const { data, error } = await getClient()
      .from("likes")
      .select(`id, created_at, posts(${postSelect})`)
      .eq("user_id", state.session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    state.likedPosts = (data || []).filter((row) => row.posts).map((row) => normalizePost(row));
  }

  async function loadCollections() {
    const { data, error } = await getClient()
      .from("collections")
      .select(
        `
        id,
        user_id,
        name,
        slug,
        description,
        is_private,
        updated_at,
        collection_posts(
          added_at,
          posts(${postSelect})
        )
      `
      )
      .eq("user_id", state.session.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    state.collections = (data || []).map(normalizeCollection);
  }

  async function loadLibrary() {
    await Promise.all([loadSavedPosts(), loadLikedPosts(), loadCollections()]);
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
    elements.publicProfileLink.href = getPublicProfileUrl(profile);

    if (elements.adminDashboardLink) {
      elements.adminDashboardLink.hidden = profile.role !== "admin";
    }
  }

  function collectionOptions() {
    if (!state.collections.length) {
      return '<option value="">Create a collection first</option>';
    }

    return [
      '<option value="">Choose collection</option>',
      ...state.collections.map((collection) => `<option value="${collection.id}">${escapeHtml(collection.name)}</option>`)
    ].join("");
  }

  function renderLibraryCard(post, source) {
    return `
      <article class="library-card">
        <a class="library-card__image" href="${getPostUrl(post)}">
          <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" />
        </a>
        <div class="library-card__body">
          <div class="cluster">
            <span class="badge">${escapeHtml(post.category)}</span>
            <span class="badge badge--accent">${escapeHtml(post.tool)}</span>
          </div>
          <h3><a href="${getPostUrl(post)}">${escapeHtml(post.title)}</a></h3>
          <p>${escapeHtml(post.description || "")}</p>
          <div class="search-meta">
            <span>${formatNumber(post.likes)} likes</span>
            <span>${post.rating.toFixed(1)} rating</span>
          </div>
          <div class="library-card__actions">
            <select class="collection-select" data-collection-picker="${post.id}" aria-label="Collection for ${escapeHtml(post.title)}">
              ${collectionOptions()}
            </select>
            <button class="button button--soft button--sm" type="button" data-add-to-collection="${post.id}">Add</button>
            ${
              source === "saved"
                ? `<button class="button button--ghost button--sm" type="button" data-unsave-post="${post.id}">Unsave</button>`
                : `<button class="button button--ghost button--sm" type="button" data-unlike-post="${post.id}">Unlike</button>`
            }
          </div>
        </div>
      </article>
    `;
  }

  function renderCollectionPosts(collection) {
    if (!collection.posts.length) {
      return '<p class="helper-text mb-0">No posts in this collection yet.</p>';
    }

    return `
      <div class="collection-post-list">
        ${collection.posts
          .map(
            ({ post }) => `
              <div class="collection-post-item">
                <img src="${escapeHtml(post.imageUrl)}" alt="" loading="lazy" />
                <div>
                  <h4><a href="${getPostUrl(post)}">${escapeHtml(post.title)}</a></h4>
                  <p>${escapeHtml(post.category)} - ${escapeHtml(post.tool)}</p>
                </div>
                <button class="button button--ghost button--sm" type="button" data-remove-from-collection="${collection.id}" data-post-id="${post.id}">
                  Remove
                </button>
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderCollections() {
    if (!state.collections.length) {
      elements.collectionsList.innerHTML = '<div class="empty-state"><p class="mb-0">No collections yet. Create your first private or public collection above.</p></div>';
      return;
    }

    elements.collectionsList.innerHTML = state.collections
      .map(
        (collection) => `
          <article class="collection-card">
            <div class="collection-card__body">
              <div class="cluster">
                <span class="visibility-pill${collection.isPrivate ? "" : " visibility-pill--public"}">${collection.isPrivate ? "Private" : "Public"}</span>
                <span class="badge">${collection.posts.length} post${collection.posts.length === 1 ? "" : "s"}</span>
              </div>
              <h3><a href="${getCollectionUrl(collection)}">${escapeHtml(collection.name)}</a></h3>
              <p>${escapeHtml(collection.description || "No description yet.")}</p>
              <div class="collection-card__actions">
                <button class="button button--soft button--sm" type="button" data-toggle-collection="${collection.id}">
                  Make ${collection.isPrivate ? "public" : "private"}
                </button>
                <button class="button button--danger button--sm" type="button" data-delete-collection="${collection.id}">Delete</button>
              </div>
              ${renderCollectionPosts(collection)}
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderLibrary() {
    elements.savedPostsList.innerHTML = state.savedPosts.length
      ? state.savedPosts.map((post) => renderLibraryCard(post, "saved")).join("")
      : '<div class="empty-state"><p class="mb-0">No saved posts yet. Save prompts from post detail pages.</p></div>';

    elements.likedPostsList.innerHTML = state.likedPosts.length
      ? state.likedPosts.map((post) => renderLibraryCard(post, "liked")).join("")
      : '<div class="empty-state"><p class="mb-0">No liked posts yet. Like prompts from post detail pages.</p></div>';

    renderCollections();
  }

  async function handleProfileUpdate(event) {
    event.preventDefault();

    const updates = {
      username: elements.username.value.trim().toLowerCase(),
      display_name: elements.displayName.value.trim(),
      bio: elements.bio.value.trim() || null,
      website_url: elements.website.value.trim() || null
    };

    if (!/^[a-z0-9_]{3,30}$/.test(updates.username)) {
      showStatus(elements.status, "Username must be 3 to 30 characters using lowercase letters, numbers, or underscores.", "error");
      return;
    }

    if (updates.display_name.length < 2) {
      showStatus(elements.status, "Display name must be at least 2 characters.", "error");
      return;
    }

    setFormLoading(elements.form, true);

    const { error } = await getClient()
      .from("profiles")
      .update(updates)
      .eq("id", state.session.user.id);

    setFormLoading(elements.form, false);

    if (error) {
      showStatus(elements.status, error.message, "error");
      return;
    }

    state.profile = await loadProfile(state.session);
    renderProfile(state.session, state.profile);
    showStatus(elements.status, "Profile updated.", "success");
  }

  async function handleCollectionCreate(event) {
    event.preventDefault();

    const fields = elements.collectionForm.elements;
    const name = fields.namedItem("name").value.trim();
    const description = fields.namedItem("description").value.trim();
    const slug = slugify(name);

    if (!slug) {
      showStatus(elements.collectionStatus, "Use a clearer collection name.", "error");
      return;
    }

    setFormLoading(elements.collectionForm, true);

    const { error } = await getClient().from("collections").insert({
      user_id: state.session.user.id,
      name,
      slug,
      description: description || null,
      is_private: fields.namedItem("visibility").value !== "public"
    });

    setFormLoading(elements.collectionForm, false);

    if (error) {
      showStatus(elements.collectionStatus, error.message, "error");
      return;
    }

    elements.collectionForm.reset();
    showStatus(elements.collectionStatus, "Collection created.", "success");
    await loadCollections();
    renderLibrary();
  }

  async function addPostToCollection(postId) {
    const picker = getCollectionPicker(postId);
    const collectionId = picker?.value;

    if (!collectionId) {
      showStatus(elements.collectionStatus, "Choose a collection first.", "error");
      return;
    }

    const { error } = await getClient().from("collection_posts").insert({
      collection_id: collectionId,
      post_id: postId
    });

    if (error && error.code !== "23505") {
      showStatus(elements.collectionStatus, error.message, "error");
      return;
    }

    showStatus(elements.collectionStatus, error?.code === "23505" ? "That post is already in the collection." : "Post added to collection.", "success");
    await loadCollections();
    renderLibrary();
  }

  async function removePostFromCollection(collectionId, postId) {
    const { error } = await getClient()
      .from("collection_posts")
      .delete()
      .eq("collection_id", collectionId)
      .eq("post_id", postId);

    if (error) {
      showStatus(elements.collectionStatus, error.message, "error");
      return;
    }

    showStatus(elements.collectionStatus, "Post removed from collection.", "success");
    await loadCollections();
    renderLibrary();
  }

  async function toggleCollectionVisibility(collectionId) {
    const collection = state.collections.find((item) => item.id === collectionId);

    if (!collection) {
      return;
    }

    const { error } = await getClient()
      .from("collections")
      .update({ is_private: !collection.isPrivate })
      .eq("id", collectionId);

    if (error) {
      showStatus(elements.collectionStatus, error.message, "error");
      return;
    }

    showStatus(elements.collectionStatus, `Collection is now ${collection.isPrivate ? "public" : "private"}.`, "success");
    await loadCollections();
    renderLibrary();
  }

  async function deleteCollection(collectionId) {
    if (!window.confirm("Delete this collection? Posts will not be deleted.")) {
      return;
    }

    const { error } = await getClient().from("collections").delete().eq("id", collectionId);

    if (error) {
      showStatus(elements.collectionStatus, error.message, "error");
      return;
    }

    showStatus(elements.collectionStatus, "Collection deleted.", "success");
    await loadCollections();
    renderLibrary();
  }

  async function removeSavedPost(postId) {
    const { error } = await getClient()
      .from("saved_posts")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", state.session.user.id);

    if (error) {
      showStatus(elements.collectionStatus, error.message, "error");
      return;
    }

    await loadSavedPosts();
    renderLibrary();
  }

  async function removeLikedPost(postId) {
    const { error } = await getClient()
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", state.session.user.id);

    if (error) {
      showStatus(elements.collectionStatus, error.message, "error");
      return;
    }

    await loadLikedPosts();
    renderLibrary();
  }

  function handleLibraryClick(event) {
    const addButton = event.target.closest("[data-add-to-collection]");
    const removeButton = event.target.closest("[data-remove-from-collection]");
    const toggleButton = event.target.closest("[data-toggle-collection]");
    const deleteButton = event.target.closest("[data-delete-collection]");
    const unsaveButton = event.target.closest("[data-unsave-post]");
    const unlikeButton = event.target.closest("[data-unlike-post]");

    if (addButton) {
      addPostToCollection(addButton.dataset.addToCollection);
      return;
    }

    if (removeButton) {
      removePostFromCollection(removeButton.dataset.removeFromCollection, removeButton.dataset.postId);
      return;
    }

    if (toggleButton) {
      toggleCollectionVisibility(toggleButton.dataset.toggleCollection);
      return;
    }

    if (deleteButton) {
      deleteCollection(deleteButton.dataset.deleteCollection);
      return;
    }

    if (unsaveButton) {
      removeSavedPost(unsaveButton.dataset.unsavePost);
      return;
    }

    if (unlikeButton) {
      removeLikedPost(unlikeButton.dataset.unlikePost);
    }
  }

  function cacheElements() {
    elements.loading = document.querySelector("[data-account-loading]");
    elements.content = document.querySelector("[data-account-content]");
    elements.status = document.querySelector("[data-account-status]");
    elements.collectionStatus = document.querySelector("[data-collection-status]");
    elements.avatar = document.querySelector("[data-account-avatar]");
    elements.name = document.querySelector("[data-account-name]");
    elements.email = document.querySelector("[data-account-email]");
    elements.role = document.querySelector("[data-account-role]");
    elements.publicProfileLink = document.querySelector("[data-public-profile-link]");
    elements.adminDashboardLink = document.querySelector("[data-admin-dashboard-link]");
    elements.form = document.querySelector("[data-profile-form]");
    elements.collectionForm = document.querySelector("[data-collection-form]");
    elements.collectionsList = document.querySelector("[data-collections-list]");
    elements.savedPostsList = document.querySelector("[data-saved-posts-list]");
    elements.likedPostsList = document.querySelector("[data-liked-posts-list]");
    elements.username = document.querySelector("[name='username']");
    elements.displayName = document.querySelector("[name='display_name']");
    elements.bio = document.querySelector("[name='bio']");
    elements.website = document.querySelector("[name='website_url']");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    cacheElements();

    const client = getClient();

    if (!client) {
      elements.loading.innerHTML = '<p class="mb-0 text-muted">Supabase is not configured yet. Add your Project URL and anon key first.</p>';
      return;
    }

    state.session = await window.PromptGalleryAuth.requireSession();

    if (!state.session) {
      return;
    }

    try {
      state.profile = await loadProfile(state.session);
      renderProfile(state.session, state.profile);
      await loadLibrary();
      renderLibrary();
      elements.form.addEventListener("submit", handleProfileUpdate);
      elements.collectionForm.addEventListener("submit", handleCollectionCreate);
      elements.content.addEventListener("click", handleLibraryClick);
    } catch (error) {
      elements.loading.innerHTML = `<p class="mb-0 text-muted">${escapeHtml(error.message)}</p>`;
      showStatus(elements.status, error.message, "error");
    }
  });
})();
