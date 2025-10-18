// frontend/src/routes/restaurants/$id.index.tsx
// -----------------------------------------------------------------------------
// Restaurant Detail (respect backend data + UUID routing)
// - Uses GET /api/restaurant/:id
// - Only exposes available fields (name/description/location*/frontpageMarkdown)
// - Removed party-size demo
// - Use global .submit_button (red)
// - esponsive layout (no horizontal scroll): 1-col on small, 2-col on wide
// -----------------------------------------------------------------------------

import "../../index.css"; // keep global site styles (red buttons)
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));
type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  locationText: string | null;
  locationUrl: string | null;
  frontpageMarkdown: string | null;
};

export const Route = createFileRoute("/$restaurantid/")({
  component: RestaurantDetail,
});

function RestaurantDetail() {
  const { restaurantid } = Route.useParams();
  const [r, setR] = React.useState<Restaurant | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/restaurant/${restaurantid}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Restaurant = await res.json();
        if (alive) setR(data);
      } catch (e: unknown) {
        if (alive) setErr(errMsg(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [restaurantid]);

  if (loading) return <main style={{ padding: 24 }}>Loading…</main>;
  if (err)
    return <main style={{ padding: 24, color: "#b91c1c" }}>Error: {err}</main>;
  if (!r) return <main style={{ padding: 24 }}>Not found.</main>;

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 24,
        overflowX: "hidden", // prevent horizontal scroll on small screens
      }}
    >
      {/* local responsive styles: stack on small, 2-cols on wide */}
      <style>{`
        .detail-grid {
          display: grid;
          gap: 24px;
          align-items: start;
          grid-template-columns: 1fr;            /*  mobile: single column */
        }
        @media (min-width: 900px) {
          .detail-grid {
            grid-template-columns: minmax(360px, 560px) 1fr; /*  wide: 2 cols */
          }
        }
      `}</style>

      <div className="detail-grid">
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
              width: "100%", // respect column width
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
                  style={{ color: "#374151", wordBreak: "break-word" }} // long text safe
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

          {/*  Reserve button only (red) */}
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 18 }}
          >
            <Link
              to="/$restaurantid/make-booking"
              params={{ restaurantid: restaurantid }} // pass current detail id as param
              className="submit_button" // keep global red style
              style={{
                height: "2.2em",
                padding: "0 1.6em",
                fontSize: 14,
                minWidth: 220,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                color: "white",
                textDecoration: "none",
              }}
            >
              Reserve now
            </Link>
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
