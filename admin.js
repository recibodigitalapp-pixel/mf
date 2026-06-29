const OWNER = "recibodigitalapp-pixel";
const REPO = "mf";
const BRANCH = "main";
const TOKEN_STORAGE_KEY = "mf-github-upload-token";
const ACCEPTED_EXTENSIONS = new Set(["avif", "gif", "jpeg", "jpg", "png", "webp", "m4v", "mov", "mp4", "webm"]);
const RECOMMENDED_MAX_SIZE = 25 * 1024 * 1024;

const form = document.querySelector("#uploadForm");
const tokenInput = document.querySelector("#tokenInput");
const rememberToken = document.querySelector("#rememberToken");
const folderSelect = document.querySelector("#folderSelect");
const dropZone = document.querySelector("#dropZone");
const fileInput = document.querySelector("#fileInput");
const fileList = document.querySelector("#fileList");
const uploadButton = document.querySelector("#uploadButton");
const statusMessage = document.querySelector("#statusMessage");

let selectedFiles = [];

const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
if (savedToken) {
  tokenInput.value = savedToken;
  rememberToken.checked = true;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getExtension(fileName) {
  return (fileName.split(".").pop() || "").toLowerCase();
}

function isAcceptedFile(file) {
  return ACCEPTED_EXTENSIONS.has(getExtension(file.name));
}

function setStatus(message, isHtml = false) {
  if (isHtml) {
    statusMessage.innerHTML = message;
  } else {
    statusMessage.textContent = message;
  }
}

function updateButtonState() {
  uploadButton.disabled = !tokenInput.value.trim() || selectedFiles.length === 0;
}

function renderFileList() {
  fileList.innerHTML = "";

  selectedFiles.forEach((file) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const meta = document.createElement("span");
    const warning = file.size > RECOMMENDED_MAX_SIZE ? " - arquivo grande" : "";

    name.className = "file-name";
    meta.className = "file-meta";
    name.textContent = file.name;
    meta.textContent = `${formatBytes(file.size)}${warning}`;

    item.append(name, meta);
    fileList.append(item);
  });
}

function setSelectedFiles(files) {
  selectedFiles = [...files].filter(isAcceptedFile);
  renderFileList();
  updateButtonState();

  if (!selectedFiles.length) {
    setStatus("Escolha pelo menos uma imagem ou video aceito.");
  } else {
    setStatus(`${selectedFiles.length} arquivo(s) pronto(s) para envio.`);
  }
}

function sanitizeBaseName(fileName) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const normalized = withoutExtension
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return normalized || "midia";
}

function createRemoteName(file, index) {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
    "-",
    String(now.getMilliseconds()).padStart(3, "0"),
    "-",
    String(index + 1).padStart(2, "0")
  ].join("");

  return `${stamp}-${sanitizeBaseName(file.name)}.${getExtension(file.name)}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

function setItemStatus(item, text) {
  const meta = item.querySelector(".file-meta");
  meta.textContent = text;
}

async function uploadFile({ file, folder, token, index }) {
  const remoteName = createRemoteName(file, index);
  const path = `${folder}/${remoteName}`;
  const content = await fileToBase64(file);
  const response = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(folder)}/${encodeURIComponent(remoteName)}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({
        message: `Add ${path}`,
        content,
        branch: BRANCH
      })
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Erro ${response.status} ao enviar ${file.name}`);
  }

  return data;
}

dropZone.addEventListener("click", () => fileInput.click());

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");
  setSelectedFiles(event.dataTransfer.files);
});

fileInput.addEventListener("change", () => {
  setSelectedFiles(fileInput.files);
});

tokenInput.addEventListener("input", updateButtonState);

rememberToken.addEventListener("change", () => {
  if (!rememberToken.checked) localStorage.removeItem(TOKEN_STORAGE_KEY);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = tokenInput.value.trim();
  const folder = folderSelect.value;
  if (!token || selectedFiles.length === 0) return;

  if (rememberToken.checked) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  uploadButton.disabled = true;
  setStatus("Enviando arquivos para o GitHub...");

  let uploaded = 0;
  const items = [...fileList.querySelectorAll("li")];

  for (let index = 0; index < selectedFiles.length; index += 1) {
    const file = selectedFiles[index];
    const item = items[index];

    try {
      setItemStatus(item, "Enviando...");
      await uploadFile({ file, folder, token, index });
      uploaded += 1;
      setItemStatus(item, "Publicado");
    } catch (error) {
      setItemStatus(item, error.message);
    }
  }

  if (uploaded > 0) {
    const feedUrl = `./?fresh=${Date.now()}`;
    setStatus(`${uploaded} arquivo(s) publicado(s). <a href="${feedUrl}">Abrir feed atualizado</a>.`, true);
  } else {
    setStatus("Nenhum arquivo foi publicado. Confira o token e tente novamente.");
  }

  updateButtonState();
});
