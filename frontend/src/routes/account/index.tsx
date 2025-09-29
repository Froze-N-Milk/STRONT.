import { createFileRoute } from "@tanstack/react-router";
import "./index.css";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

function Account() {
  const [tags, setTags] = useState<string[]>(["Tag", "Vegan"]);
  const [newTag, setNewTag] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);

  const canAdd = newTag.trim().length > 0 && !tags.includes(newTag.trim());

  function addTag() {
    if (!canAdd) return;
    setTags((list) => [...list, newTag.trim()]);
    setNewTag("");
  }

  function removeTag(tag: string) {
    setTags((list) => list.filter((t) => t !== tag));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    // Backend：Submit /api/account/update
    // Input：name, ownerName, email, contactNumber, address,
    // city, state, postcode, newPassword, tags, bio
  }

  async function onConfirmDelete() {
    setShowDeleteConfirm(false);
    // Backend：Submit /api/account/delete
  }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogo(url);
    // Backend：Upload（e.g. /api/account/upload-logo）Return URL
  }

  return (
    <div className="acc-page">
      <div className="acc-shell">
        <aside className="acc-side">
          <nav className="acc-side-nav">
            <Link to="/account" className="acc-side-link acc-active">
              Account
            </Link>
            <Link to="/account-setting" className="acc-side-link">
              Account Setting
            </Link>
            <Link to="/booking" className="acc-side-link">
              Booking
            </Link>
            <Link to="/booking-setting" className="acc-side-link">
              Booking Setting
            </Link>
          </nav>
        </aside>

        <main className="acc-main">
          <form className="acc-card" onSubmit={onSave}>
            <div className="acc-logo">
              <label className="acc-logo-circle" htmlFor="acc-logo-input">
                {logo ? (
                  <img src={logo} alt="Logo preview" />
                ) : (
                  <>
                    <span className="acc-logo-plus">+</span>
                    <div className="acc-logo-sub">Add Your Restaurant LOGO</div>
                  </>
                )}
                <input
                  id="acc-logo-input"
                  type="file"
                  accept="image/*"
                  onChange={onLogoChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <div className="acc-grid">
              <label className="acc-field">
                <span>Restaurant Name:</span>
                <input placeholder="Enter the restaurant name here" />
              </label>
              <label className="acc-field">
                <span>Owner Name:</span>
                <input placeholder="Enter the Owner name here" />
              </label>

              <label className="acc-field">
                <span>E-mail Address:</span>
                <input placeholder="Enter the e-mail address here" />
              </label>
              <label className="acc-field">
                <span>Contact Number:</span>
                <input placeholder="Enter the Contact Number here" />
              </label>

              <label className="acc-field acc-span-2">
                <span>Restaurant Address:</span>
                <input placeholder="Enter the restaurant address here" />
              </label>

              <label className="acc-field">
                <span>City:</span>
                <div className="acc-select" style={{ width: "100%" }}>
                  <select defaultValue="" style={{ width: "100%" }}>
                    <option value="" disabled>
                      City
                    </option>
                    <option>City A</option>
                    <option>City B</option>
                  </select>
                  <span className="acc-caret">▾</span>
                </div>
              </label>
              <label className="acc-field">
                <span>State:</span>
                <div className="acc-select" style={{ width: "100%" }}>
                  <select defaultValue="" style={{ width: "100%" }}>
                    <option value="" disabled>
                      State
                    </option>
                    <option>State A</option>
                    <option>State B</option>
                  </select>
                  <span className="acc-caret">▾</span>
                </div>
              </label>

              <label className="acc-field">
                <span>Postcode:</span>
                <input placeholder="Postcode" />
              </label>
              <div />
            </div>

            <div className="acc-section">
              <div className="acc-section-title">Cuisine Type</div>
              <div className="acc-tags">
                {tags.map((t) => (
                  <span key={t} className="acc-tag">
                    {t}
                    <button
                      type="button"
                      aria-label="remove"
                      onClick={() => removeTag(t)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="acc-tag-add">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button type="button" onClick={addTag} disabled={!canAdd}>
                  +
                </button>
              </div>
            </div>

            <div className="acc-section">
              <div className="acc-section-title">BIO</div>
              <textarea placeholder="Enter the restaurant BIO here" rows={8} />
            </div>

            <div className="acc-actions">
              <button
                type="button"
                className="acc-delete"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </button>
              <button type="submit" className="acc-save">
                Save
              </button>
            </div>
          </form>
        </main>
      </div>

      {showDeleteConfirm && (
        <div className="acc-modal" role="dialog" aria-modal>
          <div className="acc-modal-card">
            <div className="acc-modal-title">
              Are you sure to delete the Account?
            </div>
            <p className="acc-modal-desc">
              Once deleted, your account and all related booking records will be
              permanently removed.
            </p>
            <div className="acc-modal-actions">
              <button
                className="acc-btn-light"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </button>
              <button className="acc-btn-danger" onClick={onConfirmDelete}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/account/")({
  component: Account,
});
