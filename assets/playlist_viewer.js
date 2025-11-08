// playlist_viewer.js – reusable single-file version for any YouTube playlist
// Usage: In HTML, add `data-playlist-id="YOUR_PLAYLIST_ID"` to <div id="playlist-container">
// Shows each card immediately; title upgrade happens per-card in background.
// Thumbnails from playlist parse shown first (no reload); oEmbed only for titles.
// FIXED: Multiple reliable CORS proxies (2025) with encoded URLs + 5s timeout per attempt for faster initial load.
// Cache is per-playlist (unique key based on ID).
// UPDATE: On "Refresh" button, clears ALL cache keys (playlist + per-video titles) for full force refresh from internet.
// On page load/browser refresh: Uses cache if valid (fast load from disk).
// On button refresh: Forces fetch from internet, updates disk with fresh data.

// Generic fetch proxies (for oEmbed) - prefixes for encoded URL
const FETCH_PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://corsproxy.io/?",
  "https://r.jina.ai/?url="
];

// Playlist fetch proxies - prefixes for encoded playlist URL (2025 working list)
const PROXIES = [
  // Fast/reliable first (based on 2025 reports)
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://thingproxy.freeboard.io/fetch/",
  "https://cors.bridged.cc/",
  "https://corsproxy.io/?",
  "https://cors.x2u.in/",
  "https://api.allorigins.win/raw?url="
];

function el(sel) { return document.querySelector(sel); }
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function setLoading(msg) {
  const c = el("#playlist-container");
  if (c) c.innerHTML = `<div class="loading">${escapeHtml(msg)}</div>`;
}

/* ---------- Get dynamic playlist ID and cache key ---------- */
function getConfig() {
  const container = el("#playlist-container");
  if (!container) throw new Error("No #playlist-container found");
  
  const PLAYLIST_ID = container.dataset.playlistId;
  if (!PLAYLIST_ID) throw new Error("Missing data-playlist-id on #playlist-container");
  
  const CACHE_KEY = `playlist_cache_${PLAYLIST_ID.replace(/[^a-zA-Z0-9]/g, '_')}_v68`;
  const CACHE_TTL = 1000 * 60 * 60 * 12; // 12 h playlist
  const CACHE_TTL_VIDEO = 1000 * 60 * 60 * 12; // 12 hours per-video
  
  return { PLAYLIST_ID, CACHE_KEY, CACHE_TTL, CACHE_TTL_VIDEO };
}

/* ---------- Clear all cache for this playlist (playlist + per-video titles) ---------- */
function clearAllCache(CACHE_KEY) {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(CACHE_KEY)) {
      localStorage.removeItem(key);
    }
  });
  console.log(`Cleared all cache for ${CACHE_KEY}`);
}

/* ---------- JSON extractor ---------- */
function extractJsonObject(html, key) {
  const idx = html.indexOf(key);
  if (idx === -1) return null;
  const start = html.indexOf("{", idx);
  if (start === -1) return null;
  let i = start, depth = 0, inString = false, prev = "";
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '"' && prev !== "\\") inString = !inString;
    if (!inString) {
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return html.slice(start, i + 1);
      }
    }
    prev = ch;
  }
  return null;
}

/* ---------- playlist parsers ---------- */
function parseFromYtInitialData(html, PLAYLIST_ID) {
  const jsonStr = extractJsonObject(html, "ytInitialData");
  if (!jsonStr) return [];
  try {
    const data = JSON.parse(jsonStr);
    const videos = [];
    const stack = [data];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      if (node.videoRenderer && node.videoRenderer.videoId) {
        const vr = node.videoRenderer;
        const videoId = vr.videoId;
        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || `Lecture — ${videoId}`;
        const duration = vr.lengthText?.simpleText ||
          (vr.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText) || "—";
        const published = vr.publishedTimeText?.simpleText || vr.shortBylineText?.runs?.[0]?.text || "—";
        let description = "No description available.";
        if (vr.shortDescription) description = vr.shortDescription;
        else if (vr.detailedMetadataSnippets?.[0]?.snippetText?.runs) {
          description = vr.detailedMetadataSnippets[0].snippetText.runs.map(r => r.text).join("");
        }
        const thumbs = vr.thumbnail?.thumbnails;
        const thumbnail = Array.isArray(thumbs) && thumbs.length ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        videos.push({
          videoId, title, duration, published,
          description: description.length > 220 ? description.slice(0,217)+"..." : description,
          thumbnail,
          link: `https://www.youtube.com/watch?v=${videoId}&list=${PLAYLIST_ID}`
        });
        continue;
      }
      for (const k in node) {
        if (node[k] && typeof node[k] === "object") stack.push(node[k]);
      }
    }
    const seen = new Set();
    const uniq = videos.filter(v => !seen.has(v.videoId) && seen.add(v.videoId));
    return uniq;
  } catch (e) {
    console.warn("parseFromYtInitialData error:", e);
    return [];
  }
}

function parseFromRegex(html, PLAYLIST_ID) {
  const results = [];
  const re = /"videoId"\s*:\s*"([^"]+)"[\s\S]{0,400}?"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    results.push({
      videoId: m[1],
      title: m[2],
      duration: "—",
      published: "—",
      description: "No description available.",
      thumbnail: `https://i.ytimg.com/vi/${m[1]}/maxresdefault.jpg`,
      link: `https://www.youtube.com/watch?v=${m[1]}&list=${PLAYLIST_ID}`
    });
  }
  if (!results.length) {
    const re2 = /"videoId"\s*:\s*"([^"]+)"/g;
    const seen = new Set();
    let mm;
    while ((mm = re2.exec(html)) !== null) {
      const id = mm[1];
      if (!seen.has(id)) {
        seen.add(id);
        results.push({
          videoId: id,
          title: `Lecture — ${id}`,
          duration: "—",
          published: "—",
          description: "No description available.",
          thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
          link: `https://www.youtube.com/watch?v=${id}&list=${PLAYLIST_ID}`
        });
      }
    }
  }
  return results;
}

/* ---------- playlist HTML fetch (with multiple proxies + 5s timeout) ---------- */
async function fetchPlaylistHTMLViaProxy(PLAYLIST_ID) {
  const playlistUrl = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;
  const timeoutMs = 5000; // 5s per proxy attempt
  for (const proxy of PROXIES) {
    const target = `${proxy}${encodeURIComponent(playlistUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      console.log("Trying proxy:", target);
      const res = await fetch(target, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const text = await res.text();
      if (text && (text.includes("videoId") || text.includes("ytInitialData"))) {
        return text;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name !== 'AbortError') console.warn("Proxy failed:", proxy, e);
    }
  }
  throw new Error("All proxies failed (with timeout)");
}

/* ---------- caching (playlist) ---------- */
function getCached(CACHE_KEY, CACHE_TTL) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.time < CACHE_TTL) return parsed.data;
  } catch (e) { console.warn("cache read error", e); }
  return null;
}
function cacheSet(CACHE_KEY, data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data })); }
  catch (e) { console.warn("cache set error", e); }
}

/* ---------- per-video title cache ---------- */
function getCachedTitle(CACHE_KEY, videoId, CACHE_TTL_VIDEO) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}_title_${videoId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.time < CACHE_TTL_VIDEO) return parsed.data;
  } catch (_) {}
  return null;
}
function setCachedTitle(CACHE_KEY, videoId, data) {
  try { localStorage.setItem(`${CACHE_KEY}_title_${videoId}`, JSON.stringify({ time: Date.now(), data })); }
  catch (_) {}
}

/* ---------- generic fetch with fallback proxies + timeout ---------- */
async function fetchViaProxyGeneric(url) {
  const timeoutMs = 5000; // 5s timeout
  // direct first (YouTube oEmbed often allows CORS)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const r = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (r.ok) return await r.text();
  } catch (e) {
    if (e.name !== 'AbortError') console.warn("Direct fetch failed:", e);
  }
  // fallback to proxies
  for (const p of FETCH_PROXIES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const proxied = `${p}${encodeURIComponent(url)}`;
      const r = await fetch(proxied, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (r.ok) return await r.text();
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name !== 'AbortError') console.warn("generic proxy failed", p, e);
    }
  }
  throw new Error("All direct+proxy attempts failed for " + url);
}

/* ---------- oEmbed title ONLY (no thumb update) ---------- */
async function fetchVideoTitle(videoId, CACHE_KEY, CACHE_TTL_VIDEO) {
  const cached = getCachedTitle(CACHE_KEY, videoId, CACHE_TTL_VIDEO);
  if (cached) return cached;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
  const result = { title: `Lecture — ${videoId}` };
  try {
    const txt = await fetchViaProxyGeneric(oembedUrl);
    const json = JSON.parse(txt);
    if (json.title) result.title = json.title;
  } catch (e) {
    console.warn("oEmbed fetch failed for", videoId, e);
  }
  setCachedTitle(CACHE_KEY, videoId, result);
  return result;
}

/* ---------- card creator (immediate render + async title upgrade only) ---------- */
function createCard(v, idx, PLAYLIST_ID, CACHE_KEY, CACHE_TTL_VIDEO) {
  const card = document.createElement("div");
  card.className = "lesson-card";
  card.dataset.videoId = v.videoId;
  card.innerHTML = `
    <div class="card-image">
      <img src="${escapeHtml(v.thumbnail)}" alt="${escapeHtml(v.title)}" loading="lazy">
      <div class="card-overlay"><i class="fas fa-play"></i></div>
    </div>
    <div class="card-content">
      <h3 class="card-title">
        ${idx + 1}. ${escapeHtml(v.title)}
        <span class="title-spinner" style="color: #999; font-size: 0.8em;">Loading title...</span>
      </h3>
      <p>${escapeHtml(v.description || "")}</p>
      <div class="lesson-meta">
        <span><i class="fas fa-clock"></i> ${escapeHtml(v.duration)}</span>
        <span><i class="fas fa-calendar-alt" style="margin-left:12px"></i> ${escapeHtml(v.published)}</span>
      </div>
      <a href="${v.link}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">
        Watch on YouTube <i class="fas fa-play"></i>
      </a>
    </div>
  `;
  // start oEmbed fetch immediately for TITLE ONLY – update when done
  // (images load independently via <img loading="lazy">)
  (async () => {
    try {
      const meta = await fetchVideoTitle(v.videoId, CACHE_KEY, CACHE_TTL_VIDEO);
      const h = card.querySelector(".card-title");
      const spinner = card.querySelector(".title-spinner");
      if (h && meta.title) h.innerHTML = `${idx + 1}. ${escapeHtml(meta.title)}`;
      if (spinner) spinner.remove();
    } catch (_) { /* ignore – fallback already shown */ }
  })();
  return card;
}

/* ---------- render playlist (show cards instantly) ---------- */
function renderPlaylist(videos, PLAYLIST_ID, CACHE_KEY, CACHE_TTL_VIDEO) {
  const container = el("#playlist-container");
  if (!container) return;
  container.innerHTML = "";
  if (!videos || videos.length === 0) {
    container.innerHTML = `<div class="loading">No videos found in playlist.</div>`;
    return;
  }
  // header + refresh
  const header = document.createElement("div");
  header.className = "playlist-header";
  header.innerHTML = `
    <strong>Showing ${videos.length} videos</strong>
    <button id="refresh-playlist">
      <i class="fas fa-sync-alt"></i> Refresh
    </button>
  `;
  container.appendChild(header);
  // render each card immediately
  videos.forEach((v, idx) => container.appendChild(createCard(v, idx, PLAYLIST_ID, CACHE_KEY, CACHE_TTL_VIDEO)));
  // refresh button
  const btn = el("#refresh-playlist");
  if (btn) {
    btn.addEventListener("click", async () => {
      try {
        setLoading("Refreshing playlist from internet...");
        clearAllCache(CACHE_KEY);  // Clear ALL cache (playlist + titles) for full force refresh
        const fresh = await loadAndParse(PLAYLIST_ID, CACHE_KEY, CACHE_TTL_VIDEO);
        renderPlaylist(fresh, PLAYLIST_ID, CACHE_KEY, CACHE_TTL_VIDEO);
      } catch (e) {
        setLoading("Refresh failed. Try again later.");
        console.error(e);
      }
    });
  }
}

/* ---------- load + parse ---------- */
async function loadAndParse(PLAYLIST_ID, CACHE_KEY, CACHE_TTL) {
  // On page load/browser refresh: Use cache if valid (fast from disk)
  // On button refresh: Cache already cleared above, so fetches fresh
  const cached = getCached(CACHE_KEY, CACHE_TTL);
  if (cached) {
    console.log("Using cached playlist data (fast load from disk)");
    return cached;
  }
  setLoading("Fetching playlist (via proxy)...");
  const html = await fetchPlaylistHTMLViaProxy(PLAYLIST_ID);
  let videos = parseFromYtInitialData(html, PLAYLIST_ID);
  if (!videos.length) videos = parseFromRegex(html, PLAYLIST_ID);
  const seen = new Set();
  const uniq = videos.filter(v => !seen.has(v.videoId) && seen.add(v.videoId));
  cacheSet(CACHE_KEY, uniq);  // Always update cache with fresh data
  console.log("Fetched fresh playlist and updated cache");
  return uniq;
}

/* ---------- boot ---------- */
async function boot() {
  try {
    const config = getConfig();
    const { PLAYLIST_ID, CACHE_KEY, CACHE_TTL, CACHE_TTL_VIDEO } = config;
    setLoading("Loading playlist...");
    const videos = await loadAndParse(PLAYLIST_ID, CACHE_KEY, CACHE_TTL);
    renderPlaylist(videos, PLAYLIST_ID, CACHE_KEY, CACHE_TTL_VIDEO);
  } catch (e) {
    console.error(e);
    setLoading("Failed to load playlist. Check console for details.");
  }
}

document.addEventListener("DOMContentLoaded", boot);