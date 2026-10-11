/** Remove meta-text about prior answers from generated prompts (scoring still uses history). */
export function sanitizeQuestionPrompt(prompt) {
  return String(prompt || "")
    .replace(/^Building on your last response[^:]*:\s*/i, "")
    .replace(/\(Focus areas from your last answer[^)]*\)\.?\s*/gi, "")
    .replace(/\s*Strengthen: [^.]+\.\s*/gi, "")
    .replace(/\s*where did your last answer[^?]*\?\s*/gi, " ")
    .replace(/\s*from your last answer[^.]*\.?\s*/gi, " ")
    .replace(/\s*from your prior answer[^.]*\.?\s*/gi, " ")
    .replace(/\s*what did your last answer miss[^?]*\?\s*/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function promptKey(prompt) {
  return sanitizeQuestionPrompt(prompt).trim().toLowerCase();
}

export function isDuplicatePrompt(prompt, avoidPrompts) {
  const key = promptKey(prompt);
  if (!key) {
    return false;
  }
  return (avoidPrompts || []).some(
    (item) => promptKey(item) === key
  );
}
