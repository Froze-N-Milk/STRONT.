// frontend/src/routes/index.tsx
// -----------------------------------------------------------------------------
// Browse Restaurants (respect backend data + UUID routing)
// - Uses GET /api/restaurants
// - Card link goes to /restaurants/$id (UUID)
// - Handle loading/error/empty states
// - Uses global .submit_button (red) + .card styles
// -----------------------------------------------------------------------------

import "../index.css"; // keep global site styles (navbar + red buttons)

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

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

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
      } catch (e: unknown) {
        if (alive) setErr(errMsg(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = React.useMemo((): Restaurant[] | null => {
    if (!list) return null;
    const key = q.trim().toLowerCase();
    if (!key) return list;
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
    <div
      className="browse-root"
      style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}
    >
      <style>{`
        #navbar_container a,
        #navbar_container a:visited,
        .stront a,
        .stront a:visited {
          color: #161a1d;
          text-decoration: none;
        }
        #navbar_container a:hover,
        .stront a:hover {
          color: #a4161a;
          text-decoration: none;
        }

        .browse-root { min-width: 380px; }

        .browse-grid {
          display: grid;
          gap: 28px;
          justify-content: center;
          grid-template-columns: 1fr;          
          min-height: 280px;
        }
        @media (min-width: 740px) {
          .browse-grid {
            grid-template-columns: repeat(2, minmax(340px, 1fr)); 
          }
        }
        @media (min-width: 1120px) {
          .browse-grid {
            grid-template-columns: repeat(3, minmax(340px, 1fr)); 
          }
        }
      `}</style>

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
        <div className="browse-grid">
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
                display: "grid",
                gridTemplateRows: "auto 1fr auto",
                rowGap: 12,
                minHeight: 520,
              }}
            >
              <div
                style={{
                  aspectRatio: "4/3",
                  background: "#bbb",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#444",
                  borderRadius: 8,
                }}
              >
                image (demo)
              </div>

              <div style={{ fontSize: 14, lineHeight: 1.35 }}>
                <div
                  style={{ fontWeight: 700, marginBottom: 4, minHeight: 20 }}
                >
                  {r.name}
                </div>

                <div
                  style={{ color: "#4B5563", marginBottom: 8, minHeight: 48 }}
                >
                  {r.description || "No description yet."}
                </div>

                <div style={{ color: "#374151", minHeight: 22 }}>
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
              </div>

              <Link
                to="/restaurants/$id"
                params={{ id: r.id }}
                className="submit_button"
                style={{
                  gridRow: 3,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  minWidth: 200,
                  color: "white",
                  margin: 0,
                }}
              >
                Go to booking
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Route;
