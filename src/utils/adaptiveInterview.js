import { pickForRound, pickRoundSet, getQuestionById, QUESTIONS } from "../data/interviewBank";
import { roundsForCourse, trackFromCourse } from "../data/tracks";

export { getQuestionById, QUESTIONS };
export { trackFromCourse } from "../data/tracks";

export const ROUND_COUNT = 4;
export const QUESTIONS_PER_ROUND = 15;
export const INTERVIEW_LENGTH = ROUND_COUNT * QUESTIONS_PER_ROUND;
export const ROUND_PASS_SCORE = 50;

export function interviewPosition(answeredCount) {
  const safe = Math.max(0, Number(answeredCount) || 0);
  const roundIndex = Math.min(
    ROUND_COUNT - 1,
    Math.floor(safe / QUESTIONS_PER_ROUND)
  );
  const questionInRound = (safe % QUESTIONS_PER_ROUND) + 1;
  return {
    roundIndex,
    roundNumber: roundIndex + 1,
    questionInRound,
    totalAnswered: safe,
  };
}

export function levelLabel(level) {
  if (level === "corporate") {
    return "Corporate";
  }
  if (level === "applied") {
    return "Applied";
  }
  return "Foundation";
}

export function typeLabel(type, course) {
  const round = roundsForCourse(course).find((item) => item.id === type);
  if (round) {
    return round.name;
  }
  if (type === "behavioral") {
    return "HR";
  }
  if (type === "system") {
    return "Technical";
  }
  return "Technical";
}

export function formatPrompt(question, company) {
  const name = company?.name || "the company";
  const role = company?.role || "this role";
  return String(question?.prompt || "")
    .replaceAll("{company}", name)
    .replaceAll("{role}", role);
}

export function preferredLevel(score) {
  if (score >= 75) {
    return "corporate";
  }
  if (score >= 50) {
    return "applied";
  }
  return "foundation";
}

export function pickRoundQuestions(course, roundIndex, askedIds, preferred) {
  const track = trackFromCourse(course);
  const rounds = roundsForCourse(course);
  const round = rounds[Math.max(0, Math.min(rounds.length - 1, roundIndex))];
  const questions = pickRoundSet(
    track,
    round.id,
    QUESTIONS_PER_ROUND,
    askedIds,
    preferred || "foundation"
  );
  return { round, questions };
}

export function roundAverage(records) {
  if (!records?.length) {
    return 0;
  }
  return Math.round(
    records.reduce((sum, item) => sum + Number(item.score || 0), 0) /
      records.length
  );
}

export function passedRound(average) {
  return Number(average || 0) >= ROUND_PASS_SCORE;
}

export function getOpeningQuestion(course, company) {
  const track = trackFromCourse(course);
  const rounds = roundsForCourse(course);
  const round = rounds[0];
  const question = pickForRound(track, round.id, "foundation", new Set());
  const companyName = company?.name || "this company";

  return {
    question,
    difficulty: levelLabel(question?.level),
    roundIndex: 0,
    roundName: round.name,
    questionInRound: 1,
    reason: `Round 1 of ${ROUND_COUNT} · ${round.name} at ${companyName}. Question 1 of ${QUESTIONS_PER_ROUND}. Answer all ${QUESTIONS_PER_ROUND}, then submit the round. You need ${ROUND_PASS_SCORE}% to open the next round.`,
  };
}

/** @deprecated Use ML `/generate-adaptive-question` via adaptiveQuestionsApi.js */
export function pickNextQuestion({
  analysis,
  askedIds,
  answers,
  course,
  company,
}) {
  const track = trackFromCourse(course);
  const rounds = roundsForCourse(course);
  const nextIndex = answers.length;
  const { roundIndex, roundNumber, questionInRound } = interviewPosition(nextIndex);
  const round = rounds[roundIndex] || rounds[rounds.length - 1];
  const score = analysis?.score || 0;
  const level = preferredLevel(score);
  const question = pickForRound(track, round.id, level, askedIds);
  const companyName = company?.name || "this company";
  const startingNewRound = questionInRound === 1 && nextIndex > 0;

  if (!question) {
    return {
      question: null,
      difficulty: levelLabel(level),
      roundIndex,
      roundName: round.name,
      questionInRound,
      reason: "No unused questions remain on this track.",
    };
  }

  let reason = `Round ${roundNumber} of ${ROUND_COUNT} · ${round.name} · question ${questionInRound} of ${QUESTIONS_PER_ROUND}. Last answer scored ${score}% → ${levelLabel(level)} difficulty at ${companyName}.`;
  if (startingNewRound) {
    reason = `New round: ${round.name} (${roundNumber} of ${ROUND_COUNT}). Question 1 of ${QUESTIONS_PER_ROUND}. Last score ${score}% → ${levelLabel(level)}.`;
  } else if (score >= 75) {
    reason = `Round ${roundNumber} of ${ROUND_COUNT} · ${round.name} · question ${questionInRound} of ${QUESTIONS_PER_ROUND}. Last score ${score}% (strong), so this question is corporate-level.`;
  } else if (score < 50) {
    reason = `Round ${roundNumber} of ${ROUND_COUNT} · ${round.name} · question ${questionInRound} of ${QUESTIONS_PER_ROUND}. Last score ${score}%, so we rebuild fundamentals.`;
  }

  return {
    question,
    difficulty: levelLabel(question.level),
    roundIndex,
    roundName: round.name,
    questionInRound,
    reason,
  };
}

export function scoreBand(score) {
  if (score >= 75) {
    return "strong";
  }
  if (score >= 50) {
    return "solid";
  }
  return "rebuild";
}

export function conversionChance({ readiness, overall, behavior, voice, answers }) {
  const base = Number(readiness || overall || 0);
  const integrity = behavior?.integrity || "not_monitored";
  const confidence = Number(behavior?.confidence || 0);
  const nervousness = Number(behavior?.nervousness || 0);
  const malpractice = Number(behavior?.cheating_risk || behavior?.malpractice || 0);
  const roundScores = (answers || []).map((item) => Number(item.score || 0));
  const roundAvg = roundScores.length
    ? roundScores.reduce((sum, value) => sum + value, 0) / roundScores.length
    : base;

  const byRoundName = {};
  (answers || []).forEach((item) => {
    const key = item.roundName || item.type || "Round";
    if (!byRoundName[key]) {
      byRoundName[key] = [];
    }
    byRoundName[key].push(Number(item.score || 0));
  });
  const roundSummaries = Object.entries(byRoundName).map(([name, scores]) => ({
    name,
    score: Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length),
  }));
  const weakestRound = [...roundSummaries].sort((a, b) => a.score - b.score)[0];

  let chance = 0.55 * roundAvg + 0.25 * base;
  if (behavior && integrity !== "not_monitored") {
    chance += 0.12 * confidence + 0.08 * Math.max(0, 100 - nervousness);
    if (integrity === "flagged" || malpractice >= 45) {
      chance -= 16;
    } else if (malpractice >= 25) {
      chance -= 8;
    }
  } else {
    chance += 4;
  }

  if (voice?.used) {
    const accent = Number(voice.accent || 0);
    const spoken =
      (Number(voice.fluency || 0) + Number(voice.accuracy || 0) + accent) / 3;
    chance = chance * 0.88 + spoken * 0.12;
  }

  chance = Math.round(Math.max(8, Math.min(92, chance)));

  let band = "Needs more prep";
  if (chance >= 72) {
    band = "Likely to advance this screen";
  } else if (chance >= 52) {
    band = "Borderline — close the weak round";
  }

  const why = [
    `Four-round average ${Math.round(roundAvg)}% (${QUESTIONS_PER_ROUND} questions each) and company readiness ${Math.round(base)}% set the base chance.`,
    voice?.used
      ? `Spoken fluency ${voice.fluency || 0}%, accuracy ${voice.accuracy || 0}%, and accent/clarity ${voice.accent || 0}% adjusted the estimate.`
      : "Voice was not scored, so the estimate relies on written rounds and camera (if used).",
    weakestRound
      ? `Weakest round: ${weakestRound.name} at ${weakestRound.score}%.`
      : `Complete all ${ROUND_COUNT} rounds (${QUESTIONS_PER_ROUND} questions each) for a sharper estimate.`,
  ];

  return { chance, band, why };
}
