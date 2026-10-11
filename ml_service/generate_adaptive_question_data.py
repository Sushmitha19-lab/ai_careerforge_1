"""
Generate synthetic training rows for adaptive_question_model.pkl.

Labels match ml_service/adaptive_questions.py heuristic plan:
  level|gap_focus|template_idx
"""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
LEVELS = ["foundation", "applied", "corporate"]


def teacher_label(row):
    last_score = float(row["last_score"])
    avg_score = float(row["avg_score"])
    missing_ratio = float(row["missing_ratio"])

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
        + int(row["question_in_round"] // 5)
    ) % 3

    return f"{level}|{gap_focus}|{template_idx}"


def generate_rows(count, seed=42):
    rng = np.random.default_rng(seed)
    records = []

    profiles = [
        "strong",
        "average",
        "weak",
        "gap_heavy",
        "improving",
        "inconsistent",
    ]
    profile_weights = [0.18, 0.28, 0.22, 0.14, 0.1, 0.08]

    for _ in range(count):
        profile = rng.choice(profiles, p=profile_weights)
        round_index = int(rng.integers(0, 4))
        question_in_round = int(rng.integers(1, 16))
        track_code = int(rng.integers(0, 10))
        prev_level = int(rng.integers(0, 3))

        if profile == "strong":
            last_score = float(rng.integers(72, 100))
            avg_score = float(np.clip(last_score + rng.normal(0, 6), 55, 100))
            missing_ratio = float(rng.uniform(5, 38))
            pattern_score = float(rng.integers(65, 100))
            keyword_score = float(rng.integers(68, 100))
        elif profile == "average":
            last_score = float(rng.integers(48, 78))
            avg_score = float(np.clip(last_score + rng.normal(0, 8), 35, 85))
            missing_ratio = float(rng.uniform(25, 52))
            pattern_score = float(rng.integers(40, 75))
            keyword_score = float(rng.integers(38, 72))
        elif profile == "weak":
            last_score = float(rng.integers(8, 48))
            avg_score = float(np.clip(last_score + rng.normal(0, 10), 5, 55))
            missing_ratio = float(rng.uniform(48, 85))
            pattern_score = float(rng.integers(10, 45))
            keyword_score = float(rng.integers(8, 42))
        elif profile == "gap_heavy":
            last_score = float(rng.integers(35, 65))
            avg_score = float(np.clip(last_score + rng.normal(-5, 8), 20, 70))
            missing_ratio = float(rng.uniform(55, 90))
            pattern_score = float(rng.integers(20, 55))
            keyword_score = float(rng.integers(15, 50))
        elif profile == "improving":
            last_score = float(rng.integers(58, 88))
            avg_score = float(np.clip(last_score - rng.uniform(5, 18), 30, 80))
            missing_ratio = float(rng.uniform(18, 45))
            pattern_score = float(rng.integers(45, 80))
            keyword_score = float(rng.integers(42, 78))
        else:
            last_score = float(rng.integers(30, 90))
            avg_score = float(rng.uniform(35, 75))
            missing_ratio = float(rng.uniform(20, 70))
            pattern_score = float(rng.integers(25, 85))
            keyword_score = float(rng.integers(20, 88))

        row = {
            "last_score": round(last_score, 1),
            "avg_score": round(avg_score, 1),
            "missing_ratio": round(missing_ratio, 1),
            "pattern_score": round(pattern_score, 1),
            "keyword_score": round(keyword_score, 1),
            "round_index": round_index,
            "question_in_round": question_in_round,
            "track_code": track_code,
            "prev_level": prev_level,
        }
        row["label"] = teacher_label(row)
        records.append(row)

    return pd.DataFrame(records)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--rows",
        type=int,
        default=1500,
        help="Number of synthetic training rows (default 1500)",
    )
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--out",
        type=str,
        default=str(ROOT / "adaptive_question_data.csv"),
    )
    args = parser.parse_args()

    df = generate_rows(args.rows, seed=args.seed)
    out_path = Path(args.out)
    df.to_csv(out_path, index=False)
    print(f"Wrote {len(df)} rows to {out_path}")
    print("Label distribution (top 10):")
    print(df["label"].value_counts().head(10).to_string())


if __name__ == "__main__":
    main()
