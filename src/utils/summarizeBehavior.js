export function emptyBehavior() {
  return {
    used: false,
    samples: 0,
    confidence: 0,
    nervousness: 0,
    cheatingRisk: 0,
    integrity: "not_monitored",
    emotion: "unavailable",
    flags: [],
    notes: [
      "Camera analysis was not used during this interview.",
    ],
  };
}

export function summarizeBehavior(samples) {
  if (!samples.length) {
    return emptyBehavior();
  }

  const average = (key) =>
    Math.round(
      samples.reduce((sum, item) => sum + (item[key] || 0), 0) /
        samples.length
    );

  const confidence = average("confidence");
  const nervousness = average("nervousness");
  const cheatingRisk = average("cheating_risk");

  const flagCounts = {};
  const notes = [];

  samples.forEach((item) => {
    (item.flags || []).forEach((flag) => {
      flagCounts[flag] = (flagCounts[flag] || 0) + 1;
    });
    (item.reasons || []).forEach((reason) => {
      if (!notes.includes(reason)) {
        notes.push(reason);
      }
    });
  });

  const emotionCounts = {};
  samples.forEach((item) => {
    const emotion = item.emotion || "neutral";
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });

  const emotion = Object.entries(emotionCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  let integrity = "clear";
  if (
    cheatingRisk >= 55 ||
    (flagCounts.multiple_faces || 0) >= 2 ||
    (flagCounts.no_face || 0) >= Math.max(3, Math.floor(samples.length * 0.35))
  ) {
    integrity = "flagged";
  } else if (
    cheatingRisk >= 32 ||
    (flagCounts.looking_away || 0) >= 3 ||
    (flagCounts.looking_down || 0) >= 3
  ) {
    integrity = "warning";
  }

  return {
    used: true,
    samples: samples.length,
    confidence,
    nervousness,
    cheatingRisk,
    integrity,
    emotion,
    flags: Object.keys(flagCounts),
    flagCounts,
    notes: notes.slice(0, 5),
  };
}

export function integrityLabel(integrity) {
  if (integrity === "flagged") {
    return "Malpractice risk";
  }
  if (integrity === "warning") {
    return "Integrity caution";
  }
  if (integrity === "not_monitored") {
    return "Not monitored";
  }
  return "Integrity clear";
}

export function emotionLabel(emotion) {
  const labels = {
    confident: "Confident",
    nervous: "Nervous",
    suspicious: "Suspicious",
    neutral: "Neutral",
    unavailable: "Unavailable",
  };
  return labels[emotion] || "Neutral";
}
