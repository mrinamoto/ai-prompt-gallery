// Public profile page for visible user collections.
(function () {
  const state = {
    session: null,
    profile: null,
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

  function getParams() {
    return new URLSearchParams(window.location.search);
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

  function formatDate(value) {
    if (!value) {
      return "";
    }

    return new Intl.DateTimeFormat("en", {
      month: "short",
      year: "numeric"
    }).format(new Date(value));
  }

  function getInitials(profile) {
    const displayName = profile.display_name || profile.username || "Prompt Gallery";

    return displayName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
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
      isPrivate: Boolean(row.is_private),
      updatedAt: row.updated_at,
      posts
    };
  }

  async function loadRequestedProfile() {
    const client = getClient();
    const params = getParams();
    const id = params.get("id");
    const username = params.get("username") || params.get("user");
    let query = client
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, website_url, created_at")
      .limit(1);

    if (id) {
      query = query.eq("id", id);
    } else if (username) {
      query = query.eq("username", username.toLowerCase());
    } else if (state.session?.user?.id) {
      query = query.eq("id", state.session.user.id);
    } else {
      return null;
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async function loadCollections(profileId) {
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
      .eq("user_id", profileId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    state.collections = (data || []).map(normalizeCollection);
  }

  function getCollectionUrl(collection) {
    return `./collection.html?id=${encodeURIComponent(collection.id)}`;
  }

  function renderCollectionPreview(collection) {
    const previewPosts = collection.posts.slice(0, 3);

    if (!previewPosts.length) {
      return '<div class="collection-card__empty">No posts yet</div>';
    }

    return `
      <div class="collection-card__preview">
        ${previewPosts
          .map(
            ({ post }) => `
              <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" />
            `
          )
          .join("")}
      </div>
    `;
  }

  function renderCollectionCard(collection) {
    const visibleTags = [
      ...new Set(collection.posts.flatMap(({ post }) => [post.category, ...post.tags]).filter(Boolean))
    ].slice(0, 4);

    return `
      <article class="collection-card">
        ${renderCollectionPreview(collection)}
        <div class="collection-card__body">
          <div class="cluster">
            <span class="visibility-pill${collection.isPrivate ? "" : " visibility-pill--public"}">
              ${collection.isPrivate ? "Private" : "Public"}
            </span>
            <span class="badge">${collection.posts.length} post${collection.posts.length === 1 ? "" : "s"}</span>
          </div>
          <h3><a href="${getCollectionUrl(collection)}">${escapeHtml(collection.name)}</a></h3>
          <p>${escapeHtml(collection.description || "A curated prompt collection.")}</p>
          ${
            visibleTags.length
              ? `<div class="tag-row">${visibleTags.map((tag) => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join("")}</div>`
              : ""
          }
          <a class="button button--ghost button--sm" href="${getCollectionUrl(collection)}">Open collection</a>
        </div>
      </article>
    `;
  }

  function renderProfile() {
    const profile = state.profile;
    const displayName = profile.display_name || profile.username || "Prompt Gallery User";
    const publicCount = state.collections.filter((collection) => !collection.isPrivate).length;
    const postCount = state.collections.reduce((count, collection) => count + collection.posts.length, 0);

    document.title = `${displayName} - AI Prompt Gallery`;
    elements.loading.hidden = true;
    elements.notFound.hidden = true;
    elements.content.hidden = false;
    elements.avatar.textContent = getInitials(profile) || "PG";
    elements.name.textContent = displayName;
    elements.bio.textContent = profile.bio || "This creator is building collections of useful AI image prompts.";
    elements.meta.textContent = [
      profile.username ? `@${profile.username}` : "",
      profile.website_url ? profile.website_url : "",
      profile.created_at ? `Joined ${formatDate(profile.created_at)}` : ""
    ]
      .filter(Boolean)
      .join(" - ");
    elements.collectionCount.textContent = formatNumber(state.collections.length);
    elements.postCount.textContent = formatNumber(postCount);
    elements.publicCount.textContent = formatNumber(publicCount);

    elements.collections.innerHTML = state.collections.length
      ? state.collections.map(renderCollectionCard).join("")
      : '<div class="empty-state"><p class="mb-0">No visible collections yet.</p></div>';
  }

  function renderNotFound(message) {
    elements.loading.hidden = true;
    elements.content.hidden = true;
    elements.notFound.hidden = false;

    const lead = elements.notFound.querySelector(".lead");

    if (lead && message) {
      lead.textContent = message;
    }
  }

  function cacheElements() {
    elements.loading = document.querySelector("[data-profile-loading]");
    elements.notFound = document.querySelector("[data-profile-not-found]");
    elements.content = document.querySelector("[data-profile-content]");
    elements.avatar = document.querySelector("[data-profile-avatar]");
    elements.name = document.querySelector("[data-profile-name]");
    elements.bio = document.querySelector("[data-profile-bio]");
    elements.meta = document.querySelector("[data-profile-meta]");
    elements.collectionCount = document.querySelector("[data-profile-collection-count]");
    elements.postCount = document.querySelector("[data-profile-post-count]");
    elements.publicCount = document.querySelector("[data-profile-public-count]");
    elements.collections = document.querySelector("[data-profile-collections]");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    cacheElements();

    if (!elements.content) {
      return;
    }

    if (!getClient()) {
      renderNotFound("Add your Supabase URL and anon key before loading public profiles.");
      return;
    }

    try {
      state.session = await window.PromptGalleryAuth.loadSession();
      state.profile = await loadRequestedProfile();

      if (!state.profile) {
        renderNotFound("The profile may not exist yet, or it may use a different username.");
        return;
      }

      await loadCollections(state.profile.id);
      renderProfile();
    } catch (error) {
      console.warn(error.message);
      renderNotFound(error.message);
    }
  });
})();
