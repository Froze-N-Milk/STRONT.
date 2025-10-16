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
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AccountContext } from "../-account";
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

type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  locationText: string | null;
  locationUrl: string | null;
  frontpageMarkdown: string | null;
  maxPartySize: number;
  bookingCapacity: number;
  bookingLength: number;
};

export const Route = createFileRoute("/restaurants/$id/")({
  component: RestaurantDetail,
});

function RestaurantDetail() {
  const { id } = Route.useParams();
  const account = React.useContext(AccountContext);
  const navigate = useNavigate();
  const [r, setR] = React.useState<Restaurant | null>(null);
  const [availability, setAvailability] = React.useState<
    AvailabilityDay[] | null
  >(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const handleReserveClick = React.useCallback(() => {
    if (!account) {
      navigate({ to: "/login" });
      return;
    }
    navigate({
      to: "/restaurants/$restaurantid/make-booking",
      params: { restaurantid: id },
    });
  }, [account, id, navigate]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        setErr(null);
        const res = await fetch(`/api/restaurant/${id}`);
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
  }, [id]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/availability/${id}`);
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
  }, [id]);

  if (loading) return <main style={{ padding: 24 }}>Loading…</main>;
  if (err)
    return <main style={{ padding: 24, color: "#b91c1c" }}>Error: {err}</main>;
  if (!r) return <main style={{ padding: 24 }}>Not found.</main>;

  const bookingDuration = formatDurationFromSlots(r.bookingLength);

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

          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 14,
              color: "#374151",
            }}
          >
            <span>Max party {r.maxPartySize}</span>
            <span>Capacity {r.bookingCapacity}</span>
            <span>Booking length {bookingDuration}</span>
          </div>

          {/* Availability summary */}
          {availability && (
            <section
              style={{
                marginTop: 18,
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: 16,
                background: "#f9fafb",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                Upcoming availability
              </h2>
              <ul
                style={{ listStyle: "none", padding: 0, margin: "12px 0 0 0" }}
              >
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
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 20,
              gap: 16,
            }}
          >
            <Link
              to="/"
              style={{
                color: "#374151",
                textDecoration: "none",
                fontSize: 14,
              }}
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
          </div>
        </div>
      </div>
    </main>
  );
}

export default RestaurantDetail;
