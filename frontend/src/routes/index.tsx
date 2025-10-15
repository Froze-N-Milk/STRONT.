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
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

type Restaurant = {
  id: string; // UUID
  name: string;
  description: string | null;
  locationText: string | null;
  locationUrl: string | null;
  frontpageMarkdown: string | null;
  maxPartySize: number;
  bookingCapacity: number;
  bookingLength: number;
};

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

const HALF_HOUR_SLOTS = 48;

function slotLabel(slot: number): string {
  const totalMinutes = slot * 30;
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const period = hours24 >= 12 ? "PM" : "AM";
  const minuteLabel = minutes.toString().padStart(2, "0");
  return `${hours12}:${minuteLabel} ${period}`;
}

const SLOT_OPTIONS = Array.from({ length: HALF_HOUR_SLOTS }, (_, slot) => ({
  value: String(slot),
  label: slotLabel(slot),
}));

function formatDurationFromSlots(slots: number): string {
  if (slots <= 0) return "--";
  const minutes = slots * 30;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0 && remainder > 0) return `${hours}h ${remainder}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export const Route = createFileRoute("/")({
  component: BrowseRestaurants,
});

function BrowseRestaurants() {
  const navigate = useNavigate();
  const [list, setList] = React.useState<Restaurant[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [dateFilter, setDateFilter] = React.useState("");
  const [timeSlotFilter, setTimeSlotFilter] = React.useState("");
  const [partySizeFilter, setPartySizeFilter] = React.useState("");
  const [searchError, setSearchError] = React.useState<string | null>(null);

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
        const data: Restaurant[] = await res.json();
        if (alive) {
          setList(data);
        }
      } catch (e: unknown) {
        if (alive) {
          setErr(errMsg(e));
          setList([]);
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

  React.useEffect(() => {
    if (!dateFilter && timeSlotFilter) {
      setTimeSlotFilter("");
    }
  }, [dateFilter, timeSlotFilter]);

  const isFiltering =
    dateFilter.length > 0 ||
    timeSlotFilter.length > 0 ||
    partySizeFilter.length > 0;

  const clearFilters = React.useCallback(() => {
    setDateFilter("");
    setTimeSlotFilter("");
    setPartySizeFilter("");
    setSearchError(null);
  }, []);

  const handlePartySizeChange = React.useCallback((value: string) => {
    if (value === "") {
      setPartySizeFilter("");
      setSearchError(null);
      return;
    }
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setPartySizeFilter(String(Math.floor(parsed)));
      setSearchError(null);
    }
  }, []);

  const noRestaurants = !err && !loading && list !== null && list.length === 0;
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
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            minWidth: 240,
          }}
        >
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setSearchError(null);
            }}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: "10px 12px",
              background: "#fff",
              color: "#111",
            }}
          />
          <select
            value={timeSlotFilter}
            onChange={(e) => {
              setTimeSlotFilter(e.target.value);
              setSearchError(null);
            }}
            disabled={!dateFilter}
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: "10px 12px",
              background: "#fff",
              color: "#111",
              minWidth: 160,
            }}
          >
            <option value="">Any time</option>
            {SLOT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={partySizeFilter}
            onChange={(e) => handlePartySizeChange(e.target.value)}
            placeholder="Party size"
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: "10px 12px",
              background: "#fff",
              color: "#111",
              width: 110,
              height: 18,
            }}
          />
          {isFiltering && (
            <button
              type="button"
              onClick={clearFilters}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: "10px 16px",
                background: "#f3f4f6",
                color: "#111827",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = q.trim();
            const nextCanSearch =
              trimmed.length > 0 ||
              dateFilter.length > 0 ||
              timeSlotFilter.length > 0 ||
              partySizeFilter.length > 0;
            if (!nextCanSearch) {
              setSearchError(
                "Please set at least one filter or keyword before searching.",
              );
              return;
            }
            setSearchError(null);
            setQ(trimmed);
            navigate({
              to: "/search",
              search: {
                q: trimmed || undefined,
                date: dateFilter || undefined,
                timeSlot: timeSlotFilter || undefined,
                partySize: partySizeFilter || undefined,
              },
            });
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
              setSearchError(null);
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
          <button type="submit" className="submit_button search-button">
            <span aria-hidden className="search-button__icon" />
            Search
          </button>
        </form>
      </div>

      {searchError && (
        <div style={{ color: "#b91c1c", marginBottom: 16 }}>{searchError}</div>
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
      {/* Card grid */}
      {list && list.length > 0 && (
        <div className="browse-grid">
          {list.map((r) => (
            <div
              key={r.id}
              className="card browse-card"
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                overflow: "hidden",
                background: "#fff",
                padding: "2em",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                minHeight: 440,
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
                  width: "100%",
                }}
              >
                image (demo)
              </div>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.35,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  flex: 1,
                }}
              >
                <div style={{ fontWeight: 700 }}>{r.name}</div>

                <div
                  style={{
                    color: "#4B5563",
                    lineHeight: 1.6,
                    minHeight: "3.2em",
                    maxHeight: "3.2em",
                    overflow: "hidden",
                    display: "block",
                  }}
                >
                  <span style={{ display: "block" }}>
                    {r.description || "No description yet."}
                  </span>
                  <span
                    style={{ display: "block", visibility: "hidden" }}
                    aria-hidden="true"
                  >
                    placeholder
                  </span>
                </div>

                <div
                  style={{
                    color: "#374151",
                    lineHeight: 1.6,
                    minHeight: "1.6em",
                    maxHeight: "1.6em",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    display: "block",
                  }}
                >
                  {r.locationText ? (
                    r.locationUrl ? (
                      <a
                        href={r.locationUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#374151",
                          textDecoration: "underline",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          display: "inline-block",
                          maxWidth: "100%",
                        }}
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

                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <span>Up to {r.maxPartySize} guests</span>
                  <span>
                    {formatDurationFromSlots(r.bookingLength)} per booking
                  </span>
                  <span>Capacity {r.bookingCapacity}</span>
                </div>
              </div>

              <Link
                to="/restaurants/$id"
                params={{ id: r.id }}
                className="submit_button cta-wide"
                style={{ marginTop: "auto" }}
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
