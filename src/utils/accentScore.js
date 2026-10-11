export function localAccentScore({
  confidence = 0.7,
  wpm = 0,
  fillerRatio = 0,
  wordCount = 0,
}) {
  const confidenceScore = Math.max(0, Math.min(100, Number(confidence) * 100));
  const pace = Number(wpm) || 0;
  const paceScore = pace
    ? Math.max(0, 100 - Math.abs(pace - 140) * 0.55)
    : 55;
  const fillerPenalty = Math.min(35, Number(fillerRatio || 0) * 280);
  let score =
    0.58 * confidenceScore + 0.28 * paceScore + 0.14 * 70 - fillerPenalty * 0.35;
  if (wordCount && wordCount < 8) {
    score *= 0.78;
  }
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function accentLabel(score) {
  if (score >= 75) {
    return "Clear";
  }
  if (score >= 50) {
    return "Understandable";
  }
  return "Needs clearer speech";
}
