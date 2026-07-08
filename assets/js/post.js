// Phase 4 post details behavior.
// This page still uses temporary demo data. Supabase will replace it later.
(function () {
  const demo = window.PromptGalleryDemo || { posts: [], comments: {} };
  const posts = demo.posts;
  const comments = demo.comments;
  const state = {
    liked: false,
    saved: false,
    likesOffset: 0,
    savesOffset: 0
  };

  const elements = {};

  function formatNumber(value) {
    return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
  }

  function getPostId() {
    return Number(new URLSearchParams(window.location.search).get("id")) || posts[0]?.id;
  }

  function getPostUrl(post) {
    return `./post.html?id=${post.id}`;
  }

  function getCurrentPost() {
    const id = getPostId();
    return posts.find((post) => post.id === id);
  }

  function getSimilarPosts(post) {
    return posts
      .filter((candidate) => candidate.id !== post.id)
      .map((candidate) => {
        const sharedTags = candidate.tags.filter((tag) => post.tags.includes(tag)).length;
        const categoryScore = candidate.category === post.category ? 4 : 0;
        const toolScore = candidate.tool === post.tool ? 1 : 0;
        const popularityScore = candidate.rating + candidate.likes / 1000;

        return {
          post: candidate,
          score: categoryScore + sharedTags * 2 + toolScore + popularityScore
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.post);
  }

  function renderStars(rating) {
    const fullStars = Math.round(rating);
    return Array.from({ length: 5 }, function (_, index) {
      return index < fullStars ? "&#9733;" : "&#9734;";
    }).join("");
  }

  function renderPost(post) {
    const postComments = comments[post.id] || [];

    document.title = `${post.title} - AI Prompt Gallery`;
    elements.page.hidden = false;
    elements.notFound.hidden = true;

    elements.image.src = post.imageUrl;
    elements.image.alt = post.title;
    elements.title.textContent = post.title;
    elements.description.textContent = post.description;
    elements.prompt.textContent = post.prompt;
    elements.negativePrompt.textContent = post.negativePrompt || "No negative prompt provided for this demo post.";
    elements.category.textContent = post.category;
    elements.tool.textContent = post.tool;
    elements.model.textContent = post.model;
    elements.aspectRatio.textContent = post.aspectRatio;
    elements.createdAt.textContent = formatDate(post.createdAt);
    elements.views.textContent = formatNumber(post.views);
    elements.likes.textContent = formatNumber(post.likes);
    elements.saves.textContent = formatNumber(post.saves);
    elements.rating.textContent = post.rating.toFixed(1);
    elements.commentsCount.textContent = postComments.length;
    elements.ratingStars.innerHTML = renderStars(post.rating);
    elements.ratingSummary.textContent = `${post.rating.toFixed(1)} average from ${post.ratingCount} demo ratings`;
    elements.tags.innerHTML = post.tags.map((tag) => `<span class="tag-pill">#${tag}</span>`).join("");
    elements.details.innerHTML = renderDetails(post);
    elements.comments.innerHTML = renderComments(postComments);
    elements.similar.innerHTML = getSimilarPosts(post).map(renderSimilarCard).join("");
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
            <span>${label}</span>
            <strong>${value}</strong>
          </div>
        `
      )
      .join("");
  }

  function renderComments(postComments) {
    if (!postComments.length) {
      return `
        <div class="empty-state">
          <p class="mb-0">No demo comments yet. The real comment system arrives with Supabase.</p>
        </div>
      `;
    }

    return postComments
      .slice(0, 3)
      .map(
        (comment) => `
          <article class="comment-card">
            <div class="comment-card__header">
              <strong>${comment.name}</strong>
              <time datetime="${comment.createdAt}">${formatDate(comment.createdAt)}</time>
            </div>
            <p>${comment.text}</p>
          </article>
        `
      )
      .join("");
  }

  function renderSimilarCard(post) {
    return `
      <article class="similar-card">
        <a class="similar-card__image" href="${getPostUrl(post)}">
          <img src="${post.imageUrl}" alt="${post.title}" loading="lazy" />
        </a>
        <div class="similar-card__body">
          <div class="cluster">
            <span class="badge">${post.category}</span>
            <span class="badge badge--accent">${post.tool}</span>
          </div>
          <h3><a href="${getPostUrl(post)}">${post.title}</a></h3>
          <p>${formatNumber(post.likes)} likes - ${post.rating.toFixed(1)} rating</p>
        </div>
      </article>
    `;
  }

  function formatDate(dateString) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(dateString));
  }

  async function copyPrompt() {
    const post = getCurrentPost();

    if (!post) {
      return;
    }

    try {
      await navigator.clipboard.writeText(post.prompt);
      showToast("Prompt copied.");
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = post.prompt;
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

  function toggleLike() {
    const post = getCurrentPost();

    state.liked = !state.liked;
    state.likesOffset = state.liked ? 1 : 0;
    elements.likeButton.classList.toggle("button--primary", state.liked);
    elements.likeButton.classList.toggle("button--ghost", !state.liked);
    elements.likes.textContent = formatNumber(post.likes + state.likesOffset);
    showToast(state.liked ? "Liked in demo mode." : "Like removed.");
  }

  function toggleSave() {
    const post = getCurrentPost();

    state.saved = !state.saved;
    state.savesOffset = state.saved ? 1 : 0;
    elements.saveButton.classList.toggle("button--secondary", state.saved);
    elements.saveButton.classList.toggle("button--ghost", !state.saved);
    elements.saves.textContent = formatNumber(post.saves + state.savesOffset);
    showToast(state.saved ? "Saved in demo mode." : "Save removed.");
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
    elements.tags = document.querySelector("[data-post-tags]");
    elements.details = document.querySelector("[data-post-details]");
    elements.comments = document.querySelector("[data-comments-preview]");
    elements.similar = document.querySelector("[data-similar-posts]");
    elements.copyButtons = document.querySelectorAll("[data-copy-prompt]");
    elements.likeButton = document.querySelector("[data-like-post]");
    elements.saveButton = document.querySelector("[data-save-post]");
  }

  document.addEventListener("DOMContentLoaded", function () {
    cacheElements();

    if (!elements.page) {
      return;
    }

    const post = getCurrentPost();

    if (!post) {
      renderNotFound();
      return;
    }

    renderPost(post);
    bindEvents();
  });
})();
