// frontend/src/routes/index.tsx
// -----------------------------------------------------------------------------
// Browse Restaurants page
// - Static sample data for now (replace with backend fetch later).
// - Simple search filter (by name / cuisine / slug).
// - Responsive grid: up to 3 columns on wider screens.
// - Card UI with rating stars and price ($ to $$$$$).
// - Each card links to /restaurant/$slug for details/booking.
// -----------------------------------------------------------------------------

import "./index.css";
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountContext } from "./account";

// Restaurant list item shape used by this page
type R = {
  id: number;
  slug: string;
  name: string;
  img: string;
  cuisine: string;
  rating: number;
  /** 1–5 → visualized as filled `$` among 5 total */
  priceLevel: 1 | 2 | 3 | 4 | 5;
};

// Temporary sample data (mock). Replace with API data later.
const samples: R[] = [
  {
    id: 1,
    slug: "bella-vista",
    name: "Bella Vista",
    img: "image",
    cuisine: "Italian",
    rating: 4.5,
    priceLevel: 3,
  },
  {
    id: 2,
    slug: "sakura-sushi",
    name: "Sakura Sushi",
    img: "image",
    cuisine: "Japanese",
    rating: 4.8,
    priceLevel: 4,
  },
  {
    id: 3,
    slug: "casa-miguel",
    name: "Casa Miguel",
    img: "image",
    cuisine: "Mexican",
    rating: 4.2,
    priceLevel: 2,
  },
  {
    id: 4,
    slug: "le-petit-bistro",
    name: "Le Petit Bistro",
    img: "image",
    cuisine: "French",
    rating: 4.6,
    priceLevel: 3,
  },
  {
    id: 5,
    slug: "prime-cut-steak",
    name: "Prime Cut Steak",
    img: "image",
    cuisine: "American",
    rating: 4.7,
    priceLevel: 5,
  },
  {
    id: 6,
    slug: "bangkok-garden",
    name: "Bangkok Garden",
    img: "image",
    cuisine: "Thai",
    rating: 4.3,
    priceLevel: 2,
  },
];

// Star visualization (fills floor(value) stars)
function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  return (
    <span style={{ color: "#FACC15" }}>
      {"★".repeat(full)}
      <span style={{ color: "#D1D5DB" }}>{"☆".repeat(5 - full)}</span>
    </span>
  );
}

// Price visualization: show up to 5 dollar signs, faded beyond `level`
function PriceDollars({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span aria-label={`price level ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < level ? "#111827" : "#D1D5DB" }}>
          $
        </span>
      ))}
    </span>
  );
}

// Media query helper: return true when viewport >= `breakpoint`
function useMaxThreeCols(breakpoint = 1200) {
  const [three, setThree] = React.useState(
    typeof window !== "undefined" ? window.innerWidth >= breakpoint : false,
  );
  React.useEffect(() => {
    const onResize = () => setThree(window.innerWidth >= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return three;
}

// Layout constants to keep spacing consistent
const CONTAINER_MAX = 1280;
const PAGE_PADDING = 32;

function App() {
  // Keep AccountContext in place for future auth-aware tweaks (not used yet)
  React.useContext(AccountContext);

  // Local search query
  const [q, setQ] = React.useState("");
  const threeCols = useMaxThreeCols(1200);

  // Filter the sample list by query (name/cuisine/slug)
  const list = React.useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return samples;
    return samples.filter(
      (r) =>
        r.name.toLowerCase().includes(k) ||
        r.cuisine.toLowerCase().includes(k) ||
        r.slug.toLowerCase().includes(k),
    );
  }, [q]);

  return (
    <div
      style={{
        maxWidth: CONTAINER_MAX,
        margin: "0 auto",
        padding: `0 ${PAGE_PADDING}px`,
      }}
    >
      {/* Header */}
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

      {/* Search box and hint text */}
      <div style={{ marginBottom: 24 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Searching"
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
        <div style={{ marginTop: 6, fontSize: 12, color: "#111" }}>
          Looking for a particular cuisine or restaurant? Start typing to
          search.
        </div>
      </div>

      {/* Cards grid (responsive columns) */}
      <div
        style={{
          display: "grid",
          gap: 28,
          justifyContent: "center",
          gridTemplateColumns: threeCols
            ? "repeat(3, minmax(0, 1fr))"
            : "repeat(auto-fit, minmax(280px, 1fr))",
        }}
      >
        {list.map((r) => (
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
            {/* Image area (fallback hides broken <img>) */}
            <div
              style={{
                aspectRatio: "4/3",
                background: "#bbb",
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              <img
                src={r.img}
                alt={r.name}
                loading="lazy"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>

            {/* Card body */}
            <div style={{ fontSize: 14, lineHeight: 1.35 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{r.name}</div>

              {/* Cuisine label */}
              <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                <span>Type of cuisine</span>
                <span style={{ color: "#4B5563" }}>{r.cuisine}</span>
              </div>

              {/* Rating row */}
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>rating</span>
                <Stars value={r.rating} />
                <span style={{ color: "#111" }}>{r.rating.toFixed(1)}</span>
              </div>

              {/* Price row */}
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>price</span>
                <PriceDollars level={r.priceLevel} />
              </div>

              {/* CTA → Restaurant detail route */}
              <div style={{ marginTop: 12 }}>
                <Link
                  to="/restaurant/$slug"
                  params={{ slug: r.slug }}
                  className="create_button"
                  style={{
                    height: "1.4em",
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
                  Go to booking
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Route registration for "/"
export const Route = createFileRoute("/")({
  component: App,
});
