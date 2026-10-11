import catalog from "../data/catalog.json";
import { resourcesForRound } from "../data/practiceResources";
import { trackFromCourse } from "../data/tracks";
import { emotionLabel, integrityLabel } from "./summarizeBehavior";

const RELATED_TRACKS = {
  aptitude: ["analytics", "software"],
  coding: ["software", "fullstack", "database"],
  technical: {
    software: ["fullstack", "database"],
    ai: ["analytics", "software"],
    cloud: ["security", "software"],
    security: ["cloud", "software"],
    fullstack: ["software", "ux"],
    mobile: ["fullstack", "software"],
    analytics: ["ai", "database"],
    ux: ["fullstack", "software"],
    qa: ["software", "fullstack"],
    database: ["software", "analytics"],
  },
  hr: ["ux", "software"],
};

function avg(values) {
  const numbers = values.filter((value) => typeof value === "number");
  if (!numbers.length) {
    return null;
  }
  return Math.round(
    numbers.reduce((sum, value) => sum + value, 0) / numbers.length
  );
}

function blend(left, right, leftWeight = 0.6) {
  if (left == null && right == null) {
    return null;
  }
  if (left == null) {
    return right;
  }
  if (right == null) {
    return left;
  }
  return Math.round(left * leftWeight + right * (1 - leftWeight));
}

function courseByTrack(track) {
  return catalog.courses.find((item) => item.track === track) || null;
}

export function meterTone(value, invert = false) {
  const score = invert ? 100 - (value || 0) : value || 0;
  if (score >= 70) {
    return "good";
  }
  if (score >= 45) {
    return "warn";
  }
  return "risk";
}

export function buildRoundFeedback({
  answers = [],
  behavior,
  course,
  roundId = "technical",
}) {
  const track = trackFromCourse(course);
  const keywordAccuracy = avg(answers.map((item) => item.keywordScore));
  const patternAccuracy = avg(answers.map((item) => item.patternScore));
  const answerAccuracy =
    blend(keywordAccuracy, patternAccuracy) ??
    avg(answers.map((item) => item.score)) ??
    0;
  const voiceAccuracy = avg(
    answers
      .filter((item) => typeof item.voiceAccuracy === "number")
      .map((item) => item.voiceAccuracy)
  );
  const voiceFluency = avg(
    answers
      .filter((item) => typeof item.voiceFluency === "number")
      .map((item) => item.voiceFluency)
  );
  const voiceAccent = avg(
    answers
      .filter((item) => typeof item.voiceAccent === "number")
      .map((item) => item.voiceAccent)
  );

  let face = null;
  if (behavior) {
    face = behavior.used
      ? {
          used: true,
          confidence: behavior.confidence,
          nervousness: behavior.nervousness,
          cheatingRisk: behavior.cheatingRisk,
          integrity: behavior.integrity,
          integrityLabel: integrityLabel(behavior.integrity),
          emotion: emotionLabel(behavior.emotion),
          notes: behavior.notes || [],
          samples: behavior.samples || 0,
          noFace: behavior.flagCounts?.no_face || 0,
          extraFaces: behavior.flagCounts?.multiple_faces || 0,
          lookingAway: behavior.flagCounts?.looking_away || 0,
        }
      : {
          used: false,
          confidence: 0,
          nervousness: 0,
          cheatingRisk: 0,
          integrity: "not_monitored",
          integrityLabel: integrityLabel("not_monitored"),
          emotion: "Unavailable",
          notes: [
            "Camera was off this round. Turn it on for face-detection feedback.",
          ],
          samples: 0,
          noFace: 0,
          extraFaces: 0,
          lookingAway: 0,
        };
  }

  const weakKeywords = [
    ...new Set(answers.flatMap((item) => item.missingKeywords || [])),
  ].slice(0, 6);

  const current = courseByTrack(track);
  const relatedIds =
    roundId === "technical"
      ? RELATED_TRACKS.technical[track] || RELATED_TRACKS.coding
      : RELATED_TRACKS[roundId] || RELATED_TRACKS.coding;

  const suggested = [];
  const seen = new Set();
  const pushCourse = (item, reason) => {
    if (!item || seen.has(item.id) || suggested.length >= 3) {
      return;
    }
    seen.add(item.id);
    suggested.push({
      id: item.id,
      name: item.name,
      description: item.description,
      reason,
      href: "/courses",
    });
  };

  if (current) {
    const reason =
      answerAccuracy < 50
        ? `This ${roundId} round scored ${answerAccuracy}%. Stay in ${current.name} and drill the missed topics.`
        : answerAccuracy < 70
          ? `${current.name} still needs work — answer accuracy was ${answerAccuracy}%.`
          : `Keep ${current.name} as your main track. This round’s accuracy was ${answerAccuracy}%.`;
    pushCourse(current, reason);
  }

  const needsHelp = answerAccuracy < 70;
  relatedIds.forEach((relatedTrack) => {
    const item = courseByTrack(relatedTrack);
    if (!item || item.id === current?.id) {
      return;
    }
    if (!needsHelp && suggested.length >= 2) {
      return;
    }
    pushCourse(
      item,
      needsHelp
        ? `Weak ${roundId} result — ${item.name} covers overlapping skills.`
        : `Optional pairing: ${item.name} strengthens this round.`
    );
  });

  if (
    face &&
    (face.integrity === "flagged" || face.integrity === "warning") &&
    current
  ) {
    pushCourse(
      current,
      "Face-detection flags were raised. Retake facing the camera, one person in frame."
    );
  }

  const resources = resourcesForRound(track, roundId).slice(0, 3);

  return {
    answerAccuracy,
    keywordAccuracy: keywordAccuracy ?? 0,
    patternAccuracy: patternAccuracy ?? 0,
    voiceAccuracy,
    voiceFluency,
    voiceAccent,
    face,
    weakKeywords,
    courses: suggested.slice(0, 3),
    resources,
  };
}
