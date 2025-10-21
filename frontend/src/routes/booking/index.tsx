/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link } from "@tanstack/react-router";
import "./index.css";
import { useState, useEffect } from "react";
import type React from "react";

export function composeIso(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function buildBookingPayload({
  restaurantId,
  date,
  time,
  partySize,
  firstName,
  lastName,
  email,
  phone,
  notes,
}: {
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  notes?: string;
}) {
  return {
    restaurantId,
    date,
    time,
    partySize,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    phone: phone?.trim() || undefined,
    notes: notes?.trim() || undefined,
    startsAt: composeIso(date, time),
  };
}

export function validateBookingInput({
  date,
  time,
  firstName,
  lastName,
  email,
}: {
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
}) {
  if (!date || !time) return "Date and time are required";
  if (!firstName || !lastName) return "Name is required";
  if (!isValidEmail(email)) return "Invalid email";
  return null;
}

export function filterBookings(
  bookings: { firstName: string; lastName: string; email: string }[],
  keyword: string,
) {
  const key = keyword.trim().toLowerCase();
  if (!key) return bookings;
  return bookings.filter((b) =>
    [b.firstName, b.lastName, b.email].join(" ").toLowerCase().includes(key),
  );
}

function BookingPage() {
  type Booking = {
    id: string;
    startsAt: string; // ISO string
    firstName: string;
    lastName: string;
    email: string;
    partySize: number;
    phone?: string | null;
    notes?: string | null;
  };

  type CreateBookingRequest = {
    restaurantId: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    partySize: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
    startsAt?: string; // optional ISO for backend convenience
  };

  function composeIso(dateStr: string, timeStr: string) {
    return new Date(`${dateStr}T${timeStr}:00`).toISOString();
  }

  const restaurantId =
    typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("restaurantId") ?? "")
      : "";

  const [items, setItems] = useState<Booking[]>([]);

  const [modalOpen, setModalOpen] = useState(false);

  // form states
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [partySize, setPartySize] = useState<string>("1");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/booking/upcoming/${restaurantId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        // Expecting an array of bookings; map defensively
        const list: Booking[] = (
          Array.isArray(data) ? data : data?.bookings || []
        ).map((b: Record<string, unknown>) => ({
          id: String(b.id ?? b.ID ?? b.bookingId ?? ""),
          startsAt: b.startsAt ?? b.startTime ?? b.starts_at ?? "",
          firstName: b.firstName ?? b.first_name ?? "",
          lastName: b.lastName ?? b.last_name ?? "",
          email: b.email ?? b.contactEmail ?? "",
          partySize: Number(b.partySize ?? b.party_size ?? 0),
          phone: b.phone ?? b.contactPhone ?? null,
          notes: b.notes ?? null,
        }));
        setItems(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  function resetForm() {
    setDate("");
    setTime("");
    setFirstName("");
    setLastName("");
    setPartySize("1");
    setEmail("");
    setPhone("");
    setNotes("");
  }

  function onAdd() {
    resetForm();
    setModalOpen(true);
  }

  // For now open as create form; editing wiring can be added later
  function onEdit() {
    setModalOpen(true);
  }

  function onClose() {
    setModalOpen(false);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();

    // Basic client-side checks
    if (!date || !time) {
      alert("Please select date and time");
      return;
    }
    if (!firstName || !lastName) {
      alert("Please enter your name");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Invalid email");
      return;
    }

    const payload: CreateBookingRequest = {
      restaurantId,
      date,
      time,
      partySize: Number(partySize),
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      notes: notes || undefined,
      startsAt: composeIso(date, time),
    };

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // Merge new booking into list if an id is returned
      const newItem: Booking = {
        id: String(data?.id ?? data?.ID ?? Date.now()),
        startsAt: payload.startsAt!,
        firstName,
        lastName,
        email,
        partySize: Number(partySize),
        phone: phone || null,
        notes: notes || null,
      };
      setItems((prev) => [newItem, ...prev]);
      setModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      alert(
        `Failed to create booking: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  async function onRemove(id: string) {
    if (!id) return;
    const ok = confirm("Remove (cancel) this booking?");
    if (!ok) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/booking/cancel/${id}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      setItems((list) => list.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      alert(
        `Failed to cancel booking: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bk-page">
      <aside className="bk-side">
        <nav className="bk-side-nav">
          <Link
            to="/profile"
            search={{ restaurantId }}
            className="bk-side-link"
          >
            Profile
          </Link>
          <Link
            to="/booking"
            search={{ restaurantId }}
            className="bk-side-link bk-active"
          >
            Booking
          </Link>
          <Link to="/booking-setting" className="bk-side-link">
            Booking Setting
          </Link>
        </nav>
        <div className="bk-side-footer">
          <Link to="/account" className="bk-side-link">
            ← Back to Dashboard
          </Link>
        </div>
      </aside>

      <main className="bk-main">
        <div className="bk-toolbar">
          <input className="bk-search" placeholder="Search" />
          <button className="bk-primary" onClick={onAdd}>
            Add Booking
          </button>
        </div>

        <div className="bk-filter">
          <select defaultValue="">
            <option value="" disabled>
              Select by
            </option>
            <option>Date</option>
            <option>Name</option>
          </select>
        </div>

        {loading && <div className="bk-hint">Loading…</div>}
        {error && <div className="bk-error">{error}</div>}

        <section className="bk-cards">
          {items.map((it) => (
            <article key={it.id} className="bk-card">
              <div className="bk-card-actions">
                <button className="bk-link" onClick={() => onEdit()}>
                  Edit
                </button>
                <button className="bk-link" onClick={() => onRemove(it.id)}>
                  Remove
                </button>
              </div>
              <div className="bk-card-line">
                <strong>Date:</strong>{" "}
                {new Date(it.startsAt).toLocaleDateString()}
              </div>
              <div className="bk-card-line">
                <strong>Time:</strong>{" "}
                {new Date(it.startsAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="bk-card-line">
                <strong>Customer Name:</strong> {it.firstName} {it.lastName}
              </div>
              <div className="bk-card-line">
                <strong>Email:</strong> {it.email}
              </div>
              <div className="bk-card-line">
                <strong>Number of Guests:</strong> {it.partySize}
              </div>
            </article>
          ))}
        </section>

        {modalOpen && (
          <div className="bk-modal" role="dialog" aria-modal>
            <form className="bk-modal-card" onSubmit={onSave}>
              <div className="bk-modal-head">
                <h3>Booking Info</h3>
                <button
                  type="button"
                  className="bk-modal-close"
                  aria-label="Close"
                  onClick={onClose}
                >
                  ×
                </button>
              </div>
              <div className="bk-form-grid">
                <label>
                  <span>Date:</span>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <label>
                  <span>Time:</span>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </label>
                <label>
                  <span>First Name:</span>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>
                <label>
                  <span>Last Name:</span>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </label>
                <label>
                  <span>Party size (number of guests):</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                  />
                </label>
                <label>
                  <span>E-mail:</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  <span>Phone number (optional):</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <label>
                  <span>Booking Status:</span>
                  <select defaultValue="" disabled>
                    <option value="" disabled>
                      Select status
                    </option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="seated">Seated</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No-show</option>
                  </select>
                </label>

                <label className="bk-span-2">
                  <span>Notes / Additional Info:</span>
                  <textarea
                    rows={5}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
              </div>
              <div className="bk-actions">
                <button className="bk-primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export const Route = createFileRoute("/booking/")({
  component: BookingPage,
});

export default BookingPage;
