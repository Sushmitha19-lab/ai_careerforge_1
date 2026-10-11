"""Render CareerForge architecture and block-diagram PNGs for the project document."""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch


TEAL = "#356B72"
CORAL = "#E8755F"
INK = "#17212B"
MUTED = "#5D656A"
CREAM = "#F7F5F0"
BOX = "#FFFFFF"
SOFT = "#E4EEF0"
GOLD = "#F4E6C8"


def _box(ax, x, y, w, h, title, lines=None, fc=BOX, ec=TEAL, title_size=9, body_size=7.5):
    ax.add_patch(
        FancyBboxPatch(
            (x, y),
            w,
            h,
            boxstyle="round,pad=0.012,rounding_size=0.18",
            linewidth=1.5,
            facecolor=fc,
            edgecolor=ec,
        )
    )
    if lines:
        ax.text(
            x + w / 2,
            y + h - 0.22,
            title,
            ha="center",
            va="top",
            fontsize=title_size,
            fontweight="bold",
            color=TEAL,
            zorder=3,
        )
        ax.text(
            x + w / 2,
            y + h / 2 - 0.08,
            "\n".join(lines),
            ha="center",
            va="center",
            fontsize=body_size,
            color=INK,
            zorder=3,
            linespacing=1.35,
        )
    else:
        ax.text(
            x + w / 2,
            y + h / 2,
            title,
            ha="center",
            va="center",
            fontsize=title_size,
            fontweight="bold",
            color=INK,
            zorder=3,
        )


def _arrow(ax, x1, y1, x2, y2, color=TEAL):
    ax.add_patch(
        FancyArrowPatch(
            (x1, y1),
            (x2, y2),
            arrowstyle="-|>",
            mutation_scale=12,
            linewidth=1.4,
            color=color,
            zorder=2,
        )
    )


def _finish(fig, path: Path):
    fig.patch.set_facecolor(CREAM)
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)


def draw_architecture(path: Path):
    fig, ax = plt.subplots(figsize=(11.4, 7.5))
    ax.set_xlim(0, 12.2)
    ax.set_ylim(0, 8.1)
    ax.axis("off")
    ax.set_title("CareerForge — system architecture", fontsize=14, color=TEAL, pad=8, fontweight="bold")

    ax.add_patch(
        FancyBboxPatch(
            (0.25, 5.05),
            11.7,
            2.55,
            boxstyle="round,pad=0.02,rounding_size=0.2",
            linewidth=1.1,
            facecolor=SOFT,
            edgecolor=TEAL,
            linestyle="--",
        )
    )
    ax.text(0.45, 7.38, "Student browser  ·  React + Vite  :5173", fontsize=9, color=TEAL, fontweight="bold")

    _box(
        ax,
        0.4,
        5.25,
        2.7,
        1.85,
        "Pages / Router",
        ["login, dashboard, practice", "10×10 catalog, SkillBridge", "4-round mock, result"],
        title_size=8,
        body_size=7,
    )
    _box(
        ax,
        3.25,
        5.25,
        2.7,
        1.85,
        "Answer scorer",
        ["evaluateAnswer.js", "keywords 50% + patterns 35%", "+ length 15%  (on submit)"],
        title_size=8,
        body_size=7,
    )
    _box(
        ax,
        6.1,
        5.25,
        2.7,
        1.85,
        "Camera + microphone",
        ["JPEG frame ~1.4 s", "Web Speech transcript", "POST /ml via Vite proxy"],
        title_size=8,
        body_size=7,
    )
    _box(
        ax,
        8.95,
        5.25,
        2.8,
        1.85,
        "Google Identity",
        ["GIS button on /login", "ID token in the browser", "POST /api/auth/google"],
        fc="#EEF3F4",
        title_size=8,
        body_size=7,
    )

    _box(
        ax,
        0.5,
        2.5,
        5.5,
        2.0,
        "Express API  :5000",
        ["JWT  ·  Google ID-token verify", "GET catalog.json  (10 courses × 10 companies)", "POST /api/interview/results"],
        fc="#DCE9EB",
    )
    _box(
        ax,
        6.5,
        2.5,
        5.2,
        2.0,
        "Flask ML  :5001",
        ["POST /analyze-emotion  (YuNet ONNX)", "POST /analyze-voice  (RF / GBR)", "fluency + accuracy + accent/clarity"],
        fc="#F8E4DC",
        ec=CORAL,
    )

    _box(ax, 0.5, 0.3, 2.6, 1.55, "MySQL :3306", ["users + sessions", "when the pool is up"], fc=GOLD, title_size=8, body_size=7)
    _box(ax, 3.3, 0.3, 2.7, 1.55, "JSON file store", ["backend/data/", "if MySQL times out"], fc=GOLD, title_size=8, body_size=7)
    _box(
        ax,
        6.5,
        0.3,
        5.2,
        1.55,
        "ML models on disk",
        ["YuNet ONNX  ·  voice_fluency_model.pkl", "Flask reads these; the browser does not"],
        fc="#F8E4DC",
        ec=CORAL,
        title_size=8,
        body_size=7,
    )

    _arrow(ax, 1.75, 5.25, 2.4, 4.55)
    ax.text(1.55, 4.78, "/api", fontsize=8, color=MUTED)
    _arrow(ax, 7.45, 5.25, 8.7, 4.55)
    ax.text(7.7, 4.78, "/ml", fontsize=8, color=MUTED)
    _arrow(ax, 1.8, 2.5, 1.8, 1.9)
    _arrow(ax, 4.5, 2.5, 4.6, 1.9)
    _arrow(ax, 9.1, 2.5, 9.1, 1.9)

    ax.text(
        6.1,
        2.18,
        "browser never talks to MySQL, JSON files, .pkl, or ONNX directly",
        ha="center",
        fontsize=7.5,
        color=MUTED,
        style="italic",
    )
    _finish(fig, path)


def draw_product_blocks(path: Path):
    fig, ax = plt.subplots(figsize=(11.2, 6.2))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 6.4)
    ax.axis("off")
    ax.set_title("CareerForge — product block diagram", fontsize=14, color=TEAL, pad=8, fontweight="bold")

    _box(
        ax,
        0.35,
        2.35,
        3.15,
        3.55,
        "PREPARE",
        ["10 courses", "10 companies / course", "4 round resource packs", "SkillBridge map", "Week-wise coding"],
        fc=SOFT,
    )
    _box(
        ax,
        4.15,
        2.35,
        3.7,
        3.55,
        "MOCK  —  4 adaptive rounds",
        ["1  Aptitude", "2  Coding", "3  Technical", "4  HR", "difficulty from last score"],
        fc="#DCE9EB",
    )
    _box(
        ax,
        8.5,
        2.35,
        3.15,
        3.55,
        "OUTPUT",
        ["Company readiness %", "Chance of advancing", "Accent / clarity", "Weak areas", "Saved to account"],
        fc="#F8E4DC",
        ec=CORAL,
    )
    _box(
        ax,
        2.35,
        0.3,
        7.3,
        1.55,
        "SCORING BLOCKS  (run on each submitted round)",
        ["Text: keywords + patterns + length     ·     Camera: YuNet integrity     ·     Voice: fluency / accuracy / accent"],
        fc=GOLD,
    )

    _arrow(ax, 3.5, 4.1, 4.15, 4.1)
    _arrow(ax, 7.85, 4.1, 8.5, 4.1)
    _arrow(ax, 6.0, 2.35, 6.0, 1.9)
    _finish(fig, path)


def draw_scoring_blocks(path: Path):
    fig, ax = plt.subplots(figsize=(11.2, 6.6))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis("off")
    ax.set_title("CareerForge — interview scoring block diagram", fontsize=14, color=TEAL, pad=8, fontweight="bold")

    _box(ax, 2.6, 5.55, 6.8, 1.05, "Student answer  —  typed text and/or spoken transcript", fc=SOFT)

    _box(
        ax,
        0.3,
        2.35,
        3.6,
        2.7,
        "Block A  ·  Text",
        ["Keyword groups + aliases", "Regex patterns", "Length completeness", "50% + 35% + 15%"],
        fc=SOFT,
    )
    _box(
        ax,
        4.2,
        2.35,
        3.6,
        2.7,
        "Block B  ·  Camera",
        ["JPEG every ~1.4 s", "YuNet face + 5 landmarks", "Confidence / nervousness", "Malpractice / integrity"],
        fc="#DCE9EB",
    )
    _box(
        ax,
        8.1,
        2.35,
        3.6,
        2.7,
        "Block C  ·  Voice",
        ["Web Speech transcript", "WPM, fillers, confidence", "RF / GBR or heuristic", "Fluency + accuracy + clarity"],
        fc="#F8E4DC",
        ec=CORAL,
    )
    _box(
        ax,
        2.3,
        0.35,
        7.4,
        1.45,
        "Result pack  ·  explainInterview()",
        ["readiness  ·  chance of advancing this screen  ·  SkillBridge scores  ·  weak areas"],
        fc=GOLD,
    )

    _arrow(ax, 6.0, 5.55, 2.1, 5.1)
    _arrow(ax, 6.0, 5.55, 6.0, 5.1)
    _arrow(ax, 6.0, 5.55, 9.9, 5.1)
    _arrow(ax, 2.1, 2.35, 4.4, 1.85)
    _arrow(ax, 6.0, 2.35, 6.0, 1.85)
    _arrow(ax, 9.9, 2.35, 7.6, 1.85)
    _finish(fig, path)


def main(out_dir=None):
    root = Path(__file__).resolve().parent
    out = Path(out_dir) if out_dir else root / "docs" / "figures"
    paths = {
        "architecture": out / "architecture.png",
        "product": out / "product-blocks.png",
        "scoring": out / "scoring-blocks.png",
    }
    draw_architecture(paths["architecture"])
    draw_product_blocks(paths["product"])
    draw_scoring_blocks(paths["scoring"])
    return paths


if __name__ == "__main__":
    for key, path in main().items():
        print(f"{key}: {path}")
