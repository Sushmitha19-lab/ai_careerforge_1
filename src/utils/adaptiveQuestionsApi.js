import { P } from "../data/patterns";
import { trackFromCourse } from "../data/tracks";
import { evaluateAnswer } from "./evaluateAnswer";
import { pickForRound } from "../data/interviewBank";
import { formatPrompt, preferredLevel } from "./adaptiveInterview";
import { generateAdaptiveQuestionLocal } from "./adaptiveQuestionEngine";
import {
  isDuplicatePrompt,
  sanitizeQuestionPrompt,
} from "./adaptiveQuestionSanitize";

function patternObjects(ids) {
  return (ids || [])
    .map((id) => P[id])
    .filter(Boolean);
}

export function normalizeMlQuestion(raw) {
  if (!raw) {
    return null;
  }
  const patterns = raw.patterns?.[0]?.regex
    ? raw.patterns
    : patternObjects(raw.patterns);
  return {
    ...raw,
    prompt: sanitizeQuestionPrompt(raw.prompt),
    patterns,
    generated: raw.generated !== false,
  };
}

export function historyFromCommitted(answers) {
  return (answers || []).map((item) => ({
    questionId: item.questionId,
    prompt: item.question,
    answer: item.answer,
    score: item.score,
    keywordScore: item.keywordScore,
    patternScore: item.patternScore,
    matchedKeywords: item.matchedKeywords,
    missingKeywords: item.missingKeywords,
    level: String(item.difficulty || "foundation").toLowerCase(),
    type: item.type,
  }));
}

export function buildAnswerHistory({
  roundQuestions,
  drafts,
  company,
  upToIndex,
}) {
  const history = [];
  for (let index = 0; index < upToIndex; index += 1) {
    const question = roundQuestions[index];
    if (!question) {
      continue;
    }
    const answer = String(drafts[index] || "");
    if (!answer.trim()) {
      continue;
    }
    const analysis = evaluateAnswer(answer, question);
    history.push({
      questionId: question.id,
      prompt: formatPrompt(question, company),
      answer,
      score: analysis.score,
      keywordScore: analysis.keywordScore,
      patternScore: analysis.patternScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      level: question.level,
      type: question.type,
    });
  }
  return history;
}

function pickUniqueBankQuestion({
  track,
  roundId,
  level,
  askedIds,
  avoidPrompts,
  company,
  questionInRound,
  priorAttemptOffset,
}) {
  const asked = new Set(askedIds || []);
  const levels = [level, "applied", "corporate", "foundation"];
  const levelStart =
    (Number(questionInRound || 1) + Number(priorAttemptOffset || 0)) %
    levels.length;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const pickLevel = levels[(levelStart + attempt) % levels.length];
    const candidate = pickForRound(track, roundId, pickLevel, asked);
    if (!candidate) {
      continue;
    }
    asked.add(candidate.id);
    const prompt = formatPrompt(candidate, company);
    if (!isDuplicatePrompt(prompt, avoidPrompts)) {
      return candidate;
    }
  }
  return null;
}

export async function fetchAdaptiveQuestion({
  course,
  company,
  roundIndex,
  roundId,
  questionInRound,
  history,
  currentRoundHistory,
  isOpening,
  askedIds,
  avoidPrompts,
  priorAttemptOffset,
}) {
  const track = trackFromCourse(course);
  const payload = {
    track,
    round_id: roundId,
    round_index: roundIndex,
    question_in_round: questionInRound,
    history,
    current_round_history: currentRoundHistory || [],
    is_opening: Boolean(isOpening),
    avoid_prompts: avoidPrompts || [],
    prior_attempt_offset: Number(priorAttemptOffset || 0),
    company: {
      name: company?.name,
      role: company?.role,
    },
    fresh_id: true,
  };

  let externalPlan = null;
  let externalQuestion = null;
  let externalReason = "";
  let usedModel = false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const response = await fetch("/ml/generate-adaptive-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await response.json();
    if (response.ok && data?.plan) {
      externalPlan = data.plan;
      usedModel = data.plan?.used_model === true;
    }
    if (response.ok && data?.question) {
      externalQuestion = normalizeMlQuestion(data.question);
      externalReason = data.reason || "";
      if (data.plan?.used_model === true) {
        usedModel = true;
      }
    }
  } catch {
    /* local generator runs below */
  }

  if (
    externalQuestion?.prompt &&
    !isDuplicatePrompt(externalQuestion.prompt, avoidPrompts)
  ) {
    return {
      question: externalQuestion,
      reason: externalReason || "ML-generated adaptive question",
      algorithm: usedModel ? "adaptive_question_model" : "adaptive_question_ml",
      usedModel,
    };
  }

  const local = generateAdaptiveQuestionLocal({
    ...payload,
    track,
    round_id: roundId,
    round_index: roundIndex,
    question_in_round: questionInRound,
    history,
    avoid_prompts: avoidPrompts || [],
    company: payload.company,
    external_plan: externalPlan,
  });

  if (local?.question && !isDuplicatePrompt(local.question.prompt, avoidPrompts)) {
    return {
      question: normalizeMlQuestion(local.question),
      reason: local.reason,
      algorithm: usedModel ? "adaptive_question_model" : local.algorithm,
      usedModel,
    };
  }

  const lastScore = (currentRoundHistory || history).length
    ? (currentRoundHistory || history)[(currentRoundHistory || history).length - 1]
        .score
    : 55;
  const level = preferredLevel(lastScore);
  const fallback = pickUniqueBankQuestion({
    track,
    roundId,
    level,
    askedIds,
    avoidPrompts,
    company,
    questionInRound,
    priorAttemptOffset,
  });
  if (!fallback) {
    return {
      question: null,
      reason: "Could not generate a unique question.",
      algorithm: "none",
    };
  }
  return {
    question: normalizeMlQuestion({
      ...fallback,
      generated: false,
    }),
    reason: `Unique bank question · ${level}`,
    algorithm: "bank_fallback",
    usedModel: false,
  };
}
