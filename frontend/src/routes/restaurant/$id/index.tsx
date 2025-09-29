// Restaurant Detail (respect backend data + UUID routing)
// - Uses GET /api/restaurant/:id
// - Only exposes available fields (name/description/location*/frontpageMarkdown)
// - Image/rating/price/hours are replaced with "demo" labels
// - Includes a party-size increment/decrement demo UI (booking not implemented)

import "../../index.css";
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  locationText: string | null;
  locationUrl: string | null;
  frontpageMarkdown: string | null;
};

export const Route = createFileRoute("/restaurant/$id")({
  component: RestaurantDetail,
});

function RestaurantDetail() {
  const { id } = Route.useParams();
  const [r, setR] = React.useState<Restaurant | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Demo: party-size increment/decrement only
  const [party, setParty] = React.useState(2);
  const inc = () => setParty((p) => Math.min(p + 1, 10)); // max 10 (demo)
  const dec = () => setParty((p) => Math.max(p - 1, 1));

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/restaurant/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Restaurant = await res.json();
        if (alive) setR(data);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <main style={{ padding: 24 }}>Loading…</main>;
  if (err) return <main style={{ padding: 24, color: "#b91c1c" }}>Error: {err}</main>;
  if (!r) return <main style={{ padding: 24 }}>Not found.</main>;

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(420px,560px) 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Left: image (demo) */}
        <div>
          <div
            style={{
              aspectRatio: "4/3",
              background: "#e5e7eb",
              overflow: "hidden",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
            }}
          >
            image (demo)
          </div>
        </div>

        {/* Right: content */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>{r.name}</h1>

          <div style={{ marginTop: 8, color: "#4B5563" }}>
            {r.description || "No description yet."}
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Location: </strong>
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

          {/* frontpageMarkdown displayed as plain text (markdown renderer later) */}
          {r.frontpageMarkdown && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                whiteSpace: "pre-wrap",
              }}
            >
              {r.frontpageMarkdown}
            </div>
          )}

          {/* Demo: party-size UI (booking not implemented) */}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontWeight: 600 }}>Party size (demo):</span>
            <button
              onClick={dec}
              className="create_button"
              style={{ height: "2em", padding: "0 0.8em" }}
            >
              −
            </button>
            <span style={{ minWidth: 24, textAlign: "center" }}>{party}</span>
            <button
              onClick={inc}
              className="create_button"
              style={{ height: "2em", padding: "0 0.8em" }}
            >
              +
            </button>
          </div>

          {/* Demo booking button */}
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 18 }}
          >
            <button
              type="button"
              onClick={() => alert("Booking flow coming soon")}
              className="create_button"
              style={{
                height: "2.2em",
                padding: "0 1.6em",
                fontSize: 14,
                minWidth: 220,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Reserve now (demo)
            </button>
          </div>

          <div style={{ marginTop: 16, fontSize: 14, textAlign: "center" }}>
            <Link to="/" style={{ color: "#374151", textDecoration: "none" }}>
              ← Back to Browse
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default RestaurantDetail;