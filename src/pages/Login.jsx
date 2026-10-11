import React, { useEffect, useRef, useState } from "react";

import { authFetch } from "../utils/api";

const GIS_SRC = "https://accounts.google.com/gsi/client";

let gisLoader;

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (gisLoader) {
    return gisLoader;
  }
  gisLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Could not load Google sign-in."))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Could not load Google sign-in."));
    document.head.appendChild(script);
  });
  return gisLoader;
}

function Login({ onLogin }) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(null);
  const googleBtnRef = useRef(null);
  const onLoginRef = useRef(onLogin);
  const isRegister = mode === "register";

  onLoginRef.current = onLogin;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/config")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setGoogleClientId(String(data.googleClientId || "").trim());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGoogleClientId("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleBtnRef.current) {
      return;
    }

    let cancelled = false;

    const finishGoogle = async (credential) => {
      setBusy(true);
      setFormError("");
      try {
        const data = await authFetch("/api/auth/google", {
          method: "POST",
          body: JSON.stringify({ credential }),
        });
        onLoginRef.current({
          token: data.token,
          student: data.user,
        });
      } catch (error) {
        setFormError(error.message || "Could not continue with Google.");
      } finally {
        setBusy(false);
      }
    };

    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !googleBtnRef.current || !window.google?.accounts?.id) {
          return;
        }
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response?.credential) {
              finishGoogle(response.credential);
            }
          },
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        googleBtnRef.current.innerHTML = "";
        const width = Math.min(
          400,
          Math.max(240, Math.floor(googleBtnRef.current.offsetWidth || 336))
        );
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: isRegister ? "signup_with" : "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          width,
        });
      })
      .catch((error) => {
        if (!cancelled) {
          setFormError(error.message || "Could not load Google sign-in.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [googleClientId, isRegister]);

  const submit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setFormError("Email and password are required.");
      return;
    }
    if (isRegister && !name.trim()) {
      setFormError("Enter your name to create an account.");
      return;
    }
    if (isRegister && password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    setFormError("");

    try {
      const path = isRegister ? "/api/auth/register" : "/api/auth/login";
      const data = await authFetch(path, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      onLogin({
        token: data.token,
        student: data.user,
      });
    } catch (error) {
      setFormError(error.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-left">

        <div className="login-brand">
          <div className="brand-mark">C</div>

          <div>
            <strong>CareerForge</strong>
            <span>career preparation</span>
          </div>
        </div>

        <div className="login-content">

          <p className="eyebrow">
            YOUR CAREER, FORGED WITH PURPOSE
          </p>

          <h1>
            From learning
            <br />
            to <em>landing.</em>
          </h1>

          <p>
            Sign in with Google or email to save interview
            results, keep your place after refresh, and
            prepare against a real company bar.
          </p>

          <div className="login-points">
            <span>01</span>
            <span>Choose your career path</span>

            <span>02</span>
            <span>Prepare for your target company</span>

            <span>03</span>
            <span>Measure your interview readiness</span>
          </div>

        </div>

        <div className="login-footer">
          CareerForge · Student Career Preparation Platform
        </div>

      </div>


      <div className="login-right">

        <div className="login-form-card">

          <p className="form-label">
            {isRegister ? "CREATE ACCOUNT" : "SIGN IN"}
          </p>

          <h2>
            {isRegister ? "Join CareerForge" : "Welcome back"}
          </h2>

          <p className="form-description">
            {isRegister
              ? "Sign up with Google, or create an account with email and password."
              : "Continue with Google, or sign in with the email and password you registered."}
          </p>

          <div className="auth-toggle">
            <button
              type="button"
              className={!isRegister ? "active" : ""}
              onClick={() => {
                setMode("signin");
                setFormError("");
              }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={isRegister ? "active" : ""}
              onClick={() => {
                setMode("register");
                setFormError("");
              }}
            >
              Create account
            </button>
          </div>

          {googleClientId ? (
            <div className="google-auth" ref={googleBtnRef} />
          ) : googleClientId === "" ? (
            <p className="google-auth-hint">
              Google sign-in is not enabled yet. Add a Web Client ID
              to backend/.env as GOOGLE_CLIENT_ID, then restart the API.
            </p>
          ) : null}

          <div className="auth-divider">
            <span>or use email</span>
          </div>

          <form onSubmit={submit}>

            {isRegister ? (
              <>
                <label htmlFor="student-name">Your name</label>
                <input
                  id="student-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </>
            ) : null}

            <label htmlFor="student-email">Email address</label>
            <input
              id="student-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="student-password">Password</label>
            <input
              id="student-password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? "At least 8 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {formError ? (
              <p className="form-error">{formError}</p>
            ) : null}

            <button
              type="submit"
              className="login-button"
              disabled={busy}
            >
              {busy
                ? "Please wait…"
                : isRegister
                  ? "Create account →"
                  : "Sign in →"}
            </button>

          </form>

          <p className="login-note">
            Google creates or opens your account from a verified
            Gmail. Passwords are stored as hashes. Interview video
            is not recorded unless you later allow the camera.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;
