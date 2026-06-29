import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const VIDEO_EXTENSIONS = new Set([".m4v", ".mov", ".mp4", ".webm"]);

function getUpdatedAt(relativePath) {
  try {
    const output = execFileSync("git", ["log", "-1", "--format=%ct", "--", relativePath], {
      encoding: "utf8"
    }).trim();

    return Number(output) || 0;
  } catch {
    return 0;
  }
}

function getType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return VIDEO_EXTENSIONS.has(extension) ? "video" : "image";
}

function isMediaFile(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension);
}

function listMedia(folder, kind) {
  if (!existsSync(folder)) return [];

  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isMediaFile(entry.name))
    .map((entry) => {
      const src = `${folder}/${entry.name}`.replaceAll("\\", "/");

      return {
        src,
        type: getType(entry.name),
        kind,
        updatedAt: getUpdatedAt(src)
      };
    })
    .sort((a, b) => {
      const dateDiff = b.updatedAt - a.updatedAt;
      if (dateDiff) return dateDiff;
      return b.src.localeCompare(a.src, "pt-BR", { numeric: true });
    });
}

const feedItems = listMedia("media", "media");
const adItems = listMedia("ads", "ad");
const output = `// Gerado automaticamente.
// Para adicionar midias, envie arquivos para a pasta media/ no GitHub.
window.FEED_ITEMS = ${JSON.stringify(feedItems, null, 2)};
window.AD_ITEMS = ${JSON.stringify(adItems, null, 2)};
`;

writeFileSync("media.js", output);
