import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
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
    <div style={{ minHeight: "100vh", background: "#0f0f12", color: "#fff" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main
        style={{
          marginLeft: isMobile ? 0 : 260,
          padding: isMobile ? "16px" : "24px 32px",
          minHeight: "100vh",
          transition: "margin-left 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: isMobile ? 20 : 32,
            paddingBottom: isMobile ? 14 : 20,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            {/* Menu burger mobile */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: "rgba(237,28,36,0.15)",
                  border: `1px solid ${"#ED1C24"}44`,
                  color: "#ED1C24",
                  borderRadius: 10,
                  padding: 10,
                  cursor: "pointer",
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                <Menu size={20} />
              </button>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? 18 : 24,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </h1>
              <p
                style={{
                  margin: "4px 0 0",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: isMobile ? 11 : 13,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.email}
              </p>
            </div>
          </div>
          <div
            style={{
              width: isMobile ? 36 : 44,
              height: isMobile ? 36 : 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ED1C24, #B8141A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: isMobile ? 14 : 16,
              flexShrink: 0,
            }}
          >
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
