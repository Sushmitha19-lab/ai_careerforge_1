import hashlib
import json
import uuid
from pathlib import Path

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parent
FOLLOW_UP_BANK_PATH = ROOT.parent / "src" / "data" / "adaptive_follow_up_bank.json"


def _load_follow_up_sequences():
    try:
        with open(FOLLOW_UP_BANK_PATH, encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return {}


FOLLOW_UP_SEQUENCES = _load_follow_up_sequences()

LEVELS = ["foundation", "applied", "corporate"]
TRACKS = [
    "software",
    "ai",
    "cloud",
    "security",
    "fullstack",
    "mobile",
    "analytics",
    "ux",
    "devops",
    "data",
]

ROUND_IDS = ["aptitude", "coding", "technical", "hr"]

PATTERN_IDS = ["definition", "steps", "example", "tradeoff", "comparison", "metric", "business", "ownership"]


def _load_model():
    path = ROOT / "adaptive_question_model.pkl"
    if not path.exists():
        return None
    try:
        return joblib.load(path)
    except Exception:
        return None


def _track_code(track):
    key = str(track or "software").lower()
    if key in TRACKS:
        return TRACKS.index(key)
    return 0


def _level_code(level):
    key = str(level or "foundation").lower()
    if key in LEVELS:
        return LEVELS.index(key)
    return 0


def history_features(history, round_index, question_in_round, track):
    last = history[-1] if history else {}
    scores = [float(item.get("score") or 0) for item in history]
    last_score = float(last.get("score") or 55)
    avg_score = float(np.mean(scores)) if scores else 55.0
    missing = last.get("missingKeywords") or last.get("missing_keywords") or []
    matched = last.get("matchedKeywords") or last.get("matched_keywords") or []
    kw_total = max(1, len(missing) + len(matched))
    missing_ratio = len(missing) / kw_total
    pattern_score = float(last.get("patternScore") or last.get("pattern_score") or 50)
    keyword_score = float(last.get("keywordScore") or last.get("keyword_score") or 50)
    prev_level = _level_code(last.get("level") or "foundation")

    return np.array(
        [
            last_score,
            avg_score,
            missing_ratio * 100,
            pattern_score,
            keyword_score,
            float(round_index),
            float(question_in_round),
            float(_track_code(track)),
            float(prev_level),
        ],
        dtype=np.float64,
    )


def _heuristic_plan(features):
    last_score, avg_score, missing_ratio, *_rest = features
    if last_score >= 75 and avg_score >= 70 and missing_ratio <= 35:
        level = "corporate"
        gap_focus = 0
    elif last_score < 50 or missing_ratio >= 55:
        level = "foundation"
        gap_focus = 1
    elif last_score >= 50:
        level = "applied"
        gap_focus = 1 if missing_ratio >= 40 else 0
    else:
        level = "foundation"
        gap_focus = 1
    template_idx = (
        int(missing_ratio // 20)
        + int(last_score // 17)
        + int(avg_score // 19)
    ) % 3
    return level, gap_focus, template_idx


def _answer_snippet(answer, max_len=110):
    text = " ".join(str(answer or "").split())
    if not text:
        return ""
    if len(text) <= max_len:
        return text
    return text[:max_len] + "…"


def _pick_unique_follow_up(round_id, question_in_round, avoid_prompts, ctx):
    sequence = FOLLOW_UP_SEQUENCES.get(round_id) or FOLLOW_UP_SEQUENCES.get("technical") or []
    if not sequence:
        return (
            f"Interview question {question_in_round} for {ctx['company_name']}: "
            f"give a structured answer with definition, trade-off, and example.",
            -1,
        )
    attempt_shift = int(ctx.get("attempt_offset") or 0)
    primary_index = (max(0, question_in_round - 2) + attempt_shift) % max(
        1, len(sequence)
    )
    normalized_avoid = {
        str(item or "").strip().lower() for item in (avoid_prompts or [])
    }
    for offset in range(len(sequence)):
        index = (primary_index + offset) % len(sequence)
        template = sequence[index]
        prompt = (
            template.replace("{{company}}", ctx["company_name"])
            .replace("{company}", ctx["company_name"])
            .replace("{role}", ctx["role"])
            .replace("{gaps}", "structured reasoning")
        )
        key = prompt.strip().lower()
        if key not in normalized_avoid:
            return prompt, index
    prompt = (
        f"Interview question {question_in_round} for a {ctx['role']} at "
        f"{ctx['company_name']}: give a structured answer with definition, trade-off, and example."
    )
    return prompt, -1


def predict_plan(history, round_index, question_in_round, track):
    features = history_features(history, round_index, question_in_round, track)
    model = _load_model()
    used_model = False
    level = "foundation"
    gap_focus = 0
    template_idx = 0

    if model is not None:
        try:
            label = model.predict([features])[0]
            parts = str(label).split("|")
            if len(parts) >= 3:
                level = parts[0] if parts[0] in LEVELS else "applied"
                gap_focus = int(parts[1])
                template_idx = int(parts[2])
                used_model = True
        except Exception:
            pass

    if not used_model:
        level, gap_focus, template_idx = _heuristic_plan(features)

    return {
        "level": level,
        "gap_focus": gap_focus,
        "template_idx": template_idx,
        "features": features.tolist(),
        "used_model": used_model,
    }


def _kw(label, *terms):
    return {"label": label, "terms": list(terms) if terms else [label]}


# Template bank: model picks level + index; text adapts to prior gaps.
TEMPLATE_BANK = {
    ("software", "aptitude"): [
        {
            "foundation": "You are estimating timelines at {{company}}. A task was 30% faster than planned but scope grew 15%. How do you explain the net impact to a manager?",
            "applied": "Two pipelines finish jobs in 6 and 9 hours. How do you schedule them on one machine for minimum makespan, and what did your last answer miss about {gaps}?",
            "corporate": "Leadership wants a single KPI for engineering velocity at {{company}}. Propose one metric, its failure modes, and how you would validate it.",
        },
        {
            "foundation": "Rebuild the percentage reasoning from your previous answer: if success rate drops from 80% to 64%, is that a 16-point or 20% drop? Show the math.",
            "applied": "Given a table of conversion rates by cohort, how do you spot Simpson's paradox before presenting to {{company}}?",
            "corporate": "A/B test shows +2% lift but p=0.08. How do you recommend shipping (or not) for a {role} team?",
        },
        {
            "foundation": "Practice unit consistency: convert 45 minutes and 750 MB/s into a single throughput story for a status update.",
            "applied": "Estimate memory for 2M active sessions with 4 KB each, plus 25% overhead. Where could your last explanation be clearer on {gaps}?",
            "corporate": "You must forecast Q4 hiring needs from ticket backlog growth. Outline assumptions and risks for {{company}}.",
        },
    ],
    ("software", "coding"): [
        {
            "foundation": "Without code on screen, explain how you would detect a cycle in a linked list and why your prior answer should mention {gaps}.",
            "applied": "Design an LRU cache API for {{company}} services. What invariants and complexity bounds do you state?",
            "corporate": "A hot path does N queries per request. How do you batch or cache safely under stale reads?",
        },
        {
            "foundation": "Walk through binary search preconditions again and give one counterexample if {gaps} were ignored.",
            "applied": "Given streaming integers, describe an O(n) algorithm for the longest consecutive sequence.",
            "corporate": "Refactor a monolith endpoint that mixes auth, validation, and DB access. What module boundaries do you draw?",
        },
        {
            "foundation": "Explain Big-O for nested loops with early exit, tying back to {gaps} from your last response.",
            "applied": "How would you test a payment idempotency key handler?",
            "corporate": "Design a rate limiter for {{company}} public APIs with burst traffic.",
        },
    ],
    ("software", "technical"): [
        {
            "foundation": "Compare SQL vs NoSQL for a {role} feature at {{company}}. Address {gaps} explicitly.",
            "applied": "Sketch a read-heavy feed architecture with cache and CDN. Where is consistency relaxed?",
            "corporate": "During deploys, p99 latency spikes. List observability signals and mitigation playbooks.",
        },
        {
            "foundation": "Explain CAP in one paragraph using a concrete {{company}} scenario.",
            "applied": "How do you shard a table by tenant without hot partitions?",
            "corporate": "Design multi-region failover with RPO/RTO targets for a billing service.",
        },
        {
            "foundation": "Describe HTTP caching headers and a bug if {gaps} are misunderstood.",
            "applied": "What is your approach to schema migrations with zero downtime?",
            "corporate": "A microservice fan-out causes retry storms. How do you fix it?",
        },
    ],
    ("software", "hr"): [
        {
            "foundation": "Tell a 90-second story about learning from failure for a {role} at {{company}}. Include {gaps} themes if they fit.",
            "applied": "Describe disagreeing with a senior engineer and the outcome.",
            "corporate": "How do you communicate a slip on a committed date without losing trust?",
        },
        {
            "foundation": "Why {{company}} and why this {role} now? Structure past → present → future.",
            "applied": "Give an example of mentoring someone junior on code quality.",
            "corporate": "How do you prioritize tech debt when product pressure is high?",
        },
        {
            "foundation": "Explain a project where you measured impact with numbers.",
            "applied": "How do you handle unclear requirements from product?",
            "corporate": "Tell me about influencing without authority across teams.",
        },
    ],
}


def _default_bank(track, round_id):
    generic = TEMPLATE_BANK.get(("software", round_id))
    if generic:
        return generic
    return [
        {
            "foundation": "Explain a core concept for {role} at {{company}} and cover {gaps} from your last answer.",
            "applied": "Apply that concept to a realistic scenario at {{company}}.",
            "corporate": "How would you scale and monitor this in production for {{company}}?",
        }
    ]


def _keywords_for(round_id, level, gap_focus, missing):
    base = {
        "aptitude": [
            _kw("reasoning", "because", "therefore", "assume"),
            _kw("numbers", "percent", "ratio", "estimate"),
            _kw("check", "verify", "units", "sanity"),
        ],
        "coding": [
            _kw("complexity", "o(n)", "time", "space"),
            _kw("structure", "array", "hash", "tree"),
            _kw("edge", "empty", "duplicate", "null"),
        ],
        "technical": [
            _kw("trade-off", "latency", "consistency", "scale"),
            _kw("design", "api", "database", "cache"),
            _kw("reliability", "monitor", "alert", "rollback"),
        ],
        "hr": [
            _kw("situation", "context", "team"),
            _kw("action", "i", "we", "did"),
            _kw("result", "impact", "learned", "metric"),
        ],
    }.get(
        round_id,
        [
            _kw("concept", "explain", "define"),
            _kw("example", "for example", "such as"),
            _kw("trade-off", "however", "because"),
        ],
    )

    if gap_focus and missing:
        for label in missing[:3]:
            base.append(_kw(label, label.replace("-", " ")))
    if level == "corporate":
        base.append(_kw("business", "customer", "stakeholder", "risk"))
    return base[:6]


def _patterns_for(round_id, level):
    if round_id == "hr":
        return ["ownership", "steps", "business"]
    if round_id == "coding":
        return ["definition", "steps", "example"]
    if round_id == "aptitude":
        return ["steps", "example", "definition"]
    if level == "corporate":
        return ["metric", "tradeoff", "business"]
    return ["definition", "tradeoff", "steps"]


def _gap_phrase(missing):
    if not missing:
        return "fundamentals"
    cleaned = [str(item).replace("_", " ") for item in missing[:3]]
    return ", ".join(cleaned)


def _stable_id(track, round_id, prompt):
    digest = hashlib.sha1(f"{track}:{round_id}:{prompt}".encode("utf-8")).hexdigest()[:10]
    return f"ml-{track[:2]}-{round_id[:2]}-{digest}"


OPENING_PROMPTS = {
    "aptitude": (
        "For a {role} role at {{company}}, solve this: a price drops 25%, then rises 20%. "
        "Is the final price back to the start? Show the math and one real-world trap."
    ),
    "coding": (
        "Explain how you would solve Two Sum for {{company}} interview prep: "
        "approach, time/space complexity, and one edge case."
    ),
    "technical": (
        "For {{company}}, compare when you would choose a relational database "
        "versus a cache for a read-heavy feature."
    ),
    "hr": (
        "In 90 seconds, introduce yourself for a {role} position at {{company}}: "
        "education, one project, and why this role."
    ),
}


def generate_question(payload):
    if payload.get("is_opening"):
        track = str(payload.get("track") or "software").lower()
        round_id = str(payload.get("round_id") or "aptitude").lower()
        company = payload.get("company") or {}
        role = company.get("role") or payload.get("role") or "this role"
        company_name = company.get("name") or payload.get("company_name") or "the company"
        template = OPENING_PROMPTS.get(round_id) or OPENING_PROMPTS["technical"]
        prompt = (
            template.replace("{{company}}", company_name)
            .replace("{company}", company_name)
            .replace("{role}", role)
        )
        if payload.get("fresh_id"):
            question_id = f"ml-{uuid.uuid4().hex[:12]}"
        else:
            question_id = _stable_id(track, round_id, prompt)
        return {
            "ok": True,
            "question": {
                "id": question_id,
                "track": track,
                "round": round_id,
                "topic": round_id,
                "level": "foundation",
                "type": round_id,
                "prompt": prompt,
                "keywords": _keywords_for(round_id, "foundation", 0, []),
                "patterns": _patterns_for(round_id, "foundation"),
                "generated": True,
                "followUps": {"strong": [], "gaps": {}},
            },
            "plan": {"level": "foundation", "gap_focus": 0, "used_model": False},
            "reason": "Opening question for this round. Your answer drives the next question.",
            "algorithm": "opening",
        }

    track = str(payload.get("track") or "software").lower()
    round_id = str(payload.get("round_id") or "aptitude").lower()
    if round_id not in ROUND_IDS:
        round_id = "technical"
    round_index = int(payload.get("round_index") or 0)
    question_in_round = int(payload.get("question_in_round") or 1)
    history = payload.get("history") or []
    current_round = payload.get("current_round_history") or []
    adaptation = current_round if current_round else history
    company = payload.get("company") or {}
    role = company.get("role") or payload.get("role") or "this role"
    company_name = company.get("name") or payload.get("company_name") or "the company"

    plan = predict_plan(
        adaptation if adaptation else history,
        round_index,
        question_in_round,
        track,
    )
    level = plan["level"]
    gap_focus = plan["gap_focus"]

    last = adaptation[-1] if adaptation else {}
    missing = last.get("missingKeywords") or last.get("missing_keywords") or []
    gaps = _gap_phrase(missing)
    avoid_prompts = payload.get("avoid_prompts") or []

    prompt, template_index = _pick_unique_follow_up(
        round_id,
        question_in_round,
        avoid_prompts,
        {
            "company_name": company_name,
            "role": role,
            "gaps": gaps,
            "attempt_offset": int(payload.get("prior_attempt_offset") or 0),
        },
    )

    question_id = payload.get("seed_id") or _stable_id(track, round_id, prompt)
    if payload.get("fresh_id"):
        question_id = f"ml-{uuid.uuid4().hex[:12]}"

    keywords = _keywords_for(round_id, level, gap_focus, missing)
    patterns = _patterns_for(round_id, level)

    last_score = int(last.get("score") or 0)
    reason_parts = [
        f"Generated question {question_in_round}",
        f"{level} difficulty",
        f"topic slot {template_index + 1}",
    ]
    if plan["used_model"]:
        reason_parts.append("pre-trained selector model")
    else:
        reason_parts.append("heuristic selector")

    return {
        "ok": True,
        "question": {
            "id": question_id,
            "track": track,
            "round": round_id,
            "topic": round_id,
            "level": level,
            "type": round_id,
            "prompt": prompt,
            "keywords": keywords,
            "patterns": patterns,
            "generated": True,
            "followUps": {"strong": [], "gaps": {}},
        },
        "plan": plan,
        "reason": ". ".join(reason_parts) + ".",
        "algorithm": "adaptive_question_model" if plan["used_model"] else "heuristic",
    }
