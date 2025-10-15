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
  maxPartySize: number;
  bookingCapacity: number;
  bookingLength: number;
};

type SearchParams = {
  q?: string;
  date?: string;
  timeSlot?: string;
  partySize?: string;
};

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

export const Route = createFileRoute("/search/")({
  component: SearchPage,
  validateSearch: (incoming): SearchParams => {
    const params: SearchParams = {};
    if (typeof incoming.q === "string" && incoming.q.trim().length > 0) {
      params.q = incoming.q;
    }
    if (typeof incoming.date === "string" && incoming.date.length > 0) {
      params.date = incoming.date;
    }
    if (typeof incoming.timeSlot === "string" && incoming.timeSlot.length > 0) {
      params.timeSlot = incoming.timeSlot;
    }
    if (
      typeof incoming.partySize === "string" &&
      incoming.partySize.length > 0
    ) {
      params.partySize = incoming.partySize;
    }
    return params;
  },
});

function SearchPage() {
  const search = Route.useSearch();
  const [list, setList] = React.useState<Restaurant[] | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams();
    if (search.date) params.set("date", search.date);
    if (search.timeSlot) params.set("timeSlot", search.timeSlot);
    if (search.partySize) params.set("partySize", search.partySize);
    const query = params.toString();
    return query ? `?${query}` : "";
  }, [search.date, search.timeSlot, search.partySize]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        setErr(null);
        const res = await fetch(`/api/restaurants${queryString}`);
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
          setErr(e instanceof Error ? e.message : String(e));
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
  }, [queryString]);

  const filteredByQuery = React.useMemo((): Restaurant[] | null => {
    if (!list) return null;
    const term = (search.q ?? "").trim().toLowerCase();
    if (!term) return list;
    return list.filter((item) => {
      const haystack = [
        item.name,
        item.description ?? "",
        item.locationText ?? "",
        item.locationUrl ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [list, search.q]);

  const hasResults = filteredByQuery && filteredByQuery.length > 0;

  return (
    <main
      style={{
        padding: "24px 32px 48px",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      <Link
        to="/"
        style={{
          color: "#a4161a",
          textDecoration: "none",
          display: "inline-flex",
          gap: 6,
        }}
      >
        ← Back to browse
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 600, margin: "16px 0" }}>
        Search results
      </h1>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
          color: "#374151",
          fontSize: 14,
        }}
      >
        {search.date && (
          <span>
            Date <strong>{search.date}</strong>
          </span>
        )}
        {search.timeSlot && (
          <span>
            Time <strong>{slotLabel(Number(search.timeSlot))}</strong>
          </span>
        )}
        {search.partySize && (
          <span>
            Party size <strong>{search.partySize}</strong>
          </span>
        )}
        {search.q && (
          <span>
            Keyword <strong>{search.q}</strong>
          </span>
        )}
        {!search.date && !search.timeSlot && !search.partySize && !search.q && (
          <span style={{ color: "#b91c1c" }}>
            Please enter at least one filter (date, time, party size or keyword)
            to run a search.
          </span>
        )}
      </div>

      {err && (
        <div style={{ color: "#b91c1c", marginBottom: 24 }}>
          Failed to load: {err}
        </div>
      )}
      {!err && loading && <div style={{ marginBottom: 24 }}>Loading…</div>}
      {!err &&
        !loading &&
        (!filteredByQuery || filteredByQuery.length === 0) && (
          <div style={{ marginBottom: 24 }}>
            No restaurants match those filters yet. Try adjusting the filters or
            keyword.
          </div>
        )}

      {hasResults && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {filteredByQuery!.map((restaurant) => (
            <div
              key={restaurant.id}
              style={{
                display: "grid",
                gap: 8,
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: 18,
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
              </div>
              <Link
                to="/restaurants/$id"
                params={{ id: restaurant.id }}
                className="submit_button cta-wide search-result-link"
                style={{ justifySelf: "flex-end" }}
              >
                View restaurant
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

export default Route;
