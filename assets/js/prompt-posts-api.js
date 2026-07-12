// Shared prompt_posts data helpers for the static CMS flow.
(function () {
  const tableName = "prompt_posts";

  function getClient() {
    return window.PromptGalleryAuth?.getClient() || window.PromptGallerySupabase?.client || null;
  }

  function isConfigured() {
    return Boolean(getClient());
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function compactText(value, maxLength) {
    const text = String(value || "").replace(/\s+/g, " ").trim();

    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength - 1).trim()}...`;
  }

  function toTags(value) {
    if (Array.isArray(value)) {
      return value.map((tag) => String(tag).trim()).filter(Boolean);
    }

    return String(value || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function normalize(row) {
    const tags = toTags(row.tags);
    const category = row.category || "Uncategorized";
    const aiTool = row.ai_tool || "AI tool";
    const model = row.model || "Model not set";

    return {
      id: row.id,
      source: "prompt_posts",
      title: row.title || "Untitled prompt",
      description: compactText(row.prompt, 150),
      prompt: row.prompt || "",
      negativePrompt: row.negative_prompt || "",
      imageUrl: row.image_url,
      imagePath: row.image_path || "",
      category,
      categorySlug: slugify(category),
      tool: aiTool,
      model,
      aspectRatio: row.aspect_ratio || "4 / 5",
      style: row.style || "",
      status: row.status || "published",
      notes: row.notes || "",
      tags,
      views: 0,
      likes: 0,
      saves: 0,
      rating: 0,
      ratingCount: 0,
      commentsCount: 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  function scorePost(post, query) {
    if (!query) {
      return new Date(post.createdAt || 0).getTime() / 100000000000;
    }

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const fields = {
      title: post.title.toLowerCase(),
      prompt: post.prompt.toLowerCase(),
      category: post.category.toLowerCase(),
      style: post.style.toLowerCase(),
      model: `${post.tool} ${post.model}`.toLowerCase(),
      tags: post.tags.join(" ").toLowerCase()
    };

    let score = 0;

    terms.forEach((term) => {
      if (fields.title.includes(term)) score += 8;
      if (fields.tags.includes(term)) score += 6;
      if (fields.category.includes(term)) score += 5;
      if (fields.style.includes(term)) score += 4;
      if (fields.model.includes(term)) score += 3;
      if (fields.prompt.includes(term)) score += 2;
    });

    return score;
  }

  function sortPosts(posts, sort) {
    return [...posts].sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }

      if (sort === "popular" || sort === "trending" || sort === "rating") {
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      }

      return (b.score || 0) - (a.score || 0) || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }

  async function fetchPublished(options = {}) {
    const limit = options.limit || 80;
    const client = getClient();

    if (!client) {
      return [];
    }

    const { data, error } = await client
      .from(tableName)
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []).map(normalize);
  }

  async function fetchPostById(id) {
    const client = getClient();

    if (!client || !id) {
      return null;
    }

    const { data, error } = await client
      .from(tableName)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? normalize(data) : null;
  }

  async function search(options = {}) {
    const query = String(options.query || "").trim();
    const category = String(options.category || "all");
    const tool = String(options.tool || "all");
    const sort = options.sort || "relevance";
    const limit = options.limit || 36;
    const source = await fetchPublished({ limit: 300 });

    const results = source
      .filter((post) => category === "all" || post.categorySlug === category)
      .filter((post) => tool === "all" || post.tool === tool)
      .map((post) => ({ ...post, score: scorePost(post, query) }))
      .filter((post) => !query || post.score > 0);

    return sortPosts(results, sort).slice(0, limit);
  }

  async function getFilters() {
    const posts = await fetchPublished({ limit: 500 });
    const categoryMap = new Map();

    posts.forEach((post) => {
      if (post.category) {
        categoryMap.set(post.categorySlug, {
          name: post.category,
          slug: post.categorySlug
        });
      }
    });

    return {
      posts,
      categories: [...categoryMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
      tools: [...new Set(posts.map((post) => post.tool).filter(Boolean))].sort()
    };
  }

  function getRelatedFromPosts(posts, limit = 10) {
    const related = new Map();

    posts.forEach((post) => {
      if (post.category) {
        related.set(`category:${post.categorySlug}`, {
          label: post.category,
          kind: "category",
          query: post.category,
          category_slug: post.categorySlug
        });
      }

      post.tags.slice(0, 4).forEach((tag) => {
        related.set(`tag:${tag.toLowerCase()}`, {
          label: tag,
          kind: "tag",
          query: tag,
          category_slug: null
        });
      });
    });

    return [...related.values()].slice(0, limit);
  }

  function recommend(seedPost, posts, limit = 4) {
    if (!seedPost) {
      return sortPosts(posts, "newest").slice(0, limit);
    }

    return posts
      .filter((post) => post.id !== seedPost.id)
      .map((post) => {
        const sharedTags = post.tags.filter((tag) => seedPost.tags.includes(tag)).length;
        const categoryScore = post.categorySlug === seedPost.categorySlug ? 6 : 0;
        const styleScore = post.style && post.style === seedPost.style ? 2 : 0;

        return {
          ...post,
          score: categoryScore + sharedTags * 3 + styleScore
        };
      })
      .sort((a, b) => b.score - a.score || new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, limit);
  }

  async function fetchRecommendations(seedPost, limit = 4) {
    const posts = await fetchPublished({ limit: 120 });
    return recommend(seedPost, posts, limit);
  }

  window.PromptGalleryPromptPosts = {
    tableName,
    isConfigured,
    normalize,
    slugify,
    compactText,
    fetchPublished,
    fetchPostById,
    search,
    getFilters,
    getRelatedFromPosts,
    recommend,
    fetchRecommendations
  };
})();
