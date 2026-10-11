async function verifyGoogleIdToken(credential) {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || "").trim();
  if (!clientId) {
    const error = new Error(
      "Google sign-in is not configured. Add GOOGLE_CLIENT_ID to backend/.env."
    );
    error.status = 503;
    throw error;
  }

  const token = String(credential || "").trim();
  if (!token) {
    const error = new Error("Google did not return a sign-in token.");
    error.status = 400;
    throw error;
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.error) {
    const error = new Error("Google could not verify this sign-in. Try again.");
    error.status = 401;
    throw error;
  }

  if (payload.aud !== clientId) {
    const error = new Error("This Google sign-in is for a different app.");
    error.status = 401;
    throw error;
  }

  const issuers = ["accounts.google.com", "https://accounts.google.com"];
  if (!issuers.includes(payload.iss)) {
    const error = new Error("Google could not verify this sign-in. Try again.");
    error.status = 401;
    throw error;
  }

  const verified =
    payload.email_verified === true || payload.email_verified === "true";
  if (!verified || !payload.email) {
    const error = new Error("Google did not provide a verified email.");
    error.status = 401;
    throw error;
  }

  return {
    email: String(payload.email).trim().toLowerCase(),
    name: String(payload.name || payload.email.split("@")[0]).trim(),
    googleId: String(payload.sub),
  };
}

module.exports = { verifyGoogleIdToken };
