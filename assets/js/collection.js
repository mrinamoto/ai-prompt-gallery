// Collection detail page for public collections and private owner views.
(function () {
  const state = {
    session: null,
    collection: null
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
    const owner = row.profiles || {};
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
      userId: row.user_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      isPrivate: Boolean(row.is_private),
      updatedAt: row.updated_at,
      owner: {
        username: owner.username,
        displayName: owner.display_name,
        avatarUrl: owner.avatar_url
      },
      posts
    };
  }

  async function loadCollection() {
    const id = getParams().get("id");

    if (!id) {
      return null;
    }

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
        profiles(username, display_name, avatar_url),
        collection_posts(
          added_at,
          posts(${postSelect})
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? normalizeCollection(data) : null;
  }

  function getPostUrl(post) {
    return `./post.html?id=${encodeURIComponent(post.id)}`;
  }

  function getOwnerUrl(collection) {
    const username = collection.owner.username;

    if (username) {
      return `./profile.html?username=${encodeURIComponent(username)}`;
    }

    return `./profile.html?id=${encodeURIComponent(collection.userId)}`;
  }

  function renderPostCard({ post }) {
    const visibleTags = post.tags.slice(0, 4);

    return `
      <article class="library-card">
        <a class="library-card__image" href="${getPostUrl(post)}" style="aspect-ratio: ${escapeHtml(post.aspectRatio || "4 / 3")}">
          <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" />
        </a>
        <div class="library-card__body">
          <div class="cluster">
            <span class="badge">${escapeHtml(post.category)}</span>
            <span class="badge badge--accent">${escapeHtml(post.tool)}</span>
          </div>
          <h3><a href="${getPostUrl(post)}">${escapeHtml(post.title)}</a></h3>
          <p>${escapeHtml(post.description || "")}</p>
          ${
            visibleTags.length
              ? `<div class="tag-row">${visibleTags.map((tag) => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join("")}</div>`
              : ""
          }
          <div class="search-meta">
            <span>${formatNumber(post.likes)} likes</span>
            <span>${Number(post.rating || 0).toFixed(1)} rating</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderCollection() {
    const collection = state.collection;
    const ownerName = collection.owner.displayName || collection.owner.username || "View owner";

    document.title = `${collection.name} - AI Prompt Gallery`;
    elements.loading.hidden = true;
    elements.notFound.hidden = true;
    elements.content.hidden = false;
    elements.name.textContent = collection.name;
    elements.description.textContent = collection.description || "A curated collection of AI prompt ideas.";
    elements.visibility.textContent = collection.isPrivate ? "Private" : "Public";
    elements.visibility.classList.toggle("visibility-pill--public", !collection.isPrivate);
    elements.owner.textContent = ownerName;
    elements.owner.href = getOwnerUrl(collection);
    elements.postCount.textContent = formatNumber(collection.posts.length);
    elements.posts.innerHTML = collection.posts.length
      ? collection.posts.map(renderPostCard).join("")
      : '<div class="empty-state"><p class="mb-0">This collection does not have visible posts yet.</p></div>';
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
    elements.loading = document.querySelector("[data-collection-loading]");
    elements.notFound = document.querySelector("[data-collection-not-found]");
    elements.content = document.querySelector("[data-collection-content]");
    elements.name = document.querySelector("[data-collection-name]");
    elements.description = document.querySelector("[data-collection-description]");
    elements.visibility = document.querySelector("[data-collection-visibility]");
    elements.owner = document.querySelector("[data-collection-owner]");
    elements.postCount = document.querySelector("[data-collection-post-count]");
    elements.posts = document.querySelector("[data-collection-posts]");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    cacheElements();

    if (!elements.content) {
      return;
    }

    if (!getClient()) {
      renderNotFound("Add your Supabase URL and anon key before loading collections.");
      return;
    }

    try {
      state.session = await window.PromptGalleryAuth.loadSession();
      state.collection = await loadCollection();

      if (!state.collection) {
        renderNotFound("The collection may be private, deleted, or available only to its owner.");
        return;
      }

      renderCollection();
    } catch (error) {
      console.warn(error.message);
      renderNotFound(error.message);
    }
  });
})();
