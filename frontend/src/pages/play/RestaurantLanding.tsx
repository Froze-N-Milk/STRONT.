// frontend/src/pages/play/RestaurantLanding.tsx
import { useParams } from "@tanstack/react-router";
import { useState } from "react";

export default function RestaurantLandingPlay() {
  // 라우트 파일 경로: /play/restaurant/$slug.index.tsx 와 일치
  const { slug } = useParams({ from: "/play/restaurant/$slug/" });
  const [picked, setPicked] = useState<string | null>(null);

  const times = ["18:00", "18:30", "19:00", "19:30", "20:00"];

  return (
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "2fr 1fr" }}>
      <section>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
          {slug?.replaceAll("-", " ")}
        </h1>
        <p style={{ color: "#666" }}>Pick a date & time to book.</p>
      </section>

      <aside
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 12,
          background: "#fff",
        }}
      >
        <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>
          Pick a time
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {times.map((t) => (
            <button
              key={t}
              onClick={() => setPicked(t)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: picked === t ? "2px solid #111" : "1px solid #ddd",
                background: picked === t ? "#111" : "#fff",
                color: picked === t ? "#fff" : "#111",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          disabled={!picked}
          onClick={() => alert(`Booked at ${picked}! (demo)`)}
          className="create_button"
          style={{ width: "100%", marginTop: 12 }}
        >
          {picked ? `Book ${picked}` : "Select a time"}
        </button>
      </aside>
    </div>
  );
}