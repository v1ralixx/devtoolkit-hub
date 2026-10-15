const STORAGE_KEY = "dev-toolkit-hub-state";

function parseJson(text) {
  const value = text.trim();
  if (!value) return "";
  return JSON.parse(value);
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1300);
}

function copyText(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const value = target.value || target.textContent || "";
  navigator.clipboard.writeText(value)
    .then(() => showToast("Скопировано"))
    .catch(() => showToast("Не удалось скопировать"));
}

function saveState() {
  const payload = {
    json: document.getElementById("json-input").value,
    base64: document.getElementById("base64-input").value,
    url: document.getElementById("url-input").value,
    passwordLength: document.getElementById("password-length").value,
    color: document.getElementById("color-input").value,
    markdown: document.getElementById("markdown-input").value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved) return;

    const keys = [
      ["json-input", "json"],
      ["base64-input", "base64"],
      ["url-input", "url"],
      ["password-length", "passwordLength"],
      ["color-input", "color"],
      ["markdown-input", "markdown"],
    ];

    keys.forEach(([id, key]) => {
      const node = document.getElementById(id);
      if (!node || typeof saved[key] === "undefined") return;
      node.value = saved[key];
    });
  } catch (error) {
    console.warn("Не удалось восстановить состояние:", error);
  }
}

function formatJson() {
  const source = document.getElementById("json-input");
  try {
    const parsed = parseJson(source.value);
    source.value = JSON.stringify(parsed, null, 2);
    saveState();
  } catch (error) {
    showToast("Некорректный JSON");
  }
}

function minifyJson() {
  const source = document.getElementById("json-input");
  try {
    const parsed = parseJson(source.value);
    source.value = JSON.stringify(parsed);
    saveState();
  } catch (error) {
    showToast("Некорректный JSON");
  }
}

function encodeBase64() {
  const input = document.getElementById("base64-input");
  input.value = btoa(unescape(encodeURIComponent(input.value)));
  saveState();
}

function decodeBase64() {
  const input = document.getElementById("base64-input");
  try {
    const decoded = decodeURIComponent(escape(atob(input.value)));
    input.value = decoded;
    saveState();
  } catch (error) {
    showToast("Некорректный Base64");
  }
}

function parseUrl() {
  const field = document.getElementById("url-input");
  const url = new URL(field.value);
  const params = Object.fromEntries(url.searchParams.entries());
  field.value = JSON.stringify(params, null, 2);
  saveState();
}

function buildUrl() {
  const field = document.getElementById("url-input");
  try {
    const data = JSON.parse(field.value);
    const params = new URLSearchParams(data);
    const url = new URL("https://example.com");
    url.search = params.toString();
    field.value = url.toString();
    saveState();
  } catch (error) {
    showToast("Введите валидный JSON-объект параметров");
  }
}

function generatePassword() {
  const lengthField = document.getElementById("password-length");
  const output = document.getElementById("password-output");
  const length = clampNumber(Number(lengthField.value), 8, 64);
  lengthField.value = String(length);

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};:,.<>?";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  output.value = password;
  saveState();
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateUuid() {
  const field = document.getElementById("uuid-output");
  field.value = uuidv4();
  saveState();
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value || min));
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;

  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r, g, b) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (d !== 0) {
    switch (max) {
      case rr: h = ((gg - bb) / d) % 6; break;
      case gg: h = (bb - rr) / d + 2; break;
      default: h = (rr - gg) / d + 4; break;
    }
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function convertColor() {
  const input = document.getElementById("color-input");
  const preview = document.getElementById("color-preview");
  const output = document.getElementById("color-output");
  const value = input.value.trim();

  try {
    let rgb;
    if (value.startsWith("#")) {
      rgb = hexToRgb(value);
    } else if (value.startsWith("rgb")) {
      const matches = value.match(/\d+/g);
      if (!matches || matches.length < 3) throw new Error();
      rgb = { r: Number(matches[0]), g: Number(matches[1]), b: Number(matches[2]) };
    } else {
      throw new Error();
    }

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const rgbText = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hslText = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    preview.style.background = rgbText;
    output.value = `${rgbText}\n ${hslText}`;
    saveState();
  } catch (error) {
    showToast("Введите корректный HEX или RGB");
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function markdownToHtml(markdown) {
  let html = escapeHtml(markdown)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  html = `<p>${html}</p>`;
  html = html.replace(/<p><h1>/g, "<h1>")
    .replace(/<\/h1><\/p>/g, "</h1>")
    .replace(/<p><h2>/g, "<h2>")
    .replace(/<\/h2><\/p>/g, "</h2>")
    .replace(/<p><h3>/g, "<h3>")
    .replace(/<\/h3><\/p>/g, "</h3>")
    .replace(/<p><br>/g, "<p>")
    .replace(/<p><\/p>/g, "");

  return html;
}

function previewMarkdown() {
  const input = document.getElementById("markdown-input");
  const output = document.getElementById("markdown-output");
  output.innerHTML = markdownToHtml(input.value);
  saveState();
}

function copyAll() {
  const payload = [
    document.getElementById("json-input").value,
    document.getElementById("base64-input").value,
    document.getElementById("url-input").value,
    document.getElementById("password-output").value,
    document.getElementById("uuid-output").value,
    document.getElementById("color-output").value,
    document.getElementById("markdown-output").innerText,
  ].join("\n\n---\n\n");

  navigator.clipboard.writeText(payload)
    .then(() => showToast("Все данные скопированы"))
    .catch(() => showToast("Не удалось скопировать все данные"));
}

document.addEventListener("DOMContentLoaded", () => {
  restoreState();
  generatePassword();
  generateUuid();
  convertColor();
  previewMarkdown();

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "json-format") formatJson();
      if (action === "json-minify") minifyJson();
      if (action === "base64-encode") encodeBase64();
      if (action === "base64-decode") decodeBase64();
      if (action === "url-parse") parseUrl();
      if (action === "url-build") buildUrl();
      if (action === "password-generate") generatePassword();
      if (action === "uuid-generate") generateUuid();
      if (action === "color-convert") convertColor();
      if (action === "markdown-preview") previewMarkdown();
    });
  });

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", () => copyText(button.dataset.copyTarget));
  });

  document.getElementById("copy-all-button").addEventListener("click", copyAll);

  const inputsToTrack = [
    "json-input",
    "base64-input",
    "url-input",
    "color-input",
    "markdown-input",
    "password-length",
  ];

  inputsToTrack.forEach((id) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.addEventListener("input", saveState);
  });

  document.getElementById("password-length").addEventListener("change", () => {
    generatePassword();
  });

  document.getElementById("color-input").addEventListener("input", convertColor);
  document.getElementById("markdown-input").addEventListener("input", previewMarkdown);
  document.getElementById("json-input").addEventListener("input", saveState);
  document.getElementById("base64-input").addEventListener("input", saveState);
  document.getElementById("url-input").addEventListener("input", saveState);
  document.getElementById("uuid-output").addEventListener("input", saveState);
});

const style = document.createElement("style");
style.textContent = `
  .toast {
    position: fixed;
    right: 22px;
    bottom: 24px;
    z-index: 20;
    padding: 0.7rem 1rem;
    border: 1px solid rgba(125, 211, 252, 0.3);
    border-radius: 10px;
    background: rgba(14, 21, 34, 0.95);
    color: var(--text);
    box-shadow: 0 12px 28px rgba(0,0,0,0.34);
    font-size: 0.92rem;
  }
`;
document.head.appendChild(style);
