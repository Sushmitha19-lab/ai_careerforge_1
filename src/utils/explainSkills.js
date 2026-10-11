import { getCompanySignal } from "../data/companySignals";
import { SKILL_META } from "../data/skillMaps";
import { conversionChance, trackFromCourse } from "./adaptiveInterview";

export function strengthLabel(score) {
  if (score >= 75) {
    return "strong";
  }
  if (score >= 50) {
    return "moderate";
  }
  return "weak";
}

function average(values) {
  const numbers = values.filter((value) => typeof value === "number");
  if (!numbers.length) {
    return 0;
  }
  return Math.round(
    numbers.reduce((sum, value) => sum + value, 0) / numbers.length
  );
}

function topicBucket(answer, track) {
  const type = String(answer.type || "").toLowerCase();
  if (type === "hr" || type === "behavioral") {
    return "communication";
  }
  if (type === "aptitude") {
    return "aptitude";
  }
  if (type === "coding") {
    if (track === "ai" || track === "analytics") {
      return track === "ai" ? "python" : "dsa";
    }
    if (track === "database" || track === "analytics") {
      return "dsa";
    }
    return "dsa";
  }
  if (type === "technical") {
    if (track === "ai") {
      return "ml";
    }
    if (track === "cloud") {
      return "cloud";
    }
    if (track === "security") {
      return "aptitude";
    }
    return "python";
  }
  return "python";
}

export function explainInterview(result, course, company) {
  const answers = result?.answers || [];
  const buckets = {
    python: [],
    communication: [result?.communication],
    dsa: [result?.problemSolving],
    aptitude: [],
    ml: [],
    cloud: [],
  };

  const track = trackFromCourse(course);
  answers.forEach((answer) => {
    const bucket = topicBucket(answer, track);
    if (buckets[bucket]) {
      buckets[bucket].push(answer.score);
    }
    if (answer.difficulty === "Foundation") {
      buckets.aptitude.push(answer.score);
    }
  });

  if (result?.technical) {
    buckets.python.push(result.technical);
  }

  if (track === "ai" && !buckets.ml.length) {
    buckets.ml.push(result?.technical || result?.overall || 0);
  }
  if (track === "cloud" && !buckets.cloud.length) {
    buckets.cloud.push(result?.technical || result?.overall || 0);
  }

  const scores = {
    python: average(buckets.python),
    communication: average(buckets.communication),
    dsa: average(buckets.dsa),
    aptitude: average(buckets.aptitude.length ? buckets.aptitude : [result?.overall]),
    ml: average(buckets.ml),
    cloud: average(buckets.cloud),
  };

  const skills = ["python", "communication", "dsa", "aptitude"].map((id) => ({
    id,
    label: SKILL_META[id].label,
    hint: SKILL_META[id].hint,
    score: scores[id],
    strength: strengthLabel(scores[id]),
  }));

  if (track === "ai") {
    skills.push({
      id: "ml",
      label: SKILL_META.ml.label,
      hint: SKILL_META.ml.hint,
      score: scores.ml,
      strength: strengthLabel(scores.ml),
    });
  }
  if (track === "cloud") {
    skills.push({
      id: "cloud",
      label: SKILL_META.cloud.label,
      hint: SKILL_META.cloud.hint,
      score: scores.cloud,
      strength: strengthLabel(scores.cloud),
    });
  }

  const signal = getCompanySignal(company);
  const weights = signal?.weights || {
    python: 0.25,
    communication: 0.25,
    dsa: 0.25,
    aptitude: 0.25,
  };

  let weighted = 0;
  let weightSum = 0;
  Object.entries(weights).forEach(([key, weight]) => {
    const value = scores[key];
    if (typeof value === "number") {
      weighted += value * weight;
      weightSum += weight;
    }
  });

  const readiness =
    weightSum > 0
      ? Math.round(weighted / weightSum)
      : result?.overall || 0;

  const weakest = [...skills].sort((a, b) => a.score - b.score)[0];
  const strongest = [...skills].sort((a, b) => b.score - a.score)[0];

  const chance = conversionChance({
    readiness,
    overall: result?.overall,
    behavior: result?.behavior,
    voice: result?.voice,
    answers,
  });

  return {
    scores,
    skills,
    readiness,
    chance,
    weakest,
    strongest,
    signal,
    reasons: [
      strongest
        ? `${strongest.label} is ${strongest.strength} (${strongest.score}%).`
        : "",
      weakest
        ? `${weakest.label} is ${weakest.strength} (${weakest.score}%) — prepare this before the next mock.`
        : "",
      chance
        ? `Estimated chance of advancing this screen: ${chance.chance}% (${chance.band}).`
        : "",
      signal
        ? signal.changes[0]?.detail
        : "Complete a company-specific mock to see hiring-cycle changes.",
    ].filter(Boolean),
  };
}

export function nodeStatus(node, map, scores) {
  const score = scores?.[node.skill] || 0;
  const parentsReady = (node.dependsOn || []).every((id) => {
    const parent = map.nodes.find((item) => item.id === id);
    if (!parent) {
      return true;
    }
    return (scores?.[parent.skill] || 0) >= 45;
  });

  if (!parentsReady) {
    return "locked";
  }
  if (score >= 75) {
    return "strong";
  }
  if (score >= 50) {
    return "ready";
  }
  return "gap";
}

export function buildWeekPlan(map, scores) {
  const weeks = map.nodes.map((node, index) => {
    const status = nodeStatus(node, map, scores);
    const score = scores?.[node.skill] || 0;
    let focus = `Work ${node.label}: ${node.before}`;
    if (status === "locked") {
      const parent = map.nodes.find((item) => item.id === node.dependsOn[0]);
      focus = `Do not start ${node.label} yet. Finish ${parent?.label || "the previous skill"} first.`;
    } else if (status === "strong") {
      focus = `${node.label} is already strong. Use this week to teach it forward into ${node.nextUnlocks}.`;
    } else if (status === "ready") {
      focus = `${node.label} is moderate. Close the remaining gaps so ${node.nextUnlocks} unlocks cleanly.`;
    }
    return {
      week: index + 1,
      node,
      status,
      score,
      focus,
    };
  });

  return weeks;
}
