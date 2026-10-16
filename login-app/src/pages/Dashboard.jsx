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
