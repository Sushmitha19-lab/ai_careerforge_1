const fs = require("fs");
const path = require("path");
const { run, ensureSchema } = require("./schema");

const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

let mysqlOk = false;

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function fileUsers() {
  return readJson(USERS_FILE, []);
}

function fileSessions() {
  return readJson(SESSIONS_FILE, []);
}

async function init(db) {
  try {
    await Promise.race([
      (async () => {
        await ensureSchema(db);
        await run(db, "SELECT 1");
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("MySQL timeout")), 4000)
      ),
    ]);
    mysqlOk = true;
    console.log("Accounts: MySQL");
  } catch (error) {
    mysqlOk = false;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.warn("Accounts: file store (" + error.message + ")");
  }
}

async function createUser(db, { name, email, passwordHash = null, googleId = null }) {
  if (mysqlOk) {
    try {
      const result = await run(
        db,
        "INSERT INTO users (name, email, password_hash, google_id) VALUES (?, ?, ?, ?)",
        [name, email, passwordHash, googleId]
      );
      return { id: result.insertId, name, email };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw error;
      }
      mysqlOk = false;
    }
  }

  const users = fileUsers();
  if (
    users.some((item) => item.email === email) ||
    (googleId && users.some((item) => item.google_id === googleId))
  ) {
    const error = new Error("Duplicate email");
    error.code = "ER_DUP_ENTRY";
    throw error;
  }
  const user = {
    id: Date.now(),
    name,
    email,
    password_hash: passwordHash,
    google_id: googleId,
    created_at: new Date().toISOString(),
  };
  users.push(user);
  writeJson(USERS_FILE, users);
  return { id: user.id, name, email };
}

async function findUserByGoogleId(db, googleId) {
  if (!googleId) {
    return null;
  }
  if (mysqlOk) {
    try {
      const rows = await run(
        db,
        "SELECT id, name, email, password_hash, google_id FROM users WHERE google_id = ? LIMIT 1",
        [googleId]
      );
      if (rows[0]) {
        return rows[0];
      }
    } catch (error) {
      mysqlOk = false;
    }
  }
  return fileUsers().find((item) => item.google_id === googleId) || null;
}

async function attachGoogleId(db, userId, googleId) {
  if (mysqlOk) {
    try {
      await run(db, "UPDATE users SET google_id = ? WHERE id = ?", [
        googleId,
        userId,
      ]);
      return;
    } catch (error) {
      mysqlOk = false;
    }
  }
  const users = fileUsers().map((item) =>
    Number(item.id) === Number(userId)
      ? { ...item, google_id: googleId }
      : item
  );
  writeJson(USERS_FILE, users);
}

async function upsertGoogleUser(db, { name, email, googleId }) {
  const existingGoogle = await findUserByGoogleId(db, googleId);
  if (existingGoogle) {
    return {
      id: existingGoogle.id,
      name: existingGoogle.name,
      email: existingGoogle.email,
    };
  }

  const existingEmail = await findUserByEmail(db, email);
  if (existingEmail) {
    await attachGoogleId(db, existingEmail.id, googleId);
    return {
      id: existingEmail.id,
      name: existingEmail.name,
      email: existingEmail.email,
    };
  }

  return createUser(db, {
    name,
    email,
    passwordHash: null,
    googleId,
  });
}

async function findUserByEmail(db, email) {
  if (mysqlOk) {
    try {
      const rows = await run(
        db,
        "SELECT id, name, email, password_hash, google_id FROM users WHERE email = ? LIMIT 1",
        [email]
      );
      if (rows[0]) {
        return rows[0];
      }
    } catch (error) {
      mysqlOk = false;
    }
  }
  return fileUsers().find((item) => item.email === email) || null;
}

async function findUserById(db, id) {
  if (mysqlOk) {
    try {
      const rows = await run(
        db,
        "SELECT id, name, email FROM users WHERE id = ? LIMIT 1",
        [id]
      );
      if (rows[0]) {
        return rows[0];
      }
    } catch (error) {
      mysqlOk = false;
    }
  }
  const user = fileUsers().find((item) => Number(item.id) === Number(id));
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

async function saveInterview(db, userId, body) {
  const record = {
    id: Date.now(),
    user_id: userId,
    course_name: body.course_name || "",
    company_name: body.company_name || "",
    overall: Number(body.overall || 0),
    technical: Number(body.technical || 0),
    communication: Number(body.communication || 0),
    problem_solving: Number(body.problem_solving || 0),
    payload: {
      answers: body.answers || [],
      explained: body.explained || null,
      behavior: body.behavior || null,
      voice: body.voice || null,
      roundReports: body.round_reports || body.roundReports || [],
    },
    created_at: new Date().toISOString(),
  };

  if (mysqlOk) {
    try {
      const session = await run(
        db,
        `INSERT INTO interview_sessions
          (user_id, course_name, company_name, overall, technical, communication, problem_solving, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          record.course_name,
          record.company_name,
          record.overall,
          record.technical,
          record.communication,
          record.problem_solving,
          JSON.stringify(record.payload),
        ]
      );
      const sessionId = session.insertId;
      for (const item of record.payload.answers) {
        const missing = (item.missingKeywords || []).slice(0, 3).join(", ");
        try {
          await run(
            db,
            `INSERT INTO interview_results
              (user_id, session_id, question, user_answer, score, emotion, feedback, weak_area)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              sessionId,
              item.question || "",
              item.answer || "",
              item.score || 0,
              item.emotion || "",
              item.adaptiveReason || "",
              missing,
            ]
          );
        } catch (rowError) {
          console.error("Result row save error:", rowError.message);
        }
      }
      return sessionId;
    } catch (error) {
      mysqlOk = false;
    }
  }

  const sessions = fileSessions();
  sessions.push(record);
  writeJson(SESSIONS_FILE, sessions);
  return record.id;
}

async function listInterviews(db, userId) {
  if (mysqlOk) {
    try {
      return await run(
        db,
        `SELECT id, course_name, company_name, overall, technical, communication, problem_solving, created_at
         FROM interview_sessions
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );
    } catch (error) {
      mysqlOk = false;
    }
  }

  return fileSessions()
    .filter((item) => Number(item.user_id) === Number(userId))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map((item) => ({
      id: item.id,
      course_name: item.course_name,
      company_name: item.company_name,
      overall: item.overall,
      technical: item.technical,
      communication: item.communication,
      problem_solving: item.problem_solving,
      created_at: item.created_at,
    }));
}

async function listUsedQuestionPrompts(db, userId, courseName, companyName) {
  const prompts = [];
  const addPrompt = (value) => {
    const text = String(value || "").trim();
    if (text) {
      prompts.push(text);
    }
  };

  if (mysqlOk) {
    try {
      const rows = await run(
        db,
        `SELECT course_name, company_name, payload
         FROM interview_sessions
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );
      (rows || []).forEach((row) => {
        if (courseName && row.course_name !== courseName) {
          return;
        }
        if (companyName && row.company_name !== companyName) {
          return;
        }
        let payload = row.payload;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (error) {
            payload = {};
          }
        }
        (payload?.answers || []).forEach((item) => addPrompt(item.question));
      });
      return prompts;
    } catch (error) {
      mysqlOk = false;
    }
  }

  fileSessions()
    .filter((item) => Number(item.user_id) === Number(userId))
    .filter((item) => !courseName || item.course_name === courseName)
    .filter((item) => !companyName || item.company_name === companyName)
    .forEach((item) => {
      (item.payload?.answers || []).forEach((answer) =>
        addPrompt(answer.question)
      );
    });

  return prompts;
}

module.exports = {
  init,
  createUser,
  findUserByEmail,
  findUserById,
  upsertGoogleUser,
  saveInterview,
  listInterviews,
  listUsedQuestionPrompts,
};
