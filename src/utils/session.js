const AUTH_KEY = "careerforge-auth-v1";
const FLOW_KEY = "careerforge-flow-v1";

export function loadAuth() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_KEY) || "");
    if (parsed?.token && parsed?.student) {
      return parsed;
    }
  } catch (error) {
    /* ignore */
  }
  return { token: "", student: null };
}

export function saveAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(FLOW_KEY);
}

export function loadFlow() {
  try {
    return JSON.parse(sessionStorage.getItem(FLOW_KEY) || "{}") || {};
  } catch (error) {
    return {};
  }
}

export function saveFlow(patch) {
  const next = { ...loadFlow(), ...patch };
  sessionStorage.setItem(FLOW_KEY, JSON.stringify(next));
  return next;
}
