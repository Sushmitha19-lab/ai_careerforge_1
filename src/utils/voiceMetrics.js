export function tokenize(transcript) {
  return (transcript || "").toLowerCase().match(/[a-zA-Z']+/g) || [];
}

export function liveVoiceStats(transcript, durationSeconds) {
  const words = tokenize(transcript);
  const minutes = Math.max(Number(durationSeconds) || 0, 0) / 60;
  const wpm = minutes > 0 ? Math.round(words.length / minutes) : 0;

  return {
    wordCount: words.length,
    wpm: Math.min(wpm, 400),
  };
}
