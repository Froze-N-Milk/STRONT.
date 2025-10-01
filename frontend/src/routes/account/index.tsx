import { createFileRoute } from "@tanstack/react-router";
import "./index.css";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

function Account() {
  const [tags, setTags] = useState<string[]>(["Tag", "Vegan"]);
  const [newTag, setNewTag] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [address, setAddress] = useState("");

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
              {/* Restaurant Name */}
              {/* Restaurant Name */}
              <label className="acc-field">
                <span>Restaurant Name:</span>
                <input
                  placeholder="Enter the restaurant name here"
                  required
                  maxLength={80}
                />
              </label>
              {/* Email Address */}
              <label className="acc-field">
                <span>E-mail Address:</span>
                <input
                  type="email"
                  required
                  placeholder="Enter the e-mail address here"
                />
              </label>
              {/* Phone Number */}
              {/* Phone Number */}
              <label className="acc-field">
                <span>Phone Number:</span>
                <input
                  placeholder="Enter the Contact Number here"
                  inputMode="tel"
                />
                <span>Phone Number:</span>
                <input
                  placeholder="Enter the Contact Number here"
                  inputMode="tel"
                />
              </label>
              {/* Address */}
              {/* Address */}
              <label className="acc-field acc-span-2">
                <span>Restaurant Address:</span>
                <input placeholder="Enter the restaurant address here" />
              </label>
              {/* Maps Link */}
              <label className="acc-field">
                <span>Google Maps:</span>
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <input
                    placeholder="Enter google maps link for your restaurant."
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Select on Google Maps"
                    style={{ fontSize: "20px", textDecoration: "none" }}
                  >
                    📍
                  </a>
                </div>
              </label>
            </div>

            <div className="acc-section">
              <div className="acc-section-title">Add Search Tags</div>
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
                  placeholder="Enter your restaurant's type and add it as a tag."
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
              <div className="acc-section-title">Short Description</div>
              <textarea
                className="short-desc"
                placeholder="Enter the restaurant BIO here"
                rows={6}
              />
            </div>

            <div className="acc-section">
              <div className="acc-section-title">BIO</div>
              <textarea
                className="bio-desc"
                placeholder="Enter the restaurant BIO here"
                rows={10}
              />
            </div>

            <div className="acc-actions">
              <button type="submit" className="acc-save">
                Save
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/account/")({
  component: Account,
});
export default Account;
