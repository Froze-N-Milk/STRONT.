import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Call backend account registration API */
async function signupRequest(email: string, password: string) {
  const res = await fetch("/api/account/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res;
}

/** Sign-up page rendered as a centered modal inside #pagebody_wrapper */
function SignUpModal() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Close modal and go back to home
  function onClose() {
    navigate({ to: "/", replace: true });
  }

  // ESC to close + lock body scroll while modal is open
  // TODO: later, extract this shared effect into a small custom hook.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  });

  // Submit sign-up form
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email || !pw) {
      setErr("Email and password are required.");
      return;
    }
    if (pw.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (pw !== pw2) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await signupRequest(email, pw);

      if (res.redirected) {
        // Backend will normally redirect on success; this navigate is the proper client-side handoff.
        window.location.assign(res.url);
        return; // This line shouldn't normally get hit afterwards.
      }

      if (!res.ok) {
        // Backend doesn't currently return a JSON error body; keep a generic message.
        setErr("Sign up failed");
        return;
      }

      // Fallback: if backend doesn't redirect (should be rare), go home so navbar can refresh user state.
      // This line shouldn't normally get hit.
      navigate({ to: "/", replace: true });
    } finally {
      setLoading(false);
    }
  }

  // Minimal inline styles (keep changes local to this file)
  const overlay: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,.45)",
    zIndex: 50,
    padding: 12,
    display: "grid",
    placeItems: "center",
  };
  const card: React.CSSProperties = {
    width: "min(92vw, 600px)",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "90dvh",
    overflow: "hidden",
    position: "relative",
  };
  const header: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px",
    borderBottom: "1px solid #eee",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 1,
  };
  const body: React.CSSProperties = {
    padding: 20,
    overflowY: "auto",
    display: "flex",
    justifyContent: "center",
  };
  const closeBtn: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111", // ensure "×" is visible on white background
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
  };
  const footerLine: React.CSSProperties = {
    marginTop: 12,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    display: "inline-flex",
    alignItems: "center",
    gap: 6, // avoid {" "}
  };
  const fieldGroup: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 12,
    width: "100%",
  };

  // Modal contents
  const modal = (
    <div
      style={overlay}
      onClick={(e) => {
        // close only when clicking the backdrop, not inside the card
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <strong>Create your account</strong>
          <button aria-label="Close" onClick={onClose} style={closeBtn}>
            ×
          </button>
        </div>

        <div style={body}>
          <form style={{ width: "400px" }} onSubmit={onSubmit}>
            {/* Use vertical stacking; keep existing site styles with minimal inline tweaks */}
            <div
              className="log_sign_wrapper"
              style={{
                width: "100%",
                boxShadow: "none",
                padding: 0,
                alignItems: "stretch",
              }}
            >
              <div style={fieldGroup}>
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="username"
                  autoFocus // prefer html autofocus instead of JS focus
                />
              </div>

              <div style={fieldGroup}>
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="6+ characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div style={fieldGroup}>
                <label htmlFor="signup-password2">Confirm password</label>
                <input
                  id="signup-password2"
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  autoFocus
                />
              </div>

              {err && (
                <p
                  style={{ color: "#b00020" }}
                  role="alert"
                  aria-live="assertive"
                >
                  {err}
                </p>
              )}

              <button type="submit" disabled={loading} className="submit_button">
                {loading ? "…" : "Create account"}
              </button>

              <div style={{ textAlign: "center", marginTop: 12 }}>
                <span style={footerLine}>
                  <span>Already have an account?</span>
                  <Link
                    to="/login"
                    style={{ color: "#a4161a", textDecoration: "underline" }}
                  >
                    Log in
                  </Link>
                </span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Render inside the page body wrapper to look like a single part with the header
  const portalRoot =
    document.getElementById("pagebody_wrapper") ?? document.body;
  return createPortal(modal, portalRoot);
}

export const Route = createFileRoute("/sign-up/")({
  component: SignUpModal,
});
