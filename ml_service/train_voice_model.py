"""
Train spoken fluency + accuracy models.

Algorithm: Random Forest and Gradient Boosting regression.
The better average R^2 model is saved for the interview voice endpoint.
"""

import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.multioutput import MultiOutputRegressor

from voice_features import FEATURE_COLUMNS


def teacher_fluency(row):
    wpm = row["words_per_minute"]
    wpm_score = max(0.0, 100.0 - abs(wpm - 145.0) * 0.65)
    filler_score = max(0.0, 100.0 - row["filler_ratio"] * 420.0)
    unique_score = row["unique_ratio"] * 100.0
    confidence_score = row["speech_confidence"] * 100.0
    repetition_penalty = row["repetition_ratio"] * 90.0
    pause_penalty = min(25.0, row["pause_count"] * 4.0)

    score = (
        0.28 * wpm_score
        + 0.24 * filler_score
        + 0.18 * unique_score
        + 0.16 * confidence_score
        + 0.14 * max(0.0, 100.0 - repetition_penalty)
        - pause_penalty * 0.35
    )
    return float(np.clip(score, 0, 100))


def teacher_accuracy(row):
    score = (
        0.48 * row["keyword_score"]
        + 0.32 * row["pattern_score"]
        + 0.20 * row["speech_confidence"] * 100.0
    )
    if row["word_count"] < 8:
        score *= 0.72
    return float(np.clip(score, 0, 100))


def generate_training_data(rows=480, seed=42):
    rng = np.random.default_rng(seed)
    records = []

    for _ in range(rows):
        profile = rng.choice(
            ["fluent", "average", "hesitant", "rushed", "inaccurate"],
            p=[0.22, 0.28, 0.2, 0.15, 0.15],
        )

        if profile == "fluent":
            word_count = rng.integers(28, 90)
            duration = word_count / rng.uniform(125, 165) * 60
            filler_ratio = rng.uniform(0.0, 0.04)
            unique_ratio = rng.uniform(0.62, 0.92)
            confidence = rng.uniform(0.78, 0.99)
            repetition = rng.uniform(0.0, 0.05)
            pause_count = rng.integers(0, 3)
            keyword_score = rng.uniform(70, 100)
            pattern_score = rng.uniform(65, 100)
        elif profile == "average":
            word_count = rng.integers(16, 70)
            duration = word_count / rng.uniform(100, 155) * 60
            filler_ratio = rng.uniform(0.03, 0.09)
            unique_ratio = rng.uniform(0.48, 0.78)
            confidence = rng.uniform(0.6, 0.88)
            repetition = rng.uniform(0.02, 0.1)
            pause_count = rng.integers(1, 5)
            keyword_score = rng.uniform(45, 82)
            pattern_score = rng.uniform(35, 80)
        elif profile == "hesitant":
            word_count = rng.integers(8, 45)
            duration = word_count / rng.uniform(55, 95) * 60
            filler_ratio = rng.uniform(0.08, 0.22)
            unique_ratio = rng.uniform(0.32, 0.62)
            confidence = rng.uniform(0.35, 0.7)
            repetition = rng.uniform(0.08, 0.22)
            pause_count = rng.integers(3, 9)
            keyword_score = rng.uniform(25, 70)
            pattern_score = rng.uniform(15, 60)
        elif profile == "rushed":
            word_count = rng.integers(20, 80)
            duration = word_count / rng.uniform(185, 250) * 60
            filler_ratio = rng.uniform(0.02, 0.08)
            unique_ratio = rng.uniform(0.4, 0.72)
            confidence = rng.uniform(0.5, 0.85)
            repetition = rng.uniform(0.03, 0.12)
            pause_count = rng.integers(0, 3)
            keyword_score = rng.uniform(40, 88)
            pattern_score = rng.uniform(30, 80)
        else:
            word_count = rng.integers(10, 60)
            duration = word_count / rng.uniform(90, 160) * 60
            filler_ratio = rng.uniform(0.02, 0.12)
            unique_ratio = rng.uniform(0.4, 0.8)
            confidence = rng.uniform(0.4, 0.8)
            repetition = rng.uniform(0.02, 0.12)
            pause_count = rng.integers(1, 6)
            keyword_score = rng.uniform(5, 42)
            pattern_score = rng.uniform(0, 40)

        avg_word_length = float(rng.uniform(3.4, 6.2))
        row = {
            "word_count": float(word_count),
            "duration_seconds": round(float(duration), 2),
            "words_per_minute": round(word_count / max(duration / 60.0, 1e-6), 2),
            "filler_ratio": round(float(filler_ratio), 4),
            "unique_ratio": round(float(unique_ratio), 4),
            "avg_word_length": round(avg_word_length, 3),
            "speech_confidence": round(float(confidence), 4),
            "repetition_ratio": round(float(repetition), 4),
            "pause_count": float(pause_count),
            "keyword_score": round(float(keyword_score), 2),
            "pattern_score": round(float(pattern_score), 2),
        }
        row["fluency_score"] = round(
            teacher_fluency(row) + float(rng.normal(0, 3.2)),
            2,
        )
        row["accuracy_score"] = round(
            teacher_accuracy(row) + float(rng.normal(0, 3.0)),
            2,
        )
        row["fluency_score"] = float(np.clip(row["fluency_score"], 0, 100))
        row["accuracy_score"] = float(np.clip(row["accuracy_score"], 0, 100))
        records.append(row)

    return pd.DataFrame(records)


def evaluate_model(name, model, X_test, y_test):
    predicted = model.predict(X_test)
    fluency_r2 = r2_score(y_test[:, 0], predicted[:, 0])
    accuracy_r2 = r2_score(y_test[:, 1], predicted[:, 1])
    fluency_mae = mean_absolute_error(y_test[:, 0], predicted[:, 0])
    accuracy_mae = mean_absolute_error(y_test[:, 1], predicted[:, 1])
    average_r2 = (fluency_r2 + accuracy_r2) / 2.0

    print(f"\n{name}")
    print(f"  Fluency R2:  {fluency_r2:.3f}  MAE: {fluency_mae:.2f}")
    print(f"  Accuracy R2: {accuracy_r2:.3f}  MAE: {accuracy_mae:.2f}")
    print(f"  Average R2:  {average_r2:.3f}")

    return average_r2


def main():
    data = generate_training_data()
    data.to_csv("voice_fluency_data.csv", index=False)
    print("Saved voice_fluency_data.csv")
    print("Rows:", len(data))

    X = data[FEATURE_COLUMNS]
    y = data[["fluency_score", "accuracy_score"]]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
    )

    candidates = {
        "RandomForest": MultiOutputRegressor(
            RandomForestRegressor(
                n_estimators=160,
                max_depth=12,
                min_samples_leaf=2,
                random_state=42,
            )
        ),
        "GradientBoosting": MultiOutputRegressor(
            GradientBoostingRegressor(
                n_estimators=180,
                learning_rate=0.08,
                max_depth=3,
                random_state=42,
            )
        ),
    }

    trained = {}
    scores = {}

    for name, model in candidates.items():
        model.fit(X_train, y_train)
        trained[name] = model
        scores[name] = evaluate_model(
            name,
            model,
            X_test.to_numpy(),
            y_test.to_numpy(),
        )

    winner_name = max(scores, key=scores.get)
    winner = trained[winner_name]

    joblib.dump(winner, "voice_fluency_model.pkl")
    joblib.dump(
        {
            "algorithm": winner_name,
            "features": FEATURE_COLUMNS,
            "targets": ["fluency_score", "accuracy_score"],
        },
        "voice_fluency_meta.pkl",
    )

    print(f"\nSaved voice_fluency_model.pkl using {winner_name}")


if __name__ == "__main__":
    main()
