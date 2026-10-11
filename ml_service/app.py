import base64
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS

from emotion_analyzer import analyze_frame, decode_image
from adaptive_questions import generate_question
from voice_features import (
    extract_features,
    feature_row,
    fluency_label,
    fluency_notes,
    heuristic_scores,
    accent_score,
    accent_label,
)

app = Flask(__name__)
CORS(app)

app.config["MAX_CONTENT_LENGTH"] = 6 * 1024 * 1024

ROOT = Path(__file__).resolve().parent


def _load_pickle(name):
    try:
        import joblib
        path = ROOT / name
        if not path.exists():
            return None
        return joblib.load(path)
    except Exception:
        return None


model = _load_pickle("skill_assessment_model.pkl")
encoder = _load_pickle("label_encoder.pkl")
voice_model = _load_pickle("voice_fluency_model.pkl")
voice_meta = _load_pickle("voice_fluency_meta.pkl") or {"algorithm": "heuristic"}


@app.route("/", methods=["GET"])
@app.route("/health", methods=["GET"])
def home():
    algorithm = "heuristic"
    if isinstance(voice_meta, dict):
        algorithm = voice_meta.get("algorithm", "heuristic")
    return jsonify({
        "ok": True,
        "message": "CareerForge ML Service Running",
        "voice_model": voice_model is not None,
        "skill_model": model is not None and encoder is not None,
        "algorithm": algorithm,
        "endpoints": [
            "/predict",
            "/analyze-emotion",
            "/analyze-voice",
            "/generate-adaptive-question",
            "/health",
        ]
    })


@app.route("/predict", methods=["POST"])
def predict():
    if model is None or encoder is None:
        return jsonify({
            "error": "Skill model is not trained yet. Run train_model.py first."
        }), 503

    data = request.json

    technical_score = data["technical_score"]
    communication_score = data["communication_score"]
    problem_solving = data["problem_solving"]

    features = [[
        technical_score,
        communication_score,
        problem_solving
    ]]

    prediction = model.predict(features)

    skill_level = encoder.inverse_transform(prediction)[0]

    return jsonify({
        "skill_level": skill_level
    })


@app.route("/analyze-emotion", methods=["POST"])
def analyze_emotion():
    session_id = (
        request.form.get("session_id")
        or (request.json or {}).get("session_id")
        or "default"
    )

    image_bytes = None

    if "frame" in request.files:
        image_bytes = request.files["frame"].read()
    elif request.json and request.json.get("image"):
        payload = request.json["image"]
        if "," in payload:
            payload = payload.split(",", 1)[1]
        image_bytes = base64.b64decode(payload)

    if not image_bytes:
        return jsonify({
            "ok": False,
            "error": "No camera frame was sent."
        }), 400

    image = decode_image(image_bytes)
    try:
        result = analyze_frame(image, session_id)
    except Exception as error:
        return jsonify({
            "ok": False,
            "error": str(error)
        }), 500
    return jsonify(result)


@app.route("/generate-adaptive-question", methods=["POST"])
def generate_adaptive_question():
    data = request.json or {}
    try:
        result = generate_question(data)
    except Exception as error:
        return jsonify({"ok": False, "error": str(error)}), 500
    return jsonify(result)


@app.route("/analyze-voice", methods=["POST"])
def analyze_voice():
    data = request.json or {}
    transcript = data.get("transcript") or ""

    if not str(transcript).strip():
        return jsonify({
            "ok": False,
            "error": "No spoken transcript was sent."
        }), 400

    features = extract_features(
        transcript,
        duration_seconds=data.get("duration_seconds") or 0,
        speech_confidence=data.get("speech_confidence") or 0,
        keyword_score=data.get("keyword_score") or 0,
        pattern_score=data.get("pattern_score") or 0,
        pause_count=data.get("pause_count") or 0,
    )

    used_model = False
    algorithm = (voice_meta or {}).get("algorithm", "heuristic")

    if voice_model is not None:
        try:
            predicted = voice_model.predict([feature_row(features)])[0]
            fluency_score = int(max(0, min(100, round(float(predicted[0])))))
            accuracy_score = int(max(0, min(100, round(float(predicted[1])))))
            used_model = True
        except Exception:
            fluency_score, accuracy_score = heuristic_scores(features)
            algorithm = "heuristic"
    else:
        fluency_score, accuracy_score = heuristic_scores(features)
        algorithm = "heuristic"

    clarity = accent_score(features)

    return jsonify({
        "ok": True,
        "fluency": fluency_score,
        "accuracy": accuracy_score,
        "accent": clarity,
        "accent_label": accent_label(clarity),
        "fluency_label": fluency_label(fluency_score),
        "algorithm": algorithm,
        "used_model": used_model,
        "features": features,
        "notes": fluency_notes(features, fluency_score, accuracy_score),
    })


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5001,
        debug=False
    )
