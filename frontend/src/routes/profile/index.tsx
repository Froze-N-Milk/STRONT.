import { createFileRoute } from "@tanstack/react-router";
import "./index.css";
import { useState, useEffect } from "react";
import type React from "react";
import { Link } from "@tanstack/react-router";

type RestaurantUpdateRequest = {
  id: string;
  name: string;
  description: string;
  locationText: string;
  tags: string[];
  frontpageMarkdown?: string;
  contactEmail?: string;
  contactPhone?: string;
};

function Profile() {
  const [tags, setTags] = useState<string[]>(["Tag", "Vegan"]);
  const [newTag, setNewTag] = useState("");
  const [address, setAddress] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const restaurantId =
    new URLSearchParams(window.location.search).get("restaurantId") || "";

  useEffect(() => {
    if (!restaurantId) window.location.replace("/account");
  }, [restaurantId]);

  // Load restaurant original information
  // Connected backend endpoint: GET /api/restaurant/{restaurantId}
  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`/api/restaurant/${restaurantId}`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Load failed: ${res.status}`);
        const data = await res.json();
        setName(data.name ?? "");
        setShortDesc(data.description ?? "");
        setAddress(data.locationText ?? "");
        setTags(Array.isArray(data.tags) ? data.tags : []);
        setBio(data.frontpageMarkdown ?? "");
        setEmail(data.contactEmail ?? "");
        setPhone(data.contactPhone ?? "");
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  const canAdd = newTag.trim().length > 0 && !tags.includes(newTag.trim());

  function addTag() {
    if (!canAdd) return;
    setTags((list) => [...list, newTag.trim()]);
    setNewTag("");
  }

  function removeTag(tag: string) {
    setTags((list) => list.filter((t) => t !== tag));
  }

  // Save restaurant profile information
  // Connected backend endpoint: POST /api/restaurant/update
  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!restaurantId) return;
    try {
      setLoading(true);
      setErr(null);
      const payload: RestaurantUpdateRequest = {
        id: restaurantId,
        name,
        description: shortDesc,
        locationText: address,
        tags,
      };

      if (email.trim()) payload.contactEmail = email.trim();
      if (phone.trim()) payload.contactPhone = phone.trim();
      if (bio.trim()) payload.frontpageMarkdown = bio.trim();
      const res = await fetch("/api/restaurant/update", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Save failed: ${res.status}`);
      }
      // optional success alert
      // alert("Saved!");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="acc-page">
      <div className="acc-shell">
        <aside className="acc-side">
          <nav className="acc-side-nav">
            <Link
              to="/profile"
              search={{ restaurantId }}
              className="acc-side-link acc-active"
            >
              Profile
            </Link>
            <Link
              to="/booking"
              search={{ restaurantId }}
              className="acc-side-link"
            >
              Booking
            </Link>
            <Link
              to="/booking-setting"
              search={{ restaurantId }}
              className="acc-side-link"
            >
              Booking Setting
            </Link>
          </nav>
          <div className="side-footer">
            <Link to="/account" className="acc-side-link">
              ← Back to Dashboard
            </Link>
          </div>
        </aside>

        <main className="acc-main">
          {loading && <div>Loading...</div>}
          {err && <div style={{ color: "red" }}>{err}</div>}
          <form className="acc-card" onSubmit={onSave}>
            <div className="acc-grid">
              <label className="acc-field">
                <span>Restaurant Name:</span>
                <input
                  placeholder="Enter the restaurant name here"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="acc-field">
                <span>E-mail Address:</span>
                <input
                  type="email"
                  required
                  placeholder="Enter the e-mail address here"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="acc-field">
                <span>Phone Number:</span>
                <input
                  placeholder="Enter the Contact Number here"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>

              <label className="acc-field acc-span-2">
                <span>Restaurant Address:</span>
                <input
                  placeholder="Enter the restaurant address here"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>

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
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      address,
                    )}`}
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
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
              />
            </div>

            <div className="acc-section">
              <div className="acc-section-title">BIO</div>
              <textarea
                className="bio-desc"
                placeholder="Enter the restaurant BIO here"
                rows={10}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
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

export const Route = createFileRoute("/profile/")({
  component: Profile,
});

export default Profile;
