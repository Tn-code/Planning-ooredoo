import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Dashboard({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>📋 Planning Ooredoo</h1>
      <p>
        Bienvenue <strong>{user.email}</strong>
      </p>
      <p>UID: {user.uid}</p>
      <button
        onClick={handleLogout}
        style={{
          padding: "10px 20px",
          background: "#e30613",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginTop: "20px",
        }}
      >
        Se déconnecter
      </button>
    </div>
  );
}
