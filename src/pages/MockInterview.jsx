import React, { useEffect, useRef, useState } from "react";

import {
  emotionLabel,
  emptyBehavior,
  integrityLabel,
  summarizeBehavior,
} from "../utils/summarizeBehavior";
import { evaluateAnswer } from "../utils/evaluateAnswer";
import {
  QUESTIONS_PER_ROUND,
  ROUND_COUNT,
  ROUND_PASS_SCORE,
  formatPrompt,
  getQuestionById,
  levelLabel,
  passedRound,
  roundAverage,
  scoreBand,
  typeLabel,
} from "../utils/adaptiveInterview";
import { accentLabel, localAccentScore } from "../utils/accentScore";
import { liveVoiceStats } from "../utils/voiceMetrics";
import { loadFlow, saveFlow } from "../utils/session";
import { roundsForCourse } from "../data/tracks";
import { buildRoundFeedback } from "../utils/roundFeedback";
import { RoundFeedbackPanel } from "../components/RoundFeedbackPanel";
import {
  buildAnswerHistory,
  fetchAdaptiveQuestion,
  historyFromCommitted,
  normalizeMlQuestion,
} from "../utils/adaptiveQuestionsApi";
import {
  appendLocalUsedPrompts,
  fetchPriorUsedPrompts,
} from "../utils/usedQuestionHistory";
import {
  MAX_MALPRACTICE_DISMISSALS,
  isMultiPersonFrame,
  malpracticeSpeechText,
  speakMalpracticeAlert,
} from "../utils/malpracticeAlert";

function emptyDrafts() {
  return Array(QUESTIONS_PER_ROUND).fill("");
}

/** Drop pre-generated future questions; keep only through the last answered slot (+ current). */
function trimRestoredRound(questions, drafts) {
  if (!questions?.some(Boolean)) {
    return [];
  }
  let lastAnswered = -1;
  for (let index = 0; index < QUESTIONS_PER_ROUND; index += 1) {
    if (String(drafts[index] || "").trim()) {
      lastAnswered = index;
    }
  }
  const keepThrough = Math.max(0, lastAnswered + 1);
  const trimmed = [];
  for (let index = 0; index <= keepThrough && index < QUESTIONS_PER_ROUND; index += 1) {
    if (questions[index]) {
      trimmed[index] = questions[index];
    } else if (index < keepThrough) {
      break;
    }
  }
  return trimmed;
}

function restoreOrStartRound(course, company, saved) {
  if (saved?.roundQuestions?.some(Boolean)) {
    const rawQuestions = saved.roundQuestions.map((item) =>
      item ? normalizeMlQuestion(item) : undefined
    );
    const draftsForTrim = emptyDrafts();
    rawQuestions.forEach((_, index) => {
      draftsForTrim[index] = saved.roundDrafts?.[index] || "";
    });
    const questions = trimRestoredRound(rawQuestions, draftsForTrim);
    if (questions.some(Boolean)) {
      const drafts = emptyDrafts();
      questions.forEach((_, index) => {
        drafts[index] = saved.roundDrafts?.[index] || "";
      });
      return {
        roundIndex: saved.roundIndex || 0,
        questions,
        drafts,
        currentQ: Math.min(saved.currentQ || 0, QUESTIONS_PER_ROUND - 1),
        phase: saved.phase === "round-result" ? "round-result" : "questions",
        committed: saved.answers || [],
        askedIds: saved.askedIds || questions.filter(Boolean).map((item) => item.id),
        lastRoundResult: saved.lastRoundResult || null,
        roundReports: saved.roundReports || [],
        roundName:
          saved.roundName ||
          roundsForCourse(course)[saved.roundIndex || 0]?.name ||
          "Aptitude",
      };
    }
  }

  if (saved?.roundQuestionIds?.length) {
    const questions = saved.roundQuestionIds
      .map((id) => getQuestionById(id))
      .filter(Boolean);
    if (questions.length) {
      const drafts = emptyDrafts();
      questions.forEach((_, index) => {
        drafts[index] = saved.roundDrafts?.[index] || "";
      });
      return {
        roundIndex: saved.roundIndex || 0,
        questions,
        drafts,
        currentQ: Math.min(saved.currentQ || 0, questions.length - 1),
        phase: saved.phase === "round-result" ? "round-result" : "questions",
        committed: saved.answers || [],
        askedIds: saved.askedIds || questions.map((item) => item.id),
        lastRoundResult: saved.lastRoundResult || null,
        roundReports: saved.roundReports || [],
        roundName:
          saved.roundName ||
          roundsForCourse(course)[saved.roundIndex || 0]?.name ||
          "Aptitude",
      };
    }
  }

  const rounds = roundsForCourse(course);
  return {
    roundIndex: 0,
    questions: [],
    drafts: emptyDrafts(),
    currentQ: 0,
    phase: "questions",
    committed: [],
    askedIds: [],
    lastRoundResult: null,
    roundReports: [],
    roundName: rounds[0]?.name || "Aptitude",
  };
}

function MockInterview({
  company,
  course,
  onBack,
  onFinish,
}) {
  const savedInterview = (() => {
    const saved = loadFlow().interview;
    if (!saved) {
      return null;
    }
    if (saved.companyId && saved.companyId !== company?.id) {
      return null;
    }
    if (saved.courseId && saved.courseId !== course?.id) {
      return null;
    }
    return saved;
  })();
  const [boot] = useState(() => restoreOrStartRound(course, company, savedInterview));
  const [roundIndex, setRoundIndex] = useState(boot.roundIndex);
  const [roundQuestions, setRoundQuestions] = useState(boot.questions);
  const [drafts, setDrafts] = useState(boot.drafts);
  const [currentQ, setCurrentQ] = useState(boot.currentQ);
  const [phase, setPhase] = useState(boot.phase);
  const [difficulty, setDifficulty] = useState(
    levelLabel(boot.questions[boot.currentQ]?.level)
  );
  const [adaptiveNote, setAdaptiveNote] = useState(
    `Round ${boot.roundIndex + 1} of ${ROUND_COUNT}. Each question is generated when you click Next. After all ${QUESTIONS_PER_ROUND} answers, submit this round. You need ${ROUND_PASS_SCORE}% to open the next round.`
  );
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [roundName, setRoundName] = useState(boot.roundName);
  const [askedIds, setAskedIds] = useState(boot.askedIds);
  const [answers, setAnswers] = useState(boot.committed);
  const [lastRoundResult, setLastRoundResult] = useState(boot.lastRoundResult);
  const [roundReports, setRoundReports] = useState(boot.roundReports || []);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [listening, setListening] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [voiceAnalysis, setVoiceAnalysis] = useState(null);
  const [voiceError, setVoiceError] = useState("");
  const [liveVoice, setLiveVoice] = useState({ wpm: 0, wordCount: 0 });
  const [draft, setDraft] = useState("");
  const [heardInterim, setHeardInterim] = useState("");
  const [mediaConsent, setMediaConsent] = useState(
    savedInterview?.mediaConsent || null
  );
  const [malpracticeAlert, setMalpracticeAlert] = useState(null);
  const [malpracticeDismissCount, setMalpracticeDismissCount] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const samplesRef = useRef([]);
  const analyzingRef = useRef(false);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const voiceStartedAtRef = useRef(0);
  const voiceFinalRef = useRef("");
  const voiceInterimRef = useRef("");
  const voiceConfidenceRef = useRef([]);
  const pauseCountRef = useRef(0);
  const answerWhenStartedRef = useRef("");
  const questionRef = useRef(null);
  const voiceAnalysisRef = useRef(null);
  const textareaRef = useRef(null);
  const answerRef = useRef("");
  const draftTimerRef = useRef(null);
  const submittingRef = useRef(false);
  const currentQRef = useRef(boot.currentQ);
  const draftsRef = useRef(boot.drafts);
  const roundVoicesRef = useRef(
    Array(Math.max(QUESTIONS_PER_ROUND, boot.questions.length)).fill(null)
  );
  const roundQuestionsRef = useRef(boot.questions);
  const askedIdsRef = useRef(boot.askedIds);
  const answersRef = useRef(boot.committed);
  const priorUsedPromptsRef = useRef([]);
  const priorAttemptOffsetRef = useRef(0);
  const roundSampleOffsetRef = useRef(0);
  const roundReportsRef = useRef(boot.roundReports || []);
  const mountedRef = useRef(true);
  const voiceGenRef = useRef(0);
  const sessionIdRef = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}`
  );
  const malpracticeAlertActiveRef = useRef(false);
  const malpracticeEndingRef = useRef(false);

  const question = roundQuestions[currentQ] || roundQuestions[0];
  const questionInRound = currentQ + 1;
  const roundNumber = roundIndex + 1;
  const isLastRound = roundIndex + 1 >= ROUND_COUNT;
  const answeredInRound = drafts.filter((item) => String(item || "").trim()).length;
  const loadedInRound = roundQuestions.filter(Boolean).length;
  const canSubmitRound =
    loadedInRound >= QUESTIONS_PER_ROUND &&
    drafts.slice(0, QUESTIONS_PER_ROUND).every((item) => String(item || "").trim());
  const progress = (answeredInRound / QUESTIONS_PER_ROUND) * 100;
  const prompt = formatPrompt(question, company);
  questionRef.current = question;
  voiceAnalysisRef.current = voiceAnalysis;
  currentQRef.current = currentQ;
  draftsRef.current = drafts;
  roundQuestionsRef.current = roundQuestions;
  askedIdsRef.current = askedIds;
  answersRef.current = answers;

  const ensureQuestionAt = async (index, opts = {}) => {
    const activeRoundIndex = opts.roundIndex ?? roundIndex;
    const committed = opts.committed ?? answersRef.current;
    const forceRegenerate = opts.forceRegenerate === true;
    if (!forceRegenerate && roundQuestionsRef.current[index]) {
      return roundQuestionsRef.current[index];
    }
    if (index > 0) {
      const previousAnswer = String(draftsRef.current[index - 1] || "").trim();
      if (!previousAnswer) {
        throw new Error(
          `Write an answer for question ${index}, then use Next — question ${index + 1} is generated from it.`
        );
      }
    }
    const rounds = roundsForCourse(course);
    const roundId = rounds[activeRoundIndex]?.id || "aptitude";
    const currentRoundHistory = buildAnswerHistory({
      roundQuestions: roundQuestionsRef.current,
      drafts: draftsRef.current,
      company,
      upToIndex: index,
    });
    const priorRoundHistory = historyFromCommitted(committed);
    const isOpening = index === 0 && currentRoundHistory.length === 0;
    const history = [...priorRoundHistory, ...currentRoundHistory];
    const avoidPrompts = [
      ...priorUsedPromptsRef.current,
      ...(roundQuestionsRef.current || [])
        .filter(Boolean)
        .map((item) => item.prompt),
    ];
    const result = await fetchAdaptiveQuestion({
      course,
      company,
      roundIndex: activeRoundIndex,
      roundId,
      questionInRound: index + 1,
      history,
      currentRoundHistory,
      isOpening,
      askedIds: askedIdsRef.current,
      avoidPrompts,
      priorAttemptOffset: priorAttemptOffsetRef.current,
    });
    if (!result?.question) {
      throw new Error(result?.reason || "Could not generate the next question.");
    }
    setRoundQuestions((previous) => {
      const next = [...previous];
      while (next.length <= index) {
        next.push(undefined);
      }
      next[index] = result.question;
      roundQuestionsRef.current = next;
      return next;
    });
    setAskedIds((previous) => {
      const next = [...previous, result.question.id];
      askedIdsRef.current = next;
      return next;
    });
    if (result.question?.prompt) {
      priorUsedPromptsRef.current = [
        ...priorUsedPromptsRef.current,
        result.question.prompt,
      ];
    }
    const roundNum = activeRoundIndex + 1;
    setAdaptiveNote(
      `Round ${roundNum} · Question ${index + 1} of ${QUESTIONS_PER_ROUND} — ${result.reason}${
        result.usedModel ? " · pre-trained model" : ""
      }`
    );
    return result.question;
  };

  const canReachQuestion = (index) => {
    if (index <= currentQ) {
      return true;
    }
    if (index === currentQ + 1) {
      return String(draftsRef.current[currentQ] || "").trim().length > 0;
    }
    return false;
  };

  const readAnswer = () => {
    if (textareaRef.current) {
      return textareaRef.current.value;
    }
    return answerRef.current;
  };

  const scheduleDraft = (text) => {
    answerRef.current = text;
    const index = currentQRef.current;
    setDrafts((previous) => {
      const next = [...previous];
      next[index] = text;
      draftsRef.current = next;
      return next;
    });
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }
    draftTimerRef.current = setTimeout(() => {
      setDraft(text);
    }, 120);
  };

  const clearAnswerBox = () => {
    answerRef.current = "";
    setDraft("");
    setHeardInterim("");
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }
  };


  const attachStream = (stream) => {
    streamRef.current = stream;
    setCameraOpen(true);
    setCameraError("");
  };


  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    streamRef.current = null;
    setCameraOpen(false);
    setLiveAnalysis(null);
  };


  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      attachStream(stream);
    } catch (error) {
      setCameraError(
        "Camera permission was not granted. Emotion and integrity analysis cannot run."
      );
      setCameraOpen(false);
    }
  };


  const toggleCamera = async () => {
    if (cameraOpen) {
      stopCamera();
      return;
    }

    await startCamera();
  };


  const captureAndAnalyze = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !mountedRef.current ||
      document.hidden ||
      !video ||
      !canvas ||
      analyzingRef.current ||
      video.readyState < 2 ||
      !video.videoWidth
    ) {
      return;
    }

    analyzingRef.current = true;

    try {
      const scale = 320 / video.videoWidth;
      canvas.width = 320;
      canvas.height = Math.round(video.videoHeight * scale);

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.72)
      );

      if (!blob) {
        return;
      }

      const form = new FormData();
      form.append("frame", blob, "frame.jpg");
      form.append("session_id", sessionIdRef.current);

      const response = await fetch("/ml/analyze-emotion", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        throw new Error("Analysis request failed");
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      if (!mountedRef.current) {
        return;
      }

      samplesRef.current =
        samplesRef.current.length < 400
          ? [...samplesRef.current, data]
          : [...samplesRef.current.slice(1), data];
      setLiveAnalysis((previous) => {
        if (
          previous &&
          previous.emotion === data.emotion &&
          previous.confidence === data.confidence &&
          previous.nervousness === data.nervousness &&
          previous.integrity === data.integrity &&
          previous.cheating_risk === data.cheating_risk &&
          previous.face_count === data.face_count &&
          previous.malpractice === data.malpractice
        ) {
          return previous;
        }
        return data;
      });
      setServiceError((previous) => (previous ? "" : previous));
    } catch (error) {
      if (mountedRef.current) {
        setServiceError(
          "Camera analysis is offline. Start the ML service on port 5001."
        );
      }
    } finally {
      analyzingRef.current = false;
    }
  };


  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const prior = await fetchPriorUsedPrompts(course, company);
      if (!active) {
        return;
      }
      priorUsedPromptsRef.current = prior.prompts || [];
      priorAttemptOffsetRef.current = prior.attemptOffset || 0;
    })();
    return () => {
      active = false;
    };
  }, [course?.id, company?.id]);

  useEffect(() => {
    if (phase !== "questions" || roundQuestionsRef.current[0]) {
      return undefined;
    }
    let active = true;
    (async () => {
      setGeneratingQuestion(true);
      try {
        await ensureQuestionAt(0);
      } catch (error) {
        if (active) {
          setAdaptiveNote(String(error?.message || error));
        }
      } finally {
        if (active) {
          setGeneratingQuestion(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [phase, roundIndex, course?.id, company?.id]);


  useEffect(() => {
    if (!mediaConsent) {
      return;
    }
    saveFlow({
      interview: {
        questionId: question?.id,
        difficulty,
        adaptiveNote,
        roundName,
        askedIds,
        answers,
        mediaConsent,
        courseId: course?.id,
        companyId: company?.id,
        roundIndex,
        currentQ,
        phase,
        roundQuestionIds: Array.from(
          { length: QUESTIONS_PER_ROUND },
          (_, index) => roundQuestions[index]?.id
        ).filter(Boolean),
        roundQuestions: Array.from(
          { length: QUESTIONS_PER_ROUND },
          (_, index) => roundQuestions[index] || null
        ),
        roundDrafts: drafts,
        lastRoundResult,
        roundReports,
      },
    });
  }, [
    question?.id,
    difficulty,
    adaptiveNote,
    roundName,
    askedIds,
    answers,
    mediaConsent,
    course?.id,
    company?.id,
    roundIndex,
    currentQ,
    phase,
    roundQuestions,
    drafts,
    lastRoundResult,
    roundReports,
  ]);


  useEffect(() => {
    if (mediaConsent !== "camera") {
      return;
    }

    let cancelled = false;

    const boot = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        attachStream(stream);
      } catch (error) {
        if (!cancelled) {
          setCameraError(
            "Camera permission was not granted. Emotion and integrity analysis cannot run."
          );
        }
      }
    };

    boot();

    return () => {
      cancelled = true;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [mediaConsent]);


  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);


  useEffect(() => {
    if (!cameraOpen) {
      return;
    }

    const timer = setInterval(captureAndAnalyze, 1400);
    const first = setTimeout(captureAndAnalyze, 600);

    return () => {
      clearInterval(timer);
      clearTimeout(first);
    };
  }, [cameraOpen]);


  useEffect(() => {
    if (!cameraOpen || mediaConsent !== "camera" || malpracticeEndingRef.current) {
      return;
    }
    if (!isMultiPersonFrame(liveAnalysis)) {
      return;
    }
    if (malpracticeAlertActiveRef.current) {
      return;
    }
    const faceCount = Number(liveAnalysis.face_count || 2);
    malpracticeAlertActiveRef.current = true;
    setMalpracticeAlert({ faceCount, at: Date.now() });
    speakMalpracticeAlert(malpracticeSpeechText(faceCount));
  }, [liveAnalysis, cameraOpen, mediaConsent]);


  const appendSpokenText = (spoken) => {
    const piece = String(spoken || "").trim();
    if (!piece) {
      return;
    }

    const field = textareaRef.current;
    const current = field ? field.value : answerRef.current;
    const needsSpace = current && !/\s$/.test(current);
    const next = `${current}${needsSpace ? " " : ""}${piece}`;

    if (field) {
      field.value = next;
    }
    scheduleDraft(next);
  };


  const analyzeSpokenAnswer = async (transcript, duration, confidence, pauseCount) => {
    const gen = voiceGenRef.current;
    const spokenEval = evaluateAnswer(transcript, questionRef.current);

    try {
      const response = await fetch("/ml/analyze-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          duration_seconds: duration,
          speech_confidence: confidence,
          keyword_score: spokenEval.keywordScore,
          pattern_score: spokenEval.patternScore,
          pause_count: pauseCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Voice analysis failed");
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "Voice analysis failed");
      }

      const withAccent = {
        ...data,
        accent:
          typeof data.accent === "number"
            ? data.accent
            : localAccentScore({
                confidence,
                wpm: liveVoiceStats(transcript, duration).wpm,
                wordCount: liveVoiceStats(transcript, duration).wordCount,
              }),
        accent_label:
          data.accent_label ||
          accentLabel(
            typeof data.accent === "number" ? data.accent : 0
          ),
      };
      if (!data.accent_label) {
        withAccent.accent_label = accentLabel(withAccent.accent);
      }

      if (gen !== voiceGenRef.current || !mountedRef.current) {
        return withAccent;
      }

      voiceAnalysisRef.current = withAccent;
      setVoiceAnalysis(withAccent);
      setVoiceError("");
      return withAccent;
    } catch (error) {
      const stats = liveVoiceStats(transcript, duration);
      const accent = localAccentScore({
        confidence,
        wpm: stats.wpm,
        wordCount: stats.wordCount,
      });
      const fallback = {
        ok: true,
        fluency: accent,
        accuracy: spokenEval.keywordScore,
        accent,
        accent_label: accentLabel(accent),
        notes: [
          "Voice ML is offline. Accent/clarity used speech-recognition confidence on this machine.",
        ],
      };
      if (gen === voiceGenRef.current && mountedRef.current) {
        setVoiceError(
          "Voice ML is offline. Accent and fluency used a local clarity estimate."
        );
        voiceAnalysisRef.current = fallback;
        setVoiceAnalysis(fallback);
      }
      return fallback;
    }
  };


  const finishVoiceSession = () => {
    const spoken = voiceFinalRef.current.trim();
    const duration = Math.max(
      0.4,
      (Date.now() - voiceStartedAtRef.current) / 1000
    );
    const confidences = voiceConfidenceRef.current;
    const confidence = confidences.length
      ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
      : 0.7;

    setLiveVoice(liveVoiceStats(spoken, duration));

    if (spoken) {
      return analyzeSpokenAnswer(
        spoken,
        duration,
        confidence,
        pauseCountRef.current
      );
    }
    return null;
  };


  const stopVoice = () => {
    listeningRef.current = false;
    setListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (error) {
        /* already stopped */
      }
      recognitionRef.current = null;
    }

    setHeardInterim("");
    finishVoiceSession();
  };


  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Try Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    voiceFinalRef.current = "";
    voiceInterimRef.current = "";
    voiceConfidenceRef.current = [];
    pauseCountRef.current = 0;
    answerWhenStartedRef.current = readAnswer();
    voiceStartedAtRef.current = Date.now();
    listeningRef.current = true;
    recognitionRef.current = recognition;
    setVoiceError("");
    setHeardInterim("");
    setListening(true);

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0];
        if (event.results[i].isFinal) {
          voiceFinalRef.current = `${voiceFinalRef.current} ${piece.transcript}`.trim();
          voiceConfidenceRef.current.push(
            typeof piece.confidence === "number" ? piece.confidence : 0.75
          );
          appendSpokenText(piece.transcript);
        } else {
          interim = piece.transcript;
        }
      }

      voiceInterimRef.current = interim;
      setHeardInterim(interim);
    };

    recognition.onerror = (event) => {
      if (!listeningRef.current) {
        return;
      }
      if (event?.error === "aborted" || event?.error === "no-speech") {
        return;
      }
      setVoiceError("Microphone recognition was interrupted. Try speaking again.");
    };

    recognition.onend = () => {
      if (!listeningRef.current) {
        return;
      }

      try {
        recognition.start();
      } catch (error) {
        listeningRef.current = false;
        setListening(false);
        finishVoiceSession();
      }
    };

    try {
      recognition.start();
    } catch (error) {
      listeningRef.current = false;
      setListening(false);
      alert("Could not start the microphone.");
    }
  };


  const toggleVoice = () => {
    if (listening) {
      stopVoice();
      return;
    }
    startVoice();
  };


  useEffect(() => {
    if (!listening) {
      return;
    }

    const timer = setInterval(() => {
      const spoken = `${voiceFinalRef.current} ${voiceInterimRef.current}`.trim();
      const duration = (Date.now() - voiceStartedAtRef.current) / 1000;
      setLiveVoice(liveVoiceStats(spoken, duration));
    }, 400);

    return () => clearInterval(timer);
  }, [listening]);


  useEffect(() => {
    return () => {
      listeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.stop();
        } catch (error) {
          /* ignore */
        }
      }
    };
  }, []);


  const currentEmotion = liveAnalysis?.emotion || "neutral";

  const stashCurrentVoice = () => {
    const index = currentQRef.current;
    roundVoicesRef.current[index] = voiceAnalysisRef.current;
  };

  const loadVoiceForIndex = (index) => {
    const stored = roundVoicesRef.current[index] || null;
    voiceAnalysisRef.current = stored;
    setVoiceAnalysis(stored);
  };

  const persistCurrentDraft = () => {
    const text = readAnswer();
    const index = currentQRef.current;
    setDrafts((previous) => {
      const next = [...previous];
      next[index] = text;
      draftsRef.current = next;
      return next;
    });
    stashCurrentVoice();
    return text;
  };

  const showQuestionAt = async (index, opts = {}) => {
    if (index < 0 || index >= QUESTIONS_PER_ROUND) {
      return;
    }
    if (!canReachQuestion(index) && index > currentQ) {
      setAdaptiveNote(
        `Answer question ${currentQ + 1} first — the next prompt is built from that response.`
      );
      return;
    }
    persistCurrentDraft();
    const mustGenerate =
      opts.forceRegenerate ||
      !roundQuestionsRef.current[index];
    if (mustGenerate) {
      setGeneratingQuestion(true);
      try {
        await ensureQuestionAt(index, opts);
      } catch (error) {
        setAdaptiveNote(String(error?.message || error));
        return;
      } finally {
        setGeneratingQuestion(false);
      }
    } else {
      const roundNum = roundIndex + 1;
      setAdaptiveNote(
        `Round ${roundNum} · Question ${index + 1} of ${QUESTIONS_PER_ROUND}. Use Next after answering to generate the following question.`
      );
    }
    setCurrentQ(index);
    currentQRef.current = index;
    const nextQuestion = roundQuestionsRef.current[index];
    setDifficulty(levelLabel(nextQuestion?.level));
    const text = draftsRef.current[index] || "";
    answerRef.current = text;
    setDraft(text);
    setHeardInterim("");
    loadVoiceForIndex(index);
  };

  const goToNextQuestion = async () => {
    persistCurrentDraft();
    const text = String(draftsRef.current[currentQRef.current] || "").trim();
    if (!text) {
      setAdaptiveNote(
        "Type an answer first — the next question is generated from what you write here."
      );
      return;
    }
    const nextIndex = currentQRef.current + 1;
    if (nextIndex >= QUESTIONS_PER_ROUND) {
      return;
    }
    setRoundQuestions((previous) => {
      const next = previous.slice(0, nextIndex);
      roundQuestionsRef.current = next;
      return next;
    });
    setAskedIds((previous) => {
      const kept = (roundQuestionsRef.current || [])
        .filter(Boolean)
        .map((item) => item.id);
      askedIdsRef.current = kept;
      return kept;
    });
    await showQuestionAt(nextIndex, { forceRegenerate: true });
  };

  const buildAnswerRecordFor = (item, text, voice) => {
    const analysis = evaluateAnswer(text, item);
    return {
      question: formatPrompt(item, company),
      questionId: item.id,
      answer: text,
      score: analysis.score,
      scoreBand: scoreBand(analysis.score),
      difficulty: levelLabel(item.level),
      topic: item.topic,
      type: item.type,
      roundName,
      adaptiveReason: adaptiveNote,
      emotion: currentEmotion,
      keywordScore: analysis.keywordScore,
      patternScore: analysis.patternScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      voiceFluency: voice?.fluency,
      voiceAccuracy: voice?.accuracy,
      voiceAccent: voice?.accent,
      voiceLabel: voice?.fluency_label,
      voiceNotes: voice?.notes || [],
    };
  };

  const submitRound = async () => {
    if (submittingRef.current) {
      return;
    }
    persistCurrentDraft();
    const latestDrafts = draftsRef.current;
    if (latestDrafts.some((item) => !String(item || "").trim())) {
      return;
    }
    submittingRef.current = true;
    try {
      if (listeningRef.current) {
        listeningRef.current = false;
        setListening(false);
        if (recognitionRef.current) {
          try {
            recognitionRef.current.onend = null;
            recognitionRef.current.stop();
          } catch (error) {
            /* already stopped */
          }
          recognitionRef.current = null;
        }
        await finishVoiceSession();
        stashCurrentVoice();
      }

      const slots = Array.from(
        { length: QUESTIONS_PER_ROUND },
        (_, index) => roundQuestions[index]
      );
      if (slots.some((item) => !item)) {
        return;
      }
      const records = slots.map((item, index) =>
        buildAnswerRecordFor(
          item,
          latestDrafts[index] || "",
          roundVoicesRef.current[index]
        )
      );
      const average = roundAverage(records);
      const passed = passedRound(average);
      const roundSamples = samplesRef.current.slice(
        roundSampleOffsetRef.current
      );
      const faceSummary = summarizeBehavior(roundSamples);
      const roundId =
        roundQuestions[0]?.type ||
        roundsForCourse(course)[roundIndex]?.id ||
        "technical";
      const feedback = buildRoundFeedback({
        answers: records,
        behavior: faceSummary,
        course,
        roundId,
      });
      const report = {
        roundName,
        roundNumber: roundIndex + 1,
        roundId,
        answers: records,
        average,
        passed,
        feedback,
      };
      const reports = [
        ...roundReportsRef.current.filter(
          (item) => item.roundNumber !== roundIndex + 1
        ),
        report,
      ];
      roundReportsRef.current = reports;
      setRoundReports(reports);
      setLastRoundResult(report);
      setPhase("round-result");
    } finally {
      submittingRef.current = false;
    }
  };

  const retryRound = () => {
    setLastRoundResult(null);
    setPhase("questions");
    setCurrentQ(0);
    currentQRef.current = 0;
    const text = draftsRef.current[0] || "";
    answerRef.current = text;
    setDraft(text);
    loadVoiceForIndex(0);
    setAdaptiveNote(
      `Review and edit this round, then submit again. You need ${ROUND_PASS_SCORE}% to continue.`
    );
  };

  const startNextRound = async () => {
    if (!lastRoundResult?.passed) {
      return;
    }
    const committed = [...answers, ...lastRoundResult.answers];
    setAnswers(committed);
    answersRef.current = committed;
    if (roundIndex + 1 >= ROUND_COUNT) {
      finishInterview(packAllScoredAnswers(committed));
      return;
    }
    const nextIndex = roundIndex + 1;
    const nextRound = roundsForCourse(course)[nextIndex];
    setRoundIndex(nextIndex);
    setRoundQuestions([]);
    roundQuestionsRef.current = [];
    const empty = emptyDrafts();
    setDrafts(empty);
    draftsRef.current = empty;
    roundVoicesRef.current = Array(QUESTIONS_PER_ROUND).fill(null);
    setCurrentQ(0);
    currentQRef.current = 0;
    setRoundName(nextRound?.name || "Next round");
    setAdaptiveNote(
      `You passed ${lastRoundResult.roundName} with ${lastRoundResult.average}%. Generating the first question for round ${nextIndex + 1}…`
    );
    setLastRoundResult(null);
    setPhase("questions");
    roundSampleOffsetRef.current = samplesRef.current.length;
    clearAnswerBox();
    setVoiceAnalysis(null);
    voiceAnalysisRef.current = null;
    setGeneratingQuestion(true);
    try {
      const first = await ensureQuestionAt(0, {
        roundIndex: nextIndex,
        committed,
      });
      setDifficulty(levelLabel(first?.level));
    } catch (error) {
      setAdaptiveNote(String(error?.message || error));
    } finally {
      setGeneratingQuestion(false);
    }
  };


  const packAllScoredAnswers = (seedAnswers) => {
    const seen = new Set();
    const packed = [];
    const pushRecord = (record) => {
      if (!record?.questionId || seen.has(record.questionId)) {
        return;
      }
      seen.add(record.questionId);
      packed.push(record);
    };

    (roundReportsRef.current || []).forEach((report) => {
      (report.answers || []).forEach(pushRecord);
    });

    const seed = Array.isArray(seedAnswers) ? seedAnswers : answers;
    seed.forEach(pushRecord);

    if (lastRoundResult?.answers?.length) {
      lastRoundResult.answers.forEach(pushRecord);
    }

    const slots = Array.from(
      { length: QUESTIONS_PER_ROUND },
      (_, index) => roundQuestionsRef.current[index]
    );
    slots.forEach((item, index) => {
      if (!item) {
        return;
      }
      const text = String(draftsRef.current[index] || "").trim();
      if (!text) {
        return;
      }
      pushRecord(
        buildAnswerRecordFor(
          item,
          text,
          roundVoicesRef.current[index]
        )
      );
    });

    return packed;
  };

  const dismissMalpracticeAlert = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    malpracticeAlertActiveRef.current = false;
    setMalpracticeAlert(null);
    const nextCount = malpracticeDismissCount + 1;
    setMalpracticeDismissCount(nextCount);
    if (nextCount >= MAX_MALPRACTICE_DISMISSALS) {
      malpracticeEndingRef.current = true;
      finishInterview(undefined, {
        terminatedForMalpractice: true,
        malpracticeDismissals: nextCount,
      });
    }
  };

  const finishInterview = async (finalAnswers, finishOpts = {}) => {
    persistCurrentDraft();
    const packed = packAllScoredAnswers(finalAnswers);

    const scores = packed.map((item) => item.score);

    const average =
      scores.length > 0
        ? Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length
          )
        : 0;

    const keywordAverage =
      packed.length > 0
        ? Math.round(
            packed.reduce(
              (sum, item) => sum + (item.keywordScore || item.score || 0),
              0
            ) / packed.length
          )
        : 0;

    const patternAverage =
      packed.length > 0
        ? Math.round(
            packed.reduce(
              (sum, item) => sum + (item.patternScore || item.score || 0),
              0
            ) / packed.length
          )
        : 0;

    const voiceAnswers = packed.filter(
      (item) => typeof item.voiceFluency === "number"
    );
    const voice = voiceAnswers.length
      ? {
          used: true,
          fluency: Math.round(
            voiceAnswers.reduce((sum, item) => sum + item.voiceFluency, 0) /
              voiceAnswers.length
          ),
          accuracy: Math.round(
            voiceAnswers.reduce(
              (sum, item) => sum + (item.voiceAccuracy || 0),
              0
            ) / voiceAnswers.length
          ),
          accent: Math.round(
            voiceAnswers.reduce(
              (sum, item) => sum + (item.voiceAccent || item.voiceFluency || 0),
              0
            ) / voiceAnswers.length
          ),
          notes: [
            ...new Set(voiceAnswers.flatMap((item) => item.voiceNotes || [])),
          ].slice(0, 4),
        }
      : {
          used: false,
          fluency: 0,
          accuracy: 0,
          accent: 0,
          notes: [],
        };

    const avgField = (items, field) => {
      if (!items.length) {
        return null;
      }
      return Math.round(
        items.reduce((sum, item) => sum + Number(item[field] || 0), 0) /
          items.length
      );
    };
    const codingTechnical = packed.filter((item) =>
      ["coding", "technical"].includes(String(item.type || "").toLowerCase())
    );
    const hrAnswers = packed.filter(
      (item) => String(item.type || "").toLowerCase() === "hr"
    );
    const aptitudeCoding = packed.filter((item) =>
      ["aptitude", "coding"].includes(String(item.type || "").toLowerCase())
    );

    const technical = Math.min(
      100,
      avgField(codingTechnical, "keywordScore") ??
        avgField(codingTechnical, "score") ??
        keywordAverage
    );
    let communication = Math.min(
      100,
      avgField(hrAnswers, "patternScore") ??
        avgField(hrAnswers, "score") ??
        patternAverage
    );
    if (voice.used) {
      communication = Math.min(
        100,
        Math.round((communication + voice.fluency) / 2)
      );
    }
    const problemSolving = Math.max(
      0,
      avgField(aptitudeCoding, "score") ?? average
    );
    let behavior = summarizeBehavior(samplesRef.current);
    const malpracticeDismissals =
      finishOpts.malpracticeDismissals ?? malpracticeDismissCount;
    if (
      finishOpts.terminatedForMalpractice ||
      malpracticeDismissals > 0
    ) {
      behavior = {
        ...behavior,
        malpracticeDismissals,
        terminatedForMalpractice: Boolean(finishOpts.terminatedForMalpractice),
      };
    }

    const usedPrompts = packed.map((item) => item.question).filter(Boolean);
    const mergedPrior = appendLocalUsedPrompts(course, company, usedPrompts);
    priorUsedPromptsRef.current = mergedPrior;

    saveFlow({ interview: null });
    const baseBehavior = samplesRef.current.length
      ? behavior
      : emptyBehavior();
    const mergedBehavior =
      finishOpts.terminatedForMalpractice || malpracticeDismissals > 0
        ? {
            ...baseBehavior,
            malpracticeDismissals,
            terminatedForMalpractice: Boolean(
              finishOpts.terminatedForMalpractice
            ),
          }
        : baseBehavior;

    await onFinish({
      overall: average,
      technical,
      communication,
      problemSolving,
      answers: packed,
      behavior: mergedBehavior,
      voice,
      roundReports: roundReportsRef.current,
      terminatedForMalpractice: Boolean(finishOpts.terminatedForMalpractice),
      malpracticeDismissals,
    });
  };


  const wordCount = draft.trim()
    ? draft.trim().split(/\s+/).length
    : 0;

  const bbox = liveAnalysis?.bbox;
  const faceBoxes =
    liveAnalysis?.face_boxes?.length
      ? liveAnalysis.face_boxes
      : bbox
        ? [bbox]
        : [];
  const integrity = liveAnalysis?.integrity || "clear";
  const peopleInFrame = Number(liveAnalysis?.face_count || 0);

  if (!mediaConsent) {
    return (
      <div className="interview-page">
        <header className="interview-header">
          <button className="back-button" onClick={onBack}>
            ← Preparation
          </button>
          <div className="interview-brand">
            <div className="brand-mark">C</div>
            <strong>CareerForge</strong>
          </div>
          <span className="interview-company">
            {company?.name} · {course?.name}
          </span>
        </header>
        <main className="interview-container">
          <section className="consent-card">
            <p className="eyebrow">BEFORE WE START</p>
            <h1>Camera and microphone consent</h1>
            <p>
              This mock can analyse your camera for presence and
              expression, and your microphone when you choose to
              speak. Frames and transcripts go to the CareerForge
              ML service on this machine for this session only.
              They are not used to grade the wording of your
              written answer.
            </p>
            <ul>
              <li>Camera starts only if you allow it below.</li>
              <li>The microphone starts only when you press Start Voice Analysis.</li>
              <li>You can continue with typed answers only.</li>
              <li>
                Camera analysis flags malpractice when two or more people
                appear in frame. You will get an on-screen and voice alert.
                Dismissing that alert three times ends this mock interview
                immediately.
              </li>
            </ul>
            <div className="consent-actions">
              <button
                className="secondary-action"
                onClick={() => setMediaConsent("skip")}
              >
                Continue without camera
              </button>
              <button
                className="primary-action"
                onClick={() => setMediaConsent("camera")}
              >
                Allow camera analysis
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }


  if (phase === "round-result" && lastRoundResult) {
    const roundFeedback =
      lastRoundResult.feedback ||
      buildRoundFeedback({
        answers: lastRoundResult.answers || [],
        behavior: emptyBehavior(),
        course,
        roundId: lastRoundResult.roundId || roundQuestions[0]?.type || "technical",
      });

    return (
      <div className="interview-page">
        <header className="interview-header">
          <button className="back-button" onClick={onBack}>
            ← Preparation
          </button>
          <div className="interview-brand">
            <div className="brand-mark">C</div>
            <strong>CareerForge</strong>
          </div>
          <span className="interview-company">
            {company?.name} · {course?.name}
          </span>
        </header>
        <main className="interview-container round-result-container">
          <section className="consent-card round-gate-card">
            <p className="eyebrow">
              ROUND {lastRoundResult.roundNumber} OF {ROUND_COUNT}
            </p>
            <h1>{lastRoundResult.roundName} result</h1>
            <p className={lastRoundResult.passed ? "round-pass" : "round-fail"}>
              {lastRoundResult.passed
                ? `Passed with ${lastRoundResult.average}%. You can continue.`
                : `Scored ${lastRoundResult.average}%. You need ${ROUND_PASS_SCORE}% to open the next round.`}
            </p>
            <div className="round-gate-score">
              <strong>{lastRoundResult.average}%</strong>
              <span>
                {lastRoundResult.answers.length} questions · pass mark{" "}
                {ROUND_PASS_SCORE}%
              </span>
            </div>
            <RoundFeedbackPanel feedback={roundFeedback} />
            <ul className="round-gate-list">
              {lastRoundResult.answers.map((item, index) => (
                <li key={item.questionId || index}>
                  <span>
                    Q{index + 1}
                    {item.difficulty ? ` · ${item.difficulty}` : ""}
                  </span>
                  <strong>{item.score || 0}%</strong>
                </li>
              ))}
            </ul>
            <div className="consent-actions">
              {lastRoundResult.passed ? (
                <button className="primary-action" onClick={startNextRound}>
                  {isLastRound
                    ? "View full interview result →"
                    : `Start Round ${roundIndex + 2} →`}
                </button>
              ) : (
                <button className="primary-action" onClick={retryRound}>
                  Review answers & retry this round
                </button>
              )}
              <button className="ghost-action" onClick={() => finishInterview()}>
                End interview
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }


  return (
    <div className="interview-page">

      {malpracticeAlert && (
        <div
          className="malpractice-alert-overlay"
          role="alertdialog"
          aria-labelledby="malpractice-alert-title"
          aria-describedby="malpractice-alert-desc"
        >
          <div className="malpractice-alert-bar">
            <div className="malpractice-alert-copy">
              <p className="eyebrow">MALPRACTICE ALERT</p>
              <h2 id="malpractice-alert-title">
                {malpracticeAlert.faceCount >= 2
                  ? `${malpracticeAlert.faceCount} people detected`
                  : "Multiple people detected"}
              </h2>
              <p id="malpractice-alert-desc">
                Only you may stay in the camera frame during this interview.
                Remove other people from view, then dismiss this alert. Closing
                this alert {MAX_MALPRACTICE_DISMISSALS} times ends the test (
                {malpracticeDismissCount}/{MAX_MALPRACTICE_DISMISSALS} dismissals
                used).
              </p>
            </div>
            <button
              type="button"
              className="malpractice-alert-dismiss"
              onClick={dismissMalpracticeAlert}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <header className="interview-header">
        <button className="back-button" onClick={onBack}>
          ← Preparation
        </button>

        <div className="interview-brand">
          <div className="brand-mark">C</div>
          <strong>CareerForge</strong>
        </div>

        <span className="interview-company">
          {company?.name} · {course?.name}
        </span>
      </header>


      <main className="interview-container">

        <div className="interview-heading">
          <div>
            <p className="eyebrow">ADAPTIVE INTERVIEW</p>
            <h1>{roundName}</h1>
            <p>
              Round {roundNumber} of {ROUND_COUNT} · Question {questionInRound} of{" "}
              {QUESTIONS_PER_ROUND} · {difficulty} ·{" "}
              {typeLabel(question?.type, course)}
            </p>
          </div>

          <button
            className="end-button"
            onClick={() => finishInterview()}
          >
            End Interview
          </button>
        </div>


        <div className="interview-progress">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>


        <div className="question-meta">
          Question {questionInRound} of {QUESTIONS_PER_ROUND} · {roundName} ·{" "}
          {answeredInRound}/{QUESTIONS_PER_ROUND} answered
          <span className="level-pill">{difficulty}</span>
        </div>

        <p className="adaptive-banner">{adaptiveNote}</p>
        {generatingQuestion ? (
          <p className="behavior-note">Generating the next adaptive question…</p>
        ) : null}

        <div className="question-stepper" role="navigation" aria-label="Questions in this round">
          {Array.from({ length: QUESTIONS_PER_ROUND }, (_, index) => {
            const item = roundQuestions[index];
            return (
            <button
              key={item?.id || `q-slot-${index}`}
              type="button"
              className={`question-step ${index === currentQ ? "current" : ""} ${
                String(drafts[index] || "").trim() ? "done" : ""
              } ${item ? "" : "pending"}`}
              disabled={generatingQuestion || !canReachQuestion(index)}
              onClick={() => showQuestionAt(index)}
            >
              {index + 1}
            </button>
            );
          })}
        </div>


        <section className="question-card">

          <h2>
            {question
              ? prompt
              : generatingQuestion
                ? "Preparing your adaptive question…"
                : "Waiting for the adaptive question generator…"}
          </h2>

          <label className="section-label" htmlFor="interview-answer">
            YOUR ANSWER
          </label>
          <textarea
            id="interview-answer"
            key={`${roundIndex}-${currentQ}-${question?.id}`}
            ref={textareaRef}
            defaultValue={drafts[currentQ] || ""}
            disabled={generatingQuestion || !question}
            onInput={(e) => scheduleDraft(e.target.value)}
            placeholder="Answer as you would in a corporate interview: definition, trade-off, and a workplace example."
          />
          {heardInterim ? (
            <p className="behavior-note">
              Hearing: {heardInterim}
            </p>
          ) : null}

          <div className="question-nav question-nav-under-answer">
            <button
              type="button"
              className="nav-question"
              disabled={currentQ <= 0 || generatingQuestion}
              onClick={() => showQuestionAt(currentQ - 1)}
            >
              ← Previous
            </button>
            <button
              type="button"
              className="nav-question"
              disabled={
                generatingQuestion ||
                currentQ >= QUESTIONS_PER_ROUND - 1 ||
                !String(drafts[currentQ] || "").trim()
              }
              onClick={() => goToNextQuestion()}
            >
              Next →
            </button>
          </div>

          <div className="answer-support">
            <div className="answer-support-top">
              <p className="section-label">RESPONSE</p>
              <strong>
                {wordCount ? `${wordCount} words` : "Not started"}
              </strong>
            </div>
            <p className="behavior-note">
              Use Previous / Next to move through all {QUESTIONS_PER_ROUND}{" "}
              questions. Scoring happens when you submit this round. You need{" "}
              {ROUND_PASS_SCORE}% to open the next round.
            </p>
          </div>


          <div className="interview-tools">
            <button
              className={
                listening
                  ? "tool-button active-tool"
                  : "tool-button"
              }
              onClick={toggleVoice}
            >
              🎤 {listening ? "Stop & Score Voice" : "Start Voice Analysis"}
            </button>

            <button
              className="tool-button camera-button"
              onClick={toggleCamera}
            >
              📷 {cameraOpen ? "Stop Camera Analysis" : "Start Camera Analysis"}
            </button>
          </div>


          <div className="voice-card">
            <div className="answer-support-top">
              <p className="section-label">VOICE ANALYSIS</p>
              <strong>
                {listening
                  ? `${liveVoice.wpm} WPM`
                  : voiceAnalysis
                    ? voiceAnalysis.fluency_label
                    : "Not scored"}
              </strong>
            </div>

            <h3>
              {listening
                ? "Listening for fluency and accuracy..."
                : voiceAnalysis
                  ? `${voiceAnalysis.fluency_label} delivery`
                  : "Speak your answer, then stop to score"}
            </h3>

            {voiceError && (
              <p className="behavior-note warning-note">
                {voiceError}
              </p>
            )}

            {!listening && !voiceAnalysis && !voiceError && (
              <p className="behavior-note">
                A trained Random Forest / Gradient Boosting model
                scores fluency, accuracy, and accent/clarity
                (how well speech recognition understood you).
              </p>
            )}

            <Meter
              title="Accent / clarity"
              value={voiceAnalysis?.accent || 0}
              tone="good"
            />
            <Meter
              title="Fluency"
              value={voiceAnalysis?.fluency || 0}
              tone="good"
            />
            <Meter
              title="Accuracy"
              value={voiceAnalysis?.accuracy || 0}
              tone="warn"
            />

            {listening && (
              <p className="behavior-note">
                Live pace: {liveVoice.wpm} words/min · {liveVoice.wordCount} words
              </p>
            )}

            {!!voiceAnalysis?.notes?.length && (
              <ul className="behavior-flags">
                {voiceAnalysis.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>


          <div className="proctor-panel">

            {cameraOpen && (
              <div className="camera-box">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                />

                {faceBoxes.map((box, index) => (
                  <i
                    key={`face-${index}`}
                    className={`face-box${
                      faceBoxes.length > 1 ? " face-box-multi" : ""
                    }`}
                    style={{
                      left: `${box.x * 100}%`,
                      top: `${box.y * 100}%`,
                      width: `${box.w * 100}%`,
                      height: `${box.h * 100}%`,
                    }}
                  />
                ))}

                {peopleInFrame > 0 && (
                  <span className="face-count-badge">
                    {peopleInFrame} {peopleInFrame === 1 ? "person" : "people"}{" "}
                    in frame
                  </span>
                )}

                <span className={`integrity-badge ${integrity}`}>
                  {integrityLabel(integrity)}
                </span>
              </div>
            )}


            <div className="behavior-card">
              <p className="section-label">CAMERA ANALYSIS</p>
              <h3>
                {liveAnalysis
                  ? emotionLabel(liveAnalysis.emotion)
                  : cameraOpen
                    ? "Reading expression..."
                    : "Camera is off"}
              </h3>

              {cameraError && (
                <p className="behavior-note warning-note">
                  {cameraError}
                </p>
              )}

              {serviceError && cameraOpen && (
                <p className="behavior-note warning-note">
                  {serviceError}
                </p>
              )}

              {!cameraOpen && !cameraError && (
                <p className="behavior-note">
                  Turn the camera on to estimate confidence,
                  nervousness, and malpractice risk.
                </p>
              )}

              {cameraOpen && (
                <p className="behavior-note malpractice-disclaimer">
                  If two or more people appear in the camera, you will hear and
                  see a malpractice alert. Dismissing that alert three times
                  closes this interview ({malpracticeDismissCount}/
                  {MAX_MALPRACTICE_DISMISSALS} dismissals so far).
                </p>
              )}

              <Meter
                title="Confidence"
                value={liveAnalysis?.confidence || 0}
                tone="good"
              />
              <Meter
                title="Nervousness"
                value={liveAnalysis?.nervousness || 0}
                tone="warn"
              />
              <Meter
                title="Cheating / malpractice risk"
                value={liveAnalysis?.cheating_risk || 0}
                tone="risk"
              />

              {!!liveAnalysis?.reasons?.length && (
                <ul className="behavior-flags">
                  {liveAnalysis.reasons.slice(0, 3).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>

          </div>


          <canvas ref={canvasRef} className="hidden-capture" />


          <div className="communication">
            {answeredInRound}/{QUESTIONS_PER_ROUND} questions answered in this
            round.
            {voiceAnalysis ? " Voice sample captured for this question." : ""}
          </div>

          <button
            className="submit-answer"
            disabled={!canSubmitRound}
            onClick={submitRound}
          >
            Submit Round {roundNumber}
          </button>
          {!canSubmitRound ? (
            <p className="behavior-note">
              Answer all {QUESTIONS_PER_ROUND} questions before submitting
              this round.
            </p>
          ) : null}

        </section>

      </main>

    </div>
  );
}


function Meter({ title, value, tone }) {
  return (
    <div className="behavior-meter">
      <div className="score-row-top">
        <span>{title}</span>
        <strong>{value}%</strong>
      </div>
      <div className="score-bar">
        <i
          className={`meter-fill ${tone}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}


export default MockInterview;
