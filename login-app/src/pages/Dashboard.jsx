import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { CalendarPlus, Wand2, Users, TrendingUp } from "lucide-react";

const OOREDOO = { red: "#ED1C24" };

export default function Dashboard({ user }) {
  const navigate = useNavigate();

  const cards = [
    {
      icon: <CalendarPlus size={28} />,
      title: "Planning manuel",
      desc: "Créer un planning jour par jour à la main",
      color: "#3b82f6",
      onClick: () => navigate("/planning/manual"),
    },
    {
      icon: <Wand2 size={28} />,
      title: "Planning automatique",
      desc: "Générer un planning optimisé en 1 clic",
      color: OOREDOO.red,
      onClick: () => navigate("/planning/auto"),
    },
    {
      icon: <Users size={28} />,
      title: "Employés",
      desc: "Gérer la liste de vos collaborateurs",
      color: "#22c55e",
      onClick: () => {},
    },
    {
      icon: <TrendingUp size={28} />,
      title: "Statistiques",
      desc: "Voir la répartition des shifts",
      color: "#FFB800",
      onClick: () => {},
    },
  ];

  return (
    <Layout title="Tableau de bord" user={user}>
      {/* 🎨 Bandeau Ooredoo */}
      <div
        style={{
          background: "linear-gradient(135deg, #ED1C24 0%, #B8141A 100%)",
          padding: "24px 28px",
          borderRadius: 20,
          marginBottom: 28,
          boxShadow: "0 12px 40px rgba(237, 28, 36, 0.4)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Cercles décoratifs */}
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.08)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: 100,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.05)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            }}
          >
            <svg width="34" height="34" viewBox="0 0 22 22" fill="none">
              <circle cx="6.5" cy="6.5" r="3" fill="#ED1C24" />
              <circle cx="15.5" cy="6.5" r="3" fill="#ED1C24" />
              <circle cx="6.5" cy="15.5" r="3" fill="#ED1C24" />
              <circle cx="15.5" cy="15.5" r="3" fill="#ED1C24" />
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.5px",
              }}
            >
              Bienvenue sur Planning Ooredoo 👋
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 14,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              Gérez les plannings et les équipes en toute simplicité
            </p>
          </div>

          <div
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 12px #22c55e",
              }}
            />
            Système actif
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            onClick={c.onClick}
            style={{
              background: "linear-gradient(135deg, #1a1a1f 0%, #15151a 100%)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: 24,
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: `${c.color}22`,
                color: c.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {c.icon}
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 17 }}>{c.title}</h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              {c.desc}
            </p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
