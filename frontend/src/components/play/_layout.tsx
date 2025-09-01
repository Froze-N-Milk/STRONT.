// frontend/src/components/play/_layout.tsx
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import AuthModal from "./AuthModal";

type User = { id:number; email:string; name:string };
const AUTH_KEY = "plange_auth_user";

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<User | null>(() => {
    try { const r = localStorage.getItem(AUTH_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  });

  useEffect(() => {
    const onAuth = (e: Event) =>
      setMe((e as CustomEvent).detail?.authed ? (e as CustomEvent).detail.user : null);
    window.addEventListener("auth:changed", onAuth);
    return () => window.removeEventListener("auth:changed", onAuth);
  }, []);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid #eee", background: "#fff" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 16px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <Link to="/" style={{ fontWeight: 800, fontSize: 20, textDecoration: "none", color: "#111" }}>
            FOOD YUM <span style={{ fontSize: 12 }}>(inc)</span>
          </Link>
          <button onClick={() => setOpen(true)}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#00994C", color: "#fff" }}>
            {me ? `Hello, ${me.name.split(" ")[0]}` : "Log in / Sign up"}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px", flex: 1 }}>
        {children}
      </main>

      <footer style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px", color: "#777", fontSize: 14 }}>
        © {new Date().getFullYear()} FoodYum Inc. · Playground
      </footer>

      {open && <AuthModal onClose={() => setOpen(false)} />}
    </div>
  );
}