const KEY = "careerforge-progress-v1";

function weekKey(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + offset);
  const year = copy.getFullYear();
  const month = String(copy.getMonth() + 1).padStart(2, "0");
  const dayNum = String(copy.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayNum}`;
}

export function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "");
    if (parsed && Array.isArray(parsed.snapshots)) {
      return parsed;
    }
  } catch (error) {
    /* ignore */
  }
  return { snapshots: [], lastCourseId: null, lastCompany: null };
}

export function recordInterviewSnapshot({ student, course, company, explained, overall }) {
  const store = loadProgress();
  const email = student?.email || "student";
  const key = weekKey();
  const snapshot = {
    weekKey: key,
    date: new Date().toISOString(),
    email,
    courseId: course?.id || null,
    courseName: course?.name || "",
    companyName: company?.name || "",
    overall: overall || 0,
    readiness: explained?.readiness || overall || 0,
    scores: explained?.scores || {},
    skills: explained?.skills || [],
  };

  const snapshots = store.snapshots.filter(
    (item) => !(item.weekKey === key && item.email === email)
  );
  snapshots.push(snapshot);
  snapshots.sort((a, b) => a.weekKey.localeCompare(b.weekKey));

  const next = {
    snapshots,
    lastCourseId: course?.id || store.lastCourseId,
    lastCompany: company?.name || store.lastCompany,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (error) {
    /* private mode */
  }
  return next;
}

export function snapshotsFor(student) {
  const email = student?.email || "student";
  return loadProgress().snapshots.filter((item) => item.email === email);
}
