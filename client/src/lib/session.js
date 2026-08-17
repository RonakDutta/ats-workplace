export const TOKEN_KEY = "ats_token";
export const USER_KEY = "ats_user";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function initials(name) {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * The sidebar keeps its own copy of the role list. Anything that changes a role
 * announces it here rather than relying on a route change to force a refetch.
 */
export const ROLES_CHANGED = "ats:roles-changed";

export function announceRolesChanged() {
  window.dispatchEvent(new CustomEvent(ROLES_CHANGED));
}
