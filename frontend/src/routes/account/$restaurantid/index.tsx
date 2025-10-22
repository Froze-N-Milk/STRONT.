import { createFileRoute } from "@tanstack/react-router";
import "./index.css";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Restaurant } from "./-helper.ts";

function Profile() {
  const restaurantId = Route.useParams().restaurantid;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [newTag, setNewTag] = useState("");

  // Load restaurant original information
  // Connected backend endpoint: GET /api/restaurant/{restaurantId}
  useEffect(() => {
    fetch(`/api/restaurant/${restaurantId}`, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        setRestaurant(await r.json());
      }
    });
  }, [restaurantId]);

  async function onSave() {
    try {
      const res = await fetch("/api/restaurant/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(restaurant),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Save failed: ${res.status}`);
      }
    } catch (e) {
      console.log(e);
    }
  }

  if (restaurant == null) {
    return <p>something went wrong</p>;
  }

  return (
    <div className="acc-page">
      <div className="acc-shell">
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
                className="bks-side-link"
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
                className="bks-side-link bks-active"
                params={{ restaurantid: restaurantId }}
              >
                FOH Tracker
              </Link>
            </nav>
          </div>
        </div>
        <main className="acc-main">
          <div className="acc-grid">
            <label className="acc-field">
              <span>Restaurant Name:</span>
              <input
                placeholder="Enter the restaurant name here"
                required
                maxLength={80}
                value={restaurant.name}
                onChange={(e) =>
                  setRestaurant({ ...restaurant, name: e.target.value })
                }
              />
            </label>
            <label className="acc-field">
              <span>E-mail Address:</span>
              <input
                type="email"
                required
                placeholder="Enter the e-mail address here"
                value={restaurant.email}
                onChange={(e) =>
                  setRestaurant({ ...restaurant, email: e.target.value })
                }
              />
            </label>
            <label className="acc-field">
              <span>Phone Number:</span>
              <input
                placeholder="Enter the Contact Number here"
                inputMode="tel"
                value={restaurant.phone}
                onChange={(e) =>
                  setRestaurant({ ...restaurant, phone: e.target.value })
                }
              />
            </label>
            <label className="acc-field acc-span-2">
              <span>Restaurant Address:</span>
              <input
                placeholder="Enter the restaurant address here"
                value={restaurant.locationText}
                onChange={(e) =>
                  setRestaurant({
                    ...restaurant,
                    locationText: e.target.value,
                  })
                }
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
                  value={restaurant.locationUrl}
                  onChange={(e) =>
                    setRestaurant({
                      ...restaurant,
                      locationUrl: e.target.value,
                    })
                  }
                />
                <a
                  href={restaurant.locationUrl}
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
              {restaurant.tags.map((t) => (
                <span key={t} className="acc-tag">
                  {t}
                  <button
                    type="button"
                    aria-label="remove"
                    onClick={() => {
                      const newTags = restaurant.tags.filter(
                        (tag) => tag !== t,
                      );
                      setRestaurant({ ...restaurant, tags: newTags });
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="acc-tag-add">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter your restaurant's type and add it as a tag."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (!restaurant.tags.includes(newTag)) {
                      setRestaurant({
                        ...restaurant,
                        tags: [...restaurant.tags, newTag],
                      });
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {}}
                disabled={restaurant.tags.includes(newTag)}
              >
                +
              </button>
            </div>
          </div>
          <div className="acc-section">
            <div className="acc-section-title">Short Description</div>
            <textarea
              className="short-desc"
              placeholder="Enter the restaurant bio here"
              rows={6}
              value={restaurant.description}
              onChange={(e) =>
                setRestaurant({ ...restaurant, description: e.target.value })
              }
            />
          </div>
          <div className="acc-section">
            <div className="acc-section-title">BIO</div>
            <textarea
              className="bio-desc"
              placeholder="Create the front page for your restaurant"
              rows={10}
              value={restaurant.frontpageMarkdown}
              onChange={(e) =>
                setRestaurant({
                  ...restaurant,
                  frontpageMarkdown: e.target.value,
                })
              }
            />
          </div>
          <div className="acc-actions">
            <button className="acc-save" onClick={() => onSave()}>
              Save
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/account/$restaurantid/")({
  component: Profile,
});
