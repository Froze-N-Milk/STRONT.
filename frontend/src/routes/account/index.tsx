import { createFileRoute } from "@tanstack/react-router";
import "./index.css";
import { useState } from "react";

function Account() {
  const [tags, setTags] = useState(["italian", "fast food"]);
  const [newTag, setNewTag] = useState("");
  const [bio, setBio] = useState(
    "Welcome to BIG JOE'S PIZZA! We serve authentic Italian cuisine with a modern twist.",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    setSaveMessage("");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaveMessage("✅ Profile saved successfully!");
    setTimeout(() => setSaveMessage(""), 3000);
    setIsSaving(false);
  };

  return (
    <div className="acc-page App">
      <div className="main-container">
        <div className="sidebar">
          <button className="nav-btn active">Edit Profile</button>
        </div>

        <div className="content">
          <div className="profile-content">
            <h2>Edit Restaurant Profile</h2>

            <div className="form-section">
              <label>Tags:</label>
              <div className="tags-container">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="remove-tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="add-tag-section">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="tag-input"
                />
                <button onClick={addTag} className="add-tag-btn">
                  ✓
                </button>
              </div>
            </div>

            <div className="form-section">
              <label>Restaurant Description</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter restaurant description..."
                className="bio-textarea"
                rows={6}
              />
            </div>

          <div className="save-section">
            <button
              className={`submit_button ${isSaving ? 'saving' : ''}`}
              onClick={saveProfile}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            {saveMessage && <div className="save-message">{saveMessage}</div>}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

export const Route = createFileRoute("/account/")({
  component: Account,
});
