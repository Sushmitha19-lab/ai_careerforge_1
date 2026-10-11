import argparse
import subprocess
import sys

import pandas as pd
import joblib
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent
GENERATOR = ROOT / "generate_adaptive_question_data.py"


def ensure_dataset(min_rows=500):
    data_path = ROOT / "adaptive_question_data.csv"
    if data_path.exists():
        existing = pd.read_csv(data_path)
        if len(existing) >= min_rows:
            return data_path
    print(f"Generating adaptive training data ({min_rows}+ rows)...")
    subprocess.check_call(
        [
            sys.executable,
            str(GENERATOR),
            "--rows",
            str(max(min_rows, 1500)),
        ],
        cwd=str(ROOT),
    )
    return data_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Regenerate adaptive_question_data.csv before training",
    )
    parser.add_argument("--rows", type=int, default=1500)
    args = parser.parse_args()

    if args.regenerate or not (ROOT / "adaptive_question_data.csv").exists():
        subprocess.check_call(
            [sys.executable, str(GENERATOR), "--rows", str(args.rows)],
            cwd=str(ROOT),
        )

    data_path = ensure_dataset()
    data = pd.read_csv(data_path)
    print("Training rows:", len(data))
    feature_cols = [
        "last_score",
        "avg_score",
        "missing_ratio",
        "pattern_score",
        "keyword_score",
        "round_index",
        "question_in_round",
        "track_code",
        "prev_level",
    ]
    X = data[feature_cols]
    y = data["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=16,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print("Adaptive question model accuracy:", round(acc * 100, 2), "%")
    print(classification_report(y_test, preds, zero_division=0))

    out = ROOT / "adaptive_question_model.pkl"
    joblib.dump(model, out)
    print("Saved", out)


if __name__ == "__main__":
    main()
