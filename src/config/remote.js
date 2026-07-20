/**
 * Shared cloud config — all users worldwide read this file from GitHub.
 * Super Admin writes updates via the GitHub API (requires a Personal Access Token).
 */
export const GITHUB_OWNER = "mohidul-hq";
export const GITHUB_REPO = "DigitalSevaService_Invoice";
export const GITHUB_BRANCH = "main";
export const REMOTE_CONFIG_PATH = "remote/lock-config.json";

export const REMOTE_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${REMOTE_CONFIG_PATH}`;

export const GITHUB_CONTENTS_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${REMOTE_CONFIG_PATH}`;

/** How often every visitor checks for admin changes (ms) */
export const REMOTE_POLL_INTERVAL_MS = 12000;

export const GITHUB_TOKEN_STORAGE_KEY = "digitalInvoiceGithubToken";
