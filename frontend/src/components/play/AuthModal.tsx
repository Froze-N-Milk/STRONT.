// frontend/src/components/play/AuthModal.tsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Mode = "login" | "signup";
type ApiError = { error: string };
type ApiUser = { id: number; email: string; name: string };

const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
const isPhone = (v: string) => /^\d{9,}$/.test(v.replace(/\D/g, ""));
const DEMO = { email: "demo@plange.app", password: "pass1234", name: "Demo User" } as const;
const AUTH_KEY = "plange_auth_user";
const LOGIN_MIN_HEIGHT = 560;

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<ApiUser | null>(restoreUser());

  const [verificationCode, setVerificationCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => { emailRef.current?.focus(); }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function restoreUser(): ApiUser | null {
    try { const raw = localStorage.getItem(AUTH_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }
  function setAuthedUser(user: ApiUser | null) {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      setMe(user);
      window.dispatchEvent(new CustomEvent("auth:changed", { detail: { authed: true, user } }));
    } else {
      localStorage.removeItem(AUTH_KEY);
      setMe(null);
      window.dispatchEvent(new CustomEvent("auth:changed", { detail: { authed: false } }));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (mode === "login") {
      const okId = isEmail(email) || isPhone(email);
      if (!okId) return setError("Please enter a valid email or phone.");
      if (password.length < 6) return setError("Password must be ≥ 6 chars.");
      setLoading(true);
      try {
        if (email.toLowerCase() === DEMO.email && password === DEMO.password) {
          const user: ApiUser = { id: 1, email: DEMO.email, name: DEMO.name };
          setAuthedUser(user); setPassword(""); return;
        }
        const res = await fetch("/api/auth/login", {
          method: "POST", headers: { "Content-Type": "application/json" },
          credentials: "include", body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = (await res.json()) as ApiError;
          throw new Error(data.error || "Request failed");
        }
        const data = (await res.json()) as { user: ApiUser };
        setAuthedUser(data.user); setPassword("");
      } catch (err: any) {
        setError(err?.message ?? "Login failed");
      } finally { setLoading(false); }
    } else {
      const okId = isEmail(email) || isPhone(email);
      if (!okId) return setError("Please enter a valid email or phone.");
      if (verificationCode.length !== 4) return setError("Verification code must be exactly 4 characters.");
      if (name.trim().length < 2) return setError("Please enter your name (2+ chars).");
      if (password.length < 6) return setError("Password must be ≥ 6 chars.");
      if (password !== confirmPassword) return setError("Passwords do not match.");
      setLoading(true);
      try {
        const user: ApiUser = { id: Date.now(), email, name };
        setAuthedUser(user);
      } catch (err: any) {
        setError(err?.message ?? "Signup failed");
      } finally { setLoading(false); }
    }
  }
  async function logout() {
    setLoading(true); setError(null);
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    finally { setAuthedUser(null); setLoading(false); }
  }

  const box: React.CSSProperties = { border: "1px solid #d9d9d9", borderRadius: 10, padding: 14, marginBottom: 12, width: "100%" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, boxSizing: "border-box" };
  const padX14: React.CSSProperties = { paddingLeft: 14, paddingRight: 14 };

  const modal = (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center", zIndex: 50 }}
      aria-modal="true" role="dialog">
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "min(92vw, 640px)", background: "#fff", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,.25)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #eee" }}>
          <strong>Log in / Sign up</strong>
          <button aria-label="Close" onClick={onClose} style={{ fontSize: 22, lineHeight: 1, background: "transparent", border: 0, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: 16 }}>
          <div id="auth-root" style={{ maxWidth: 520, margin: "0 auto", textAlign: "left" }}>
            {me ? (
              <div className="card">
                <p style={{ marginBottom: 8 }}>Logged in as <b>{me.name}</b> ({me.email})</p>
                <button onClick={logout} disabled={loading}>{loading ? "…" : "Log out"}</button>
              </div>
            ) : (
              <div className="card" style={mode === "login" ? { minHeight: LOGIN_MIN_HEIGHT } : undefined}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <button onClick={() => setMode("login")}
                    style={{ padding: ".6em 1.2em", borderRadius: 8, border: "1px solid #ddd", background: mode === "login" ? "#00994C" : "#eee", color: mode === "login" ? "#fff" : "#333" }}
                    aria-pressed={mode === "login"}>Log in</button>
                  <button onClick={() => setMode("signup")}
                    style={{ padding: ".6em 1.2em", borderRadius: 8, border: "1px solid #ddd", background: mode === "signup" ? "#00994C" : "#eee", color: mode === "signup" ? "#fff" : "#333" }}
                    aria-pressed={mode === "signup"}>Sign up</button>
                </div>

                <form onSubmit={submit}>
                  {mode === "login" && (
                    <div style={box}>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="email" style={{ display: "block", marginBottom: 6 }}>Email or phone</label>
                        <input ref={emailRef} id="email" type="text" value={email} onChange={(e)=>setEmail(e.target.value)}
                          placeholder="you@example.com / 123456789" required style={inputStyle} autoComplete="username" />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="password" style={{ display: "block", marginBottom: 6 }}>Password</label>
                        <input id="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)}
                          placeholder="••••••••" required minLength={6} style={inputStyle} autoComplete="current-password" />
                      </div>
                    </div>
                  )}

                  {mode === "signup" && (
                    <div style={box}>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="email2" style={{ display: "block", marginBottom: 6 }}>Email or phone</label>
                        <input ref={emailRef} id="email2" type="text" value={email} onChange={(e)=>setEmail(e.target.value)}
                          placeholder="you@example.com / 123456789" required style={inputStyle} autoComplete="username" />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="code" style={{ display: "block", marginBottom: 6 }}>Verification code (4 number)</label>
                        <input id="code" type="text" value={verificationCode}
                          onChange={(e)=>setVerificationCode(e.target.value.replace(/\D/g,"").slice(0,4))}
                          placeholder="****" maxLength={4} required style={inputStyle} inputMode="numeric" pattern="\d{4}" />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="name" style={{ display: "block", marginBottom: 6 }}>Name (nickname)</label>
                        <input id="name" type="text" value={name} onChange={(e)=>setName(e.target.value)}
                          placeholder="Your name" required style={inputStyle} autoComplete="nickname" />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="password1" style={{ display: "block", marginBottom: 6 }}>Password</label>
                        <input id="password1" type="password" value={password} onChange={(e)=>setPassword(e.target.value)}
                          placeholder="6+ characters" required minLength={6} style={inputStyle} autoComplete="new-password" />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="password2" style={{ display: "block", marginBottom: 6 }}>Re-enter password</label>
                        <input id="password2" type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)}
                          placeholder="Confirm password" required minLength={6} style={inputStyle} autoComplete="new-password" />
                      </div>
                    </div>
                  )}

                  {error && <p role="alert" aria-live="assertive" style={{ color: "#b00020", margin: "6px 14px" }}>{error}</p>}

                  <div style={padX14}>
                    <button type="submit" disabled={loading} className="create_button" style={{ width: "100%" }}>
                      {loading ? "…" : mode === "login" ? "Log in" : "Create account"}
                    </button>
                  </div>

                  <div style={{ ...padX14, marginTop: 10 }}>
                    <div style={{ border: "1px dashed #ccc", borderRadius: 8, padding: 10 }}>
                      <b>Demo login (frontend only)</b>
                      <div>email: <code>{DEMO.email}</code></div>
                      <div>password: <code>{DEMO.password}</code></div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}