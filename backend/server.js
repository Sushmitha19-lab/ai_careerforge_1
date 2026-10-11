const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { createProxyMiddleware } = require("http-proxy-middleware");

const catalog = require(path.join(__dirname, "../src/data/catalog.json"));
const db = require("./db");
const accounts = require("./accounts");
const { signToken, publicUser, requireAuth } = require("./auth");
const { verifyGoogleIdToken } = require("./googleAuth");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const ML_ORIGIN = process.env.ML_ORIGIN || "http://127.0.0.1:5001";
const DIST = path.join(__dirname, "../dist");

app.use(cors({ origin: true, credentials: false }));

app.use(
  "/ml",
  createProxyMiddleware({
    target: ML_ORIGIN,
    changeOrigin: true,
    pathRewrite: { "^/ml": "" },
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  db.query("SELECT 1", (err) => {
    res.json({ ok: true, mysql: !err });
  });
});

app.get("/api/health", (req, res) => {
  db.query("SELECT 1", (err) => {
    res.json({ ok: true, mysql: !err });
  });
});

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const user = await accounts.createUser(db, {
      name,
      email,
      passwordHash: hash,
    });
    res.status(201).json({
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "Could not create the account. Check that MySQL is running." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await accounts.findUserByEmail(db, email);
    if (!user) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    if (!user.password_hash) {
      return res.status(401).json({
        error: "This account uses Google. Continue with Google above.",
      });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    res.json({
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Could not sign in. Check that MySQL is running." });
  }
});

app.get("/api/auth/config", (req, res) => {
  res.json({
    googleClientId: String(process.env.GOOGLE_CLIENT_ID || "").trim(),
  });
});

app.post("/api/auth/google", async (req, res) => {
  try {
    const profile = await verifyGoogleIdToken(req.body?.credential);
    const user = await accounts.upsertGoogleUser(db, profile);
    res.json({
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Google auth error:", error.message);
    res.status(error.status || 500).json({
      error: error.message || "Could not sign in with Google.",
    });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await accounts.findUserById(db, req.user.id);
    if (!user) {
      return res.status(401).json({ error: "Account not found." });
    }
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: "Could not load the account." });
  }
});

app.get("/api/courses", (req, res) => {
  res.json(catalog.courses);
});

app.get("/api/companies", (req, res) => {
  const sql = `
    SELECT *
    FROM companies
    ORDER BY name
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Companies error:", err);
      return res.status(500).json({ error: "Failed to fetch companies" });
    }
    res.json(results);
  });
});

app.get("/api/courses/:courseId/companies", (req, res) => {
  const courseId = req.params.courseId;
  res.json(catalog.companiesByCourseId[String(courseId)] || []);
});

app.get("/api/requirements/detect", (req, res) => {
  const name = String(req.query.company || "").trim();
  const cycles = catalog.companiesByCourseId;
  const found = Object.values(cycles)
    .flat()
    .find((item) => String(item.name).toLowerCase() === name.toLowerCase());
  res.json({
    company: found?.name || name || "Unknown",
    message:
      "Open SkillBridge in the app and run the detector. Snapshots live in the Career Compass cycle file.",
  });
});

app.get("/api/companies/:companyId/requirements", (req, res) => {
  const companyId = req.params.companyId;
  const sql = `
    SELECT *
    FROM company_requirements
    WHERE company_id = ?
  `;

  db.query(sql, [companyId], (err, results) => {
    if (err) {
      console.error("Requirements error:", err);
      return res.status(500).json({
        error: "Failed to fetch company requirements",
      });
    }
    res.json(results);
  });
});

app.post("/api/interview/results", requireAuth, async (req, res) => {
  try {
    const id = await accounts.saveInterview(db, req.user.id, {
      course_name: req.body?.course_name || "",
      company_name: req.body?.company_name || "",
      overall: req.body?.overall,
      technical: req.body?.technical,
      communication: req.body?.communication,
      problem_solving: req.body?.problem_solving,
      answers: req.body?.answers,
      explained: req.body?.explained,
      behavior: req.body?.behavior,
      voice: req.body?.voice,
    });
    res.json({
      message: "Interview result saved successfully",
      id,
    });
  } catch (error) {
    console.error("Result save error:", error);
    res.status(500).json({ error: "Failed to save interview result" });
  }
});

app.get("/api/interview/used-prompts", requireAuth, async (req, res) => {
  try {
    const prompts = await accounts.listUsedQuestionPrompts(
      db,
      req.user.id,
      req.query?.course_name || "",
      req.query?.company_name || ""
    );
    res.json({
      prompts,
      count: prompts.length,
      attempt_offset: Math.floor(prompts.length / 15),
    });
  } catch (error) {
    console.error("Used prompts error:", error);
    res.status(500).json({ error: "Failed to load prior questions" });
  }
});

app.get("/api/me/results", requireAuth, async (req, res) => {
  try {
    const sessions = await accounts.listInterviews(db, req.user.id);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch interview results" });
  }
});

app.get("/api/users/:userId/results", requireAuth, async (req, res) => {
  if (Number(req.params.userId) !== Number(req.user.id)) {
    return res.status(403).json({ error: "You can only read your own results." });
  }

  try {
    const sessions = await accounts.listInterviews(db, req.user.id);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch interview results" });
  }
});

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.use((req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/ml") ||
      req.path === "/health"
    ) {
      return next();
    }
    res.sendFile(path.join(DIST, "index.html"));
  });
}

async function start() {
  await accounts.init(db);

  app.listen(PORT, () => {
    console.log("-----------------------------------");
    console.log("CareerForge backend running");
    console.log(`Origin: http://127.0.0.1:${PORT}`);
    console.log(`ML proxy: ${ML_ORIGIN}`);
    console.log("-----------------------------------");
  });
}

start();
