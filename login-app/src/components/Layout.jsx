import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { Menu } from "lucide-react";

export default function Layout({ children, title, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F12", color: "#fff" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {!isMobile && <TopBar user={user} />}
      <main style={{ marginLeft: isMobile ? 0 : 260, paddingTop: isMobile ? 0 : 88, padding: isMobile ? "16px" : "16px 32px 32px", minHeight: "100vh", transition: "all 0.3s ease" }}>
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.08)", gap: 12 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: "rgba(237,28,36,0.15)", border: "1px solid #ED1C2444", color: "#ED1C24", borderRadius: 10, padding: 10, cursor: "pointer", display: "flex" }}>
              <Menu size={20} />
            </button>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, flex: 1 }}>{title}</h1>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #ED1C24, #B8141A)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        )}
        {!isMobile && (
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" }}>{title}</h1>
            <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{user?.email}</p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
