// Phase 8 search and recommendations.
// Uses Supabase RPC helpers when configured, with a demo-data fallback for beginner testing.
(function () {
  const demoPosts = window.PromptGalleryDemo?.posts || [];
  const defaultSuggestions = ["cinematic", "portrait", "product", "architecture", "fantasy", "neon", "anime", "studio"];

  const state = {
    mode: "demo",
    query: "",
    category: "all",
    tool: "all",
    sort: "relevance",
    categories: [],
    tools: [],
    results: [],
    related: [],
    trending: [],
    similar: [],
    youMayLike: [],
    renderTimer: null
  };

  const elements = {};

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

  function getPostUrl(post) {
    return post.source === "supabase" ? `./post.html?id=${post.id}` : `./post.html?id=${post.id}`;
  }

  function normalizeRpcPost(row) {
    return {
      id: row.id,
      source: "supabase",
      title: row.title,
      description: row.description,
      prompt: row.prompt,
      negativePrompt: row.negative_prompt,
      imageUrl: row.image_url,
      category: row.category_name || "Uncategorized",
      categorySlug: row.category_slug || "",
      tool: row.ai_tool,
      model: row.ai_model,
      aspectRatio: row.aspect_ratio,
      views: row.views_count || 0,
      likes: row.likes_count || 0,
      saves: row.saves_count || 0,
      rating: Number(row.average_rating) || 0,
      ratingCount: row.rating_count || 0,
      commentsCount: row.comments_count || 0,
      createdAt: row.published_at || row.created_at,
      tags: Array.isArray(row.tags) ? row.tags : [],
      score: Number(row.rank ?? row.recommendation_score ?? 0)
    };
  }

  function normalizeDemoPost(post) {
    return {
      ...post,
      source: "demo",
      categorySlug: slugify(post.category),
      commentsCount: window.PromptGalleryDemo?.comments?.[post.id]?.length || 0,
      score: 0
    };
  }

  function getDemoCategories() {
    const categories = [...new Set(demoPosts.map((post) => post.category))];
    return categories.map((name) => ({ name, slug: slugify(name) }));
  }

  function getDemoTools() {
    return [...new Set(demoPosts.map((post) => post.tool))].sort();
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    state.query = params.get("q") || "";
    state.category = params.get("category") || "all";
    state.tool = params.get("tool") || "all";
    state.sort = params.get("sort") || "relevance";
  }

  function writeUrlState() {
    const params = new URLSearchParams();

    if (state.query) {
      params.set("q", state.query);
    }

    if (state.category !== "all") {
      params.set("category", state.category);
    }

    if (state.tool !== "all") {
      params.set("tool", state.tool);
    }

    if (state.sort !== "relevance") {
      params.set("sort", state.sort);
    }

    const nextUrl = params.toString() ? `./search.html?${params.toString()}` : "./search.html";
    window.history.replaceState({}, "", nextUrl);
  }

  function renderLoading() {
    elements.loading.hidden = false;
    elements.results.hidden = true;
    elements.empty.hidden = true;
    elements.loading.innerHTML = [360, 460, 320, 420, 380, 500]
      .map((height) => `<div class="skeleton-card" style="--skeleton-height: ${height}px"></div>`)
      .join("");
  }

  function sortDemoPosts(posts) {
    if (state.sort === "newest") {
      return posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (state.sort === "popular") {
      return posts.sort((a, b) => b.likes + b.views - (a.likes + a.views));
    }

    if (state.sort === "rating") {
      return posts.sort((a, b) => b.rating - a.rating || b.likes - a.likes);
    }

    if (state.sort === "trending") {
      return posts.sort((a, b) => Number(b.trending) - Number(a.trending) || b.views + b.likes - (a.views + a.likes));
    }

    return posts.sort((a, b) => b.score - a.score || b.rating * 1000 + b.likes - (a.rating * 1000 + a.likes));
  }

  function scoreDemoPost(post, query) {
    if (!query) {
      return post.rating * 2 + post.likes / 500 + (post.trending ? 4 : 0);
    }

    const text = query.toLowerCase();
    const title = post.title.toLowerCase();
    const description = post.description.toLowerCase();
    const prompt = post.prompt.toLowerCase();
    const category = post.category.toLowerCase();
    const tags = post.tags.join(" ").toLowerCase();
    let score = 0;

    if (title.includes(text)) score += 8;
    if (description.includes(text)) score += 5;
    if (prompt.includes(text)) score += 3;
    if (category.includes(text)) score += 4;
    if (tags.includes(text)) score += 5;

    query
      .split(/\s+/)
      .filter(Boolean)
      .forEach((term) => {
        if (title.includes(term)) score += 2;
        if (description.includes(term)) score += 1.5;
        if (prompt.includes(term)) score += 1;
        if (tags.includes(term)) score += 2;
      });

    if (score === 0) {
      return 0;
    }

    return score + post.rating + post.likes / 1000;
  }

  function searchDemoPosts() {
    const query = state.query.trim().toLowerCase();
    const posts = demoPosts
      .map(normalizeDemoPost)
      .filter((post) => state.category === "all" || post.categorySlug === state.category)
      .filter((post) => state.tool === "all" || post.tool === state.tool)
      .map((post) => ({ ...post, score: scoreDemoPost(post, query) }))
      .filter((post) => !query || post.score > 0);

    state.results = sortDemoPosts(posts);
    state.trending = [...demoPosts].map(normalizeDemoPost).sort((a, b) => Number(b.trending) - Number(a.trending) || b.views - a.views).slice(0, 5);
    state.similar = getDemoRecommendations(state.results[0], 4);
    state.youMayLike = getDemoRecommendations(state.results[0] || state.trending[0], 8);
    state.related = getRelatedFromPosts([...state.results, ...state.trending]);
  }

  function getDemoRecommendations(seedPost, limit) {
    const source = demoPosts.map(normalizeDemoPost);

    if (!seedPost) {
      return source.sort((a, b) => b.rating * 1000 + b.likes - (a.rating * 1000 + a.likes)).slice(0, limit);
    }

    return source
      .filter((post) => post.id !== seedPost.id)
      .map((post) => {
        const sharedTags = post.tags.filter((tag) => seedPost.tags.includes(tag)).length;
        const categoryScore = post.categorySlug === seedPost.categorySlug ? 6 : 0;
        return {
          ...post,
          score: categoryScore + sharedTags * 3 + post.rating + post.likes / 1000
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async function loadSupabaseFilters() {
    const client = getClient();
    const [categoryResult, toolResult] = await Promise.all([
      client.from("categories").select("name, slug").eq("is_active", true).order("sort_order", { ascending: true }),
      client.from("posts").select("ai_tool").eq("is_published", true).limit(200)
    ]);

    if (categoryResult.error) {
      throw categoryResult.error;
    }

    if (toolResult.error) {
      throw toolResult.error;
    }

    state.categories = categoryResult.data || [];
    state.tools = [...new Set((toolResult.data || []).map((row) => row.ai_tool).filter(Boolean))].sort();
  }

  async function searchSupabasePosts() {
    const client = getClient();
    const category = state.category === "all" ? null : state.category;
    const tool = state.tool === "all" ? null : state.tool;
    const args = {
      p_search_text: state.query,
      p_category_slug: category,
      p_ai_tool: tool,
      p_sort_by: state.sort,
      p_limit: 36
    };

    const { data, error } = await client.rpc("search_posts", args);

    if (error) {
      throw error;
    }

    state.results = (data || []).map(normalizeRpcPost);

    const [trendingResult, relatedResult, similarResult, recommendedResult] = await Promise.all([
      client.rpc("search_posts", {
        p_search_text: "",
        p_category_slug: category,
        p_ai_tool: null,
        p_sort_by: "trending",
        p_limit: 5
      }),
      client.rpc("get_related_searches", {
        p_search_text: state.query,
        p_category_slug: category,
        p_limit: 10
      }),
      client.rpc("get_recommended_posts", {
        p_post_id: state.results[0]?.id || null,
        p_category_slug: state.results[0]?.categorySlug || category,
        p_tag_names: state.results[0]?.tags || [],
        p_limit: 4
      }),
      client.rpc("get_recommended_posts", {
        p_post_id: null,
        p_category_slug: category,
        p_tag_names: state.results[0]?.tags || [],
        p_limit: 8
      })
    ]);

    if (trendingResult.error) throw trendingResult.error;
    if (relatedResult.error) throw relatedResult.error;
    if (similarResult.error) throw similarResult.error;
    if (recommendedResult.error) throw recommendedResult.error;

    state.trending = (trendingResult.data || []).map(normalizeRpcPost);
    state.related = relatedResult.data || [];
    state.similar = (similarResult.data || []).map(normalizeRpcPost);
    state.youMayLike = (recommendedResult.data || []).map(normalizeRpcPost);
  }

  function getRelatedFromPosts(posts) {
    const related = new Map();

    posts.forEach((post) => {
      if (post.category && post.categorySlug) {
        related.set(`category:${post.categorySlug}`, {
          label: post.category,
          kind: "category",
          query: post.category,
          category_slug: post.categorySlug
        });
      }

      post.tags.slice(0, 4).forEach((tag) => {
        related.set(`tag:${tag}`, {
          label: tag,
          kind: "tag",
          query: tag,
          category_slug: null
        });
      });
    });

    return [...related.values()].slice(0, 10);
  }

  function renderFilters() {
    elements.category.innerHTML = [
      '<option value="all">All categories</option>',
      ...state.categories.map((category) => `<option value="${escapeHtml(category.slug)}">${escapeHtml(category.name)}</option>`)
    ].join("");
    elements.category.value = state.category;

    elements.tool.innerHTML = [
      '<option value="all">All tools</option>',
      ...state.tools.map((tool) => `<option value="${escapeHtml(tool)}">${escapeHtml(tool)}</option>`)
    ].join("");
    elements.tool.value = state.tool;
    elements.sort.value = state.sort;
  }

  function renderSuggestions() {
    const generated = [];
    const posts = [...state.results, ...state.trending, ...state.youMayLike];

    posts.forEach((post) => {
      if (post.category) generated.push(post.category);
      generated.push(...post.tags);
    });

    const suggestions = [...new Set([...defaultSuggestions, ...generated].map((item) => String(item).trim()).filter(Boolean))]
      .slice(0, 10);

    elements.suggestions.innerHTML = suggestions
      .map((suggestion) => `<button class="suggestion-button" type="button" data-search-suggestion="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`)
      .join("");
  }

  function renderCurrentSummary() {
    const categoryName = state.category === "all"
      ? "All categories"
      : state.categories.find((category) => category.slug === state.category)?.name || state.category;
    const toolName = state.tool === "all" ? "All tools" : state.tool;
    const queryText = state.query || "No keyword";

    elements.summary.innerHTML = `
      <p class="mb-0"><strong>Keyword:</strong> ${escapeHtml(queryText)}</p>
      <p class="mb-0"><strong>Category:</strong> ${escapeHtml(categoryName)}</p>
      <p class="mb-0"><strong>Tool:</strong> ${escapeHtml(toolName)}</p>
      <p class="mb-0"><strong>Sort:</strong> ${escapeHtml(state.sort)}</p>
    `;
  }

  function renderCard(post) {
    const visibleTags = post.tags.slice(0, 3);

    return `
      <article class="search-card">
        <a class="search-card__image" style="--card-ratio: ${escapeHtml(post.aspectRatio || "4 / 5")}" href="${getPostUrl(post)}">
          <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" />
        </a>
        <div class="search-card__body">
          <div class="cluster">
            <span class="badge">${escapeHtml(post.category)}</span>
            <span class="badge badge--accent">${escapeHtml(post.tool)}</span>
          </div>
          <h3><a href="${getPostUrl(post)}">${escapeHtml(post.title)}</a></h3>
          <p>${escapeHtml(post.description)}</p>
          <div class="tag-row">
            ${visibleTags.map((tag) => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="search-meta">
            <span>${formatNumber(post.views)} views</span>
            <span>${formatNumber(post.likes)} likes</span>
            <span>${Number(post.rating || 0).toFixed(1)} rating</span>
          </div>
        </div>
      </article>
    `;
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

  function renderRelatedSearches() {
    if (!state.related.length) {
      elements.related.innerHTML = '<p class="helper-text mb-0">Search once to generate related ideas.</p>';
      return;
    }

    elements.related.innerHTML = state.related
      .map((item) => {
        const params = new URLSearchParams();

        if (item.kind === "category" && item.category_slug) {
          params.set("category", item.category_slug);
        } else {
          params.set("q", item.query || item.label);
        }

        return `<a class="related-link" href="./search.html?${params.toString()}">${escapeHtml(item.label)}</a>`;
      })
      .join("");
  }

  function renderResults() {
    const hasResults = state.results.length > 0;
    const heading = state.query ? `Results for "${state.query}"` : "Recommended prompt results";

    elements.loading.hidden = true;
    elements.results.hidden = !hasResults;
    elements.empty.hidden = hasResults;
    elements.heading.textContent = heading;
    elements.count.textContent = `${state.results.length} result${state.results.length === 1 ? "" : "s"}`;
    elements.modeNote.textContent =
      state.mode === "supabase"
        ? "Supabase search is active. Results use ranked database search, category/tag matches, and recommendation RPCs."
        : "Demo search is active. Add Supabase keys and run the Phase 8 SQL to search database posts.";

    elements.results.innerHTML = state.results.map(renderCard).join("");
    elements.trending.innerHTML = state.trending.length
      ? state.trending.map(renderMiniCard).join("")
      : '<p class="helper-text mb-0">No trending posts yet.</p>';
    elements.similar.innerHTML = state.similar.length
      ? state.similar.map(renderCard).join("")
      : '<p class="helper-text mb-0">Search results will create similar prompt suggestions.</p>';
    elements.youMayLike.innerHTML = state.youMayLike.length
      ? state.youMayLike.map(renderCard).join("")
      : '<p class="helper-text mb-0">Recommendations appear after posts are available.</p>';

    renderRelatedSearches();
    renderSuggestions();
    renderCurrentSummary();
  }

  async function runSearch(updateUrl) {
    window.clearTimeout(state.renderTimer);
    renderLoading();

    if (updateUrl) {
      writeUrlState();
    }

    try {
      if (getClient()) {
        state.mode = "supabase";
        await searchSupabasePosts();
      } else {
        state.mode = "demo";
        searchDemoPosts();
      }
    } catch (error) {
      console.warn(error.message);
      state.mode = "demo";
      state.categories = getDemoCategories();
      state.tools = getDemoTools();
      renderFilters();
      searchDemoPosts();
      elements.modeNote.textContent = "Demo fallback is active. Run the latest Phase 8 SQL in Supabase to enable database search.";
    }

    renderResults();
  }

  function scheduleSearch(updateUrl) {
    window.clearTimeout(state.renderTimer);
    renderLoading();
    state.renderTimer = window.setTimeout(function () {
      runSearch(updateUrl);
    }, 280);
  }

  async function loadFilters() {
    try {
      if (getClient()) {
        state.mode = "supabase";
        await loadSupabaseFilters();
      } else {
        state.mode = "demo";
        state.categories = getDemoCategories();
        state.tools = getDemoTools();
      }
    } catch (error) {
      console.warn(error.message);
      state.mode = "demo";
      state.categories = getDemoCategories();
      state.tools = getDemoTools();
    }
  }

  function bindEvents() {
    elements.form.addEventListener("submit", function (event) {
      event.preventDefault();
      state.query = elements.input.value.trim();
      runSearch(true);
    });

    elements.input.addEventListener("input", function (event) {
      state.query = event.target.value.trim();
      scheduleSearch(true);
    });

    elements.category.addEventListener("change", function (event) {
      state.category = event.target.value;
      runSearch(true);
    });

    elements.tool.addEventListener("change", function (event) {
      state.tool = event.target.value;
      runSearch(true);
    });

    elements.sort.addEventListener("change", function (event) {
      state.sort = event.target.value;
      runSearch(true);
    });

    elements.suggestions.addEventListener("click", function (event) {
      const button = event.target.closest("[data-search-suggestion]");

      if (!button) {
        return;
      }

      state.query = button.dataset.searchSuggestion;
      elements.input.value = state.query;
      runSearch(true);
    });
  }

  function cacheElements() {
    elements.form = document.querySelector("[data-search-page-form]");
    elements.input = document.querySelector("[data-search-page-input]");
    elements.suggestions = document.querySelector("[data-search-suggestions]");
    elements.modeNote = document.querySelector("[data-search-mode-note]");
    elements.category = document.querySelector("[data-search-category]");
    elements.tool = document.querySelector("[data-search-tool]");
    elements.sort = document.querySelector("[data-search-sort]");
    elements.loading = document.querySelector("[data-search-loading]");
    elements.results = document.querySelector("[data-search-results]");
    elements.empty = document.querySelector("[data-search-empty]");
    elements.heading = document.querySelector("[data-search-heading]");
    elements.count = document.querySelector("[data-search-count]");
    elements.related = document.querySelector("[data-related-searches]");
    elements.trending = document.querySelector("[data-search-trending]");
    elements.summary = document.querySelector("[data-current-search-summary]");
    elements.similar = document.querySelector("[data-similar-search-results]");
    elements.youMayLike = document.querySelector("[data-you-may-like]");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    cacheElements();

    if (!elements.form) {
      return;
    }

    readUrlState();
    elements.input.value = state.query;
    await loadFilters();
    renderFilters();
    bindEvents();
    await runSearch(false);
  });
})();
