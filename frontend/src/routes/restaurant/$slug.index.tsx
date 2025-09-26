// frontend/src/routes/restaurant/$slug.index.tsx
// -----------------------------------------------------------------------------
// Restaurant detail page
// - Reads auth state from AccountContext.
// - If the user is signed out (AccountContext === null), redirects to /login.
// - Uses local SAMPLE_DETAIL as mock data until backend API is wired.
// - "Reserve now" currently shows a "coming soon" alert (no navigation yet).
// -----------------------------------------------------------------------------

import "../index.css"; // uses .create_button
import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AccountContext } from "../account"; // read login state

// Shape of a single restaurant detail record shown on this page
type Detail = {
  name: string;
  image: string;
  cuisine: string;
  rating: number;
  priceLevel: "$" | "$$" | "$$$" | "$$$$" | "$$$$$";
  description: string;
  hours: string;
  location: string;
  phone: string;
};

// Temporary in-memory data for demo purposes.
// Replace this with a real fetch to your backend in the future.
const SAMPLE_DETAIL: Record<string, Detail> = {
  "bella-vista": {
    name: "Bella Vista",
    image: "",
    cuisine: "Italian",
    rating: 4.5,
    priceLevel: "$$$",
    description: "Authentic Italian cuisine with fresh ingredients.",
    hours: "Mon–Sun: 17:00–22:00",
    location: "123 Main Street, Downtown",
    phone: "(555) 123-4567",
  },
  "sakura-sushi": {
    name: "Sakura Sushi",
    image: "",
    cuisine: "Japanese",
    rating: 4.8,
    priceLevel: "$$$$",
    description: "Traditional sushi and modern fusion dishes.",
    hours: "Tue–Sun: 18:00–23:00",
    location: "456 Ocean Ave, Waterfront",
    phone: "(555) 987-6543",
  },
  "casa-miguel": {
    name: "Casa Miguel",
    image: "",
    cuisine: "Mexican",
    rating: 4.2,
    priceLevel: "$$",
    description: "Vibrant Mexican flavors and signature margaritas.",
    hours: "Daily: 11:00–22:00",
    location: "789 Fiesta Blvd, Arts District",
    phone: "(555) 246-8135",
  },
  "le-petit-bistro": {
    name: "Le Petit Bistro",
    image: "",
    cuisine: "French",
    rating: 4.6,
    priceLevel: "$$$",
    description: "Elegant French dining with classic dishes.",
    hours: "Wed–Sun: 17:30–21:30",
    location: "321 Vineyard Lane, Historic Quarter",
    phone: "(555) 369-2580",
  },
  "prime-cut-steak": {
    name: "Prime Cut Steak",
    image: "",
    cuisine: "American",
    rating: 4.7,
    priceLevel: "$$$$",
    description: "Dry-aged beef, fresh seafood, and great wine.",
    hours: "Mon–Sat: 17:00–23:00",
    location: "654 Executive Plaza, Business District",
    phone: "(555) 147-9630",
  },
  "bangkok-garden": {
    name: "Bangkok Garden",
    image: "",
    cuisine: "Thai",
    rating: 4.3,
    priceLevel: "$$",
    description: "Authentic Thai with bold flavors and aromatic spices.",
    hours: "Daily: 12:00–21:00",
    location: "987 Spice Market Rd, Little Thailand",
    phone: "(555) 852-7410",
  },
};

// Register the route and attach the component
export const Route = createFileRoute("/restaurant/$slug/")({
  component: RestaurantPage,
});

// Small visual helper: renders filled + empty stars based on rating integer part
function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  return (
    <span style={{ color: "#FACC15" }}>
      {"★".repeat(full)}
      <span style={{ color: "#D1D5DB" }}>{"☆".repeat(5 - full)}</span>
    </span>
  );
}

// Price scale visualization as a row of up to 5 dollar signs
function PriceDollars({ level }: { level: number }) {
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

// Responsive hook: returns true when viewport width >= `breakpoint`
function useIsWide(breakpoint = 1024) {
  const [wide, setWide] = React.useState(
    typeof window !== "undefined" ? window.innerWidth >= breakpoint : false,
  );
  React.useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return wide;
}

function RestaurantPage() {
  const { slug } = Route.useParams(); // current restaurant slug (from URL)
  const navigate = useNavigate();
  const account = React.useContext(AccountContext); // null when signed out; {email} when signed in
  const isWide = useIsWide(1024);

  // Auth guard: if user is signed out, push them to /login (replace to avoid back-stack loop)
  React.useEffect(() => {
    if (account === null) {
      navigate({ to: "/login", replace: true });
    }
  }, [account, navigate]);

  // Resolve detail from sample by slug; otherwise generate a readable fallback from slug
  // (This is a placeholder until backend API is used.)
  const r: Detail =
    SAMPLE_DETAIL[slug] ??
    ({
      name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      image: "",
      cuisine: "Cuisine",
      rating: 4.5,
      priceLevel: "$$",
      description: "Description from backend will appear here.",
      hours: "Mon–Sun: 11:00–22:00",
      location: "123 Main Street",
      phone: "(000) 000-0000",
    } as Detail);

  // Convert "$$$" → 3 to feed into <PriceDollars />
  const priceLevelNumber = r.priceLevel.length;

  // CTA handler: keep user on the same page and show "coming soon" notice
  // (No navigation yet because the reserve page is not implemented)
  const onReserve = () => {
    alert("Reservation page is coming soon.");
  };

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isWide ? "minmax(420px,560px) 1fr" : "1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* left: image/placeholder (sticky on wide) */}
        <div
          style={{
            position: isWide ? ("sticky" as const) : ("static" as const),
            top: isWide ? 80 : undefined,
          }}
        >
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
            {r.image ? (
              <img
                src={r.image}
                alt={r.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                onError={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.display = "none")
                }
              />
            ) : (
              "image"
            )}
          </div>
        </div>

        {/* right: content */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>{r.name}</h1>

              {/* top info row: cuisine, rating, price */}
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  color: "#4B5563",
                }}
              >
                <span style={{ display: "flex", gap: 6 }}>
                  <span>Type of cuisine</span>
                  <span style={{ color: "#374151" }}>{r.cuisine}</span>
                </span>

                <span>
                  <Stars value={r.rating} />{" "}
                  <span style={{ color: "#111", marginLeft: 4 }}>
                    {r.rating}
                  </span>
                </span>

                <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span>price</span>
                  <PriceDollars level={priceLevelNumber} />
                </span>
              </div>
            </div>
            {/* top-right CTA intentionally removed */}
          </div>

          {/* brief description block */}
          <p style={{ marginTop: 12, color: "#374151", lineHeight: 1.6 }}>
            {r.description}
          </p>

          {/* info cards: hours / location / phone */}
          <div
            style={{
              marginTop: 16,
              display: "grid",
              gap: 12,
              gridTemplateColumns: isWide ? "1fr 1fr" : "1fr",
            }}
          >
            <div
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>
                Opening hours
              </h3>
              <div style={{ color: "#4B5563" }}>{r.hours}</div>
            </div>
            <div
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Location</h3>
              <div style={{ color: "#4B5563" }}>{r.location}</div>
            </div>
            <div
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: 12,
                gridColumn: isWide ? "1 / -1" : undefined,
              }}
            >
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Phone</h3>
              <div style={{ color: "#4B5563" }}>{r.phone}</div>
            </div>
          </div>

          {/* centered CTA between Phone and Back */}
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 18 }}
          >
            <button
              type="button" // avoid form submit
              onClick={onReserve} // show "coming soon" notice
              className="create_button" // reuse green style
              style={{
                height: "2.2em", // thicker button
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
              Reserve now
            </button>
          </div>

          {/* go back to browse page */}
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
