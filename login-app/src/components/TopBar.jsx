import OoredooLogo from "./OoredooLogo";
import { Bell, Search, Settings } from "lucide-react";

const OOREDOO = { red: "#ED1C24", redDark: "#B8141A" };

export default function TopBar({ user }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 260, right: 0, height: 64, background: `linear-gradient(135deg, ${OOREDOO.red} 0%, ${OOREDOO.redDark} 100%)`, display: "flex", alignItems: "center", padding: "0 32px", gap: 20, zIndex: 40, boxShadow: "0 4px 20px rgba(237,28,36,0.3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <OoredooLogo size={36} />
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px" }}>Planning</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <TopBarBtn icon={<Search size={18} />} />
        <TopBarBtn icon={<Bell size={18} />} hasBadge />
        <TopBarBtn icon={<Settings size={18} />} />
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: OOREDOO.red, marginLeft: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
          {user?.email?.[0]?.toUpperCase() || "U"}
        </div>
      </div>
    </div>
  );
}

function TopBarBtn({ icon, hasBadge }) {
  return (
    <button style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", fontFamily: "inherit" }}>
      {icon}
      {hasBadge && <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#FFB800", border: "2px solid " + OOREDOO.red }} />}
    </button>
  );
}
