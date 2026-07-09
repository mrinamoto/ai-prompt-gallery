// Post details behavior.
// Demo posts still render locally, while Supabase posts use real likes, ratings, comments, saves, and views.
(function () {
  const demo = window.PromptGalleryDemo || { posts: [], comments: {} };
  const demoPosts = demo.posts;
  const demoComments = demo.comments;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const state = {
    mode: "demo",
    post: null,
    comments: [],
    recommendations: [],
    session: null,
    profile: null,
    liked: false,
    saved: false,
    userRating: 0,
    likesOffset: 0,
    savesOffset: 0,
    demoRating: 0,
    isBusy: false
  };

  const elements = {};

  function getClient() {
    return window.PromptGalleryAuth?.getClient();
  }

  function getQuery() {
    return new URLSearchParams(window.location.search);
  }

  function getRequestedPostId() {
    return getQuery().get("id");
  }

  function getRequestedSlug() {
    return getQuery().get("slug");
  }

  function shouldUseSupabase() {
    const client = getClient();
    const requestedId = getRequestedPostId();
    const requestedSlug = getRequestedSlug();

    return Boolean(client && (requestedSlug || uuidPattern.test(String(requestedId || ""))));
  }

  function getDemoPostId() {
    const requestedId = getRequestedPostId();

    if (!requestedId) {
      return demoPosts[0]?.id;
    }

    const numericId = Number(requestedId);
    return Number.isFinite(numericId) ? numericId : null;
  }

  function getPostUrl(post) {
    if (post.source === "supabase") {
      return `./post.html?id=${post.id}`;
    }

    return `./post.html?id=${post.id}`;
  }

  function getAuthRedirectUrl() {
    return `./auth.html?redirect=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`;
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

  function formatDate(dateString) {
    if (!dateString) {
      return "Unknown";
    }

    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(dateString));
  }

  function renderStars(rating) {
    const fullStars = Math.round(Number(rating) || 0);
    return Array.from({ length: 5 }, function (_, index) {
      return index < fullStars ? "&#9733;" : "&#9734;";
    }).join("");
  }

  function normalizeSupabasePost(row) {
    const tags = Array.isArray(row.tags)
      ? row.tags
      : Array.isArray(row.post_tags)
        ? row.post_tags.map((item) => item.tags?.name).filter(Boolean)
        : [];

    return {
      id: row.id,
      source: "supabase",
      title: row.title,
      description: row.description,
      prompt: row.prompt,
      negativePrompt: row.negative_prompt,
      category: row.category_name || row.categories?.name || "Uncategorized",
      categorySlug: row.category_slug || row.categories?.slug || "",
      tool: row.ai_tool,
      model: row.ai_model,
      aspectRatio: row.aspect_ratio,
      tags,
      imageUrl: row.image_url,
      views: row.views_count || 0,
      likes: row.likes_count || 0,
      saves: row.saves_count || 0,
      rating: Number(row.average_rating) || 0,
      ratingCount: row.rating_count || 0,
      commentsCount: row.comments_count || 0,
      createdAt: row.published_at || row.created_at
    };
  }

  async function fetchSupabaseRecommendations() {
    if (state.mode !== "supabase") {
      state.recommendations = [];
      return;
    }

    const { data, error } = await getClient().rpc("get_recommended_posts", {
      p_post_id: state.post.id,
      p_category_slug: state.post.categorySlug,
      p_tag_names: state.post.tags,
      p_limit: 4
    });

    if (error) {
      console.warn(error.message);
      state.recommendations = [];
      return;
    }

    state.recommendations = (data || []).map(normalizeSupabasePost);
  }

  function normalizeSupabaseComment(row) {
    const profile = row.profiles || {};
    const name = profile.display_name || profile.username || "Community member";

    return {
      id: row.id,
      source: "supabase",
      postId: row.post_id,
      userId: row.user_id,
      name,
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async function fetchSupabasePost() {
    const client = getClient();
    const requestedId = getRequestedPostId();
    const requestedSlug = getRequestedSlug();
    let query = client
      .from("posts")
      .select(
        `
        id,
        title,
        slug,
        description,
        prompt,
        negative_prompt,
        image_url,
        ai_tool,
        ai_model,
        aspect_ratio,
        views_count,
        likes_count,
        saves_count,
        rating_count,
        average_rating,
        comments_count,
        published_at,
        created_at,
        categories(name, slug),
        post_tags(tags(name, slug))
      `
      )
      .eq("is_published", true);

    if (requestedSlug) {
      query = query.eq("slug", requestedSlug);
    } else {
      query = query.eq("id", requestedId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    return data ? normalizeSupabasePost(data) : null;
  }

  function getDemoPost() {
    const id = getDemoPostId();
    const post = demoPosts.find((item) => item.id === id);

    return post ? { ...post, source: "demo", commentsCount: (demoComments[post.id] || []).length } : null;
  }

  async function loadSessionAndProfile() {
    if (!getClient()) {
      state.session = null;
      state.profile = null;
      return;
    }

    state.session = await window.PromptGalleryAuth.loadSession();

    if (!state.session) {
      state.profile = null;
      return;
    }

    const { data, error } = await getClient()
      .from("profiles")
      .select("id, role, display_name, username")
      .eq("id", state.session.user.id)
      .maybeSingle();

    if (error) {
      console.warn(error.message);
      state.profile = null;
      return;
    }

    state.profile = data;
  }

  async function fetchUserPostState() {
    if (state.mode !== "supabase" || !state.session) {
      state.liked = false;
      state.saved = false;
      state.userRating = 0;
      return;
    }

    const client = getClient();
    const userId = state.session.user.id;
    const postId = state.post.id;
    const [likeResult, saveResult, ratingResult] = await Promise.all([
      client.from("likes").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
      client.from("saved_posts").select("id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
      client.from("ratings").select("id, rating").eq("post_id", postId).eq("user_id", userId).maybeSingle()
    ]);

    [likeResult, saveResult, ratingResult].forEach((result) => {
      if (result.error) {
        throw result.error;
      }
    });

    state.liked = Boolean(likeResult.data);
    state.saved = Boolean(saveResult.data);
    state.userRating = Number(ratingResult.data?.rating || 0);
  }

  async function fetchSupabaseComments() {
    if (state.mode !== "supabase") {
      state.comments = [];
      return;
    }

    const client = getClient();
    const selectFields = state.session
      ? "id, post_id, user_id, body, created_at, updated_at, profiles(display_name, username)"
      : "id, post_id, user_id, body, created_at, updated_at";

    const { data, error } = await client
      .from("comments")
      .select(selectFields)
      .eq("post_id", state.post.id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      throw error;
    }

    state.comments = (data || []).map(normalizeSupabaseComment);
  }

  async function refreshSupabasePostCounts() {
    if (state.mode !== "supabase") {
      return;
    }

    const { data, error } = await getClient()
      .from("posts")
      .select("views_count, likes_count, saves_count, rating_count, average_rating, comments_count")
      .eq("id", state.post.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return;
    }

    state.post.views = data.views_count || 0;
    state.post.likes = data.likes_count || 0;
    state.post.saves = data.saves_count || 0;
    state.post.rating = Number(data.average_rating) || 0;
    state.post.ratingCount = data.rating_count || 0;
    state.post.commentsCount = data.comments_count || 0;
    renderMetrics(state.post);
    renderRatingSummary(state.post);
    elements.details.innerHTML = renderDetails(state.post);
  }

  function getVisitorId() {
    const key = "prompt_gallery_visitor_id";

    try {
      const existing = window.localStorage.getItem(key);

      if (existing) {
        return existing;
      }

      const visitorId = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `visitor_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem(key, visitorId);
      return visitorId;
    } catch (error) {
      return `visitor_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  }

  async function recordSupabaseView() {
    if (state.mode !== "supabase") {
      return;
    }

    const { error } = await getClient().from("views").insert({
      post_id: state.post.id,
      user_id: state.session?.user?.id || null,
      visitor_id: getVisitorId()
    });

    if (error && error.code !== "23505") {
      console.warn(error.message);
      return;
    }

    await refreshSupabasePostCounts();
  }

  function getSimilarPosts(post) {
    if (state.mode === "supabase" && state.recommendations.length) {
      return state.recommendations;
    }

    return demoPosts
      .filter((candidate) => candidate.id !== post.id)
      .map((candidate) => {
        const sharedTags = candidate.tags.filter((tag) => post.tags.includes(tag)).length;
        const categoryScore = candidate.category === post.category ? 4 : 0;
        const toolScore = candidate.tool === post.tool ? 1 : 0;
        const popularityScore = candidate.rating + candidate.likes / 1000;

        return {
          post: { ...candidate, source: "demo" },
          score: categoryScore + sharedTags * 2 + toolScore + popularityScore
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.post);
  }

  function renderPost(post) {
    document.title = `${post.title} - AI Prompt Gallery`;
    elements.page.hidden = false;
    elements.notFound.hidden = true;

    elements.image.src = post.imageUrl;
    elements.image.alt = post.title;
    elements.title.textContent = post.title;
    elements.description.textContent = post.description;
    elements.prompt.textContent = post.prompt;
    elements.negativePrompt.textContent = post.negativePrompt || "No negative prompt provided for this post.";
    elements.category.textContent = post.category;
    elements.tool.textContent = post.tool;
    elements.model.textContent = post.model;
    elements.aspectRatio.textContent = post.aspectRatio;
    elements.createdAt.textContent = formatDate(post.createdAt);
    elements.tags.innerHTML = post.tags.map((tag) => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join("");
    elements.details.innerHTML = renderDetails(post);
    elements.similar.innerHTML = getSimilarPosts(post).map(renderSimilarCard).join("");
    elements.sourceNote.textContent =
      state.mode === "supabase"
        ? "These values are loaded from Supabase and update as visitors interact."
        : "These values are local demo data. Open a Supabase post UUID to use real interactions.";

    renderMetrics(post);
    renderRatingSummary(post);
    renderActionButtons();
    renderRatingControl();
  }

  function renderMetrics(post) {
    elements.views.textContent = formatNumber(post.views);
    elements.likes.textContent = formatNumber(post.likes + state.likesOffset);
    elements.saves.textContent = formatNumber(post.saves + state.savesOffset);
    elements.rating.textContent = Number(post.rating || 0).toFixed(1);
    elements.commentsCount.textContent = formatNumber(post.commentsCount || 0);
  }

  function renderRatingSummary(post) {
    elements.ratingStars.innerHTML = renderStars(post.rating);
    elements.ratingSummary.textContent = `${Number(post.rating || 0).toFixed(1)} average from ${formatNumber(
      post.ratingCount || 0
    )} ${state.mode === "demo" ? "demo " : ""}ratings`;
  }

  function renderDetails(post) {
    const details = [
      ["AI tool", post.tool],
      ["Model", post.model],
      ["Category", post.category],
      ["Aspect ratio", post.aspectRatio],
      ["Views", formatNumber(post.views)],
      ["Published", formatDate(post.createdAt)]
    ];

    return details
      .map(
        ([label, value]) => `
          <div class="detail-item">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `
      )
      .join("");
  }

  function canManageComment(comment) {
    return Boolean(
      state.session &&
        (comment.userId === state.session.user.id || state.profile?.role === "admin")
    );
  }

  function renderComments(postComments) {
    if (!postComments.length) {
      return `
        <div class="empty-state">
          <p class="mb-0">${
            state.mode === "supabase"
              ? "No comments yet. Be the first to add a useful note."
              : "No demo comments yet. Supabase comments are available for database posts."
          }</p>
        </div>
      `;
    }

    return postComments
      .map((comment) => {
        const canManage = canManageComment(comment);
        const body = escapeHtml(comment.body || comment.text);
        const name = escapeHtml(comment.name);
        const createdAt = escapeHtml(comment.createdAt);

        return `
          <article class="comment-card" data-comment-id="${escapeHtml(comment.id)}">
            <div class="comment-card__header">
              <strong>${name}</strong>
              <time datetime="${createdAt}">${formatDate(comment.createdAt)}</time>
            </div>
            <p data-comment-body-text>${body}</p>
            ${
              canManage
                ? `
                  <form class="comment-edit-form" data-comment-edit-form hidden>
                    <label class="field">
                      <span>Edit comment</span>
                      <textarea class="textarea" name="body" maxlength="2000" required>${body}</textarea>
                    </label>
                    <div class="comment-edit-actions">
                      <button class="button button--primary button--sm" type="submit">Save edit</button>
                      <button class="button button--ghost button--sm" type="button" data-cancel-comment-edit>Cancel</button>
                    </div>
                  </form>
                  <div class="comment-card__actions">
                    <button class="comment-action" type="button" data-edit-comment>Edit</button>
                    <button class="comment-action" type="button" data-delete-comment>Delete</button>
                  </div>
                `
                : ""
            }
          </article>
        `;
      })
      .join("");
  }

  function renderSimilarCard(post) {
    return `
      <article class="similar-card">
        <a class="similar-card__image" href="${getPostUrl(post)}">
          <img src="${escapeHtml(post.imageUrl)}" alt="${escapeHtml(post.title)}" loading="lazy" />
        </a>
        <div class="similar-card__body">
          <div class="cluster">
            <span class="badge">${escapeHtml(post.category)}</span>
            <span class="badge badge--accent">${escapeHtml(post.tool)}</span>
          </div>
          <h3><a href="${getPostUrl(post)}">${escapeHtml(post.title)}</a></h3>
          <p>${formatNumber(post.likes)} likes - ${Number(post.rating || 0).toFixed(1)} rating</p>
        </div>
      </article>
    `;
  }

  function renderActionButtons() {
    elements.likeButton.classList.toggle("button--primary", state.liked);
    elements.likeButton.classList.toggle("button--ghost", !state.liked);
    elements.likeLabel.textContent = state.liked ? "Liked" : "Like";

    elements.saveButton.classList.toggle("button--secondary", state.saved);
    elements.saveButton.classList.toggle("button--ghost", !state.saved);
    elements.saveLabel.textContent = state.saved ? "Saved" : "Save";
  }

  function renderRatingControl() {
    const rating = state.mode === "demo" ? state.demoRating : state.userRating;
    elements.ratingButtons.forEach((button) => {
      const value = Number(button.dataset.ratePost);
      button.classList.toggle("is-active", value <= rating);
      button.setAttribute("aria-pressed", value <= rating ? "true" : "false");
    });

    if (state.mode === "supabase") {
      elements.ratingHelp.textContent = state.session
        ? rating
          ? `You rated this ${rating} out of 5. Click another star to update it.`
          : "Choose 1 to 5 stars. You can update your rating later."
        : "Sign in to rate this Supabase post.";
      return;
    }

    elements.ratingHelp.textContent = rating
      ? `Demo rating set to ${rating} out of 5.`
      : "Demo rating only. Supabase ratings work on database posts.";
  }

  function renderCommentTools() {
    if (state.mode !== "supabase") {
      elements.commentForm.hidden = true;
      elements.commentAuthNote.hidden = true;
      elements.commentStatus.textContent = "";
      elements.comments.innerHTML = renderComments(demoComments[state.post.id] || []);
      return;
    }

    elements.commentForm.hidden = !state.session;
    elements.commentAuthNote.hidden = Boolean(state.session);
    elements.comments.innerHTML = renderComments(state.comments);
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

  function showCommentStatus(message, type) {
    elements.commentStatus.textContent = message;
    elements.commentStatus.classList.toggle("is-error", type === "error");
    elements.commentStatus.classList.toggle("is-success", type === "success");
  }

  async function copyPrompt() {
    if (!state.post) {
      return;
    }

    try {
      await navigator.clipboard.writeText(state.post.prompt);
      showToast("Prompt copied.");
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = state.post.prompt;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      showToast("Prompt copied.");
    }
  }

  async function requireSignedIn(action) {
    if (state.session) {
      return state.session;
    }

    state.session = await window.PromptGalleryAuth.loadSession();

    if (state.session) {
      return state.session;
    }

    showToast(`Sign in to ${action}.`);
    window.setTimeout(function () {
      window.location.href = getAuthRedirectUrl();
    }, 700);
    return null;
  }

  function setBusy(isBusy) {
    state.isBusy = isBusy;
    elements.likeButton.disabled = isBusy;
    elements.saveButton.disabled = isBusy;
    elements.ratingButtons.forEach((button) => {
      button.disabled = isBusy;
    });
  }

  async function toggleDemoLike() {
    state.liked = !state.liked;
    state.likesOffset = state.liked ? 1 : 0;
    renderMetrics(state.post);
    renderActionButtons();
    showToast(state.liked ? "Liked in demo mode." : "Like removed.");
  }

  async function toggleSupabaseLike() {
    const session = await requireSignedIn("like posts");

    if (!session || state.isBusy) {
      return;
    }

    setBusy(true);

    try {
      if (state.liked) {
        const { error } = await getClient()
          .from("likes")
          .delete()
          .eq("post_id", state.post.id)
          .eq("user_id", session.user.id);

        if (error) {
          throw error;
        }

        state.liked = false;
      } else {
        const { error } = await getClient().from("likes").insert({
          post_id: state.post.id,
          user_id: session.user.id
        });

        if (error && error.code !== "23505") {
          throw error;
        }

        state.liked = true;
      }

      await refreshSupabasePostCounts();
      renderActionButtons();
      showToast(state.liked ? "Post liked." : "Like removed.");
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleLike() {
    if (state.mode === "supabase") {
      toggleSupabaseLike();
      return;
    }

    toggleDemoLike();
  }

  async function toggleDemoSave() {
    state.saved = !state.saved;
    state.savesOffset = state.saved ? 1 : 0;
    renderMetrics(state.post);
    renderActionButtons();
    showToast(state.saved ? "Saved in demo mode." : "Save removed.");
  }

  async function toggleSupabaseSave() {
    const session = await requireSignedIn("save posts");

    if (!session || state.isBusy) {
      return;
    }

    setBusy(true);

    try {
      if (state.saved) {
        const { error } = await getClient()
          .from("saved_posts")
          .delete()
          .eq("post_id", state.post.id)
          .eq("user_id", session.user.id);

        if (error) {
          throw error;
        }

        state.saved = false;
      } else {
        const { error } = await getClient().from("saved_posts").insert({
          post_id: state.post.id,
          user_id: session.user.id
        });

        if (error && error.code !== "23505") {
          throw error;
        }

        state.saved = true;
      }

      await refreshSupabasePostCounts();
      renderActionButtons();
      showToast(state.saved ? "Post saved." : "Save removed.");
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleSave() {
    if (state.mode === "supabase") {
      toggleSupabaseSave();
      return;
    }

    toggleDemoSave();
  }

  async function rateDemoPost(value) {
    state.demoRating = value;
    renderRatingControl();
    showToast(`Demo rating set to ${value} stars.`);
  }

  async function rateSupabasePost(value) {
    const session = await requireSignedIn("rate posts");

    if (!session || state.isBusy) {
      return;
    }

    setBusy(true);

    try {
      const { error } = await getClient().from("ratings").upsert(
        {
          post_id: state.post.id,
          user_id: session.user.id,
          rating: value
        },
        { onConflict: "post_id,user_id" }
      );

      if (error) {
        throw error;
      }

      state.userRating = value;
      await refreshSupabasePostCounts();
      renderRatingControl();
      showToast(`Rating saved: ${value} stars.`);
    } catch (error) {
      showToast(error.message);
    } finally {
      setBusy(false);
    }
  }

  function handleRatingClick(event) {
    const button = event.target.closest("[data-rate-post]");

    if (!button) {
      return;
    }

    const value = Number(button.dataset.ratePost);

    if (state.mode === "supabase") {
      rateSupabasePost(value);
      return;
    }

    rateDemoPost(value);
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();

    const session = await requireSignedIn("comment");

    if (!session) {
      return;
    }

    const body = elements.commentBody.value.trim();

    if (body.length < 2) {
      showCommentStatus("Write at least 2 characters.", "error");
      return;
    }

    elements.commentForm.querySelectorAll("button, textarea").forEach((field) => {
      field.disabled = true;
    });

    try {
      const { error } = await getClient().from("comments").insert({
        post_id: state.post.id,
        user_id: session.user.id,
        body,
        is_approved: true
      });

      if (error) {
        throw error;
      }

      elements.commentBody.value = "";
      showCommentStatus("Comment posted.", "success");
      await Promise.all([fetchSupabaseComments(), refreshSupabasePostCounts()]);
      renderCommentTools();
    } catch (error) {
      showCommentStatus(error.message, "error");
    } finally {
      elements.commentForm.querySelectorAll("button, textarea").forEach((field) => {
        field.disabled = false;
      });
    }
  }

  function getCommentCard(target) {
    return target.closest("[data-comment-id]");
  }

  function showEditForm(card, show) {
    const text = card.querySelector("[data-comment-body-text]");
    const form = card.querySelector("[data-comment-edit-form]");
    const actions = card.querySelector(".comment-card__actions");

    if (!form) {
      return;
    }

    text.hidden = show;
    form.hidden = !show;

    if (actions) {
      actions.hidden = show;
    }

    if (show) {
      form.body.focus();
    }
  }

  async function handleCommentListClick(event) {
    const editButton = event.target.closest("[data-edit-comment]");
    const cancelButton = event.target.closest("[data-cancel-comment-edit]");
    const deleteButton = event.target.closest("[data-delete-comment]");

    if (editButton) {
      showEditForm(getCommentCard(editButton), true);
      return;
    }

    if (cancelButton) {
      showEditForm(getCommentCard(cancelButton), false);
      return;
    }

    if (!deleteButton) {
      return;
    }

    const card = getCommentCard(deleteButton);
    const commentId = card?.dataset.commentId;

    if (!commentId || !window.confirm("Delete this comment?")) {
      return;
    }

    deleteButton.disabled = true;

    try {
      const { error } = await getClient().from("comments").delete().eq("id", commentId);

      if (error) {
        throw error;
      }

      showCommentStatus("Comment deleted.", "success");
      await Promise.all([fetchSupabaseComments(), refreshSupabasePostCounts()]);
      renderCommentTools();
    } catch (error) {
      showCommentStatus(error.message, "error");
      deleteButton.disabled = false;
    }
  }

  async function handleCommentEditSubmit(event) {
    const form = event.target.closest("[data-comment-edit-form]");

    if (!form) {
      return;
    }

    event.preventDefault();

    const card = getCommentCard(form);
    const commentId = card?.dataset.commentId;
    const body = form.body.value.trim();

    if (!commentId) {
      return;
    }

    if (body.length < 2) {
      showCommentStatus("Write at least 2 characters.", "error");
      return;
    }

    form.querySelectorAll("button, textarea").forEach((field) => {
      field.disabled = true;
    });

    try {
      const { error } = await getClient().from("comments").update({ body }).eq("id", commentId);

      if (error) {
        throw error;
      }

      showCommentStatus("Comment updated.", "success");
      await fetchSupabaseComments();
      renderCommentTools();
    } catch (error) {
      showCommentStatus(error.message, "error");
      form.querySelectorAll("button, textarea").forEach((field) => {
        field.disabled = false;
      });
    }
  }

  function renderNotFound() {
    elements.page.hidden = true;
    elements.notFound.hidden = false;
  }

  function bindEvents() {
    elements.copyButtons.forEach((button) => {
      button.addEventListener("click", copyPrompt);
    });

    elements.likeButton.addEventListener("click", toggleLike);
    elements.saveButton.addEventListener("click", toggleSave);
    elements.ratingControl.addEventListener("click", handleRatingClick);
    elements.commentForm.addEventListener("submit", handleCommentSubmit);
    elements.comments.addEventListener("click", handleCommentListClick);
    elements.comments.addEventListener("submit", handleCommentEditSubmit);
  }

  function cacheElements() {
    elements.page = document.querySelector("[data-post-page]");
    elements.notFound = document.querySelector("[data-not-found]");
    elements.image = document.querySelector("[data-post-image]");
    elements.title = document.querySelector("[data-post-title]");
    elements.description = document.querySelector("[data-post-description]");
    elements.prompt = document.querySelector("[data-post-prompt]");
    elements.negativePrompt = document.querySelector("[data-negative-prompt]");
    elements.category = document.querySelector("[data-post-category]");
    elements.tool = document.querySelector("[data-post-tool]");
    elements.model = document.querySelector("[data-post-model]");
    elements.aspectRatio = document.querySelector("[data-post-aspect]");
    elements.createdAt = document.querySelector("[data-post-created]");
    elements.views = document.querySelector("[data-post-views]");
    elements.likes = document.querySelector("[data-post-likes]");
    elements.saves = document.querySelector("[data-post-saves]");
    elements.rating = document.querySelector("[data-post-rating]");
    elements.commentsCount = document.querySelector("[data-post-comments-count]");
    elements.ratingStars = document.querySelector("[data-rating-stars]");
    elements.ratingSummary = document.querySelector("[data-rating-summary]");
    elements.ratingControl = document.querySelector("[data-rating-control]");
    elements.ratingButtons = document.querySelectorAll("[data-rate-post]");
    elements.ratingHelp = document.querySelector("[data-rating-help]");
    elements.tags = document.querySelector("[data-post-tags]");
    elements.details = document.querySelector("[data-post-details]");
    elements.sourceNote = document.querySelector("[data-post-source-note]");
    elements.comments = document.querySelector("[data-comments-preview]");
    elements.commentForm = document.querySelector("[data-comment-form]");
    elements.commentBody = document.querySelector("[data-comment-body]");
    elements.commentAuthNote = document.querySelector("[data-comment-auth-note]");
    elements.commentStatus = document.querySelector("[data-comment-status]");
    elements.similar = document.querySelector("[data-similar-posts]");
    elements.copyButtons = document.querySelectorAll("[data-copy-prompt]");
    elements.likeButton = document.querySelector("[data-like-post]");
    elements.likeLabel = document.querySelector("[data-like-label]");
    elements.saveButton = document.querySelector("[data-save-post]");
    elements.saveLabel = document.querySelector("[data-save-label]");
  }

  async function initialize() {
    cacheElements();

    if (!elements.page) {
      return;
    }

    bindEvents();

    try {
      if (shouldUseSupabase()) {
        state.mode = "supabase";
        await loadSessionAndProfile();
        state.post = await fetchSupabasePost();

        if (!state.post) {
          renderNotFound();
          return;
        }

        await Promise.all([fetchUserPostState(), fetchSupabaseComments(), fetchSupabaseRecommendations()]);
        renderPost(state.post);
        renderCommentTools();
        await recordSupabaseView();
        return;
      }

      state.mode = "demo";
      state.post = getDemoPost();

      if (!state.post) {
        renderNotFound();
        return;
      }

      renderPost(state.post);
      renderCommentTools();
    } catch (error) {
      console.error(error);
      renderNotFound();
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
