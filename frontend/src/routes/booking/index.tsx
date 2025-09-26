import { createFileRoute, Link } from "@tanstack/react-router";
import "./index.css";
import { useState } from "react";

function BookingPage() {
  const [items, setItems] = useState(
    Array.from({ length: 6 }).map((_, i) => ({ id: i + 1 })),
  );
  const [modalOpen, setModalOpen] = useState(false);

  function onAdd() {
    setModalOpen(true);
  }
  function onEdit() {
    setModalOpen(true);
  }
  function onRemove(id: number) {
    if (confirm("Remove this booking?")) {
      setItems((list) => list.filter((x) => x.id !== id));
      // 预留后端对接：DELETE /api/booking/:id
    }
  }
  function onClose() {
    setModalOpen(false);
  }
  function onSave(e: React.FormEvent) {
    e.preventDefault();
    // 预留后端对接：POST/PUT /api/booking
    // 建议提交字段：date, time, customerName, guests, contact, confirmStatus,
    // tableInfo, specialRequests, notes
    setModalOpen(false);
  }

  return (
    <div className="bk-page">
      <aside className="bk-side">
        <nav className="bk-side-nav">
          <Link to="/account" className="bk-side-link">
            Account
          </Link>
          <Link to="/booking" className="bk-side-link bk-active">
            Booking
          </Link>
          <Link to="/booking-setting" className="bk-side-link">
            Booking Setting
          </Link>
        </nav>
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
              </div>
              <div className="bk-card-line">
                <strong>Time:</strong>{" "}
              </div>
              <div className="bk-card-line">
                <strong>Customer Name:</strong>{" "}
              </div>
              <div className="bk-card-line">
                <strong>Contact Info:</strong>{" "}
              </div>
              <div className="bk-card-line">
                <strong>Number of Guests:</strong>{" "}
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
                  <input placeholder="" />
                </label>
                <label>
                  <span>Time:</span>
                  <input placeholder="" />
                </label>
                <label>
                  <span>Customer Name:</span>
                  <input placeholder="" />
                </label>
                <label>
                  <span>Number of Guests:</span>
                  <input placeholder="" />
                </label>
                <label>
                  <span>Contact Info:</span>
                  <input placeholder="" />
                </label>
                <label>
                  <span>Confirm Status:</span>
                  <input placeholder="" />
                </label>
                <label className="bk-span-2">
                  <span>Table Info:</span>
                  <input placeholder="" />
                </label>

                <div className="bk-span-2">
                  <span>Special Requests:</span>
                  <div className="bk-checks">
                    {[
                      "Vegetarian",
                      "Vegan",
                      "Gluten-Free",
                      "Birthday",
                      "Allergy",
                    ].map((t) => (
                      <label key={t}>
                        <input type="checkbox" /> {t}
                      </label>
                    ))}
                  </div>
                </div>

                <label className="bk-span-2">
                  <span>Notes:</span>
                  <textarea rows={4} />
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
