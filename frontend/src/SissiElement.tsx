import { useState } from "react";
import ProfileModal from "./ProfileModal"; 

export default function SissiElement() {
  const [openProfile, setOpenProfile] = useState(false);

  return (
    <div>
      <div className="card">
        <button
          className="create_button"
          onClick={() => setOpenProfile(true)}
        >
          Profile
        </button>
      </div>

      {openProfile && <ProfileModal close={() => setOpenProfile(false)} />}
    </div>
  );
}