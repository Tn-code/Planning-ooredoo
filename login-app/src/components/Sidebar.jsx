import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import {
  LayoutDashboard,
  CalendarPlus,
  Wand2,
  History as HistoryIcon,
  Users,
  LogOut,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const OOREDOO = { red: "#ED1C24", redDark: "#B8141A" };

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Tableau de bord" },
    { to: "/planning/manual", icon: <CalendarPlus size={20} />, label: "Planning manuel" },
    { to: "/planning/auto", icon: <Wand2 size={20} />, label: "Planning auto" },
    { to: "/history", icon: <HistoryIcon size={20} />, label: "Historique" },
    { to: "/employees", icon: <Users size={20} />, label: "Employés" },
  ];

  return (
    <>
      {/* Overlay mobile */}
      {isMobile && open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 90,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 260,
          height: "100vh",
          background: "linear-gradient(180deg, #1a1a1f 0%, #0f0f12 100%)",
          borderRight: "1px solid rgba(237,28,36,0.2)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
          transform: isMobile
            ? open
              ? "translateX(0)"
              : "translateX(-100%)"
            : "translateX(0)",
          transition: "transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
          overflowY: "auto",
        }}
      >
        {/* Header logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 8px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${OOREDOO.red}, ${OOREDOO.redDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 8px 20px ${OOREDOO.red}66`,
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22">
              <circle cx="6.5" cy="6.5" r="3" fill="#fff" />
              <circle cx="15.5" cy="6.5" r="3" fill="#fff" />
              <circle cx="6.5" cy="15.5" r="3" fill="#fff" />
              <circle cx="15.5" cy="15.5" r="3" fill="#fff" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Ooredoo</div>
            <div
              style={{
                color: OOREDOO.red,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.15em",
              }}
            >
              PLANNING
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                color: "#fff",
                borderRadius: 8,
                padding: 6,
                cursor: "pointer",
                display: "flex",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={isMobile ? onClose : undefined}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 10,
                color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
                background: isActive
                  ? `linear-gradient(90deg, ${OOREDOO.red}33, transparent)`
                  : "transparent",
                borderLeft: isActive
                  ? `3px solid ${OOREDOO.red}`
                  : "3px solid transparent",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                transition: "all 0.2s",
              })}
            >
              {l.icon}
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(237,28,36,0.1)",
            border: `1px solid ${OOREDOO.red}44`,
            color: OOREDOO.red,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "inherit",
            transition: "all 0.2s",
            marginTop: 12,
          }}
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </aside>
    </>
  );
}
