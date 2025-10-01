import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import "../account-setting/index.css";

function AccountSetting() {
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const canSave = newPwd.trim().length >= 6 && newPwd === confirmPwd;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      setNewPwd("");
      setConfirmPwd("");
    } finally {
      setSaving(false);
    }
  }

  async function onConfirmDelete() {
    setShowDeleteConfirm(false);
  }

  return (
    <div className="acc-page setting-page">
      <div className="acc-shell">
        <aside className="acc-side">
          <nav className="acc-side-nav">
            <Link to="/account" className="acc-side-link">
              Account
            </Link>
            <Link to="/account-setting" className="acc-side-link acc-active">
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
            <div className="acc-section">
              <div className="acc-section-title">Change Password</div>
              <div className="acc-grid">
                <label className="acc-field">
                  <span>New Password:</span>
                  <input
                    type="password"
                    placeholder="Enter your new password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                  />
                </label>
                <label className="acc-field">
                  <span>Confirm Password:</span>
                  <input
                    type="password"
                    placeholder="Enter your new password again"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                  />
                </label>
              </div>
              {/* simple noti */}
              {newPwd && confirmPwd && newPwd !== confirmPwd && (
                <p style={{ color: "#b32121", marginTop: 8 }}>
                  Passwords do not match.
                </p>
              )}
              {newPwd && newPwd.length < 6 && (
                <p style={{ color: "#b32121", marginTop: 8 }}>
                  Password should be at least 6 characters.
                </p>
              )}
            </div>

            <div className="set-actions">
              <button
                type="button"
                className="acc-delete"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Restaurant
              </button>
              <button
                type="submit"
                className="acc-save"
                disabled={!canSave || saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </main>
      </div>

      {showDeleteConfirm && (
        <div className="acc-modal" role="dialog" aria-modal>
          <div className="acc-modal-card">
            <div className="acc-modal-title">
              Are you sure to delete the Restaurant?
            </div>
            <p className="acc-modal-desc">
              Once deleted, your Restaurant and all related records will be
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

export const Route = createFileRoute("/account-setting/")({
  component: AccountSetting,
});
export default AccountSetting;
