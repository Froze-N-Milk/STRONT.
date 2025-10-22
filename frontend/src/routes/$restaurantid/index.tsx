// frontend/src/routes/restaurants/$id.index.tsx
// -----------------------------------------------------------------------------
// Restaurant Detail (inline overview + availability + actions)
// -----------------------------------------------------------------------------

import "../../index.css";
import "../index.css";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type Restaurant } from "../-restaurant.ts";

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

function formatDurationFromSlots(slots: number): string {
  if (slots <= 0) return "--";
  const minutes = slots * 30;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0 && remainder > 0) return `${hours}h ${remainder}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function maskToSlots(mask: bigint): number[] {
  const slots: number[] = [];
  for (let slot = 0; slot < HALF_HOUR_SLOTS; slot++) {
    const shifted = mask >> BigInt(HALF_HOUR_SLOTS - 1 - slot);
    if ((shifted & 1n) === 1n) {
      slots.push(slot);
    }
  }
  return slots;
}

function groupContiguousSlots(
  slots: number[],
): Array<{ start: number; end: number }> {
  if (slots.length === 0) return [];
  const ranges: Array<{ start: number; end: number }> = [];
  let start = slots[0];
  let prev = slots[0];
  for (let i = 1; i < slots.length; i++) {
    const current = slots[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    ranges.push({ start, end: prev + 1 });
    start = current;
    prev = current;
  }
  ranges.push({ start, end: prev + 1 });
  return ranges;
}

function describeMask(mask: bigint): string {
  const slots = maskToSlots(mask);
  if (slots.length === 0) return "Closed";
  const ranges = groupContiguousSlots(slots);
  return ranges
    .map(({ start, end }) => `${slotLabel(start)} - ${slotLabel(end)}`)
    .join(", ");
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface AvailabilityDay {
  date: Date;
  hours: bigint;
}

export const Route = createFileRoute("/$restaurantid/")({
  component: RestaurantDetail,
});

function RestaurantDetail() {
  const { restaurantid } = Route.useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);
  const [availability, setAvailability] = React.useState<
    AvailabilityDay[] | null
  >(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const handleReserveClick = React.useCallback(() => {
    navigate({
      to: "/$restaurantid/make-booking",
      params: { restaurantid },
    });
  }, [restaurantid, navigate]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        setErr(null);
        const res = await fetch(`/api/restaurant/${restaurantid}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Restaurant = await res.json();
        const normalized: Restaurant = {
          ...data,
          tags: Array.isArray(data.tags) ? data.tags : [],
        };
        if (alive) setRestaurant(normalized);
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

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/availability/${restaurantid}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        if (!Array.isArray(raw)) throw new Error("Bad availability payload");
        const parsed: AvailabilityDay[] = raw.map(
          (item: { date: number; hours: number }) => ({
            date: new Date(item.date),
            hours: BigInt(item.hours),
          }),
        );
        if (alive) setAvailability(parsed);
      } catch {
        if (alive) setAvailability(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [restaurantid]);

  if (loading) return <main style={{ padding: 24 }}>Loading…</main>;
  if (err)
    return <main style={{ padding: 24, color: "#b91c1c" }}>Error: {err}</main>;
  if (!restaurant) return <main style={{ padding: 24 }}>Not found.</main>;

  const bookingDuration = formatDurationFromSlots(restaurant.bookingLength);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <style>{`
        .detail-grid {
          display: grid;
          gap: 24px;
          align-items: start;
          grid-template-columns: 1fr;
        }
        @media (min-width: 900px) {
          .detail-grid {
            grid-template-columns: minmax(360px, 560px) 1fr;
          }
        }
      `}</style>

      <div className="detail-grid">
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
              {restaurant.name}
            </h1>
            <div style={{ color: "#374151", fontSize: 14 }}>
              <strong>Location: </strong>
              {restaurant.locationText ? (
                restaurant.locationUrl ? (
                  <a
                    href={restaurant.locationUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#374151", wordBreak: "break-word" }}
                  >
                    {restaurant.locationText}
                  </a>
                ) : (
                  restaurant.locationText
                )
              ) : (
                "No location set."
              )}
            </div>
          </header>

          <section
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 14,
              color: "#374151",
            }}
          >
            <span>Max party {restaurant.maxPartySize}</span>
            <span>Capacity {restaurant.bookingCapacity}</span>
            <span>Booking length {bookingDuration}</span>
          </section>

          {restaurant.tags.length > 0 && (
            <section
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                fontSize: 12,
              }}
            >
              {restaurant.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#1f2937",
                    padding: "4px 8px",
                    borderRadius: 999,
                  }}
                >
                  {tag}
                </span>
              ))}
            </section>
          )}

          <section>
            <div
              style={{
                margin: 0,
                color: "#4B5563",
                whiteSpace: "pre-wrap",
              }}
            >
              <ReactMarkdown>{restaurant.frontpageMarkdown}</ReactMarkdown>
            </div>
          </section>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {availability && (
            <section
              style={{
                background: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                Upcoming availability
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
                {availability.map((day) => (
                  <li
                    key={day.date.toISOString()}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "6px 0",
                      borderBottom: "1px solid #e5e7eb",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      {formatDateLabel(day.date)}
                    </span>
                    <span style={{ color: "#4b5563", textAlign: "right" }}>
                      {describeMask(day.hours)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section
            style={{
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Link
              to="/"
              style={{ color: "#374151", textDecoration: "none", fontSize: 14 }}
            >
              ← Back to Browse
            </Link>
            <button
              type="button"
              onClick={handleReserveClick}
              className="submit_button cta-wide"
            >
              Reserve now
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

export default RestaurantDetail;
