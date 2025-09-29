// frontend/src/routes/index.tsx
// -----------------------------------------------------------------------------
// Browse Restaurants (respect backend data + UUID routing)
// - Uses GET /api/restaurants
// - Card link goes to /restaurant/$id (UUID)
// - Handle loading/error/empty states
// - Uses .card / .create_button styles
// -----------------------------------------------------------------------------

import "../index.css";
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

type Restaurant = {
  id: string; // UUID
  name: string;
  description: string | null;
  locationText: string | null;
  locationUrl: string | null;
  frontpageMarkdown: string | null;
};

export const Route = createFileRoute("/")({
  component: BrowseRestaurants,
});

function BrowseRestaurants() {
  const [list, setList] = React.useState<Restaurant[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const res = await fetch("/api/restaurants");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Restaurant[] = await res.json();
        if (alive) setList(data);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    if (!list) return null;
    const key = q.trim().toLowerCase();
    if (!key) return list;
    // Filter by name/description/locationText (only backend fields)
    return list.filter((r) => {
      const hay = [
        r.name,
        r.description ?? "",
        r.locationText ?? "",
        r.locationUrl ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(key);
    });
  }, [list, q]);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
      <div style={{ position: "relative", marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 400,
            textAlign: "center",
            margin: 0,
            letterSpacing: -0.2,
          }}
        >
          Browse Restaurant
        </h1>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name / description / location"
          style={{
            width: "96%",
            padding: "12px 16px",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            background: "#fff",
            color: "#111",
            outline: "none",
          }}
        />
      </div>

      {/* Status indicators */}
      {err && (
        <div style={{ color: "#b91c1c", marginBottom: 16 }}>
          Failed to load restaurants: {err}
        </div>
      )}
      {!err && list === null && <div>Loading…</div>}
      {!err && list?.length === 0 && <div>No restaurants yet.</div>}

      {/* Card grid */}
      {filtered && filtered.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: 28,
            justifyContent: "center",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {filtered.map((r) => (
            <div
              key={r.id}
              className="card"
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                overflow: "hidden",
                background: "#fff",
                padding: "2em",
              }}
            >
              {/* No image field in schema → placeholder */}
              <div
                style={{
                  aspectRatio: "4/3",
                  background: "#bbb",
                  overflow: "hidden",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#444",
                }}
              >
                image (demo)
              </div>

              <div style={{ fontSize: 14, lineHeight: 1.35 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{r.name}</div>

                <div style={{ color: "#4B5563", marginBottom: 8 }}>
                  {r.description || "No description yet."}
                </div>

                <div style={{ color: "#374151", marginBottom: 12 }}>
                  {r.locationText ? (
                    r.locationUrl ? (
                      <a
                        href={r.locationUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#374151" }}
                      >
                        {r.locationText}
                      </a>
                    ) : (
                      r.locationText
                    )
                  ) : (
                    "No location set."
                  )}
                </div>

                <Link
                  to="/restaurant/$id"
                  params={{ id: r.id }}
                  className="create_button"
                  style={{
                    height: "1.8em",
                    padding: "0.6em 1.0em",
                    fontSize: 12,
                    minWidth: 200,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}