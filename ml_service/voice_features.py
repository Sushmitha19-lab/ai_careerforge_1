"""
Feature extraction for spoken-answer fluency and accuracy.

Fluency uses delivery signals: pace, fillers, repetition, vocabulary variety.
Accuracy uses content signals: keyword coverage, pattern coverage, speech confidence.
"""

import re


FEATURE_COLUMNS = [
    "word_count",
    "duration_seconds",
    "words_per_minute",
    "filler_ratio",
    "unique_ratio",
    "avg_word_length",
    "speech_confidence",
    "repetition_ratio",
    "pause_count",
    "keyword_score",
    "pattern_score",
]

FILLER_WORDS = {
    "um",
    "uh",
    "erm",
    "er",
    "ah",
    "hmm",
    "huh",
    "uhm",
}

FILLER_PHRASES = [
    "you know",
    "kind of",
    "kinda",
    "sort of",
    "i mean",
]


def tokenize(transcript):
    return re.findall(r"[a-zA-Z']+", (transcript or "").lower())


def count_fillers(transcript, words):
    text = " " + re.sub(r"[^a-zA-Z'\s]", " ", (transcript or "").lower()) + " "
    phrase_count = 0

    for phrase in FILLER_PHRASES:
        hits = len(re.findall(r"\b" + re.escape(phrase) + r"\b", text))
        phrase_count += hits
        text = re.sub(r"\b" + re.escape(phrase) + r"\b", " ", text)

    word_count = sum(1 for word in tokenize(text) if word in FILLER_WORDS)
    return phrase_count + word_count


def repetition_ratio(words):
    if len(words) < 2:
        return 0.0

    repeats = sum(
        1 for left, right in zip(words, words[1:]) if left == right
    )
    return repeats / (len(words) - 1)


def extract_features(
    transcript,
    duration_seconds=0,
    speech_confidence=0,
    keyword_score=0,
    pattern_score=0,
    pause_count=0,
):
    words = tokenize(transcript)
    word_count = len(words)
    duration = max(float(duration_seconds or 0), 0.0)
    minutes = duration / 60.0 if duration > 0 else 0.0
    wpm = (word_count / minutes) if minutes > 0 else 0.0
    fillers = count_fillers(transcript, words)
    filler_ratio = (fillers / word_count) if word_count else 0.0
    unique_ratio = (len(set(words)) / word_count) if word_count else 0.0
    avg_word_length = (
        sum(len(word) for word in words) / word_count if word_count else 0.0
    )

    features = {
        "word_count": float(word_count),
        "duration_seconds": round(duration, 2),
        "words_per_minute": round(min(wpm, 400.0), 2),
        "filler_ratio": round(min(filler_ratio, 1.0), 4),
        "unique_ratio": round(unique_ratio, 4),
        "avg_word_length": round(avg_word_length, 3),
        "speech_confidence": round(min(max(float(speech_confidence or 0), 0.0), 1.0), 4),
        "repetition_ratio": round(repetition_ratio(words), 4),
        "pause_count": float(max(int(pause_count or 0), 0)),
        "keyword_score": float(min(max(keyword_score or 0, 0), 100)),
        "pattern_score": float(min(max(pattern_score or 0, 0), 100)),
    }
    return features


def feature_row(features):
    return [features[name] for name in FEATURE_COLUMNS]


def fluency_notes(features, fluency_score, accuracy_score):
    notes = []
    wpm = features["words_per_minute"]

    if features["filler_ratio"] >= 0.08:
        notes.append("Too many filler words are hurting fluency.")
    if wpm and wpm < 90:
        notes.append("Speaking pace is slow. Aim for a steadier flow.")
    if wpm > 180:
        notes.append("Speaking pace is very fast, which can reduce clarity.")
    if features["repetition_ratio"] >= 0.12:
        notes.append("Repeated words are breaking the flow.")
    if features["speech_confidence"] < 0.55:
        notes.append("Speech recognition confidence is low. Enunciate more clearly.")
    if features["keyword_score"] < 50:
        notes.append("The spoken answer is missing important technical keywords.")
    if features["pattern_score"] < 40:
        notes.append("The answer structure is thin. Add a definition or example.")
    if fluency_score >= 75 and accuracy_score >= 75 and not notes:
        notes.append("Spoken delivery is fluent and the content is on-topic.")
    if features["speech_confidence"] < 0.6:
        notes.append("Accent/clarity is limited — the recognizer was not confident.")

    return notes[:4]


def fluency_label(score):
    if score >= 75:
        return "Fluent"
    if score >= 50:
        return "Average"
    return "Needs practice"


def heuristic_scores(features):
    wpm = features["words_per_minute"]
    wpm_score = max(0.0, 100.0 - abs(wpm - 145.0) * 0.65)
    filler_score = max(0.0, 100.0 - features["filler_ratio"] * 420.0)
    unique_score = features["unique_ratio"] * 100.0
    confidence_score = features["speech_confidence"] * 100.0
    repetition_penalty = features["repetition_ratio"] * 90.0
    pause_penalty = min(25.0, features["pause_count"] * 4.0)

    fluency = (
        0.28 * wpm_score
        + 0.24 * filler_score
        + 0.18 * unique_score
        + 0.16 * confidence_score
        + 0.14 * max(0.0, 100.0 - repetition_penalty)
        - pause_penalty * 0.35
    )
    accuracy = (
        0.48 * features["keyword_score"]
        + 0.32 * features["pattern_score"]
        + 0.20 * confidence_score
    )
    if features["word_count"] < 8:
        accuracy *= 0.72

    return (
        int(max(0, min(100, round(fluency)))),
        int(max(0, min(100, round(accuracy)))),
    )


def accent_score(features):
    """Intelligibility / accent-clarity proxy from ASR confidence and pace."""
    confidence_score = features["speech_confidence"] * 100.0
    wpm = features["words_per_minute"]
    pace_score = max(0.0, 100.0 - abs(wpm - 140.0) * 0.55) if wpm else 55.0
    filler_penalty = min(35.0, features["filler_ratio"] * 280.0)
    unique_score = features["unique_ratio"] * 100.0
    score = (
        0.55 * confidence_score
        + 0.25 * pace_score
        + 0.12 * unique_score
        - filler_penalty * 0.28
    )
    if features["word_count"] < 8:
        score *= 0.78
    return int(max(0, min(100, round(score))))


def accent_label(score):
    if score >= 75:
        return "Clear"
    if score >= 50:
        return "Understandable"
    return "Needs clearer speech"
