import { k } from "../data/patterns";
import { FOLLOW_UP_SEQUENCES } from "./adaptiveFollowUpBank";
import {
  isDuplicatePrompt,
  promptKey,
  sanitizeQuestionPrompt,
} from "./adaptiveQuestionSanitize";

const LEVELS = ["foundation", "applied", "corporate"];
const TRACKS = [
  "software",
  "ai",
  "cloud",
  "security",
  "fullstack",
  "mobile",
  "analytics",
  "ux",
  "devops",
  "data",
];

const TEMPLATE_BANK = {
  "software|aptitude": [
    {
      foundation:
        "You are estimating timelines at {{company}}. A task was 30% faster than planned but scope grew 15%. How do you explain the net impact to a manager?",
      applied:
        "Two pipelines finish jobs in 6 and 9 hours. How do you schedule them on one machine for minimum makespan, and what did your last answer miss about {gaps}?",
      corporate:
        "Leadership wants a single KPI for engineering velocity at {{company}}. Propose one metric, its failure modes, and how you would validate it.",
    },
    {
      foundation:
        "Rebuild the percentage reasoning from your previous answer: if success rate drops from 80% to 64%, is that a 16-point or 20% drop? Show the math.",
      applied:
        "Given a table of conversion rates by cohort, how do you spot Simpson's paradox before presenting to {{company}}?",
      corporate:
        "A/B test shows +2% lift but p=0.08. How do you recommend shipping (or not) for a {role} team?",
    },
    {
      foundation:
        "Practice unit consistency: convert 45 minutes and 750 MB/s into a single throughput story for a status update.",
      applied:
        "Estimate memory for 2M active sessions with 4 KB each, plus 25% overhead. Where could your last explanation be clearer on {gaps}?",
      corporate:
        "You must forecast Q4 hiring needs from ticket backlog growth. Outline assumptions and risks for {{company}}.",
    },
  ],
  "software|coding": [
    {
      foundation:
        "Without code on screen, explain how you would detect a cycle in a linked list and why your prior answer should mention {gaps}.",
      applied:
        "Design an LRU cache API for {{company}} services. What invariants and complexity bounds do you state?",
      corporate:
        "A hot path does N queries per request. How do you batch or cache safely under stale reads?",
    },
    {
      foundation:
        "Walk through binary search preconditions again and give one counterexample if {gaps} were ignored.",
      applied:
        "Given streaming integers, describe an O(n) algorithm for the longest consecutive sequence.",
      corporate:
        "Refactor a monolith endpoint that mixes auth, validation, and DB access. What module boundaries do you draw?",
    },
    {
      foundation:
        "Explain Big-O for nested loops with early exit, tying back to {gaps} from your last response.",
      applied: "How would you test a payment idempotency key handler?",
      corporate:
        "Design a rate limiter for {{company}} public APIs with burst traffic.",
    },
  ],
  "software|technical": [
    {
      foundation:
        "Compare SQL vs NoSQL for a {role} feature at {{company}}. Address {gaps} explicitly.",
      applied:
        "Sketch a read-heavy feed architecture with cache and CDN. Where is consistency relaxed?",
      corporate:
        "During deploys, p99 latency spikes. List observability signals and mitigation playbooks.",
    },
    {
      foundation:
        "Explain CAP in one paragraph using a concrete {{company}} scenario.",
      applied: "How do you shard a table by tenant without hot partitions?",
      corporate:
        "Design multi-region failover with RPO/RTO targets for a billing service.",
    },
    {
      foundation:
        "Describe HTTP caching headers and a bug if {gaps} are misunderstood.",
      applied: "What is your approach to schema migrations with zero downtime?",
      corporate: "A microservice fan-out causes retry storms. How do you fix it?",
    },
  ],
  "software|hr": [
    {
      foundation:
        "Tell a 90-second story about learning from failure for a {role} at {{company}}. Include {gaps} themes if they fit.",
      applied:
        "Describe disagreeing with a senior engineer and the outcome.",
      corporate:
        "How do you communicate a slip on a committed date without losing trust?",
    },
    {
      foundation:
        "Why {{company}} and why this {role} now? Structure past → present → future.",
      applied: "Give an example of mentoring someone junior on code quality.",
      corporate:
        "How do you prioritize tech debt when product pressure is high?",
    },
    {
      foundation: "Explain a project where you measured impact with numbers.",
      applied: "How do you handle unclear requirements from product?",
      corporate: "Tell me about influencing without authority across teams.",
    },
  ],
};

function trackCode(track) {
  const key = String(track || "software").toLowerCase();
  const index = TRACKS.indexOf(key);
  return index >= 0 ? index : 0;
}

function levelCode(level) {
  const key = String(level || "foundation").toLowerCase();
  const index = LEVELS.indexOf(key);
  return index >= 0 ? index : 0;
}

export function historyFeatures(history, roundIndex, questionInRound, track) {
  const last = history.length ? history[history.length - 1] : {};
  const scores = history.map((item) => Number(item.score || 0));
  const lastScore = Number(last.score ?? 55);
  const avgScore = scores.length
    ? scores.reduce((sum, value) => sum + value, 0) / scores.length
    : 55;
  const missing = last.missingKeywords || last.missing_keywords || [];
  const matched = last.matchedKeywords || last.matched_keywords || [];
  const kwTotal = Math.max(1, missing.length + matched.length);
  const missingRatio = missing.length / kwTotal;
  const patternScore = Number(last.patternScore ?? last.pattern_score ?? 50);
  const keywordScore = Number(last.keywordScore ?? last.keyword_score ?? 50);
  const prevLevel = levelCode(last.level);

  return [
    lastScore,
    avgScore,
    missingRatio * 100,
    patternScore,
    keywordScore,
    Number(roundIndex),
    Number(questionInRound),
    trackCode(track),
    prevLevel,
  ];
}

function heuristicPlan(features) {
  const lastScore = features[0];
  const avgScore = features[1];
  const missingRatio = features[2];
  let level = "foundation";
  let gapFocus = 1;
  if (lastScore >= 75 && avgScore >= 70 && missingRatio <= 35) {
    level = "corporate";
    gapFocus = 0;
  } else if (lastScore < 50 || missingRatio >= 55) {
    level = "foundation";
    gapFocus = 1;
  } else if (lastScore >= 50) {
    level = "applied";
    gapFocus = missingRatio >= 40 ? 1 : 0;
  }
  const templateIdx =
    (Math.floor(missingRatio / 20) +
      Math.floor(lastScore / 17) +
      Math.floor(avgScore / 19)) %
    3;
  return { level, gapFocus, templateIdx };
}

function answerSnippet(answer, maxLen = 110) {
  const text = String(answer || "").trim().replace(/\s+/g, " ");
  if (!text) {
    return "";
  }
  return text.length <= maxLen ? text : `${text.slice(0, maxLen)}…`;
}

function personalizeTemplate(template, ctx) {
  return sanitizeQuestionPrompt(
    template
      .replaceAll("{{company}}", ctx.companyName)
      .replaceAll("{company}", ctx.companyName)
      .replaceAll("{role}", ctx.role)
      .replaceAll("{gaps}", ctx.gapsLabel || "structured reasoning")
  );
}

function pickUniqueFollowUp(roundId, questionInRound, avoidPrompts, ctx) {
  const sequence =
    FOLLOW_UP_SEQUENCES[roundId] || FOLLOW_UP_SEQUENCES.technical;
  const attemptShift = Number(ctx.attemptOffset || 0) % sequence.length;
  const primaryIndex =
    (Math.max(0, questionInRound - 2) + attemptShift) % sequence.length;
  const normalizedAvoid = new Set(
    (avoidPrompts || []).map((item) => promptKey(item))
  );

  for (let offset = 0; offset < sequence.length; offset += 1) {
    const index = (primaryIndex + offset) % sequence.length;
    const prompt = personalizeTemplate(sequence[index], ctx);
    const key = promptKey(prompt);
    if (key && !normalizedAvoid.has(key)) {
      return { prompt, templateIndex: index };
    }
  }

  const prompt = sanitizeQuestionPrompt(
    `Interview question ${questionInRound} for a ${ctx.role} at ${ctx.companyName}: give a structured answer with definition, trade-off, and a concrete example.`
  );
  return { prompt, templateIndex: -1 };
}

function templateBank(track, roundId) {
  const key = `${track}|${roundId}`;
  if (TEMPLATE_BANK[key]) {
    return TEMPLATE_BANK[key];
  }
  const software = TEMPLATE_BANK[`software|${roundId}`];
  if (software) {
    return software;
  }
  return [
    {
      foundation:
        "Explain a core concept for {role} at {{company}} and cover {gaps} from your last answer.",
      applied: "Apply that concept to a realistic scenario at {{company}}.",
      corporate:
        "How would you scale and monitor this in production for {{company}}?",
    },
  ];
}

function gapPhrase(missing) {
  if (!missing?.length) {
    return "fundamentals";
  }
  return missing
    .slice(0, 3)
    .map((item) => String(item).replace(/_/g, " "))
    .join(", ");
}

function keywordsFor(roundId, level, gapFocus, missing) {
  const base = {
    aptitude: [
      k("reasoning", ["because", "therefore", "assume"]),
      k("numbers", ["percent", "ratio", "estimate"]),
      k("check", ["verify", "units", "sanity"]),
    ],
    coding: [
      k("complexity", ["o(n)", "time", "space"]),
      k("structure", ["array", "hash", "tree"]),
      k("edge", ["empty", "duplicate", "null"]),
    ],
    technical: [
      k("trade-off", ["latency", "consistency", "scale"]),
      k("design", ["api", "database", "cache"]),
      k("reliability", ["monitor", "alert", "rollback"]),
    ],
    hr: [
      k("situation", ["context", "team"]),
      k("action", ["i", "we", "did"]),
      k("result", ["impact", "learned", "metric"]),
    ],
  }[roundId] || [
    k("concept", ["explain", "define"]),
    k("example", ["for example", "such as"]),
    k("trade-off", ["however", "because"]),
  ];

  const list = [...base];
  if (gapFocus && missing?.length) {
    missing.slice(0, 3).forEach((label) => {
      list.push(k(label, [label.replace(/-/g, " ")]));
    });
  }
  if (level === "corporate") {
    list.push(k("business", ["customer", "stakeholder", "risk"]));
  }
  return list.slice(0, 6);
}

function patternsFor(roundId, level) {
  if (roundId === "hr") {
    return ["ownership", "steps", "business"];
  }
  if (roundId === "coding") {
    return ["definition", "steps", "example"];
  }
  if (roundId === "aptitude") {
    return ["steps", "example", "definition"];
  }
  if (level === "corporate") {
    return ["metric", "tradeoff", "business"];
  }
  return ["definition", "tradeoff", "steps"];
}

function newQuestionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `ml-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `ml-${Date.now().toString(36)}`;
}

const OPENING_PROMPTS = {
  aptitude: [
    "For a {role} role at {{company}}, solve this: a price drops 25%, then rises 20%. Is the final price back to the start? Show the math and one real-world trap.",
    "At {{company}}, estimate how many servers you need for 50k concurrent users if each session uses 2 MB RAM and you allow 30% headroom.",
    "A/B test: variant B wins on clicks but loses on revenue. How do you decide what to ship for a {role} team?",
    "Explain compound vs simple interest on a loan quote shown to customers at {{company}}.",
  ],
  coding: [
    "Explain how you would solve Two Sum for {{company}} interview prep: approach, time/space complexity, and one edge case.",
    "Describe validating binary search input before running it on production log indexes at {{company}}.",
    "How would you design a function to merge two sorted arrays without extra space?",
    "Walk through detecting duplicate files by content hash in a backup pipeline.",
  ],
  technical: [
    "For {{company}}, compare when you would choose a relational database versus a cache for a read-heavy feature.",
    "Sketch a three-tier architecture for a mobile app backend serving {{company}} users globally.",
    "How would you investigate intermittent 503 errors that only appear during deploys?",
    "Compare REST vs event-driven updates for an inventory service.",
  ],
  hr: [
    "In 90 seconds, introduce yourself for a {role} position at {{company}}: education, one project, and why this role.",
    "Describe a time you delivered under a tight deadline without cutting quality.",
    "Tell me about feedback you received that changed how you work.",
    "Explain how you collaborate with non-technical stakeholders at {{company}}.",
  ],
};

function generateOpeningQuestionLocal(payload) {
  const track = String(payload.track || "software").toLowerCase();
  let roundId = String(payload.round_id || "aptitude").toLowerCase();
  if (!["aptitude", "coding", "technical", "hr"].includes(roundId)) {
    roundId = "technical";
  }
  const company = payload.company || {};
  const role = company.role || payload.role || "this role";
  const companyName = company.name || payload.company_name || "the company";
  const roundIndex = Number(payload.round_index || 0);
  const openings = OPENING_PROMPTS[roundId] || OPENING_PROMPTS.technical;
  const attemptShift = Number(payload.prior_attempt_offset || 0);
  const avoidPrompts = payload.avoid_prompts || [];
  let prompt = "";
  for (let offset = 0; offset < openings.length; offset += 1) {
    const template =
      openings[(roundIndex + attemptShift + offset) % openings.length];
    const candidate = template
      .replaceAll("{{company}}", companyName)
      .replaceAll("{company}", companyName)
      .replaceAll("{role}", role);
    if (!isDuplicatePrompt(candidate, avoidPrompts)) {
      prompt = candidate;
      break;
    }
  }
  if (!prompt) {
    prompt = `Opening ${roundId} question for a ${role} role at ${companyName}.`;
  }

  const question = {
    id: newQuestionId(),
    track,
    round: roundId,
    topic: roundId,
    level: "foundation",
    type: roundId,
    prompt,
    keywords: keywordsFor(roundId, "foundation", 0, []),
    patterns: patternsFor(roundId, "foundation"),
    generated: true,
    followUps: { strong: [], gaps: {} },
  };

  return {
    question,
    reason: `Round ${roundIndex + 1} opening · ${roundId} · generated`,
    algorithm: "opening",
    usedModel: false,
    plan: { level: "foundation", gap_focus: 0, used_model: false },
  };
}

/** Client-side adaptive generator (mirrors ml_service/adaptive_questions.py heuristic path). */
export function generateAdaptiveQuestionLocal(payload) {
  if (payload.is_opening) {
    return generateOpeningQuestionLocal(payload);
  }
  const track = String(payload.track || "software").toLowerCase();
  let roundId = String(payload.round_id || "aptitude").toLowerCase();
  if (!["aptitude", "coding", "technical", "hr"].includes(roundId)) {
    roundId = "technical";
  }
  const roundIndex = Number(payload.round_index || 0);
  const questionInRound = Number(payload.question_in_round || 1);
  const history = payload.history || [];
  const adaptationHistory = payload.current_round_history?.length
    ? payload.current_round_history
    : history;
  const company = payload.company || {};
  const role = company.role || payload.role || "this role";
  const companyName = company.name || payload.company_name || "the company";

  const features = historyFeatures(
    adaptationHistory,
    roundIndex,
    questionInRound,
    track
  );
  let plan = heuristicPlan(features);
  const last = adaptationHistory.length
    ? adaptationHistory[adaptationHistory.length - 1]
    : {};
  const missing = last.missingKeywords || last.missing_keywords || [];
  const avoidPrompts = payload.avoid_prompts || [];
  const externalPlan = payload.external_plan;
  if (externalPlan?.level && LEVELS.includes(externalPlan.level)) {
    plan.level = externalPlan.level;
  }
  const picked = pickUniqueFollowUp(roundId, questionInRound, avoidPrompts, {
    companyName,
    role,
    gapsLabel: "structured reasoning",
    attemptOffset: Number(payload.prior_attempt_offset || 0),
  });
  let prompt = picked.prompt;
  if (isDuplicatePrompt(prompt, avoidPrompts)) {
    const retry = pickUniqueFollowUp(
      roundId,
      questionInRound + 7,
      [...avoidPrompts, prompt],
      { companyName, role, gapsLabel: "structured reasoning" }
    );
    prompt = retry.prompt;
  }

  const question = {
    id: newQuestionId(),
    track,
    round: roundId,
    topic: roundId,
    level: plan.level,
    type: roundId,
    prompt,
    keywords: keywordsFor(roundId, plan.level, plan.gapFocus, missing),
    patterns: patternsFor(roundId, plan.level),
    generated: true,
    followUps: { strong: [], gaps: {} },
  };

  const reason = [
    `Generated question ${questionInRound}`,
    `${plan.level} difficulty`,
    `topic slot ${picked.templateIndex + 1}`,
  ].join(" · ");

  return {
    question,
    reason,
    algorithm: "heuristic_local",
    usedModel: false,
    plan: {
      level: plan.level,
      gap_focus: plan.gapFocus,
      template_idx: plan.templateIdx,
      used_model: false,
    },
  };
}
