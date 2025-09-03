import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Call backend login API */
async function loginRequest(email: string, password: string) {
  const res = await fetch("/api/login", {
    method: "POST",
    // no need for credentials here
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res;
}

/** Login page rendered as a centered modal inside #pagebody_wrapper */
function LoginModal() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // lock body scroll while modal is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  function onClose() {
    navigate({ to: "/", replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!email || !pw) {
      setErr("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await loginRequest(email, pw);

      // backend WILL ALWAYS redirect upon successful login
      if (res.redirected) {
        const to = new URL(res.url);
        navigate({ to: (to.pathname || "/") as any, replace: true });
        return;
      }

      // Normally we shouldn't hit this line if login succeeds (server redirects).
      if (!res.ok) {
        // backend doesn't return structured error yet — show generic message
        throw new Error("Login failed");
      }

      navigate({ to: "/", replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  // minimal inline styles to avoid touching other files
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
  const body: React.CSSProperties = { padding: 20, overflowY: "auto" };
  const closeBtn: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
  };
  const footerLink: React.CSSProperties = {
    marginTop: 12,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  };
  const fieldGroup: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 12,
    width: "100%",
  };

  const modal = (
    <div
      style={overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <strong>Log in</strong>
          <button aria-label="Close" onClick={onClose} style={closeBtn}>
            ×
          </button>
        </div>

        <div style={body}>
          <form onSubmit={onSubmit}>
            <div
              className="log_sign_wrapper"
              style={{ width: "100%", boxShadow: "none", padding: 0, alignItems: "stretch" }}
            >
              <div style={fieldGroup}>
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div style={fieldGroup}>
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
              </div>

              {err && (
                <p style={{ color: "#b00020" }} role="alert" aria-live="assertive">
                  {err}
                </p>
              )}

              <button type="submit" disabled={loading} className="submit_button" style={{ width: "100%" }}>
                {loading ? "…" : "Log in"}
              </button>

              <div style={footerLink}>
                <span>Don’t have an account? </span>
                <Link to="/sign-up" style={{ color: "#a4161a", textDecoration: "underline" }}>
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const portalRoot = document.getElementById("pagebody_wrapper") ?? document.body;
  return createPortal(modal, portalRoot);
}

export const Route = createFileRoute("/login/")({
  component: LoginModal,
});