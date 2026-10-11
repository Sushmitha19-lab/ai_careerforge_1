# CareerForge ML training data and models

All training CSVs and shipped model files live in this folder (`ml_service/`). Retrain from here:

```text
py -3 train_model.py
py -3 train_voice_model.py
py -3 generate_adaptive_question_data.py --rows 1500
py -3 train_adaptive_questions.py --regenerate --rows 1500
```

Both trainers use an 80/20 split (`random_state=42`).

## Training data

| File | Rows | Source | Features | Label |
| --- | ---: | --- | --- | --- |
| `skill_assessment_data.csv` | 20 | Hand-written table | `technical_score`, `communication_score`, `problem_solving` (0–100) | `skill_level`: Strong (7), Average (7), Weak (6) |
| `adaptive_question_data.csv` | 1500 (default) | Synthetic (`generate_adaptive_question_data.py`, seed 42) | `last_score`, `avg_score`, `missing_ratio`, `pattern_score`, `keyword_score`, `round_index`, `question_in_round`, `track_code`, `prev_level` | `label`: `level\|gap_focus\|template_idx` (e.g. `applied\|1\|2`) |
| `voice_fluency_data.csv` | 480 | Synthetic (`train_voice_model.py`, seed 42) | 11 delivery/content features | `fluency_score`, `accuracy_score` (0–100) |

### Skill CSV columns

`technical_score`, `communication_score`, `problem_solving`, `skill_level`

Score ranges in the file: technical 45–95, communication 50–92, problem-solving 42–96.

### Voice CSV columns

**Inputs:** `word_count`, `duration_seconds`, `words_per_minute`, `filler_ratio`, `unique_ratio`, `avg_word_length`, `speech_confidence`, `repetition_ratio`, `pause_count`, `keyword_score`, `pattern_score`

**Targets:** `fluency_score`, `accuracy_score`

Rows are sampled from five profiles: fluent 22%, average 28%, hesitant 20%, rushed 15%, inaccurate 15%. Labels come from `teacher_fluency` / `teacher_accuracy` plus small Gaussian noise. There are **no** real audio recordings in this repository.

## Trained / shipped models

| File | Algorithm | Trained from | Used by |
| --- | --- | --- | --- |
| `skill_assessment_model.pkl` | `RandomForestClassifier` (100 trees) | `skill_assessment_data.csv` | Flask `POST /predict` |
| `label_encoder.pkl` | `LabelEncoder` | `skill_level` strings | Same endpoint (decode class) |
| `voice_fluency_model.pkl` | Better of Random Forest vs Gradient Boosting (`MultiOutputRegressor`) | `voice_fluency_data.csv` | Flask `POST /analyze-voice` |
| `voice_fluency_meta.pkl` | JSON-like pickle | Training run | Algorithm name + feature list |
| `adaptive_question_model.pkl` | `RandomForestClassifier` (200 trees) | `adaptive_question_data.csv` | Flask `POST /generate-adaptive-question` (level/slot plan) |
| `models/face_detection_yunet_2023mar.onnx` | OpenCV YuNet (pretrained, **not** trained here) | OpenCV model zoo | Flask `POST /analyze-emotion` |

If `voice_fluency_model.pkl` is missing, voice scoring falls back to the heuristic in `app.py`.

## Not training data

- `src/data/interviewBank.js` / `questionExtras.js` — keyword/pattern rubrics for answers
- `backend/data/*.json` — runtime users/sessions (gitignored)
