// Homepage behavior. Loads Supabase prompt_posts first, then falls back to demo data.
(function () {
  const demoPosts = window.PromptGalleryDemo?.posts || [];

  const state = {
    mode: "loading",
    posts: [],
    category: "All",
    tool: "All",
    sort: "for-you",
    query: "",
    renderTimer: null
  };

  const elements = {};

  function api() {
    return window.PromptGalleryPromptPosts;
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

  function getCategories() {
    return ["All", ...new Set(state.posts.map((post) => post.category).filter(Boolean))];
  }

  function getTools() {
    return ["All", ...new Set(state.posts.map((post) => post.tool).filter(Boolean))];
  }

  function getPostUrl(post) {
    return `./post.html?id=${encodeURIComponent(post.id)}`;
  }

  function getFilteredPosts() {
    const query = state.query.trim().toLowerCase();

    return state.posts
      .filter((post) => state.category === "All" || post.category === state.category)
      .filter((post) => state.tool === "All" || post.tool === state.tool)
      .filter((post) => {
        if (!query) {
          return true;
        }

        const searchableText = [
          post.title,
          post.description,
          post.prompt,
          post.category,
          post.tool,
          post.model,
          post.style,
          ...(post.tags || [])
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      })
      .sort(sortPosts);
  }

  function sortPosts(a, b) {
    if (state.sort === "trending" || state.sort === "popular") {
      return b.likes + b.views - (a.likes + a.views) || new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    }

    if (state.sort === "newest") {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }

    const scoreA = (a.rating || 0) * 1000 + (a.likes || 0) + (a.trending ? 1200 : 0);
    const scoreB = (b.rating || 0) * 1000 + (b.likes || 0) + (b.trending ? 1200 : 0);

    return scoreB - scoreA || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  }

  function renderCategories() {
    elements.categoryFilters.innerHTML = getCategories()
      .map(
        (category) => `
          <button class="chip${category === state.category ? " is-active" : ""}" type="button" data-category="${escapeHtml(category)}">
            ${escapeHtml(category)}
          </button>
        `
      )
      .join("");
  }

  function renderTools() {
    elements.toolFilter.innerHTML = getTools()
      .map((tool) => `<option value="${escapeHtml(tool)}">${tool === "All" ? "All tools" : escapeHtml(tool)}</option>`)
      .join("");
  }

  function renderHeroStats() {
    elements.totalPosts.textContent = state.posts.length;
    elements.categoryCount.textContent = Math.max(getCategories().length - 1, 0);
    elements.toolCount.textContent = Math.max(getTools().length - 1, 0);
  }

  function renderSkeleton() {
    elements.loading.hidden = false;
    elements.feed.hidden = true;
    elements.empty.hidden = true;

    const heights = [390, 320, 460, 360, 520, 340, 430, 300];
    elements.loading.innerHTML = heights
      .map((height) => `<div class="skeleton-card" style="--skeleton-height: ${height}px"></div>`)
      .join("");
  }

  function scheduleRender() {
    window.clearTimeout(state.renderTimer);
    renderSkeleton();

    state.renderTimer = window.setTimeout(function () {
      renderFeed();
    }, 220);
  }

  function renderFeed() {
    const posts = getFilteredPosts();
    const activeText = state.query ? `Results for "${state.query}"` : `${state.category} prompts`;

    elements.loading.hidden = true;
    elements.feed.hidden = posts.length === 0;
    elements.empty.hidden = posts.length > 0;
    elements.activeLabel.textContent = activeText;
    elements.resultCount.textContent = `${posts.length} result${posts.length === 1 ? "" : "s"}`;

    if (!posts.length) {
      elements.feed.innerHTML = "";
      return;
    }

    elements.feed.innerHTML = posts.map(renderPostCard).join("");
  }

  function renderPostCard(post) {
    const visibleTags = (post.tags || []).slice(0, 3);

    return `
      <article class="masonry-card">
        <div class="masonry-card__media" style="--card-ratio: ${escapeHtml(post.aspectRatio || "4 / 5")}">
          <a class="masonry-card__image-link" href="${getPostUrl(post)}" aria-label="Open ${escapeHtml(post.title)}">
            <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" />
          </a>
          <div class="masonry-card__overlay">
            <a class="masonry-card__open" href="${getPostUrl(post)}">View prompt</a>
            <button class="icon-button masonry-card__save" type="button" data-save-post="${escapeHtml(post.id)}" aria-label="Save ${escapeHtml(post.title)}">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </button>
          </div>
        </div>
        <div class="masonry-card__body">
          <div class="cluster">
            <span class="badge">${escapeHtml(post.category)}</span>
            <span class="badge badge--accent">${escapeHtml(post.tool)}</span>
          </div>
          <h3 class="masonry-card__title">
            <a href="${getPostUrl(post)}">${escapeHtml(post.title)}</a>
          </h3>
          <p class="masonry-card__description">${escapeHtml(post.description)}</p>
          <div class="tag-row">
            ${visibleTags.map((tag) => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="masonry-card__meta">
            <span>${formatNumber(post.views)} views</span>
            <span>${formatNumber(post.likes)} likes</span>
            <span>${Number(post.rating || 0).toFixed(1)} rating</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderMiniLists() {
    const trending = [...state.posts].sort((a, b) => Number(b.trending) - Number(a.trending) || new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    const popular = [...state.posts].sort((a, b) => (b.likes || 0) - (a.likes || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const newest = [...state.posts].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    elements.trendingList.innerHTML = trending.slice(0, 4).map(renderMiniCard).join("");
    elements.popularList.innerHTML = popular.slice(0, 4).map(renderMiniCard).join("");
    elements.newList.innerHTML = newest.slice(0, 4).map(renderMiniCard).join("");

    elements.trendingRail.innerHTML = trending.slice(0, 3).map(renderRailCard).join("");
    elements.newRail.innerHTML = newest.slice(0, 3).map(renderRailCard).join("");
    elements.popularRail.innerHTML = popular.slice(0, 3).map(renderRailCard).join("");
  }

  function renderMiniCard(post) {
    return `
      <a class="mini-card" href="${getPostUrl(post)}">
        <div class="mini-card__image">
          <img src="${escapeHtml(post.imageUrl)}" alt="" loading="lazy" />
        </div>
        <div>
          <h4>${escapeHtml(post.title)}</h4>
          <p>${formatNumber(post.likes)} likes - ${Number(post.rating || 0).toFixed(1)} rating</p>
        </div>
      </a>
    `;
  }

  function renderRailCard(post) {
    return `
      <article class="rail-card">
        <a class="rail-card__image" href="${getPostUrl(post)}">
          <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" />
        </a>
        <div class="rail-card__body">
          <div class="cluster">
            <span class="badge">${escapeHtml(post.category)}</span>
            <span class="badge badge--accent">${escapeHtml(post.tool)}</span>
          </div>
          <h3><a href="${getPostUrl(post)}">${escapeHtml(post.title)}</a></h3>
          <p>${formatNumber(post.views)} views - ${formatNumber(post.likes)} likes</p>
        </div>
      </article>
    `;
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    window.setTimeout(function () {
      toast.remove();
    }, 2400);
  }

  async function loadPosts() {
    renderSkeleton();

    try {
      if (api()?.isConfigured()) {
        state.posts = await api().fetchPublished({ limit: 80 });
        state.mode = "supabase";
        return;
      }
    } catch (error) {
      console.warn(error.message);
    }

    state.posts = demoPosts;
    state.mode = "demo";
  }

  function bindEvents() {
    elements.searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const query = elements.searchInput.value.trim();
      window.location.href = query ? `./search.html?q=${encodeURIComponent(query)}` : "./search.html";
    });

    elements.searchInput.addEventListener("input", function (event) {
      state.query = event.target.value;
      scheduleRender();
    });

    elements.categoryFilters.addEventListener("click", function (event) {
      const button = event.target.closest("[data-category]");

      if (!button) {
        return;
      }

      state.category = button.dataset.category;
      renderCategories();
      scheduleRender();
    });

    elements.sortTabs.addEventListener("click", function (event) {
      const button = event.target.closest("[data-sort]");

      if (!button) {
        return;
      }

      state.sort = button.dataset.sort;
      elements.sortTabs.querySelectorAll("[data-sort]").forEach((tab) => {
        tab.classList.toggle("is-active", tab.dataset.sort === state.sort);
      });
      scheduleRender();
    });

    elements.toolFilter.addEventListener("change", function (event) {
      state.tool = event.target.value;
      scheduleRender();
    });

    document.addEventListener("click", function (event) {
      const suggestion = event.target.closest("[data-suggestion]");
      const saveButton = event.target.closest("[data-save-post]");

      if (suggestion) {
        state.query = suggestion.dataset.suggestion;
        elements.searchInput.value = state.query;
        elements.searchInput.focus();
        scheduleRender();
      }

      if (saveButton) {
        showToast(state.mode === "supabase" ? "Open the prompt to save or interact." : "Saving posts arrives after authentication.");
      }
    });
  }

  function cacheElements() {
    elements.searchForm = document.querySelector("[data-search-form]");
    elements.searchInput = document.querySelector("[data-search-input]");
    elements.categoryFilters = document.querySelector("[data-category-filters]");
    elements.toolFilter = document.querySelector("[data-tool-filter]");
    elements.sortTabs = document.querySelector("[data-sort-tabs]");
    elements.loading = document.querySelector("[data-loading]");
    elements.feed = document.querySelector("[data-feed]");
    elements.empty = document.querySelector("[data-empty]");
    elements.activeLabel = document.querySelector("[data-active-label]");
    elements.resultCount = document.querySelector("[data-result-count]");
    elements.trendingList = document.querySelector("[data-trending-list]");
    elements.popularList = document.querySelector("[data-popular-list]");
    elements.newList = document.querySelector("[data-new-list]");
    elements.trendingRail = document.querySelector("[data-trending-rail]");
    elements.newRail = document.querySelector("[data-new-rail]");
    elements.popularRail = document.querySelector("[data-popular-rail]");
    elements.totalPosts = document.querySelector("[data-total-posts]");
    elements.categoryCount = document.querySelector("[data-category-count]");
    elements.toolCount = document.querySelector("[data-tool-count]");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    cacheElements();

    if (!elements.feed) {
      return;
    }

    await loadPosts();
    renderCategories();
    renderTools();
    renderHeroStats();
    renderMiniLists();
    bindEvents();
    renderFeed();
  });
})();
