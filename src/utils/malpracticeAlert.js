export const MAX_MALPRACTICE_DISMISSALS = 3;

export function isMultiPersonFrame(analysis) {
  if (!analysis) {
    return false;
  }
  const count = Number(analysis.face_count || 0);
  if (count >= 2) {
    return true;
  }
  return (analysis.flags || []).includes("multiple_faces");
}

export function malpracticeSpeechText(faceCount) {
  const people = Math.max(2, Number(faceCount || 2));
  return `Malpractice alert. ${people} people detected in the camera. Only you may remain in frame. Dismiss this alert only if the issue is fixed.`;
}

export function speakMalpracticeAlert(message) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.92;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* ignore TTS errors */
  }
}
