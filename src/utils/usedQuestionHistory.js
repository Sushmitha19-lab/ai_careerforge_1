import { authFetch } from "./api";
import { loadAuth } from "./session";
import { promptKey } from "./adaptiveQuestionSanitize";

const KEY = "careerforge-used-prompts-v1";

function storageKey(course, company) {
  const { student } = loadAuth();
  const user = student?.email || student?.id || "guest";
  return `${user}::${course?.id || course?.name || "course"}::${company?.id || company?.name || "company"}`;
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function writeStore(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode */
  }
}

export function loadLocalUsedPrompts(course, company) {
  const bucket = readStore()[storageKey(course, company)] || [];
  return Array.isArray(bucket) ? bucket : [];
}

export function appendLocalUsedPrompts(course, company, prompts) {
  const key = storageKey(course, company);
  const store = readStore();
  const existing = new Set((store[key] || []).map((item) => promptKey(item)));
  const next = [...(store[key] || [])];
  (prompts || []).forEach((prompt) => {
    const sanitized = String(prompt || "").trim();
    if (!sanitized) {
      return;
    }
    const normalized = promptKey(sanitized);
    if (existing.has(normalized)) {
      return;
    }
    existing.add(normalized);
    next.push(sanitized);
  });
  store[key] = next.slice(-500);
  writeStore(store);
  return next;
}

export async function fetchPriorUsedPrompts(course, company) {
  const local = loadLocalUsedPrompts(course, company);
  const { token } = loadAuth();
  if (!token) {
    return {
      prompts: local,
      attemptOffset: Math.floor(local.length / 15),
    };
  }
  try {
    const params = new URLSearchParams({
      course_name: course?.name || "",
      company_name: company?.name || "",
    });
    const data = await authFetch(`/api/interview/used-prompts?${params.toString()}`);
    const remote = Array.isArray(data?.prompts) ? data.prompts : [];
    const merged = appendLocalUsedPrompts(course, company, remote);
    return {
      prompts: merged.length ? merged : local,
      attemptOffset:
        Number(data?.attempt_offset) ||
        Math.floor((merged.length || local.length) / 15),
    };
  } catch {
    return {
      prompts: local,
      attemptOffset: Math.floor(local.length / 15),
    };
  }
}
