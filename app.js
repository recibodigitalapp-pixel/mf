const feed = document.querySelector("#feed");
const emptyState = document.querySelector("#emptyState");
const template = document.querySelector("#postTemplate");
const items = Array.isArray(window.FEED_ITEMS) ? window.FEED_ITEMS : [];

let posts = [];
let activeIndex = 0;

function inferType(src, explicitType) {
  if (explicitType) return explicitType;
  return /\.(mp4|webm|mov|m4v)$/i.test(src) ? "video" : "image";
}

function normalizeItem(item, index) {
  if (typeof item === "string") {
    return {
      src: item,
      type: inferType(item),
      author: "@meu-feed",
      caption: `Post ${index + 1}`,
      likes: 0
    };
  }

  return {
    src: item.src,
    type: inferType(item.src || "", item.type),
    author: item.author || "@meu-feed",
    caption: item.caption || "",
    likes: Number(item.likes || 0)
  };
}

function pauseOtherVideos(currentVideo) {
  document.querySelectorAll("video").forEach((video) => {
    if (video !== currentVideo) video.pause();
  });
}

function createMedia(post) {
  if (post.type === "video") {
    const video = document.createElement("video");
    video.src = post.src;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    return video;
  }

  const image = document.createElement("img");
  image.src = post.src;
  image.alt = post.caption || "Imagem do feed";
  image.loading = "eager";
  return image;
}

function renderPost(post, index) {
  const fragment = template.content.cloneNode(true);
  const article = fragment.querySelector(".post");
  const mediaStage = article.querySelector(".media-stage");
  const author = article.querySelector(".author");
  const caption = article.querySelector(".caption");
  const playButton = article.querySelector(".play-button");
  const soundButton = article.querySelector(".sound-button");
  const likeButton = article.querySelector(".like-button");
  const shareButton = article.querySelector(".share-button");
  const likeCount = article.querySelector(".like-count");
  const media = createMedia(post);

  article.dataset.index = String(index);
  mediaStage.append(media);
  author.textContent = post.author;
  caption.textContent = post.caption;
  likeCount.textContent = post.likes ? String(post.likes) : "";

  if (post.type !== "video") {
    playButton.remove();
    soundButton.remove();
  }

  playButton.addEventListener("click", () => {
    if (!(media instanceof HTMLVideoElement)) return;

    if (media.paused) {
      pauseOtherVideos(media);
      media.play().catch(() => undefined);
      playButton.textContent = "||";
    } else {
      media.pause();
      playButton.textContent = ">";
    }
  });

  soundButton.addEventListener("click", () => {
    if (!(media instanceof HTMLVideoElement)) return;
    media.muted = !media.muted;
    soundButton.textContent = media.muted ? "S" : "M";
  });

  likeButton.addEventListener("click", () => {
    likeButton.classList.toggle("active");
    post.likes += likeButton.classList.contains("active") ? 1 : -1;
    likeCount.textContent = post.likes > 0 ? String(post.likes) : "";
  });

  shareButton.addEventListener("click", async () => {
    const url = `${window.location.href.split("#")[0]}#post-${index + 1}`;
    await navigator.clipboard?.writeText(url).catch(() => undefined);
    shareButton.textContent = "OK";
    window.setTimeout(() => {
      shareButton.textContent = "↗";
    }, 1400);
  });

  return fragment;
}

function observePosts() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.7) return;
        const article = entry.target;
        activeIndex = Number(article.dataset.index || 0);
        const video = article.querySelector("video");
        if (video) {
          pauseOtherVideos(video);
          video.play().catch(() => undefined);
        }
      });
    },
    { threshold: [0.7] }
  );

  document.querySelectorAll(".post").forEach((article) => observer.observe(article));
}

function bindKeyboard() {
  window.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;

    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(posts.length - 1, activeIndex + direction));
    document.querySelector(`[data-index="${nextIndex}"]`)?.scrollIntoView({
      block: "start",
      behavior: "smooth"
    });
  });
}

function scrollToHash() {
  const match = window.location.hash.match(/^#post-(\d+)$/);
  if (!match) return;

  const index = Number(match[1]) - 1;
  document.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "start" });
}

function init() {
  posts = items.filter((item) => item && (typeof item === "string" || item.src)).map(normalizeItem);
  feed.hidden = posts.length === 0;
  emptyState.hidden = posts.length > 0;
  feed.style.display = posts.length === 0 ? "none" : "";
  emptyState.style.display = posts.length > 0 ? "none" : "";

  posts.forEach((post, index) => {
    feed.append(renderPost(post, index));
  });

  observePosts();
  bindKeyboard();
  scrollToHash();
}

init();
