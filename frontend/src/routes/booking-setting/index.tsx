import { createFileRoute, Link } from "@tanstack/react-router";
import "./index.css";
import { useState } from "react";

function BookingSettingPage() {
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState(
    ["Vegetarian", "Vegan", "Gluten - Free", "Birthday", "Allergy"].map(
      (t, i) => ({ id: i + 1, label: t, selected: false }),
    ),
  );
  const [newTag, setNewTag] = useState("");

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function addTag() {
    const label = newTag.trim();
    if (
      !label ||
      tags.find((t) => t.label.toLowerCase() === label.toLowerCase())
    )
      return;
    setTags((list) => [...list, { id: Date.now(), label, selected: false }]);
    setNewTag("");
  }
  function toggleTag(id: number) {
    setTags((list) =>
      list.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)),
    );
  }
  function editTag(id: number) {
    const curr = tags.find((t) => t.id === id);
    if (!curr) return;
    const next = prompt("Rename tag", curr.label);
    if (next && next.trim()) {
      setTags((list) =>
        list.map((t) => (t.id === id ? { ...t, label: next.trim() } : t)),
      );
    }
  }
  function removeTag(id: number) {
    setTags((list) => list.filter((t) => t.id !== id));
  }

  function onSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    // 预留后端对接：提交设置，如 /api/settings/update
    // 建议提交字段：timeSlot, cutoff, openingHours, openingDates, guestsMinMax,
    // tableCapacity, depositRequirement, cancellationPolicy, noShowPolicy,
    // notifyEmail, notifySms, notifyTargets, reminderHours, messageTemplate,
    // specialRequests(tags)
  }

  return (
    <div className="bks-page">
      <aside className="bks-side">
        <nav className="bks-side-nav">
          <Link to="/account" className="bks-side-link">
            Account
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
          <section className="bks-section">
            <div className="bks-title no-line">Time:</div>
            <div className="bks-grid">
              <label>
                <span>Booking Time Slot:</span>
                <input placeholder="e.g. 60 or 90 (mins)" />
              </label>
              <label>
                <span>Cut-off Time:</span>
                <input placeholder="Mins | Hours" />
              </label>
              <label>
                <span>Opening Hours:</span>
                <div className="bks-inline">
                  <input placeholder="00:00" />
                  <span className="bks-dash" /> <input placeholder="00:00" />
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
              <label>
                <span>Max Advance Booking:</span>
                <input placeholder="Enter the e-mail address here" />
              </label>
              <label>
                <span>Contact Number:</span>
                <input placeholder="Enter the Contact Number here" />
              </label>
            </div>
          </section>

          <section className="bks-section">
            <div className="bks-title">People & Table:</div>
            <div className="bks-grid">
              <label>
                <span>Min / Max Guests per Booking:</span>
                <input placeholder="" />
              </label>
              <label>
                <span>Table Capacity:</span>
                <input placeholder="" />
              </label>
            </div>
          </section>

          <section className="bks-section">
            <div className="bks-title">Payment & Policy:</div>
            <div className="bks-grid">
              <label className="bks-span-2">
                <span>Deposit Requirement:</span>
                <input placeholder="" />
              </label>
              <label className="bks-span-2">
                <span>Cancellation Policy:</span>
                <input placeholder="" />
              </label>
              <label className="bks-span-2">
                <span>No-show Policy:</span>
                <input placeholder="" />
              </label>
            </div>
          </section>

          <section className="bks-section">
            <div className="bks-title">Notification:</div>
            <div className="bks-grid">
              <div className="bks-span-2 bks-checklines">
                <label>
                  <input type="checkbox" /> Send Email Notification
                </label>
                <label>
                  <input type="checkbox" /> Send SMS Notification
                </label>
              </div>
              <div className="bks-span-2">
                <span>Notify:</span>
                <div className="bks-checks">
                  <label>
                    <input type="checkbox" /> Customer
                  </label>
                  <label>
                    <input type="checkbox" /> Owner/Staff
                  </label>
                </div>
              </div>
              <label className="bks-span-2">
                <span>Reminder:</span>
                <div className="bks-inline">
                  <span>Send reminder</span>
                  <input style={{ width: 80 }} placeholder="" />
                  <span>hours before booking</span>
                </div>
              </label>
              <label className="bks-span-2">
                <span>Message Template:</span>
                <textarea
                  rows={4}
                  placeholder="Booking confirmation message box..."
                />
              </label>
            </div>
          </section>

          <section className="bks-section">
            <div className="bks-title">Special Requests</div>
            <div className="bks-tags">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className={`bks-tag ${t.selected ? "active" : ""}`}
                  onClick={() => toggleTag(t.id)}
                >
                  {t.label}
                  <button
                    type="button"
                    className="bks-mini"
                    onClick={(e) => {
                      e.stopPropagation();
                      editTag(t.id);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="bks-mini"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(t.id);
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="bks-tag-add">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag"
              />
              <button type="button" onClick={addTag}>
                +
              </button>
            </div>
          </section>

          <div className="bks-actions">
            <button className="bks-primary" type="submit">
              Save
            </button>
          </div>
          {/* backend */}
        </form>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/booking-setting/")({
  component: BookingSettingPage,
});
