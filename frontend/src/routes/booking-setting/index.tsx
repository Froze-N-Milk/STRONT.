import { createFileRoute, Link } from "@tanstack/react-router";
import "./index.css";
import { useState } from "react";

function BookingSettingPage() {
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

  function onSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    //const payload = { timeSlot };
  }

  return (
    <div className="bks-page">
      <aside className="bks-side">
        <nav className="bks-side-nav">
          <Link to="/account" className="bks-side-link">
            Account
          </Link>
          <Link to="/account-setting" className="acc-side-link">
            Account Setting
          </Link>
          <Link to="/booking" className="bks-side-link">
            Booking
          </Link>
          <Link to="/booking-setting" className="bks-side-link bks-active">
            Booking Setting
          </Link>
        </nav>
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
