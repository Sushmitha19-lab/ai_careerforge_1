"""
Interview camera analysis.

Uses OpenCV YuNet face detection plus 5-point landmarks to estimate:
- confidence  — facing the camera, eye alignment, relaxed mouth
- nervousness — fidgeting, looking away, tense pose
- cheating / malpractice — extra people, no face, covered camera, looking down/away
"""

from collections import defaultdict, deque
from pathlib import Path

import cv2
import numpy as np

try:
    cv2.setLogLevel(cv2.LOG_LEVEL_ERROR)
except Exception:
    pass


_MODEL_PATH = (
    Path(__file__).resolve().parent / "models" / "face_detection_yunet_2023mar.onnx"
)

_detector = None
_detector_size = None

_sessions = defaultdict(
    lambda: {
        "centers": deque(maxlen=14),
        "no_face_streak": 0,
        "multi_face_streak": 0,
        "away_streak": 0,
        "down_streak": 0,
    }
)


def decode_image(image_bytes):
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    return image


def _get_detector(width, height):
    global _detector, _detector_size

    if not _MODEL_PATH.exists():
        raise FileNotFoundError(
            f"YuNet model missing: {_MODEL_PATH}"
        )

    size = (int(width), int(height))

    if _detector is None:
        _detector = cv2.FaceDetectorYN.create(
            str(_MODEL_PATH),
            "",
            size,
            0.55,
            0.35,
            5000,
        )
        _detector_size = size
        return _detector

    if _detector_size != size:
        _detector.setInputSize(size)
        _detector_size = size

    return _detector


def _bbox(face, width, height):
    x, y, w, h = [float(v) for v in face[:4]]
    x = max(0.0, x)
    y = max(0.0, y)
    return {
        "x": round(x / width, 4),
        "y": round(y / height, 4),
        "w": round(min(w, width - x) / width, 4),
        "h": round(min(h, height - y) / height, 4),
    }


def _landmark_signals(face, width, height):
    x, y, w, h = [float(v) for v in face[:4]]
    right_eye = (float(face[4]), float(face[5]))
    left_eye = (float(face[6]), float(face[7]))
    nose = (float(face[8]), float(face[9]))
    mouth_right = (float(face[10]), float(face[11]))
    mouth_left = (float(face[12]), float(face[13]))

    cx = (x + w / 2.0) / width
    cy = (y + h / 2.0) / height
    face_ratio = (w * h) / float(width * height)

    eye_mid_x = (right_eye[0] + left_eye[0]) / 2.0
    eye_mid_y = (right_eye[1] + left_eye[1]) / 2.0
    yaw = abs(nose[0] - eye_mid_x) / max(w, 1.0)
    pitch = (nose[1] - eye_mid_y) / max(h, 1.0)

    eye_gap = abs(left_eye[0] - right_eye[0]) / max(w, 1.0)
    mouth_width = abs(mouth_left[0] - mouth_right[0]) / max(w, 1.0)

    looking_away = yaw > 0.14 or abs(cx - 0.5) > 0.24 or eye_gap < 0.22
    looking_down = pitch > 0.22 or cy > 0.70
    smiling = mouth_width > 0.38
    eyes_visible = eye_gap >= 0.18

    return {
        "cx": cx,
        "cy": cy,
        "face_ratio": face_ratio,
        "looking_away": looking_away,
        "looking_down": looking_down,
        "smiling": smiling,
        "eyes_visible": eyes_visible,
    }


def analyze_frame(image, session_id="default"):
    if image is None:
        return {
            "ok": False,
            "error": "Could not read the camera frame.",
        }

    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    session = _sessions[session_id]
    brightness = float(np.mean(gray))
    flags = []
    reasons = []

    camera_covered = brightness < 28
    confidence = 48
    nervousness = 32
    cheating_risk = 8
    emotion = "neutral"
    eyes_visible = False
    smiling = False
    looking_away = False
    looking_down = False
    fidgeting = False
    bbox = None
    face_boxes = []
    face_count = 0
    malpractice = False

    if camera_covered:
        flags.append("camera_covered")
        reasons.append("Camera is too dark - it may be covered.")
        cheating_risk += 45
        nervousness += 15
        confidence -= 30
        session["no_face_streak"] += 1
        session["multi_face_streak"] = 0
        session["away_streak"] += 1
    else:
        detector = _get_detector(width, height)
        _, faces = detector.detect(image)
        face_list = [] if faces is None else list(faces)
        face_count = len(face_list)

        if face_count == 0:
            flags.append("no_face")
            reasons.append("No face visible - candidate may have left the frame.")
            cheating_risk += 40
            nervousness += 18
            confidence -= 28
            session["no_face_streak"] += 1
            session["multi_face_streak"] = 0
            session["away_streak"] += 1

        elif face_count > 1:
            malpractice = True
            flags.append("multiple_faces")
            reasons.append(
                f"{face_count} people detected in the camera view — malpractice risk."
            )
            cheating_risk += 55
            confidence -= 20
            session["multi_face_streak"] += 1
            session["no_face_streak"] = 0
            face_boxes = [_bbox(face, width, height) for face in face_list]
            largest = max(face_list, key=lambda face: face[2] * face[3])
            bbox = _bbox(largest, width, height)
            session["centers"].append(
                (
                    (float(largest[0]) + float(largest[2]) / 2.0) / width,
                    (float(largest[1]) + float(largest[3]) / 2.0) / height,
                )
            )

        else:
            session["no_face_streak"] = 0
            session["multi_face_streak"] = 0
            face = face_list[0]
            bbox = _bbox(face, width, height)
            face_boxes = [bbox]
            signals = _landmark_signals(face, width, height)
            looking_away = signals["looking_away"]
            looking_down = signals["looking_down"]
            smiling = signals["smiling"]
            eyes_visible = signals["eyes_visible"]

            session["centers"].append((signals["cx"], signals["cy"]))

            if signals["face_ratio"] < 0.035:
                flags.append("too_far")
                reasons.append("Face is too small - sitting far or turned away.")
                cheating_risk += 12
                confidence -= 10

            if smiling:
                confidence += 16
                nervousness -= 12
            else:
                nervousness += 8

            if eyes_visible:
                confidence += 14
            else:
                flags.append("no_eye_contact")
                reasons.append("Eyes are not clearly toward the camera.")
                confidence -= 12
                nervousness += 10
                cheating_risk += 10

            if looking_down:
                flags.append("looking_down")
                reasons.append("Looking down at the desk or answer box.")
                nervousness += 6
                looking_away = True
                session["down_streak"] += 1
            else:
                session["down_streak"] = 0

            if looking_away:
                if "looking_away" not in flags:
                    flags.append("looking_away")
                    reasons.append("Not facing the camera.")
                cheating_risk += 18
                confidence -= 16
                nervousness += 14
                session["away_streak"] += 1
            else:
                session["away_streak"] = 0
                confidence += 10

            if len(session["centers"]) >= 5:
                points = np.array(session["centers"])
                motion = float(np.std(points[:, 0]) + np.std(points[:, 1]))
                fidgeting = motion > 0.055
                if fidgeting:
                    flags.append("fidgeting")
                    reasons.append("Head position is changing quickly.")
                    nervousness += 16
                    confidence -= 6

    if session["no_face_streak"] >= 3:
        cheating_risk += 18
        flags.append("face_missing_repeatedly")
        reasons.append("Face was missing across several checks.")

    if session["multi_face_streak"] >= 2:
        cheating_risk += 15
        reasons.append("Another person stayed in view.")

    if session["away_streak"] >= 3:
        cheating_risk += 16
        reasons.append("Looking away across several checks.")

    if session["down_streak"] >= 3:
        cheating_risk += 12

    confidence = int(np.clip(confidence, 0, 100))
    nervousness = int(np.clip(nervousness, 0, 100))
    cheating_risk = int(np.clip(cheating_risk, 0, 100))

    if cheating_risk >= 55 or "multiple_faces" in flags or session["no_face_streak"] >= 4:
        integrity = "flagged"
        emotion = "suspicious"
    elif cheating_risk >= 32 or looking_away or fidgeting:
        integrity = "warning"
        emotion = "nervous" if nervousness >= confidence else "neutral"
    elif confidence >= 62 and nervousness < 48:
        integrity = "clear"
        emotion = "confident"
    elif nervousness >= confidence + 8:
        integrity = "clear"
        emotion = "nervous"
    else:
        integrity = "clear"
        emotion = "neutral"

    unique_reasons = []
    for item in reasons:
        if item not in unique_reasons:
            unique_reasons.append(item)

    unique_flags = []
    for item in flags:
        if item not in unique_flags:
            unique_flags.append(item)

    return {
        "ok": True,
        "emotion": emotion,
        "confidence": confidence,
        "nervousness": nervousness,
        "cheating_risk": cheating_risk,
        "integrity": integrity,
        "face_count": int(face_count),
        "eyes_visible": bool(eyes_visible),
        "smiling": bool(smiling),
        "looking_away": bool(looking_away),
        "looking_down": bool(looking_down),
        "fidgeting": bool(fidgeting),
        "camera_covered": bool(camera_covered),
        "brightness": round(brightness, 1),
        "flags": unique_flags,
        "reasons": unique_reasons,
        "bbox": bbox,
        "face_boxes": face_boxes,
        "malpractice": bool(malpractice or face_count > 1),
    }
