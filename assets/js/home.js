// Phase 3 homepage behavior.
// This file uses temporary demo data only. Supabase data will replace this later.
(function () {
  const demoPosts = [
    {
      id: 1,
      title: "Neon Rain Portrait",
      description: "A cinematic portrait prompt with wet streets, glowing signs, and reflective color.",
      prompt: "Cinematic close-up portrait, neon rain, reflective street, soft rim light, editorial mood",
      category: "Portrait",
      tool: "Midjourney",
      model: "v6",
      aspectRatio: "4 / 5",
      tags: ["neon", "portrait", "cinematic"],
      imageUrl: "https://picsum.photos/seed/neon-rain-portrait/720/900",
      views: 8400,
      likes: 1320,
      rating: 4.9,
      createdAt: "2026-07-05",
      trending: true
    },
    {
      id: 2,
      title: "Glass Product Studio",
      description: "A premium product render setup with soft reflections and controlled studio light.",
      prompt: "Luxury glass product, translucent material, softbox reflections, clean studio background",
      category: "Product",
      tool: "DALL-E",
      model: "3",
      aspectRatio: "5 / 4",
      tags: ["product", "studio", "glass"],
      imageUrl: "https://picsum.photos/seed/glass-product-studio/900/720",
      views: 6100,
      likes: 980,
      rating: 4.7,
      createdAt: "2026-07-02",
      trending: true
    },
    {
      id: 3,
      title: "Floating Garden City",
      description: "A bright worldbuilding prompt for fantasy architecture and lush vertical spaces.",
      prompt: "Floating garden city above clouds, detailed terraces, warm morning light, fantasy concept art",
      category: "Fantasy",
      tool: "Stable Diffusion",
      model: "SDXL",
      aspectRatio: "3 / 4",
      tags: ["fantasy", "architecture", "garden"],
      imageUrl: "https://picsum.photos/seed/floating-garden-city/780/1040",
      views: 9700,
      likes: 1488,
      rating: 4.8,
      createdAt: "2026-06-29",
      trending: true
    },
    {
      id: 4,
      title: "Future Transit Hub",
      description: "A clean architecture prompt with sweeping light, glass, and human-scale detail.",
      prompt: "Futuristic transit hub, natural light, curved glass roof, precise architectural photography",
      category: "Architecture",
      tool: "Leonardo",
      model: "Phoenix",
      aspectRatio: "4 / 5",
      tags: ["architecture", "future", "glass"],
      imageUrl: "https://picsum.photos/seed/future-transit-hub/760/950",
      views: 4200,
      likes: 670,
      rating: 4.5,
      createdAt: "2026-07-06",
      trending: false
    },
    {
      id: 5,
      title: "Anime Street Market",
      description: "A lively night market look with expressive lighting and detailed environment cues.",
      prompt: "Anime street market at night, lanterns, rain mist, cozy food stalls, detailed background",
      category: "Anime",
      tool: "NovelAI",
      model: "Diffusion V3",
      aspectRatio: "4 / 5",
      tags: ["anime", "market", "night"],
      imageUrl: "https://picsum.photos/seed/anime-street-market/760/950",
      views: 7600,
      likes: 1215,
      rating: 4.6,
      createdAt: "2026-07-01",
      trending: true
    },
    {
      id: 6,
      title: "Minimal Landing Hero",
      description: "A simple UI mockup prompt for modern SaaS pages and clean product storytelling.",
      prompt: "Minimal SaaS hero section, clean interface mockup, soft depth, tasteful product panels",
      category: "UI Design",
      tool: "DALL-E",
      model: "3",
      aspectRatio: "16 / 10",
      tags: ["ui", "landing", "saas"],
      imageUrl: "https://picsum.photos/seed/minimal-landing-hero/960/600",
      views: 3500,
      likes: 540,
      rating: 4.4,
      createdAt: "2026-07-04",
      trending: false
    },
    {
      id: 7,
      title: "Space Opera Poster",
      description: "A dramatic poster prompt with strong silhouettes and cinematic atmosphere.",
      prompt: "Space opera poster, distant planet, heroic silhouette, cinematic lighting, premium key art",
      category: "Sci-Fi",
      tool: "Midjourney",
      model: "v6",
      aspectRatio: "2 / 3",
      tags: ["space", "poster", "cinematic"],
      imageUrl: "https://picsum.photos/seed/space-opera-poster/720/1080",
      views: 11800,
      likes: 1850,
      rating: 4.9,
      createdAt: "2026-06-25",
      trending: true
    },
    {
      id: 8,
      title: "Editorial Fashion Study",
      description: "A refined fashion prompt with clean styling, strong pose direction, and soft color.",
      prompt: "Editorial fashion study, sculptural silhouette, soft daylight studio, refined styling",
      category: "Fashion",
      tool: "Firefly",
      model: "Image 3",
      aspectRatio: "3 / 4",
      tags: ["fashion", "editorial", "studio"],
      imageUrl: "https://picsum.photos/seed/editorial-fashion-study/780/1040",
      views: 5100,
      likes: 830,
      rating: 4.6,
      createdAt: "2026-07-07",
      trending: false
    },
    {
      id: 9,
      title: "Forest Cabin Concept",
      description: "A peaceful environment prompt with warm windows, fog, and natural texture.",
      prompt: "Forest cabin at blue hour, warm window light, gentle fog, cozy cinematic environment",
      category: "Landscape",
      tool: "Stable Diffusion",
      model: "SDXL",
      aspectRatio: "5 / 4",
      tags: ["landscape", "cabin", "fog"],
      imageUrl: "https://picsum.photos/seed/forest-cabin-concept/900/720",
      views: 6900,
      likes: 1020,
      rating: 4.7,
      createdAt: "2026-06-30",
      trending: false
    },
    {
      id: 10,
      title: "Solarpunk Courtyard",
      description: "A bright environmental design prompt balancing greenery, texture, and community space.",
      prompt: "Solarpunk courtyard, layered greenery, warm stone, people relaxing, optimistic design",
      category: "Architecture",
      tool: "Leonardo",
      model: "Phoenix",
      aspectRatio: "4 / 5",
      tags: ["solarpunk", "courtyard", "architecture"],
      imageUrl: "https://picsum.photos/seed/solarpunk-courtyard/760/950",
      views: 5900,
      likes: 900,
      rating: 4.6,
      createdAt: "2026-07-03",
      trending: false
    },
    {
      id: 11,
      title: "Food Campaign Tabletop",
      description: "A polished commercial prompt for food photography and ad-ready composition.",
      prompt: "Commercial tabletop food photography, fresh ingredients, soft daylight, premium campaign",
      category: "Product",
      tool: "DALL-E",
      model: "3",
      aspectRatio: "4 / 3",
      tags: ["food", "commercial", "tabletop"],
      imageUrl: "https://picsum.photos/seed/food-campaign-tabletop/900/675",
      views: 4700,
      likes: 720,
      rating: 4.5,
      createdAt: "2026-07-08",
      trending: false
    },
    {
      id: 12,
      title: "Mythic Character Key Art",
      description: "A fantasy character prompt with rich materials, atmosphere, and gallery polish.",
      prompt: "Mythic character key art, ornate armor, atmospheric background, high-detail fantasy render",
      category: "Fantasy",
      tool: "Midjourney",
      model: "v6",
      aspectRatio: "2 / 3",
      tags: ["character", "fantasy", "armor"],
      imageUrl: "https://picsum.photos/seed/mythic-character-key-art/720/1080",
      views: 12600,
      likes: 2120,
      rating: 5,
      createdAt: "2026-07-06",
      trending: true
    }
  ];

  const state = {
    category: "All",
    tool: "All",
    sort: "for-you",
    query: "",
    renderTimer: null
  };

  const elements = {};

  function formatNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
  }

  function getCategories() {
    return ["All", ...new Set(demoPosts.map((post) => post.category))];
  }

  function getTools() {
    return ["All", ...new Set(demoPosts.map((post) => post.tool))];
  }

  function getFilteredPosts() {
    const query = state.query.trim().toLowerCase();

    return demoPosts
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
          ...post.tags
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      })
      .sort(sortPosts);
  }

  function sortPosts(a, b) {
    if (state.sort === "trending") {
      return Number(b.trending) - Number(a.trending) || b.views + b.likes - (a.views + a.likes);
    }

    if (state.sort === "popular") {
      return b.likes + b.views - (a.likes + a.views);
    }

    if (state.sort === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    const scoreA = a.rating * 1000 + a.likes + (a.trending ? 1200 : 0);
    const scoreB = b.rating * 1000 + b.likes + (b.trending ? 1200 : 0);

    return scoreB - scoreA;
  }

  function renderCategories() {
    elements.categoryFilters.innerHTML = getCategories()
      .map(
        (category) => `
          <button class="chip${category === state.category ? " is-active" : ""}" type="button" data-category="${category}">
            ${category}
          </button>
        `
      )
      .join("");
  }

  function renderTools() {
    elements.toolFilter.innerHTML = getTools()
      .map((tool) => `<option value="${tool}">${tool === "All" ? "All tools" : tool}</option>`)
      .join("");
  }

  function renderHeroStats() {
    elements.totalPosts.textContent = demoPosts.length;
    elements.categoryCount.textContent = getCategories().length - 1;
    elements.toolCount.textContent = getTools().length - 1;
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
    const visibleTags = post.tags.slice(0, 3);

    return `
      <article class="masonry-card">
        <div class="masonry-card__media" style="--card-ratio: ${post.aspectRatio}">
          <img src="${post.imageUrl}" alt="${post.title}" loading="lazy" />
          <div class="masonry-card__overlay">
            <button class="masonry-card__open" type="button" data-preview-post="${post.id}">View prompt</button>
            <button class="icon-button masonry-card__save" type="button" data-save-post="${post.id}" aria-label="Save ${post.title}">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
              </svg>
            </button>
          </div>
        </div>
        <div class="masonry-card__body">
          <div class="cluster">
            <span class="badge">${post.category}</span>
            <span class="badge badge--accent">${post.tool}</span>
          </div>
          <h3 class="masonry-card__title">${post.title}</h3>
          <p class="masonry-card__description">${post.description}</p>
          <div class="tag-row">
            ${visibleTags.map((tag) => `<span class="tag-pill">#${tag}</span>`).join("")}
          </div>
          <div class="masonry-card__meta">
            <span>${formatNumber(post.views)} views</span>
            <span>${formatNumber(post.likes)} likes</span>
            <span>${post.rating.toFixed(1)} rating</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderMiniLists() {
    const trending = [...demoPosts].sort((a, b) => Number(b.trending) - Number(a.trending) || b.views - a.views);
    const popular = [...demoPosts].sort((a, b) => b.likes - a.likes);
    const newest = [...demoPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    elements.trendingList.innerHTML = trending.slice(0, 4).map(renderMiniCard).join("");
    elements.popularList.innerHTML = popular.slice(0, 4).map(renderMiniCard).join("");
    elements.newList.innerHTML = newest.slice(0, 4).map(renderMiniCard).join("");

    elements.trendingRail.innerHTML = trending.slice(0, 3).map(renderRailCard).join("");
    elements.newRail.innerHTML = newest.slice(0, 3).map(renderRailCard).join("");
    elements.popularRail.innerHTML = popular.slice(0, 3).map(renderRailCard).join("");
  }

  function renderMiniCard(post) {
    return `
      <article class="mini-card">
        <div class="mini-card__image">
          <img src="${post.imageUrl}" alt="" loading="lazy" />
        </div>
        <div>
          <h4>${post.title}</h4>
          <p>${formatNumber(post.likes)} likes - ${post.rating.toFixed(1)} rating</p>
        </div>
      </article>
    `;
  }

  function renderRailCard(post) {
    return `
      <article class="rail-card">
        <div class="rail-card__image">
          <img src="${post.imageUrl}" alt="${post.title}" loading="lazy" />
        </div>
        <div class="rail-card__body">
          <div class="cluster">
            <span class="badge">${post.category}</span>
            <span class="badge badge--accent">${post.tool}</span>
          </div>
          <h3>${post.title}</h3>
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

  function bindEvents() {
    elements.searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
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
      const previewButton = event.target.closest("[data-preview-post]");
      const saveButton = event.target.closest("[data-save-post]");
      const focusSearch = event.target.closest("[data-focus-search]");

      if (suggestion) {
        state.query = suggestion.dataset.suggestion;
        elements.searchInput.value = state.query;
        elements.searchInput.focus();
        scheduleRender();
      }

      if (previewButton) {
        showToast("Post detail pages arrive in Phase 4.");
      }

      if (saveButton) {
        showToast("Saving posts arrives after authentication.");
      }

      if (focusSearch) {
        elements.searchInput.focus();
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

  document.addEventListener("DOMContentLoaded", function () {
    cacheElements();

    if (!elements.feed) {
      return;
    }

    renderCategories();
    renderTools();
    renderHeroStats();
    renderMiniLists();
    bindEvents();
    scheduleRender();
  });
})();
