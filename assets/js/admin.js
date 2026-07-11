// Admin dashboard for posts, uploads, categories, tags, comments, users, and analytics.
(function () {
  const state = {
    session: null,
    profile: null,
    posts: [],
    categories: [],
    tags: [],
    comments: [],
    users: [],
    activeTab: "posts",
    postSearch: "",
    postStatus: "all",
    busy: false
  };

  const elements = {};
  const bucketName = "post-images";

  const postSelect = `
    id,
    author_id,
    category_id,
    title,
    slug,
    description,
    prompt,
    negative_prompt,
    image_url,
    image_path,
    ai_tool,
    ai_model,
    aspect_ratio,
    is_published,
    published_at,
    views_count,
    likes_count,
    saves_count,
    rating_count,
    average_rating,
    comments_count,
    created_at,
    updated_at,
    categories(id, name, slug),
    post_tags(tags(id, name, slug))
  `;

  function getClient() {
    return window.PromptGalleryAuth?.getClient();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact" }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) {
      return "Not set";
    }

    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(value));
  }

  function showStatus(message, type) {
    elements.status.textContent = message;
    elements.status.classList.toggle("is-error", type === "error");
    elements.status.classList.toggle("is-success", type === "success");
  }

  function clearStatus() {
    showStatus("", "");
  }

  function setBusy(isBusy) {
    state.busy = isBusy;
    document.querySelectorAll("[data-admin-content] button, [data-admin-content] input, [data-admin-content] textarea, [data-admin-content] select").forEach((field) => {
      field.disabled = isBusy;
    });
  }

  function getFields(form) {
    return form.elements;
  }

  function normalizePost(row) {
    const tags = Array.isArray(row.post_tags)
      ? row.post_tags.map((item) => item.tags).filter(Boolean)
      : [];

    return {
      ...row,
      categoryName: row.categories?.name || "Uncategorized",
      categorySlug: row.categories?.slug || "",
      tags
    };
  }

  function normalizeComment(row) {
    return {
      ...row,
      postTitle: row.posts?.title || "Deleted post",
      postId: row.posts?.id || row.post_id,
      userName: row.profiles?.display_name || row.profiles?.username || "Community member"
    };
  }

  function parseTags(value) {
    return [
      ...new Set(
        String(value || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    ].slice(0, 18);
  }

  function tagNames(post) {
    return post.tags.map((tag) => tag.name).filter(Boolean);
  }

  function getPostUrl(post) {
    return `./post.html?id=${encodeURIComponent(post.id)}`;
  }

  async function loadProfile() {
    const { data, error } = await getClient().rpc("get_current_profile");

    if (error) {
      throw error;
    }

    return data?.[0] || null;
  }

  async function loadPosts() {
    const { data, error } = await getClient()
      .from("posts")
      .select(postSelect)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    state.posts = (data || []).map(normalizePost);
  }

  async function loadCategories() {
    const { data, error } = await getClient()
      .from("categories")
      .select("id, name, slug, description, color, sort_order, is_active, created_at, updated_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    state.categories = data || [];
  }

  async function loadTags() {
    const { data, error } = await getClient()
      .from("tags")
      .select("id, name, slug, created_at")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    state.tags = data || [];
  }

  async function loadComments() {
    const { data, error } = await getClient()
      .from("comments")
      .select("id, post_id, user_id, body, is_approved, created_at, updated_at, posts(id, title), profiles(id, username, display_name)")
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      throw error;
    }

    state.comments = (data || []).map(normalizeComment);
  }

  async function loadUsers() {
    const { data, error } = await getClient().rpc("admin_list_profiles");

    if (error) {
      throw error;
    }

    state.users = data || [];
  }

  async function loadDashboard() {
    await Promise.all([loadCategories(), loadTags(), loadPosts(), loadComments(), loadUsers()]);
  }

  function renderLoadingError(message) {
    elements.loading.innerHTML = `<p class="mb-0 text-muted">${escapeHtml(message)}</p>`;
  }

  function renderDenied(message) {
    elements.loading.hidden = true;
    elements.content.hidden = true;
    elements.denied.hidden = false;

    const lead = elements.denied.querySelector(".lead");

    if (lead && message) {
      lead.textContent = message;
    }
  }

  function renderContent() {
    elements.loading.hidden = true;
    elements.denied.hidden = true;
    elements.content.hidden = false;
    renderCategoryOptions();
    renderStats();
    renderPosts();
    renderCategories();
    renderTags();
    renderComments();
    renderUsers();
    renderAnalytics();
    activateTab(state.activeTab);
  }

  function renderCategoryOptions() {
    elements.categoryOptions.innerHTML = [
      '<option value="">Choose category</option>',
      ...state.categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}${category.is_active ? "" : " (inactive)"}</option>`)
    ].join("");
  }

  function renderStats() {
    const totalPosts = state.posts.length;
    const publishedPosts = state.posts.filter((post) => post.is_published).length;
    const draftPosts = totalPosts - publishedPosts;
    const totalViews = state.posts.reduce((sum, post) => sum + (post.views_count || 0), 0);
    const totalLikes = state.posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
    const hiddenComments = state.comments.filter((comment) => !comment.is_approved).length;
    const stats = [
      ["Posts", totalPosts],
      ["Published", publishedPosts],
      ["Drafts", draftPosts],
      ["Views", totalViews],
      ["Likes", totalLikes],
      ["Users", state.users.length],
      ["Comments", state.comments.length],
      ["Hidden", hiddenComments],
      ["Categories", state.categories.length],
      ["Tags", state.tags.length],
      ["Saves", state.posts.reduce((sum, post) => sum + (post.saves_count || 0), 0)],
      ["Avg rating", getAverageRating()]
    ];

    elements.stats.innerHTML = stats
      .map(
        ([label, value]) => `
          <div class="admin-stat">
            <strong>${typeof value === "number" ? formatNumber(value) : escapeHtml(value)}</strong>
            <span>${escapeHtml(label)}</span>
          </div>
        `
      )
      .join("");
  }

  function getAverageRating() {
    const ratedPosts = state.posts.filter((post) => Number(post.average_rating) > 0);

    if (!ratedPosts.length) {
      return "0.0";
    }

    const average = ratedPosts.reduce((sum, post) => sum + Number(post.average_rating || 0), 0) / ratedPosts.length;
    return average.toFixed(1);
  }

  function filteredPosts() {
    const search = state.postSearch.toLowerCase();

    return state.posts.filter((post) => {
      const statusMatch =
        state.postStatus === "all" ||
        (state.postStatus === "published" && post.is_published) ||
        (state.postStatus === "draft" && !post.is_published);

      if (!statusMatch) {
        return false;
      }

      if (!search) {
        return true;
      }

      const text = [
        post.title,
        post.slug,
        post.description,
        post.prompt,
        post.ai_tool,
        post.ai_model,
        post.categoryName,
        ...tagNames(post)
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search);
    });
  }

  function renderPosts() {
    const posts = filteredPosts();

    if (!posts.length) {
      elements.postsList.innerHTML = '<div class="empty-state"><p class="mb-0">No posts match this view.</p></div>';
      return;
    }

    elements.postsList.innerHTML = posts.map(renderPostRow).join("");
  }

  function renderPostRow(post) {
    const statusClass = post.is_published ? "admin-status--published" : "admin-status--draft";
    const statusText = post.is_published ? "Published" : "Draft";

    return `
      <article class="admin-row">
        <a class="admin-thumb" href="${getPostUrl(post)}">
          <img src="${escapeHtml(post.image_url)}" alt="${escapeHtml(post.title)}" loading="lazy" />
        </a>
        <div>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.categoryName)} - ${escapeHtml(post.ai_tool)} - ${formatDate(post.updated_at)}</p>
          <div class="admin-row__meta">
            <span class="admin-status ${statusClass}">${statusText}</span>
            <span class="badge">${formatNumber(post.views_count)} views</span>
            <span class="badge badge--accent">${formatNumber(post.likes_count)} likes</span>
            <span class="badge badge--gold">${Number(post.average_rating || 0).toFixed(1)} rating</span>
          </div>
        </div>
        <div class="admin-actions">
          <button class="button button--soft button--sm" type="button" data-edit-post="${post.id}">Edit</button>
          <button class="button button--ghost button--sm" type="button" data-toggle-post="${post.id}">
            ${post.is_published ? "Unpublish" : "Publish"}
          </button>
          <a class="button button--ghost button--sm" href="${getPostUrl(post)}">Open</a>
          <button class="button button--danger button--sm" type="button" data-delete-post="${post.id}">Delete</button>
        </div>
      </article>
    `;
  }

  function renderCategories() {
    if (!state.categories.length) {
      elements.categoriesList.innerHTML = '<div class="empty-state"><p class="mb-0">No categories yet.</p></div>';
      return;
    }

    elements.categoriesList.innerHTML = state.categories
      .map(
        (category) => `
          <article class="admin-row">
            <div class="admin-thumb admin-thumb--color" style="background: ${escapeHtml(category.color)}">${escapeHtml(category.name.slice(0, 2).toUpperCase())}</div>
            <div>
              <h3>${escapeHtml(category.name)}</h3>
              <p>${escapeHtml(category.description || "No description.")}</p>
              <div class="admin-row__meta">
                <span class="admin-status ${category.is_active ? "admin-status--approved" : "admin-status--hidden"}">${category.is_active ? "Active" : "Inactive"}</span>
                <span class="badge">${escapeHtml(category.slug)}</span>
                <span class="badge badge--accent">Sort ${formatNumber(category.sort_order)}</span>
              </div>
            </div>
            <div class="admin-actions">
              <button class="button button--soft button--sm" type="button" data-edit-category="${category.id}">Edit</button>
              <button class="button button--danger button--sm" type="button" data-delete-category="${category.id}">Delete</button>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderTags() {
    if (!state.tags.length) {
      elements.tagsList.innerHTML = '<div class="empty-state"><p class="mb-0">No tags yet.</p></div>';
      return;
    }

    elements.tagsList.innerHTML = state.tags
      .map(
        (tag) => `
          <article class="admin-row admin-row--compact">
            <div>
              <h3>#${escapeHtml(tag.name)}</h3>
              <p>${escapeHtml(tag.slug)}</p>
            </div>
            <div class="admin-actions">
              <button class="button button--soft button--sm" type="button" data-edit-tag="${tag.id}">Edit</button>
              <button class="button button--danger button--sm" type="button" data-delete-tag="${tag.id}">Delete</button>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderComments() {
    if (!state.comments.length) {
      elements.commentsList.innerHTML = '<div class="empty-state"><p class="mb-0">No comments yet.</p></div>';
      return;
    }

    elements.commentsList.innerHTML = state.comments
      .map(
        (comment) => `
          <article class="admin-row admin-row--compact">
            <div>
              <h3>${escapeHtml(comment.postTitle)}</h3>
              <p>${escapeHtml(comment.body)}</p>
              <div class="admin-row__meta">
                <span class="admin-status ${comment.is_approved ? "admin-status--approved" : "admin-status--hidden"}">
                  ${comment.is_approved ? "Approved" : "Hidden"}
                </span>
                <span class="badge">${escapeHtml(comment.userName)}</span>
                <span class="badge badge--accent">${formatDate(comment.created_at)}</span>
              </div>
            </div>
            <div class="admin-actions">
              <button class="button button--soft button--sm" type="button" data-toggle-comment="${comment.id}">
                ${comment.is_approved ? "Hide" : "Approve"}
              </button>
              <button class="button button--danger button--sm" type="button" data-delete-comment="${comment.id}">Delete</button>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderUsers() {
    if (!state.users.length) {
      elements.usersList.innerHTML = '<div class="empty-state"><p class="mb-0">No profile rows yet.</p></div>';
      return;
    }

    elements.usersList.innerHTML = state.users
      .map((user) => {
        const isSelf = user.id === state.session.user.id;
        const isAdmin = user.role === "admin";

        return `
          <article class="admin-row admin-row--compact">
            <div>
              <h3>${escapeHtml(user.display_name || user.username || "User")}</h3>
              <p>${escapeHtml(user.username ? `@${user.username}` : user.id)} - Joined ${formatDate(user.created_at)}</p>
              <div class="admin-row__meta">
                <span class="admin-status ${isAdmin ? "admin-status--admin" : "admin-status--user"}">${isAdmin ? "Admin" : "User"}</span>
                ${isSelf ? '<span class="badge badge--gold">Current account</span>' : ""}
              </div>
            </div>
            <div class="admin-actions">
              <a class="button button--ghost button--sm" href="./profile.html?id=${encodeURIComponent(user.id)}">Profile</a>
              ${
                isSelf
                  ? '<button class="button button--ghost button--sm" type="button" disabled>Current admin</button>'
                  : `<button class="button button--soft button--sm" type="button" data-set-user-role="${user.id}" data-role="${isAdmin ? "user" : "admin"}">
                      Make ${isAdmin ? "user" : "admin"}
                    </button>`
              }
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderAnalytics() {
    const topPosts = [...state.posts]
      .sort((a, b) => (b.views_count + b.likes_count * 4 + Number(b.average_rating) * 100) - (a.views_count + a.likes_count * 4 + Number(a.average_rating) * 100))
      .slice(0, 8);
    const recentComments = state.comments.slice(0, 8);

    elements.topPostsList.innerHTML = topPosts.length
      ? topPosts.map(renderPostRow).join("")
      : '<div class="empty-state"><p class="mb-0">No post analytics yet.</p></div>';

    elements.recentCommentsList.innerHTML = recentComments.length
      ? recentComments
          .map(
            (comment) => `
              <article class="admin-row admin-row--compact">
                <div>
                  <h3>${escapeHtml(comment.postTitle)}</h3>
                  <p>${escapeHtml(comment.body)}</p>
                  <div class="admin-row__meta">
                    <span class="badge">${escapeHtml(comment.userName)}</span>
                    <span class="badge badge--accent">${formatDate(comment.created_at)}</span>
                  </div>
                </div>
              </article>
            `
          )
          .join("")
      : '<div class="empty-state"><p class="mb-0">No recent comments yet.</p></div>';
  }

  function activateTab(tabName) {
    state.activeTab = tabName;

    elements.tabButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.adminTabButton === tabName);
    });

    elements.panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.adminPanel === tabName);
    });
  }

  function resetPostForm() {
    elements.postForm.reset();
    const fields = getFields(elements.postForm);
    fields.namedItem("id").value = "";
    fields.namedItem("image_url").value = "";
    fields.namedItem("image_path").value = "";
    fields.namedItem("aspect_ratio").value = "4 / 5";
    elements.postFormTitle.textContent = "Create post";
    elements.postImagePreview.hidden = true;
    elements.postImagePreview.innerHTML = "";
  }

  function resetCategoryForm() {
    elements.categoryForm.reset();
    getFields(elements.categoryForm).namedItem("id").value = "";
    getFields(elements.categoryForm).namedItem("color").value = "#ef4056";
    getFields(elements.categoryForm).namedItem("sort_order").value = "0";
    getFields(elements.categoryForm).namedItem("is_active").checked = true;
    elements.categoryFormTitle.textContent = "Create category";
  }

  function resetTagForm() {
    elements.tagForm.reset();
    getFields(elements.tagForm).namedItem("id").value = "";
    elements.tagFormTitle.textContent = "Create tag";
  }

  function editPost(postId) {
    const post = state.posts.find((item) => item.id === postId);

    if (!post) {
      return;
    }

    const fields = getFields(elements.postForm);
    fields.namedItem("id").value = post.id;
    fields.namedItem("title").value = post.title || "";
    fields.namedItem("slug").value = post.slug || "";
    fields.namedItem("description").value = post.description || "";
    fields.namedItem("prompt").value = post.prompt || "";
    fields.namedItem("negative_prompt").value = post.negative_prompt || "";
    fields.namedItem("category_id").value = post.category_id || "";
    fields.namedItem("aspect_ratio").value = post.aspect_ratio || "4 / 5";
    fields.namedItem("ai_tool").value = post.ai_tool || "";
    fields.namedItem("ai_model").value = post.ai_model || "";
    fields.namedItem("tags").value = tagNames(post).join(", ");
    fields.namedItem("image_url").value = post.image_url || "";
    fields.namedItem("image_path").value = post.image_path || "";
    fields.namedItem("is_published").checked = Boolean(post.is_published);
    elements.postFormTitle.textContent = "Edit post";
    renderImagePreview(post.image_url, post.image_path);
    activateTab("posts");
    elements.postForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function editCategory(categoryId) {
    const category = state.categories.find((item) => item.id === categoryId);

    if (!category) {
      return;
    }

    const fields = getFields(elements.categoryForm);
    fields.namedItem("id").value = category.id;
    fields.namedItem("name").value = category.name || "";
    fields.namedItem("slug").value = category.slug || "";
    fields.namedItem("description").value = category.description || "";
    fields.namedItem("color").value = category.color || "#ef4056";
    fields.namedItem("sort_order").value = category.sort_order || 0;
    fields.namedItem("is_active").checked = Boolean(category.is_active);
    elements.categoryFormTitle.textContent = "Edit category";
    activateTab("categories");
    elements.categoryForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function editTag(tagId) {
    const tag = state.tags.find((item) => item.id === tagId);

    if (!tag) {
      return;
    }

    const fields = getFields(elements.tagForm);
    fields.namedItem("id").value = tag.id;
    fields.namedItem("name").value = tag.name || "";
    fields.namedItem("slug").value = tag.slug || "";
    elements.tagFormTitle.textContent = "Edit tag";
    activateTab("tags");
    elements.tagForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderImagePreview(url, path) {
    if (!url) {
      elements.postImagePreview.hidden = true;
      elements.postImagePreview.innerHTML = "";
      return;
    }

    elements.postImagePreview.hidden = false;
    elements.postImagePreview.innerHTML = `
      <img src="${escapeHtml(url)}" alt="" loading="lazy" />
      <div>
        <strong>Current image</strong>
        <p class="helper-text">${escapeHtml(path || url)}</p>
      </div>
    `;
  }

  async function uploadPostImage(file, slug) {
    if (!file) {
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Image must be 10 MB or smaller.");
    }

    const allowedExtensions = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif"
    };
    const extension = allowedExtensions[file.type];

    if (!extension) {
      throw new Error("Upload a JPG, PNG, WebP, or GIF image.");
    }

    const safeSlug = slugify(slug) || "prompt-image";
    const safeName = `${Date.now()}-${safeSlug}-${Math.random().toString(16).slice(2)}.${extension}`;
    const path = `posts/${state.session.user.id}/${safeName}`;
    const { error } = await getClient().storage.from(bucketName).upload(path, file, {
      contentType: file.type,
      upsert: false
    });

    if (error) {
      throw error;
    }

    const { data } = getClient().storage.from(bucketName).getPublicUrl(path);

    return {
      image_url: data.publicUrl,
      image_path: path
    };
  }

  async function ensureTags(names) {
    const tagItems = names
      .map((name) => ({ name, slug: slugify(name) }))
      .filter((tag) => tag.slug && tag.name.length >= 2);
    const uniqueTags = [...new Map(tagItems.map((tag) => [tag.slug, tag])).values()];

    if (!uniqueTags.length) {
      return [];
    }

    const slugs = uniqueTags.map((tag) => tag.slug);
    const { data: existing, error: selectError } = await getClient()
      .from("tags")
      .select("id, name, slug")
      .in("slug", slugs);

    if (selectError) {
      throw selectError;
    }

    const existingSlugs = new Set((existing || []).map((tag) => tag.slug));
    const missing = uniqueTags.filter((tag) => !existingSlugs.has(tag.slug));
    let created = [];

    if (missing.length) {
      const { data, error } = await getClient()
        .from("tags")
        .insert(missing)
        .select("id, name, slug");

      if (error) {
        throw error;
      }

      created = data || [];
    }

    return [...(existing || []), ...created];
  }

  async function syncPostTags(postId, tagText) {
    const names = parseTags(tagText);
    const tags = await ensureTags(names);
    const { error: deleteError } = await getClient().from("post_tags").delete().eq("post_id", postId);

    if (deleteError) {
      throw deleteError;
    }

    if (!tags.length) {
      return;
    }

    const rows = tags.map((tag) => ({
      post_id: postId,
      tag_id: tag.id
    }));
    const { error } = await getClient().from("post_tags").insert(rows);

    if (error) {
      throw error;
    }
  }

  async function handlePostSubmit(event) {
    event.preventDefault();

    if (state.busy) {
      return;
    }

    const fields = getFields(elements.postForm);
    const title = fields.namedItem("title").value.trim();
    const slug = slugify(fields.namedItem("slug").value || title);
    const imageFile = fields.namedItem("image_file").files[0];
    const existingImageUrl = fields.namedItem("image_url").value;
    const existingImagePath = fields.namedItem("image_path").value;
    const upload = imageFile ? await runBusy(() => uploadPostImage(imageFile, slug), "Uploading image...") : null;

    if (imageFile && !upload) {
      return;
    }

    const image_url = upload?.image_url || existingImageUrl;
    const image_path = upload?.image_path || existingImagePath || null;

    if (!image_url) {
      showStatus("Upload an image before saving the post.", "error");
      return;
    }

    if (!slug) {
      showStatus("Add a clearer title or slug before saving.", "error");
      return;
    }

    const payload = {
      category_id: fields.namedItem("category_id").value,
      title,
      slug,
      description: fields.namedItem("description").value.trim(),
      prompt: fields.namedItem("prompt").value.trim(),
      negative_prompt: fields.namedItem("negative_prompt").value.trim() || null,
      image_url,
      image_path,
      ai_tool: fields.namedItem("ai_tool").value.trim(),
      ai_model: fields.namedItem("ai_model").value.trim(),
      aspect_ratio: fields.namedItem("aspect_ratio").value.trim(),
      is_published: fields.namedItem("is_published").checked
    };
    const postId = fields.namedItem("id").value;

    await runBusy(async function () {
      const query = postId
        ? getClient().from("posts").update(payload).eq("id", postId).select("id").single()
        : getClient()
            .from("posts")
            .insert({ ...payload, author_id: state.session.user.id })
            .select("id")
            .single();

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      await syncPostTags(data.id, fields.namedItem("tags").value);
      await Promise.all([loadPosts(), loadTags()]);
      resetPostForm();
      renderCategoryOptions();
      renderStats();
      renderPosts();
      renderTags();
      renderAnalytics();
      showStatus("Post saved.", "success");
    }, "Saving post...");
  }

  async function runBusy(task, busyMessage) {
    clearStatus();
    setBusy(true);
    showStatus(busyMessage, "");

    try {
      return await task();
    } catch (error) {
      showStatus(error.message, "error");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function togglePost(postId) {
    const post = state.posts.find((item) => item.id === postId);

    if (!post) {
      return;
    }

    await runBusy(async function () {
      const { error } = await getClient().from("posts").update({ is_published: !post.is_published }).eq("id", postId);

      if (error) {
        throw error;
      }

      await loadPosts();
      renderStats();
      renderPosts();
      renderAnalytics();
      showStatus(post.is_published ? "Post unpublished." : "Post published.", "success");
    }, "Updating post...");
  }

  async function deletePost(postId) {
    const post = state.posts.find((item) => item.id === postId);

    if (!post || !window.confirm("Delete this post and its interactions?")) {
      return;
    }

    await runBusy(async function () {
      const { error } = await getClient().from("posts").delete().eq("id", postId);

      if (error) {
        throw error;
      }

      if (post.image_path) {
        await getClient().storage.from(bucketName).remove([post.image_path]);
      }

      await Promise.all([loadPosts(), loadComments()]);
      renderStats();
      renderPosts();
      renderComments();
      renderAnalytics();
      showStatus("Post deleted.", "success");
    }, "Deleting post...");
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();

    const fields = getFields(elements.categoryForm);
    const categoryId = fields.namedItem("id").value;
    const name = fields.namedItem("name").value.trim();
    const payload = {
      name,
      slug: slugify(fields.namedItem("slug").value || name),
      description: fields.namedItem("description").value.trim() || null,
      color: fields.namedItem("color").value,
      sort_order: Number(fields.namedItem("sort_order").value) || 0,
      is_active: fields.namedItem("is_active").checked
    };

    if (!payload.slug) {
      showStatus("Add a clearer category name or slug.", "error");
      return;
    }

    await runBusy(async function () {
      const query = categoryId
        ? getClient().from("categories").update(payload).eq("id", categoryId)
        : getClient().from("categories").insert({ ...payload, created_by: state.session.user.id });
      const { error } = await query;

      if (error) {
        throw error;
      }

      await loadCategories();
      resetCategoryForm();
      renderCategoryOptions();
      renderCategories();
      renderStats();
      showStatus("Category saved.", "success");
    }, "Saving category...");
  }

  async function deleteCategory(categoryId) {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    await runBusy(async function () {
      const { error } = await getClient().from("categories").delete().eq("id", categoryId);

      if (error) {
        throw error;
      }

      await loadCategories();
      renderCategoryOptions();
      renderCategories();
      renderStats();
      showStatus("Category deleted.", "success");
    }, "Deleting category...");
  }

  async function handleTagSubmit(event) {
    event.preventDefault();

    const fields = getFields(elements.tagForm);
    const tagId = fields.namedItem("id").value;
    const name = fields.namedItem("name").value.trim();
    const payload = {
      name,
      slug: slugify(fields.namedItem("slug").value || name)
    };

    if (!payload.slug) {
      showStatus("Add a clearer tag name or slug.", "error");
      return;
    }

    await runBusy(async function () {
      const query = tagId
        ? getClient().from("tags").update(payload).eq("id", tagId)
        : getClient().from("tags").insert(payload);
      const { error } = await query;

      if (error) {
        throw error;
      }

      await loadTags();
      resetTagForm();
      renderTags();
      showStatus("Tag saved.", "success");
    }, "Saving tag...");
  }

  async function deleteTag(tagId) {
    if (!window.confirm("Delete this tag?")) {
      return;
    }

    await runBusy(async function () {
      const { error } = await getClient().from("tags").delete().eq("id", tagId);

      if (error) {
        throw error;
      }

      await Promise.all([loadTags(), loadPosts()]);
      renderTags();
      renderPosts();
      renderAnalytics();
      showStatus("Tag deleted.", "success");
    }, "Deleting tag...");
  }

  async function toggleComment(commentId) {
    const comment = state.comments.find((item) => item.id === commentId);

    if (!comment) {
      return;
    }

    await runBusy(async function () {
      const { error } = await getClient()
        .from("comments")
        .update({ is_approved: !comment.is_approved })
        .eq("id", commentId);

      if (error) {
        throw error;
      }

      await Promise.all([loadComments(), loadPosts()]);
      renderComments();
      renderStats();
      renderPosts();
      renderAnalytics();
      showStatus(comment.is_approved ? "Comment hidden." : "Comment approved.", "success");
    }, "Updating comment...");
  }

  async function deleteComment(commentId) {
    if (!window.confirm("Delete this comment?")) {
      return;
    }

    await runBusy(async function () {
      const { error } = await getClient().from("comments").delete().eq("id", commentId);

      if (error) {
        throw error;
      }

      await Promise.all([loadComments(), loadPosts()]);
      renderComments();
      renderStats();
      renderPosts();
      renderAnalytics();
      showStatus("Comment deleted.", "success");
    }, "Deleting comment...");
  }

  async function setUserRole(userId, role) {
    if (userId === state.session.user.id && role !== "admin") {
      showStatus("You cannot demote your own admin account from the browser.", "error");
      return;
    }

    await runBusy(async function () {
      const { error } = await getClient().rpc("admin_set_profile_role", {
        p_user_id: userId,
        p_role: role
      });

      if (error) {
        throw error;
      }

      await loadUsers();
      renderUsers();
      renderStats();
      showStatus("User role updated.", "success");
    }, "Updating user...");
  }

  function handleDashboardClick(event) {
    const tab = event.target.closest("[data-admin-tab-button]");
    const refresh = event.target.closest("[data-admin-refresh]");
    const resetPost = event.target.closest("[data-reset-post-form]");
    const resetCategory = event.target.closest("[data-reset-category-form]");
    const resetTag = event.target.closest("[data-reset-tag-form]");
    const editPostButton = event.target.closest("[data-edit-post]");
    const togglePostButton = event.target.closest("[data-toggle-post]");
    const deletePostButton = event.target.closest("[data-delete-post]");
    const editCategoryButton = event.target.closest("[data-edit-category]");
    const deleteCategoryButton = event.target.closest("[data-delete-category]");
    const editTagButton = event.target.closest("[data-edit-tag]");
    const deleteTagButton = event.target.closest("[data-delete-tag]");
    const toggleCommentButton = event.target.closest("[data-toggle-comment]");
    const deleteCommentButton = event.target.closest("[data-delete-comment]");
    const roleButton = event.target.closest("[data-set-user-role]");

    if (tab) {
      activateTab(tab.dataset.adminTabButton);
      return;
    }

    if (refresh) {
      refreshDashboard();
      return;
    }

    if (resetPost) {
      resetPostForm();
      return;
    }

    if (resetCategory) {
      resetCategoryForm();
      return;
    }

    if (resetTag) {
      resetTagForm();
      return;
    }

    if (editPostButton) {
      editPost(editPostButton.dataset.editPost);
      return;
    }

    if (togglePostButton) {
      togglePost(togglePostButton.dataset.togglePost);
      return;
    }

    if (deletePostButton) {
      deletePost(deletePostButton.dataset.deletePost);
      return;
    }

    if (editCategoryButton) {
      editCategory(editCategoryButton.dataset.editCategory);
      return;
    }

    if (deleteCategoryButton) {
      deleteCategory(deleteCategoryButton.dataset.deleteCategory);
      return;
    }

    if (editTagButton) {
      editTag(editTagButton.dataset.editTag);
      return;
    }

    if (deleteTagButton) {
      deleteTag(deleteTagButton.dataset.deleteTag);
      return;
    }

    if (toggleCommentButton) {
      toggleComment(toggleCommentButton.dataset.toggleComment);
      return;
    }

    if (deleteCommentButton) {
      deleteComment(deleteCommentButton.dataset.deleteComment);
      return;
    }

    if (roleButton) {
      setUserRole(roleButton.dataset.setUserRole, roleButton.dataset.role);
    }
  }

  async function refreshDashboard() {
    await runBusy(async function () {
      await loadDashboard();
      renderContent();
      showStatus("Dashboard refreshed.", "success");
    }, "Refreshing dashboard...");
  }

  function bindEvents() {
    elements.content.addEventListener("click", handleDashboardClick);
    elements.postForm.addEventListener("submit", handlePostSubmit);
    elements.categoryForm.addEventListener("submit", handleCategorySubmit);
    elements.tagForm.addEventListener("submit", handleTagSubmit);
    elements.postFilter.addEventListener("input", function (event) {
      state.postSearch = event.target.value.trim();
      renderPosts();
    });
    elements.postStatusFilter.addEventListener("change", function (event) {
      state.postStatus = event.target.value;
      renderPosts();
    });

    getFields(elements.postForm).namedItem("title").addEventListener("input", function () {
      const fields = getFields(elements.postForm);

      if (!fields.namedItem("id").value) {
        fields.namedItem("slug").value = slugify(fields.namedItem("title").value);
      }
    });

    getFields(elements.categoryForm).namedItem("name").addEventListener("input", function () {
      const fields = getFields(elements.categoryForm);

      if (!fields.namedItem("id").value) {
        fields.namedItem("slug").value = slugify(fields.namedItem("name").value);
      }
    });

    getFields(elements.tagForm).namedItem("name").addEventListener("input", function () {
      const fields = getFields(elements.tagForm);

      if (!fields.namedItem("id").value) {
        fields.namedItem("slug").value = slugify(fields.namedItem("name").value);
      }
    });
  }

  function cacheElements() {
    elements.loading = document.querySelector("[data-admin-loading]");
    elements.denied = document.querySelector("[data-admin-denied]");
    elements.content = document.querySelector("[data-admin-content]");
    elements.status = document.querySelector("[data-admin-status]");
    elements.stats = document.querySelector("[data-admin-stats]");
    elements.tabButtons = document.querySelectorAll("[data-admin-tab-button]");
    elements.panels = document.querySelectorAll("[data-admin-panel]");
    elements.postForm = document.querySelector("[data-post-form]");
    elements.postFormTitle = document.querySelector("[data-post-form-title]");
    elements.postImagePreview = document.querySelector("[data-post-image-preview]");
    elements.postFilter = document.querySelector("[data-post-filter]");
    elements.postStatusFilter = document.querySelector("[data-post-status-filter]");
    elements.categoryOptions = document.querySelector("[data-category-options]");
    elements.postsList = document.querySelector("[data-posts-list]");
    elements.categoryForm = document.querySelector("[data-category-form]");
    elements.categoryFormTitle = document.querySelector("[data-category-form-title]");
    elements.categoriesList = document.querySelector("[data-categories-list]");
    elements.tagForm = document.querySelector("[data-tag-form]");
    elements.tagFormTitle = document.querySelector("[data-tag-form-title]");
    elements.tagsList = document.querySelector("[data-tags-list]");
    elements.commentsList = document.querySelector("[data-comments-list]");
    elements.usersList = document.querySelector("[data-users-list]");
    elements.topPostsList = document.querySelector("[data-top-posts-list]");
    elements.recentCommentsList = document.querySelector("[data-recent-comments-list]");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    cacheElements();

    if (!getClient()) {
      renderLoadingError("Supabase is not configured yet. Add your Project URL and anon key first.");
      return;
    }

    state.session = await window.PromptGalleryAuth.requireSession();

    if (!state.session) {
      return;
    }

    try {
      state.profile = await loadProfile();

      if (state.profile?.role !== "admin") {
        renderDenied("Your account is signed in, but it is not marked as admin.");
        return;
      }

      await loadDashboard();
      resetPostForm();
      bindEvents();
      renderContent();
    } catch (error) {
      console.warn(error.message);
      renderDenied(error.message);
    }
  });
})();
