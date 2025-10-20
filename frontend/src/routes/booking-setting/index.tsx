import { createFileRoute, Link } from "@tanstack/react-router";
import "./index.css";
import type { FormEvent } from "react";
import { useState } from "react";

export type UpdateAvailabilitiesRequest = {
  id: string;
  mondayHours: bigint;
  tuesdayHours: bigint;
  wednesdayHours: bigint;
  thursdayHours: bigint;
  fridayHours: bigint;
  saturdayHours: bigint;
  sundayHours: bigint;
};

function BookingSettingPage() {
  const restaurantId =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("restaurantId") ?? "")
      : "";

  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [timeSlot, setTimeSlot] = useState<number | null>(null);
  const HOURS = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  ); // 00-23
  const MINUTES = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  ); // 00-59

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

  function formatHourMask(): bigint {
    const startHourInt = +startHour;
    const startMinuteInt = +startMinute;
    const endHourInt = +endHour;
    const endMinuteInt = +endMinute;

    const openTimeSlot = BigInt(startHourInt * 2 + startMinuteInt / 30);
    const closeTimeSlot = BigInt(endHourInt * 2 + endMinuteInt / 30);

    const hourRange = closeTimeSlot - openTimeSlot;
    const rangeMask = BigInt(1) << (hourRange + BigInt(1) - BigInt(1));

    return rangeMask << openTimeSlot;
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
    const hourMask = formatHourMask();
    // TODO: Fix JSON BigInt parsing.
    try {
      const request: UpdateAvailabilitiesRequest = {
        id: restaurantId,
        mondayHours: selectedDays.has("monday") ? hourMask : BigInt(0),
        tuesdayHours: selectedDays.has("tuesday") ? hourMask : BigInt(0),
        wednesdayHours: selectedDays.has("wednesday") ? hourMask : BigInt(0),
        thursdayHours: selectedDays.has("thursday") ? hourMask : BigInt(0),
        fridayHours: selectedDays.has("friday") ? hourMask : BigInt(0),
        saturdayHours: selectedDays.has("saturday") ? hourMask : BigInt(0),
        sundayHours: selectedDays.has("sunday") ? hourMask : BigInt(0),
      };

      const response = await fetch(`/api/availability/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error(response.status.toString());
    } catch (error) {
      console.error("Error updating restaurant availabilities: ", error);
    }
    e.preventDefault();
    //const payload = { timeSlot };
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
                  {["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"].map(
                    (d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`bks-day ${selectedDays.has(d) ? "active" : ""}`}
                      >
                        {d}
                      </button>
                    ),
                  )}
                </div>
              </label>
            </div>
          </section>

          <section className="bks-section">
            <div className="bks-title">People & Tasble:</div>
            <div className="bks-grid">
              <label>
                <span>Maximum Party Size:</span>
                <input placeholder="" />
              </label>
              <label>
                <span>Maximum Number of Tables:</span>
                <input placeholder="" />
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
