const feed = document.querySelector("#feed");
const emptyState = document.querySelector("#emptyState");
const template = document.querySelector("#postTemplate");

const GITHUB_OWNER = "recibodigitalapp-pixel";
const GITHUB_REPO = "mf";
const GITHUB_BRANCH = "main";
const IMAGE_EXTENSIONS = /\.(avif|gif|jpeg|jpg|png|webp)$/i;
const VIDEO_EXTENSIONS = /\.(m4v|mov|mp4|webm)$/i;

let posts = [];
let activeIndex = 0;

function isGitHubPages() {
  return window.location.hostname.endsWith("github.io");
}

function isMediaFile(name) {
  return IMAGE_EXTENSIONS.test(name) || VIDEO_EXTENSIONS.test(name);
}

function inferType(src, explicitType) {
  if (explicitType) return explicitType;
  return VIDEO_EXTENSIONS.test(src) ? "video" : "image";
}

function cleanCaption(fileName, index, type = "image") {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const readable = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const fallback = `${type === "video" ? "Video" : "Foto"} ${index + 1}`;

  if (!readable || readable.length > 44) return fallback;
  return readable;
}

function normalizeItem(item, index) {
  if (typeof item === "string") {
    return {
      src: item,
      type: inferType(item),
      author: "@meu-feed",
      caption: cleanCaption(item.split("/").pop() || "", index, inferType(item)),
      likes: 0
    };
  }

  const type = inferType(item.src || "", item.type);
  return {
    src: item.src,
    type,
    author: item.author || "@meu-feed",
    caption: item.caption || cleanCaption(item.src?.split("/").pop() || "", index, type),
    likes: Number(item.likes || 0)
  };
}

async function loadFromGitHubMediaFolder() {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/media?ref=${GITHUB_BRANCH}`;
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" }
  });

  if (!response.ok) return [];

  const files = await response.json();
  if (!Array.isArray(files)) return [];

  return files
    .filter((file) => file.type === "file" && isMediaFile(file.name))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true }))
    .map((file, index) => {
      const type = inferType(file.name);
      return {
        src: file.download_url || `media/${file.name}`,
        type,
        author: "@meu-feed",
        caption: cleanCaption(file.name, index, type),
        likes: 0
      };
    });
}

async function loadFromLocalDirectory() {
  try {
    const response = await fetch("media/");
    if (!response.ok) return [];

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const names = [...doc.querySelectorAll("a")]
      .map((link) => decodeURIComponent(link.getAttribute("href") || ""))
      .map((href) => href.split("/").filter(Boolean).pop() || "")
      .filter((name) => isMediaFile(name));

    return names
      .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }))
      .map((name, index) => {
        const type = inferType(name);
        return {
          src: `media/${name}`,
          type,
          author: "@meu-feed",
          caption: cleanCaption(name, index, type),
          likes: 0
        };
      });
  } catch {
    return [];
  }
}

async function loadItems() {
  if (isGitHubPages()) {
    const githubItems = await loadFromGitHubMediaFolder();
    if (githubItems.length) return githubItems;
  }

  const configuredItems = Array.isArray(window.FEED_ITEMS) ? window.FEED_ITEMS : [];
  if (configuredItems.length) return configuredItems;

  return loadFromLocalDirectory();
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
  const postCopy = article.querySelector(".post-copy");
  const playButton = article.querySelector(".play-button");
  const soundButton = article.querySelector(".sound-button");
  const likeButton = article.querySelector(".like-button");
  const shareButton = article.querySelector(".share-button");
  const likeCount = article.querySelector(".like-count");
  const media = createMedia(post);

  article.id = `post-${index + 1}`;
  article.dataset.index = String(index);
  mediaStage.append(media);
  postCopy.remove();
  likeCount.textContent = post.likes ? String(post.likes) : "";

  if (post.type === "video") {
    playButton.addEventListener("click", () => {
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
      media.muted = !media.muted;
      soundButton.textContent = media.muted ? "S" : "M";
    });
  } else {
    playButton.remove();
    soundButton.remove();
  }

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

function render() {
  feed.innerHTML = "";
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

async function init() {
  const items = await loadItems();
  posts = items.filter((item) => item && (typeof item === "string" || item.src)).map(normalizeItem);
  render();
}

init();
