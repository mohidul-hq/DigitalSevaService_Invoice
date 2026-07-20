import {
  DEFAULT_TRIAL_LOCK_CONFIG,
  TRIAL_LOCK_STORAGE_KEY,
} from "./trialLockConfig";
import {
  GITHUB_BRANCH,
  GITHUB_CONTENTS_API,
  GITHUB_TOKEN_STORAGE_KEY,
  REMOTE_POLL_INTERVAL_MS,
  REMOTE_RAW_URL,
} from "../config/remote";

function cacheLocal(config) {
  try {
    localStorage.setItem(TRIAL_LOCK_STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* ignore quota errors (e.g. huge QR) */
  }
}

function readLocalCache() {
  try {
    const raw = localStorage.getItem(TRIAL_LOCK_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_TRIAL_LOCK_CONFIG };
    return { ...DEFAULT_TRIAL_LOCK_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_TRIAL_LOCK_CONFIG };
  }
}

function normalize(data) {
  if (!data || typeof data !== "object") {
    return { ...DEFAULT_TRIAL_LOCK_CONFIG };
  }
  return { ...DEFAULT_TRIAL_LOCK_CONFIG, ...data };
}

/** Public read — used by every visitor worldwide */
export async function fetchRemoteTrialLockConfig() {
  const url = `${REMOTE_RAW_URL}?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) {
    return { ...DEFAULT_TRIAL_LOCK_CONFIG, _remoteMissing: true };
  }
  if (!res.ok) {
    throw new Error(`Cloud sync fetch failed (${res.status})`);
  }
  const data = await res.json();
  const config = normalize(data);
  cacheLocal(config);
  return config;
}

/**
 * Load config: try cloud first, fall back to local cache.
 */
export async function loadTrialLockConfigAsync() {
  try {
    return await fetchRemoteTrialLockConfig();
  } catch (err) {
    console.warn("Remote trial lock unavailable, using local cache.", err);
    return readLocalCache();
  }
}

export function getGithubToken() {
  return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || "";
}

export function setGithubToken(token) {
  const trimmed = (token || "").trim();
  if (trimmed) {
    localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(GITHUB_TOKEN_STORAGE_KEY);
  }
}

async function getRemoteFileMeta(token) {
  const res = await fetch(
    `${GITHUB_CONTENTS_API}?ref=${encodeURIComponent(GITHUB_BRANCH)}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub read failed (${res.status}): ${body}`);
  }
  return res.json();
}

function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

/**
 * Super Admin save — pushes config to GitHub so every user receives it.
 */
export async function saveRemoteTrialLockConfig(config) {
  const token = getGithubToken();
  if (!token) {
    throw new Error(
      "Add a GitHub Personal Access Token in Super Admin to sync changes worldwide."
    );
  }

  const merged = normalize(config);
  // Do not upload internal flags
  delete merged._remoteMissing;

  const content = toBase64Utf8(JSON.stringify(merged, null, 2));
  const meta = await getRemoteFileMeta(token);

  const payload = {
    message: `chore: update trial lock config (${new Date().toISOString()})`,
    content,
    branch: GITHUB_BRANCH,
  };
  if (meta?.sha) {
    payload.sha = meta.sha;
  }

  const res = await fetch(GITHUB_CONTENTS_API, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cloud save failed (${res.status}): ${body}`);
  }

  cacheLocal(merged);
  return merged;
}

/**
 * Poll cloud config so lock changes appear for all users within ~15 seconds.
 */
export function subscribeTrialLockConfig(onChange, intervalMs = REMOTE_POLL_INTERVAL_MS) {
  let stopped = false;
  let lastJson = "";

  const tick = async () => {
    if (stopped) return;
    try {
      const config = await fetchRemoteTrialLockConfig();
      const serialized = JSON.stringify(config);
      if (serialized !== lastJson) {
        lastJson = serialized;
        onChange(config);
      }
    } catch (err) {
      console.warn("Trial lock poll failed:", err);
    }
  };

  tick();
  const id = setInterval(tick, intervalMs);

  return () => {
    stopped = true;
    clearInterval(id);
  };
}

export { REMOTE_POLL_INTERVAL_MS, readLocalCache as loadLocalTrialLockCache };
