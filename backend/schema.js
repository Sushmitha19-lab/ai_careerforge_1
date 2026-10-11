function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

async function ensureSchema(db) {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NULL,
      google_id VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  try {
    await run(
      db,
      "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL"
    );
  } catch (error) {
    /* column already exists */
  }

  try {
    await run(
      db,
      "ALTER TABLE users ADD COLUMN google_id VARCHAR(64) NULL"
    );
  } catch (error) {
    /* column already exists */
  }

  try {
    await run(
      db,
      "CREATE UNIQUE INDEX idx_users_google_id ON users (google_id)"
    );
  } catch (error) {
    /* index already exists */
  }

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS interview_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      course_name VARCHAR(190) NULL,
      company_name VARCHAR(190) NULL,
      overall INT NULL,
      technical INT NULL,
      communication INT NULL,
      problem_solving INT NULL,
      payload LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sessions_user (user_id)
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS interview_results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      session_id INT NULL,
      question TEXT NULL,
      user_answer TEXT NULL,
      score INT NULL,
      emotion VARCHAR(80) NULL,
      feedback TEXT NULL,
      weak_area VARCHAR(190) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_results_user (user_id)
    )`
  );

  try {
    await run(db, "ALTER TABLE interview_results ADD COLUMN session_id INT NULL");
  } catch (error) {
    /* column already exists */
  }
}

module.exports = { run, ensureSchema };
