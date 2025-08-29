import { useRef, useState } from "react";

export default function ProfileModal({ close }: { close: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");

  return (
    <div
      className="bg_tint"
      onClick={(e) => {
        const el = ref.current;
        if (!el) return;
        if (e.nativeEvent.composedPath().includes(el)) return;
        close();
      }}
    >
      <div className="add_popover" ref={ref}>
        <h2 className="modal_title">Profile</h2>

        {/* Name */}
        <div className="form_group">
          <label className="field_label" htmlFor="pf-name">Name:</label>
          <input
            id="pf-name"
            className="field_input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Email */}
        <div className="form_group">
          <label className="field_label" htmlFor="pf-email">E-mail:</label>
          <input
            id="pf-email"
            className="field_input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Bio */}
        <div className="form_group">
          <label className="field_label" htmlFor="pf-bio">Short bio:</label>
          <textarea
            id="pf-bio"
            className="field_input field_textarea"
            placeholder="Short bio..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            id="create_button"
            onClick={() => {
              console.log({ name, email, bio });
              alert("Profile saved!");
              close();
            }}
          >
            Save Profile
          </button>
          <button className="secondary_button" type="button" onClick={close}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}