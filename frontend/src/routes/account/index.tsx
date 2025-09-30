import { createFileRoute } from "@tanstack/react-router";
import "./index.css";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

function Account() {
  const [tags, setTags] = useState<string[]>(["Tag", "Vegan"]);
  const [newTag, setNewTag] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  // State -> City mapping
  const stateCityMap: Record<string, string[]> = {
    "Australian Capital Territory": ["Belconnen", "Canberra", "Queanbeyan"],
    "New South Wales": [
      "Bathurst",
      "Coffs Harbour",
      "Newcastle",
      "Parramatta",
      "Sydney",
      "Tamworth",
      "Wollongong",
    ],
    "Northern Territory": [
      "Alice Springs",
      "Darwin",
      "Katherine",
      "Palmerston",
    ],
    Queensland: [
      "Brisbane",
      "Cairns",
      "Gold Coast",
      "Mackay",
      "Rockhampton",
      "Sunshine Coast",
      "Toowoomba",
      "Townsville",
    ],
    "South Australia": ["Adelaide", "Mount Gambier", "Port Augusta", "Whyalla"],
    Tasmania: ["Burnie", "Devonport", "Hobart", "Launceston"],
    Victoria: [
      "Ballarat",
      "Bendigo",
      "Geelong",
      "Melbourne",
      "Mildura",
      "Shepparton",
    ],
    "Western Australia": [
      "Bunbury",
      "Fremantle",
      "Geraldton",
      "Kalgoorlie",
      "Perth",
    ],
  };

  const [selectedState, setSelectedState] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");

  const canAdd = newTag.trim().length > 0 && !tags.includes(newTag.trim());

  function onStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const state = e.target.value;
    setSelectedState(state);
    setCities(stateCityMap[state] || []);
    setSelectedCity("");
  }
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
              <label className="acc-field">
                <span>Restaurant Name:</span>
                <input
                  placeholder="Enter the restaurant name here"
                  required
                  maxLength={80}
                />
              </label>
              <label className="acc-field">
                <span>Owner Name:</span>
                <input placeholder="Enter the Owner name here" />
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
              <label className="acc-field">
                <span>Phone Number:</span>
                <input
                  placeholder="Enter the Contact Number here"
                  inputMode="tel"
                />
              </label>
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
                    placeholder="Enter the restaurant address here"
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
              <div />

              {/* City, State, Postcode */}
              {/* You can replace these with dynamic data from backend */}
              <label className="acc-field">
                <span>State:</span>
                <div className="acc-select" style={{ width: "100%" }}>
                  <select
                    value={selectedState}
                    onChange={onStateChange}
                    style={{ width: "100%" }}
                  >
                    <option value="" disabled>
                      Select a State
                    </option>
                    {Object.keys(stateCityMap).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              {/* City */}
              <label className="acc-field">
                <span>City:</span>
                <div className="acc-select" style={{ width: "100%" }}>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={!selectedState}
                    style={{ width: "100%" }}
                  >
                    <option value="" disabled>
                      {selectedState
                        ? "Select a City"
                        : "Please select a State first"}
                    </option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
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
