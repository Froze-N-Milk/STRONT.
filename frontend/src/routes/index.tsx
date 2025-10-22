// frontend/src/routes/index.tsx
// -----------------------------------------------------------------------------
// Browse Restaurants (inline filters + list view)
// - Uses GET /api/restaurants
// - Local filtering (keyword/date/time/party/tags)
// - List rows link to /restaurants/$id
// - Uses global .submit_button (red)
// -----------------------------------------------------------------------------

import "../index.css"; // keep global site styles (navbar + red buttons)
import "./index.css";

import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

export type Restaurant = {
  id: string; // UUID
  name: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  locationText: string | null;
  locationUrl: string | null;
  frontpageMarkdown: string | null;
  maxPartySize: number;
  bookingCapacity: number;
  bookingLength: number;
  tags: string[];
};

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function formatDurationFromSlots(slots: number): string {
  return `${slots * 30} min`;
}

export const Route = createFileRoute("/")({
  component: BrowseRestaurants,
});

function BrowseRestaurants() {
  const [restaurants, setRestaurants] = React.useState<Restaurant[] | null>(
    null,
  );
  const [err, setErr] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        setErr(null);
        const res = await fetch(`/api/restaurants`);
        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || `HTTP ${res.status}`);
        }
        const data: unknown = await res.json();
        if (!Array.isArray(data)) {
          throw new Error("Bad restaurant payload");
        }
        const normalized: Restaurant[] = data.map((item) => {
          const restaurant = item as Restaurant;
          const tags = Array.isArray(restaurant.tags) ? restaurant.tags : [];
          return {
            ...restaurant,
            tags,
          };
        });
        if (alive) {
          setRestaurants(normalized);
        }
      } catch (e: unknown) {
        if (alive) {
          setErr(errMsg(e));
          setRestaurants([]);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const availableTags = React.useMemo(() => {
    if (!restaurants) return [] as string[];
    const bucket = new Set<string>();
    restaurants.forEach((restaurant) => {
      restaurant.tags.forEach((tag) => {
        if (tag.trim().length > 0) bucket.add(tag);
      });
    });
    return Array.from(bucket).sort((a, b) => a.localeCompare(b));
  }, [restaurants]);

  const filteredRestaurants = React.useMemo(() => {
    if (!restaurants) return [] as Restaurant[];
    const trimmedQuery = q.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      if (
        selectedTags.length > 0 &&
        !selectedTags.every((tag) => restaurant.tags.includes(tag))
      ) {
        return false;
      }

      if (trimmedQuery) {
        const haystack = [
          restaurant.name,
          restaurant.description ?? "",
          restaurant.locationText ?? "",
          restaurant.locationUrl ?? "",
          restaurant.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(trimmedQuery)) {
          return false;
        }
      }

      return true;
    });
  }, [restaurants, selectedTags, q]);

  const toggleTag = React.useCallback((tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }, []);

  const noRestaurants =
    !err && !loading && restaurants !== null && restaurants.length === 0;

  const hasFiltered = filteredRestaurants.length > 0;
  const noMatches =
    !err &&
    !loading &&
    restaurants !== null &&
    restaurants.length > 0 &&
    filteredRestaurants.length === 0;

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
          align-items: stretch;
          grid-template-columns: 1fr;
          grid-auto-rows: minmax(0, max-content);
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

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "stretch",
          justifyContent: "flex-end",
          marginBottom: 24,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = q.trim();
            setQ(trimmed);
          }}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexGrow: 1,
            justifyContent: "flex-end",
            minWidth: 280,
          }}
        >
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
            placeholder="Search by name / description / location"
            style={{
              flex: "1 1 220px",
              padding: "12px 16px",
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              background: "#fff",
              color: "#111",
              outline: "none",
            }}
          />
        </form>
      </div>

      {(q || selectedTags.length > 0 || availableTags.length > 0) && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 24,
            alignItems: "center",
            color: "#374151",
            fontSize: 14,
          }}
        >
          {q && (
            <span>
              Keyword <strong>{q}</strong>
            </span>
          )}
          {availableTags.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="browse-tag-chip"
                aria-pressed={isActive}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Status indicators */}
      {err && (
        <div style={{ color: "#b91c1c", marginBottom: 16 }}>
          Failed to load restaurants: {err}
        </div>
      )}
      {!err && loading && <div style={{ marginBottom: 16 }}>Loading…</div>}
      {!err && !loading && noRestaurants && (
        <div style={{ marginBottom: 16 }}>
          No restaurants have been added yet.
        </div>
      )}
      {!err && !loading && noMatches && (
        <div style={{ marginBottom: 16 }}>
          No restaurants match the selected tags.
        </div>
      )}
      {/* List view */}
      {hasFiltered && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                paddingBottom: 18,
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 20 }}>{restaurant.name}</h2>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    Capacity {restaurant.bookingCapacity} • Up to{" "}
                    {restaurant.maxPartySize} guests •{" "}
                    {formatDurationFromSlots(restaurant.bookingLength)}
                  </span>
                </div>

                <p style={{ margin: 0, color: "#4b5563" }}>
                  {restaurant.description || "No description yet."}
                </p>

                {(restaurant.email || restaurant.phone) && (
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      fontSize: 13,
                      color: "#4b5563",
                      flexWrap: "wrap",
                    }}
                  >
                    {restaurant.phone && <span>{restaurant.phone}</span>}
                    {restaurant.email && (
                      <a
                        href={`mailto:${restaurant.email}`}
                        style={{ color: "#a4161a" }}
                      >
                        {restaurant.email}
                      </a>
                    )}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    fontSize: 13,
                    color: "#374151",
                    flexWrap: "wrap",
                  }}
                >
                  <span>{restaurant.locationText || "No location set."}</span>
                  {restaurant.locationUrl && (
                    <a
                      href={restaurant.locationUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#a4161a" }}
                    >
                      View map
                    </a>
                  )}
                </div>

                {restaurant.tags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    {restaurant.tags.map((tag) => (
                      <span
                        key={tag}
                        className="browse-tag-chip browse-tag-chip--readonly"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Link
                to="/$restaurantid"
                params={{ restaurantid: restaurant.id }}
                className="submit_button cta-wide search-result-link"
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
