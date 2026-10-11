import { P } from "../data/patterns";

function resolvePatterns(raw) {
  return (raw || [])
    .map((item) => {
      if (item?.regex) {
        return item;
      }
      const id = typeof item === "string" ? item : item?.id;
      return id ? P[id] : null;
    })
    .filter(Boolean);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasTerm(text, term) {
  const haystack = text.toLowerCase();
  const needle = String(term).toLowerCase().trim();

  if (!needle) {
    return false;
  }

  if (needle.includes(" ") || /[^a-z0-9]/i.test(needle)) {
    return haystack.includes(needle);
  }

  return new RegExp(`\\b${escapeRegex(needle)}s?\\b`, "i").test(text);
}

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function completenessFromLength(text) {
  const words = wordCount(text);

  if (words === 0) {
    return 0;
  }
  if (words < 8) {
    return Math.min(52, 14 + words * 5);
  }
  if (words < 18) {
    return 62;
  }
  if (words < 35) {
    return 85;
  }
  return 100;
}

/** Structure and effort signals for free-form adaptive interview answers. */
function rubricScore(text) {
  const answer = String(text || "").trim();
  if (!answer) {
    return 0;
  }
  const words = wordCount(answer);
  const sentences = answer.split(/[.!?]+/).filter((part) => part.trim()).length;
  let score = 0;

  if (words >= 60) {
    score += 50;
  } else if (words >= 35) {
    score += 42;
  } else if (words >= 20) {
    score += 32;
  } else if (words >= 12) {
    score += 24;
  } else if (words >= 6) {
    score += 16;
  } else {
    score += words * 2;
  }

  if (sentences >= 3) {
    score += 12;
  } else if (sentences >= 2) {
    score += 8;
  }

  const signals =
    /\b(because|therefore|however|for example|such as|first|then|next|finally|approach|explain|would|implement|design|result|impact|metric|percent|ratio|latency|cache|database|algorithm|team|project)\b/i;
  const hits = (answer.match(signals) || []).length;
  score += Math.min(28, hits * 7);

  return Math.min(100, score);
}

export function evaluateAnswer(text, question) {
  const answer = text || "";
  const keywords = question?.keywords || [];
  const patterns = resolvePatterns(question?.patterns);

  const matchedKeywords = [];
  const missingKeywords = [];

  keywords.forEach((item) => {
    const terms = item.terms || [item.label];
    const matched = terms.some((term) => hasTerm(answer, term));

    if (matched) {
      matchedKeywords.push(item.label);
    } else {
      missingKeywords.push(item.label);
    }
  });

  const patternResults = patterns.map((item) => ({
    id: item.id,
    label: item.label,
    matched: item.regex.test(answer),
  }));

  const matchedPatterns = patternResults.filter((item) => item.matched);
  const keywordScore = keywords.length
    ? Math.round((matchedKeywords.length / keywords.length) * 100)
    : 0;
  const patternScore = patterns.length
    ? Math.round((matchedPatterns.length / patterns.length) * 100)
    : 0;
  const completeness = completenessFromLength(answer);
  const rubric = rubricScore(answer);
  const words = wordCount(answer);
  const isGenerated = question?.generated !== false;

  let score = 0;
  if (answer.trim()) {
    if (isGenerated || !keywords.length) {
      score = Math.round(
        keywordScore * 0.25 +
          patternScore * 0.2 +
          completeness * 0.2 +
          rubric * 0.35
      );
    } else {
      score = Math.round(
        keywordScore * 0.45 +
          patternScore * 0.3 +
          completeness * 0.15 +
          rubric * 0.1
      );
    }

    if (words >= 15 && score < 28) {
      score = Math.max(score, Math.round(rubric * 0.55 + completeness * 0.25));
    }
    if (words >= 30 && score < 40) {
      score = Math.max(score, Math.round(rubric * 0.65 + completeness * 0.2));
    }
    score = Math.min(100, score);
  }

  let strength = "Start typing";
  if (answer.trim()) {
    if (score >= 80) {
      strength = "Strong";
    } else if (score >= 65) {
      strength = "Good";
    } else if (score >= 45) {
      strength = "Developing";
    } else {
      strength = "Weak";
    }
  }

  return {
    score,
    keywordScore,
    patternScore,
    completeness,
    matchedKeywords,
    missingKeywords,
    patternResults,
    matchedPatternCount: matchedPatterns.length,
    patternCount: patterns.length,
    keywordCount: keywords.length,
    strength,
  };
}
