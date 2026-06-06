const feed = document.querySelector("#feed");
const emptyState = document.querySelector("#emptyState");
const template = document.querySelector("#postTemplate");

const GITHUB_OWNER = "recibodigitalapp-pixel";
const GITHUB_REPO = "mf";
const GITHUB_BRANCH = "main";
const IMAGE_EXTENSIONS = /\.(avif|gif|jpeg|jpg|png|webp)$/i;
const VIDEO_EXTENSIONS = /\.(m4v|mov|mp4|webm)$/i;
const AD_INTERVAL = 3;

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

async function getFileUpdatedAt(folder, fileName) {
  const path = encodeURIComponent(`${folder}/${fileName}`);
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?sha=${GITHUB_BRANCH}&path=${path}&per_page=1`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github+json" }
    });

    if (!response.ok) return "";

    const commits = await response.json();
    return commits?.[0]?.commit?.committer?.date || commits?.[0]?.commit?.author?.date || "";
  } catch {
    return "";
  }
}

async function loadFromGitHubFolder(folder, kind = "media") {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${folder}?ref=${GITHUB_BRANCH}`;
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" }
  });

  if (!response.ok) return [];

  const files = await response.json();
  if (!Array.isArray(files)) return [];

  const mediaFiles = files.filter((file) => file.type === "file" && isMediaFile(file.name));
  const filesWithDates = await Promise.all(
    mediaFiles.map(async (file) => ({
      ...file,
      updatedAt: await getFileUpdatedAt(folder, file.name)
    }))
  );

  return filesWithDates
    .sort((a, b) => {
      const dateDiff = new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      if (dateDiff) return dateDiff;
      return b.name.localeCompare(a.name, "pt-BR", { numeric: true });
    })
    .map((file, index) => {
      const type = inferType(file.name);
      return {
        src: file.download_url || `media/${file.name}`,
        type,
        kind,
        author: "@meu-feed",
        caption: cleanCaption(file.name, index, type),
        likes: 0
      };
    });
}

async function loadFromLocalDirectory(folder = "media", kind = "media") {
  try {
    const response = await fetch(`${folder}/`);
    if (!response.ok) return [];

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const names = [...doc.querySelectorAll("a")]
      .map((link) => decodeURIComponent(link.getAttribute("href") || ""))
      .map((href) => href.split("/").filter(Boolean).pop() || "")
      .filter((name) => isMediaFile(name));

    return names
      .sort((a, b) => b.localeCompare(a, "pt-BR", { numeric: true }))
      .map((name, index) => {
        const type = inferType(name);
        return {
          src: `${folder}/${name}`,
          type,
          kind,
          author: "@meu-feed",
          caption: cleanCaption(name, index, type),
          likes: 0
        };
      });
  } catch {
    return [];
  }
}

function interleaveAds(mediaItems, adItems) {
  if (!adItems.length) return mediaItems;

  const mixedItems = [];
  let adIndex = 0;

  mediaItems.forEach((item, index) => {
    mixedItems.push(item);

    if ((index + 1) % AD_INTERVAL === 0) {
      mixedItems.push(adItems[adIndex % adItems.length]);
      adIndex += 1;
    }
  });

  return mixedItems;
}

async function loadItems() {
  if (isGitHubPages()) {
    const [githubItems, githubAds] = await Promise.all([
      loadFromGitHubFolder("media", "media"),
      loadFromGitHubFolder("ads", "ad")
    ]);

    if (githubItems.length) return interleaveAds(githubItems, githubAds);
  }

  const configuredItems = Array.isArray(window.FEED_ITEMS) ? window.FEED_ITEMS : [];
  if (configuredItems.length) return configuredItems;

  const [localItems, localAds] = await Promise.all([
    loadFromLocalDirectory("media", "media"),
    loadFromLocalDirectory("ads", "ad")
  ]);

  return interleaveAds(localItems, localAds);
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
  const actions = article.querySelector(".actions");
  const playButton = article.querySelector(".play-button");
  const soundButton = article.querySelector(".sound-button");
  const media = createMedia(post);

  article.id = `post-${index + 1}`;
  article.dataset.index = String(index);
  mediaStage.append(media);
  postCopy.remove();
  actions.remove();

  if (post.type === "video") {
    media.controls = true;
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
