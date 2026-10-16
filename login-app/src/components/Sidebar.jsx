import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  CalendarPlus,
  Wand2,
  History as HistoryIcon,
  LogOut,
  X,
  Users as UsersIcon,
} from "lucide-react";
import OoredooLogo from "./OoredooLogo";
import { useAuth } from "../hooks/useAuth";
import { ROLES } from "../utils/roles";

const OOREDOO = { red: "#ED1C24", redDark: "#B8141A" };

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { role } = useAuth();
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
    ...(role === ROLES.ADMIN
      ? [{ to: "/users", icon: <UsersIcon size={20} />, label: "Utilisateurs" }]
      : []),
    { to: "/planning/manual", icon: <CalendarPlus size={20} />, label: "Planning manuel" },
    { to: "/planning/auto", icon: <Wand2 size={20} />, label: "Planning auto" },
    { to: "/history", icon: <HistoryIcon size={20} />, label: "Historique" },
    { to: "/employees", icon: <UsersIcon size={20} />, label: "Employés" },
  ];

  return (
    <>
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
          background: "linear-gradient(180deg, #1A1A1F 0%, #0F0F12 100%)",
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
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 8px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 20,
          }}
        >
          <OoredooLogo size={40} showText={true} />
          {isMobile && (
            <button
              onClick={onClose}
              style={{
                marginLeft: "auto",
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

        {/* Logout */}
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
