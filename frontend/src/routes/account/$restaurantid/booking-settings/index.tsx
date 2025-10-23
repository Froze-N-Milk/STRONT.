import { createFileRoute, Link } from "@tanstack/react-router";
import "./index.css";
import { useEffect, useState } from "react";
import type { Restaurant } from "../-helper.ts";

export type Availability = {
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
  const restaurantId = Route.useParams().restaurantid;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());

  /*function toggleDay(day: string) {
        setSelectedDays((prev) => {
            const next = new Set(prev);
            if (next.has(day)) next.delete(day);
            else next.add(day);
            return next;
        });
    }*/

  useEffect(() => {
    fetch(`/api/restaurant/${restaurantId}`, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        setRestaurant(await r.json());
      }
    });
    fetch(`/api/availability/${restaurantId}/raw`, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        const a: Availability = await r.json();
        console.log(a);
        const newSelectedDays = new Set<string>();
        for (const [key, value] of Object.entries(a)) {
          if (value != 0) {
            newSelectedDays.add(key);
          }
        }
        setSelectedDays(newSelectedDays);
        console.log(selectedDays);
        setAvailability(a);
      }
    });
  }, [restaurantId]);

  const HOURS = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  ); // 00-23
  const MINUTES = ["00", "30"]; // 30-minute granularity only

  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");
  const [endHour, setEndHour] = useState("21");
  const [endMinute, setEndMinute] = useState("00");

  if (restaurant == null || availability == null) {
    return <p>Something went wrong</p>;
  }

  function formatHourMask(): bigint {
    const startHourInt = +startHour;
    const startMinuteInt = +startMinute;
    const endHourInt = +endHour;
    const endMinuteInt = +endMinute;

    const openSlot = startHourInt * 2 + Math.floor(startMinuteInt / 30);
    const closeSlot = endHourInt * 2 + Math.floor(endMinuteInt / 30);

    const length = Math.max(0, closeSlot - openSlot);
    if (length <= 0) return 0n;

    const mask = ((1n << BigInt(length)) - 1n) << BigInt(openSlot);
    return mask;
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
  async function onSaveSettings() {
    console.log("Saving settings");
    //const hourMask = formatHourMask();
    try {
      // setAvailability({
      //     id: restaurantId,
      //     mondayHours: selectedDays.has("monday") ? Number(hourMask) : 0,
      //     tuesdayHours: selectedDays.has("tuesday") ? Number(hourMask) : 0,
      //     wednesdayHours: selectedDays.has("wednesday") ? Number(hourMask) : 0,
      //     thursdayHours: selectedDays.has("thursday") ? Number(hourMask) : 0,
      //     fridayHours: selectedDays.has("friday") ? Number(hourMask) : 0,
      //     saturdayHours: selectedDays.has("saturday") ? Number(hourMask) : 0,
      //     sundayHours: selectedDays.has("sunday") ? Number(hourMask) : 0,
      // });

      console.log(JSON.stringify(availability));

      const response = await fetch(`/api/availability/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(availability),
      });

      if (!response.ok) throw new Error(response.status.toString());

      // Update restaurant-level settings (booking length, capacities)

      const res2 = await fetch(`/api/restaurant/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurant),
      });
      if (!res2.ok) throw new Error(res2.status.toString());
    } catch (error) {
      console.error("Error updating restaurant details: ", error);
    }
  }

  return (
    <div className="bks-page">
      <div style={{ display: "flex", gap: "20px", width: "max-content" }}>
        <div className="bks-side">
          <nav className="bks-side-nav">
            <Link to="/account" className="bks-side-link">
              Back to Account
            </Link>
            <Link
              to="/account/$restaurantid"
              className="bks-side-link"
              params={{ restaurantid: restaurantId }}
            >
              Edit Restaurant Profile
            </Link>
            <Link
              to="/account/$restaurantid/booking-settings"
              className="bks-side-link bks-active"
              params={{ restaurantid: restaurantId }}
            >
              Booking Settings
            </Link>
            <Link
              to="/account/$restaurantid/view-bookings"
              className="bks-side-link"
              params={{ restaurantid: restaurantId }}
            >
              Bookings
            </Link>
            <Link
              to="/account/$restaurantid/FOHtracker"
              className="bks-side-link"
              params={{ restaurantid: restaurantId }}
            >
              FOH Tracker
            </Link>
          </nav>
        </div>
      </div>

      <main className="bks-main">
        {/* Time */}
        <section className="bks-section">
          <div className="bks-title no-line">Time:</div>
          <div className="bks-grid">
            <label>
              <span>Booking Duration:</span>
              <div className="bks-days">
                {[2, 3, 4].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`bks-day ${restaurant.bookingLength === m ? "active" : ""}`}
                    aria-pressed={restaurant.bookingLength === m}
                    onClick={() =>
                      setRestaurant({ ...restaurant, bookingLength: m })
                    }
                  >
                    {m * 30} min
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
                <button
                  type="button"
                  onClick={() => {
                    const mask =
                      availability?.mondayHours == 0
                        ? Number(formatHourMask())
                        : 0;
                    setAvailability({ ...availability, mondayHours: mask });
                  }}
                  className={`bks-day ${availability.mondayHours != 0 ? "active" : ""}`}
                >
                  Mon
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mask =
                      availability?.tuesdayHours == 0
                        ? Number(formatHourMask())
                        : 0;
                    setAvailability({ ...availability, tuesdayHours: mask });
                  }}
                  className={`bks-day ${availability.tuesdayHours != 0 ? "active" : ""}`}
                >
                  Tue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mask =
                      availability?.wednesdayHours == 0
                        ? Number(formatHourMask())
                        : 0;
                    setAvailability({ ...availability, wednesdayHours: mask });
                  }}
                  className={`bks-day ${availability.wednesdayHours != 0 ? "active" : ""}`}
                >
                  Wed
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mask =
                      availability?.thursdayHours == 0
                        ? Number(formatHourMask())
                        : 0;
                    setAvailability({ ...availability, thursdayHours: mask });
                  }}
                  className={`bks-day ${availability.thursdayHours != 0 ? "active" : ""}`}
                >
                  Thu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mask =
                      availability?.fridayHours == 0
                        ? Number(formatHourMask())
                        : 0;
                    setAvailability({ ...availability, fridayHours: mask });
                  }}
                  className={`bks-day ${availability.fridayHours != 0 ? "active" : ""}`}
                >
                  Fri
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mask =
                      availability?.saturdayHours == 0
                        ? Number(formatHourMask())
                        : 0;
                    setAvailability({ ...availability, saturdayHours: mask });
                  }}
                  className={`bks-day ${availability.saturdayHours != 0 ? "active" : ""}`}
                >
                  Sat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mask =
                      availability?.sundayHours == 0
                        ? Number(formatHourMask())
                        : 0;
                    setAvailability({ ...availability, sundayHours: mask });
                  }}
                  className={`bks-day ${availability.sundayHours != 0 ? "active" : ""}`}
                >
                  Sun
                </button>
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
                value={restaurant.maxPartySize}
                onChange={(e) =>
                  setRestaurant({
                    ...restaurant,
                    maxPartySize: !isNaN(Number(e.target.value))
                      ? Number(e.target.value)
                      : 0,
                  })
                }
              />
            </label>
            <label>
              <span>Maximum Concurrent Bookings:</span>
              <input
                type="number"
                min={0}
                value={restaurant.bookingCapacity}
                onChange={(e) =>
                  setRestaurant({
                    ...restaurant,
                    bookingCapacity: !isNaN(Number(e.target.value))
                      ? Number(e.target.value)
                      : 0,
                  })
                }
              />
            </label>
          </div>
        </section>

        <div className="bks-actions">
          <button className="bks-primary" onClick={() => onSaveSettings()}>
            Save
          </button>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute(
  "/account/$restaurantid/booking-settings/",
)({
  component: BookingSettingPage,
});

export default BookingSettingPage;
