/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link } from "@tanstack/react-router";
import "./index.css";
import type { FormEvent } from "react";
import { useState, useEffect } from "react";

export function toggleDayForTest(prev: Set<string>, day: string): Set<string> {
  const next = new Set(prev);
  if (next.has(day)) next.delete(day);
  else next.add(day);
  return next;
}

export function formatHourMaskForTest(
  startHour: string,
  startMinute: string,
  endHour: string,
  endMinute: string,
): number {
  const sh = Number(startHour);
  const sm = Number(startMinute);
  const eh = Number(endHour);
  const em = Number(endMinute);
  const open = sh * 2 + Math.floor(sm / 30);
  const close = eh * 2 + Math.floor(em / 30);
  const len = Math.max(0, close - open);
  if (len <= 0) return 0;
  const mask = ((1n << BigInt(len)) - 1n) << BigInt(open);
  return Number(mask);
}

export type UpdateAvailabilitiesRequestForTest = {
  id: string;
  mondayHours: number;
  tuesdayHours: number;
  wednesdayHours: number;
  thursdayHours: number;
  fridayHours: number;
  saturdayHours: number;
  sundayHours: number;
};

export function makeAvailabilitiesRequestForTest(
  restaurantId: string,
  selectedDays: Set<string>,
  hourMask: number,
): UpdateAvailabilitiesRequestForTest {
  return {
    id: restaurantId,
    mondayHours: selectedDays.has("monday") ? hourMask : 0,
    tuesdayHours: selectedDays.has("tuesday") ? hourMask : 0,
    wednesdayHours: selectedDays.has("wednesday") ? hourMask : 0,
    thursdayHours: selectedDays.has("thursday") ? hourMask : 0,
    fridayHours: selectedDays.has("friday") ? hourMask : 0,
    saturdayHours: selectedDays.has("saturday") ? hourMask : 0,
    sundayHours: selectedDays.has("sunday") ? hourMask : 0,
  };
}

export type UpdateAvailabilitiesRequest = {
  id: string;
  mondayHours: number;
  tuesdayHours: number;
  wednesdayHours: number;
  thursdayHours: number;
  fridayHours: number;
  saturdayHours: number;
  sundayHours: number;
};

function BookingSettingPage() {
  const [existingRestaurant, setExistingRestaurant] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [maxPartySize, setMaxPartySize] = useState<number | "">("");
  const [bookingCapacity, setBookingCapacity] = useState<number | "">("");

  const restaurantId =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("restaurantId") ?? "")
      : "";

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/restaurant/details?restaurantId=${encodeURIComponent(restaurantId)}`,
        );
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        setExistingRestaurant(data);
        // Pre-fill People & Table if available
        if (typeof data?.maxPartySize === "number")
          setMaxPartySize(data.maxPartySize);
        if (typeof data?.bookingCapacity === "number")
          setBookingCapacity(data.bookingCapacity);
        if (typeof data?.bookingLength === "number")
          setTimeSlot(data.bookingLength);
      } catch (e) {
        console.error("Failed to load restaurant details:", e);
      }
    })();
  }, [restaurantId]);

  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [timeSlot, setTimeSlot] = useState<number | null>(null);
  const HOURS = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  ); // 00-23
  const MINUTES = ["00", "30"]; // 30-minute granularity only

  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("21");
  const [endMinute, setEndMinute] = useState("00");

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function formatHourMask(): number {
    const startHourInt = +startHour;
    const startMinuteInt = +startMinute;
    const endHourInt = +endHour;
    const endMinuteInt = +endMinute;

    const openSlot = startHourInt * 2 + Math.floor(startMinuteInt / 30);
    const closeSlot = endHourInt * 2 + Math.floor(endMinuteInt / 30);

    const length = Math.max(0, closeSlot - openSlot);
    if (length <= 0) return 0;

    const mask = ((1n << BigInt(length)) - 1n) << BigInt(openSlot);
    return Number(mask);
  }

  // API request logic flow:
  // Construct data from frontend into request -> submit request -> check request result

  // TODO (For Sissi):
  // /api/restaurant/update
  // update the maxPartySize, bookingCapacity, and bookingLength variables
  // (refer to UpdateRestaurantHandler line 225 in backend/api/restaurant.go)
  //
  // MAKE SURE TO RETAIN EVERYTHING ELSE. This API endpoint expects the full restaurant details,
  // so you need to send back everything like the ID, name, description, etc. You don't want to change these,
  // keep them the same as when you received the details for this restaurant.
  async function onSaveSettings(e: FormEvent) {
    e.preventDefault();
    const hourMask = formatHourMask();
    // Optional: ensure a booking duration has been chosen; if not, leave existing value
    // (Backend will keep prior setting if this is undefined.)
    try {
      const request: UpdateAvailabilitiesRequest = {
        id: restaurantId,
        mondayHours: selectedDays.has("monday") ? hourMask : 0,
        tuesdayHours: selectedDays.has("tuesday") ? hourMask : 0,
        wednesdayHours: selectedDays.has("wednesday") ? hourMask : 0,
        thursdayHours: selectedDays.has("thursday") ? hourMask : 0,
        fridayHours: selectedDays.has("friday") ? hourMask : 0,
        saturdayHours: selectedDays.has("saturday") ? hourMask : 0,
        sundayHours: selectedDays.has("sunday") ? hourMask : 0,
      };

      const response = await fetch(`/api/availability/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error(response.status.toString());

      // Update restaurant-level settings (booking length, capacities)
      const restaurantUpdatePayload: Record<string, unknown> = {
        ...(existingRestaurant ?? {}),
        id: restaurantId,
      };
      if (typeof timeSlot === "number")
        restaurantUpdatePayload.bookingLength = timeSlot;
      if (typeof maxPartySize === "number")
        restaurantUpdatePayload.maxPartySize = maxPartySize;
      if (typeof bookingCapacity === "number")
        restaurantUpdatePayload.bookingCapacity = bookingCapacity;

      const res2 = await fetch(`/api/restaurant/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurantUpdatePayload),
      });
      if (!res2.ok) throw new Error(res2.status.toString());
    } catch (error) {
      console.error("Error updating restaurant availabilities: ", error);
    }
  }

  return (
    <div className="bks-page">
      <aside className="bks-side">
        <nav className="bks-side-nav">
          <Link
            to="/profile"
            search={{ restaurantId }}
            className="bks-side-link"
          >
            Profile
          </Link>
          <Link
            to="/booking"
            search={{ restaurantId }}
            className="bks-side-link"
          >
            Booking
          </Link>
          <Link
            to="/booking-setting"
            search={{ restaurantId }}
            className="bks-side-link bks-active"
          >
            Booking Setting
          </Link>
        </nav>
        <div className="bks-side-footer">
          <Link to="/account" className="bks-side-link">
            ← Back to Dashboard
          </Link>
        </div>
      </aside>

      <main className="bks-main">
        <form className="bks-card" onSubmit={onSaveSettings}>
          {/* Time */}
          <section className="bks-section">
            <div className="bks-title no-line">Time:</div>
            <div className="bks-grid">
              <label>
                <span>Booking Duration:</span>
                <div className="bks-days">
                  {[60, 90, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`bks-day ${timeSlot === m ? "active" : ""}`}
                      aria-pressed={timeSlot === m}
                      onClick={() => setTimeSlot(m)}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </label>
              <label>
                <span>Opening Hours:</span>
                <div className="bks-inline">
                  {/* Start time */}
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  :
                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <span className="bks-dash" />
                  {/* End time */}
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  :
                  <select
                    value={endMinute}
                    onChange={(e) => setEndMinute(e.target.value)}
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="bks-span-2">
                <span>Opening Dates:</span>
                <div className="bks-days">
                  {[
                    ["monday", "Mon"],
                    ["tuesday", "Tue"],
                    ["wednesday", "Wed"],
                    ["thursday", "Thur"],
                    ["friday", "Fri"],
                    ["saturday", "Sat"],
                    ["sunday", "Sun"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(key)}
                      className={`bks-day ${selectedDays.has(key) ? "active" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </label>
            </div>
          </section>

          <section className="bks-section">
            <div className="bks-title">People & Table:</div>
            <div className="bks-grid">
              <label>
                <span>Maximum Party Size:</span>
                <input
                  type="number"
                  min={1}
                  value={maxPartySize}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMaxPartySize(v === "" ? "" : Math.max(1, Number(v)));
                  }}
                />
              </label>
              <label>
                <span>Maximum Number of Tables:</span>
                <input
                  type="number"
                  min={0}
                  value={bookingCapacity}
                  onChange={(e) => {
                    const v = e.target.value;
                    setBookingCapacity(v === "" ? "" : Math.max(0, Number(v)));
                  }}
                />
              </label>
            </div>
          </section>

          <div className="bks-actions">
            <button className="bks-primary" type="submit">
              Save
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/booking-setting/")({
  component: BookingSettingPage,
});

export default BookingSettingPage;
