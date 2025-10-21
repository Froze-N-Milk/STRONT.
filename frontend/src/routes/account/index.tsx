import { createFileRoute } from "@tanstack/react-router";
import "./index.css";
import {
  useState,
  useEffect,
  useMemo,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link } from "@tanstack/react-router";

type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  locationText: string | null;
  locationUrl: string | null;
  frontpageMarkdown: string | null;
};

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

function Account() {
  const [list, setList] = useState<Restaurant[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [restaurantToRemove, setRestaurantToRemove] = useState<string | null>(
    null,
  );
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newRestaurantImage, setNewRestaurantImage] = useState<string | null>(
    null,
  );
  const [newRestaurantFile, setNewRestaurantFile] = useState<File | null>(null);

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  // List my own restaurants
  // 1.Connected backend endpoint: GET /api/account/restaurants
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);

        const res = await fetch("/api/account/restaurants", {
          credentials: "include",
        });

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Restaurant[] = await res.json();
        if (alive) setList(data);
      } catch (e) {
        if (alive) setErr(String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo((): Restaurant[] | null => {
    if (!list) return null;
    const key = q.trim().toLowerCase();
    if (!key) return list;
    return list.filter((r) => {
      const hay = [
        r.name,
        r.description ?? "",
        r.locationText ?? "",
        r.locationUrl ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(key);
    });
  }, [list, q]);

  const handleRemoveClick = (id: string) => {
    setRestaurantToRemove(id);
    setShowRemoveConfirm(true);
  };

  // Delete restaurant
  // Connected backend endpoint: POST /api/restaurant/delete
  const handleConfirmRemove = async () => {
    if (!restaurantToRemove) return;

    try {
      const res = await fetch("/api/restaurant/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: restaurantToRemove }),
      });

      if (res.ok) {
        setList(
          (prev) => prev?.filter((r) => r.id !== restaurantToRemove) ?? null,
        );
      } else if (res.status === 401) {
        window.location.href = "/login";
        return;
      } else {
        setErr(`HTTP ${res.status}`);
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setShowRemoveConfirm(false);
      setRestaurantToRemove(null);
    }
  };

  // Create new restaurant
  // Connected backend endpoint: POST /api/restaurant/create
  const handleNewRestaurant = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/restaurant/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRestaurantName.trim() }),
      });
      if (res.ok) {
        const newRestaurant = await res.json();

        if (newRestaurantFile) {
          const fd = new FormData();
          fd.append("id", newRestaurant.id);
          fd.append("image", newRestaurantFile);

          await fetch("/api/restaurant/update", {
            method: "POST",
            credentials: "include",
            body: fd,
          });
        }

        setList((prev) => (prev ? [...prev, newRestaurant] : [newRestaurant]));
        setShowNewModal(false);
        setNewRestaurantName("");
        setNewRestaurantImage(null);
        setNewRestaurantFile(null);
      }
    } catch {
      void 0;
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setNewRestaurantImage(url);
    setNewRestaurantFile(file);
  };

  // Save account settings
  // Connected backend endpoint: POST /api/account/update
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPwd || newPwd !== confirmPwd || newPwd.length < 6) return;

    try {
      const res = await fetch("/api/account/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPwd }),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const msg = await res.text();
        setErr(`Password update failed: ${res.status} ${msg}`);
        return;
      }

      setNewPwd("");
      setConfirmPwd("");
      setShowSettingsModal(false);
    } catch (e) {
      setErr(`Password update failed: ${String(e)}`);
    }
  };

  return (
    <div className="browse-root">
      <div className="toolbar">
        <button
          className="toolbar-icon-btn"
          onClick={() => setShowNewModal(true)}
          title="Add New Restaurant"
        >
          +
        </button>
        <input
          className="toolbar-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
        />
        <button
          className="toolbar-icon-btn"
          onClick={() => setShowSettingsModal(true)}
          title="Settings"
          style={{ fontSize: "28px" }}
        >
          ⚙
        </button>
      </div>

      {err && (
        <div className="status-error">
          Failed to load restaurants: {errMsg(err)}
        </div>
      )}
      {!err && list === null && <div className="status-muted">Loading…</div>}
      {!err && list?.length === 0 && (
        <div className="status-muted">No restaurants yet.</div>
      )}

      {filtered && filtered.length > 0 && (
        <div className="browse-grid">
          {filtered.map((r) => (
            <Link
              key={r.id}
              to="/profile"
              search={{ restaurantId: r.id }}
              className="link-reset"
            >
              <div className="restaurant-card">
                <div className="card-image-wrapper">
                  <button
                    className="card-remove-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveClick(r.id);
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div className="card-content">
                  <div className="card-title">{r.name}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showNewModal && (
        <div className="overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">New Restaurant</h2>
            <form onSubmit={handleNewRestaurant}>
              <label className="image-upload-area">
                {newRestaurantImage ? (
                  <img src={newRestaurantImage} alt="Restaurant preview" />
                ) : (
                  <div className="upload-icon">+</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>

              <div className="form-field">
                <label className="form-label">Restaurant Name:</label>
                <input
                  className="form-input"
                  value={newRestaurantName}
                  onChange={(e) => setNewRestaurantName(e.target.value)}
                  placeholder="Enter restaurant name"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Account Setting</h2>
            <form onSubmit={handleSaveSettings}>
              <div className="settings-form-grid">
                <div className="form-field">
                  <label className="form-label">New Password:</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="Enter your new password"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Confirm Password:</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Enter your new password again"
                  />
                  {newPwd && confirmPwd && newPwd !== confirmPwd && (
                    <div className="error-text">Passwords do not match.</div>
                  )}
                  {newPwd && newPwd.length > 0 && newPwd.length < 6 && (
                    <div className="error-text">
                      Password should be at least 6 characters.
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions modal-actions--split">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowSettingsModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    !newPwd || newPwd.length < 6 || newPwd !== confirmPwd
                  }
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRemoveConfirm && (
        <div className="overlay" onClick={() => setShowRemoveConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-text">
              Are you sure to remove this restaurant?
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowRemoveConfirm(false)}
              >
                No
              </button>
              <button className="btn-primary" onClick={handleConfirmRemove}>
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

export default Account;
