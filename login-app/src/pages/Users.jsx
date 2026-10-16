import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { listUsers, updateUserRole, ROLES, ROLE_INFO } from "../utils/roles";
import {
  Users as UsersIcon,
  Search,
  Shield,
  Crown,
  User,
  Loader,
  Inbox,
  Check,
  ChevronDown,
} from "lucide-react";

const OOREDOO = { red: "#ED1C24" };

export default function Users({ user }) {
  const { role: myRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [updating, setUpdating] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  // 🔒 Vérifier que c'est un admin
  if (myRole !== ROLES.ADMIN) {
    return (
      <Layout title="Utilisateurs" user={user}>
        <div style={emptyState}>
          <Shield size={48} color={OOREDOO.red} />
          <h3 style={{ margin: "16px 0 8px", fontSize: 18 }}>
            Accès refusé
          </h3>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
            Seuls les administrateurs peuvent gérer les utilisateurs.
          </p>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await listUsers();
    if (result.success) {
      setUsers(result.data);
    }
    setLoading(false);
  };

  const handleChangeRole = async (userId, newRole) => {
    if (userId === user.uid) {
      if (!window.confirm("⚠️ Tu vas changer ton propre rôle. Continuer ?")) {
        return;
      }
    }

    setUpdating(userId);
    const result = await updateUserRole(userId, newRole);
    setUpdating(null);
    setOpenDropdown(null);

    if (result.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } else {
      alert("❌ Erreur : " + result.error);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      search === "" ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === ROLES.ADMIN).length,
    managers: users.filter((u) => u.role === ROLES.MANAGER).length,
    employees: users.filter((u) => u.role === ROLES.EMPLOYEE).length,
  };

  return (
    <Layout title="Gestion des utilisateurs" user={user}>
      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<UsersIcon size={20} />}
          label="Total"
          value={stats.total}
          color="#fff"
        />
        <StatCard
          icon={<Crown size={20} />}
          label="Admins"
          value={stats.admins}
          color="#FFB800"
        />
        <StatCard
          icon={<Shield size={20} />}
          label="Managers"
          value={stats.managers}
          color="#3B82F6"
        />
        <StatCard
          icon={<User size={20} />}
          label="Employés"
          value={stats.employees}
          color="#22C55E"
        />
      </div>

      {/* Filtres */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <div style={searchBox}>
          <Search size={16} color="rgba(255,255,255,0.5)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            style={searchInput}
          />
        </div>

        <div style={filterGroup}>
          {[
            { id: "all", label: "Tous" },
            { id: ROLES.ADMIN, label: "Admins" },
            { id: ROLES.MANAGER, label: "Managers" },
            { id: ROLES.EMPLOYEE, label: "Employés" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterRole(f.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: filterRole === f.id ? OOREDOO.red : "transparent",
                color:
                  filterRole === f.id ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div
          style={{
            marginLeft: "auto",
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            fontWeight: 600,
          }}
        >
          {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Liste */}
      {loading && (
        <div style={emptyState}>
          <Loader size={32} color={OOREDOO.red} />
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={emptyState}>
          <Inbox size={48} color="rgba(255,255,255,0.2)" />
          <h3 style={{ margin: "16px 0 8px", fontSize: 18 }}>
            Aucun utilisateur
          </h3>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((u) => {
            const roleInfo = ROLE_INFO[u.role] || ROLE_INFO.employee;
            const isMe = u.id === user.uid;

            return (
              <div
                key={u.id}
                style={{
                  background: isMe
                    ? `linear-gradient(135deg, ${OOREDOO.red}11, ${OOREDOO.red}05)`
                    : "linear-gradient(135deg, #1a1a1f 0%, #15151a 100%)",
                  border: isMe
                    ? `1px solid ${OOREDOO.red}44`
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 14,
                  padding: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${OOREDOO.red}, #B8141A)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 18,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {(u.email || u.name || "?")[0].toUpperCase()}
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {u.name || u.email?.split("@")[0] || "Utilisateur"}
                    </span>
                    {isMe && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: `${OOREDOO.red}22`,
                          color: OOREDOO.red,
                          fontWeight: 700,
                          border: `1px solid ${OOREDOO.red}55`,
                        }}
                      >
                        MOI
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {u.email}
                  </div>
                </div>

                {/* Rôle actuel */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 12,
                    background: `${roleInfo.color}15`,
                    border: `1px solid ${roleInfo.color}44`,
                    color: roleInfo.color,
                    fontSize: 12,
                    fontWeight: 700,
                    minWidth: 140,
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{roleInfo.icon}</span>
                  {roleInfo.label}
                </div>

                {/* Bouton changer */}
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === u.id ? null : u.id
                      )
                    }
                    disabled={updating === u.id}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.05)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "inherit",
                    }}
                  >
                    {updating === u.id ? (
                      <Loader size={14} />
                    ) : (
                      <>
                        Changer
                        <ChevronDown size={14} />
                      </>
                    )}
                  </button>

                  {/* Dropdown */}
                  {openDropdown === u.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        background: "#1a1a1f",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                        padding: 6,
                        minWidth: 200,
                        zIndex: 100,
                        boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
                      }}
                    >
                      {Object.values(ROLES).map((r) => {
                        const info = ROLE_INFO[r];
                        const isCurrent = u.role === r;
                        return (
                          <button
                            key={r}
                            onClick={() => handleChangeRole(u.id, r)}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 8,
                              border: "none",
                              background: isCurrent
                                ? `${info.color}15`
                                : "transparent",
                              color: isCurrent ? info.color : "#fff",
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              fontFamily: "inherit",
                              textAlign: "left",
                            }}
                          >
                            <span style={{ fontSize: 18 }}>{info.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700 }}>
                                {info.label}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "rgba(255,255,255,0.5)",
                                  fontWeight: 400,
                                  marginTop: 2,
                                }}
                              >
                                {info.description}
                              </div>
                            </div>
                            {isCurrent && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.3)",
          fontSize: 13,
          color: "rgba(255,255,255,0.7)",
          lineHeight: 1.7,
        }}
      >
        <strong style={{ color: "#3B82F6" }}>ℹ️ À propos des rôles :</strong>
        <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
          <li><strong>👑 Admin</strong> : Accès total à toutes les fonctionnalités</li>
          <li><strong>🎯 Manager</strong> : Gestion des plannings et de l'équipe</li>
          <li><strong>👤 Employé</strong> : Voit uniquement son propre planning</li>
        </ul>
        <p style={{ margin: "8px 0 0", fontSize: 12 }}>
          ⚠️ Le premier utilisateur inscrit devient automatiquement Administrateur.
        </p>
      </div>
    </Layout>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1a1a1f 0%, #15151a 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}22`,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.5)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </div>
        <div
          style={{ fontSize: 22, fontWeight: 800, color, marginTop: 2 }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  borderRadius: 10,
  background: "#1a1a1f",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 260,
  flex: "0 1 320px",
};
const searchInput = {
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
};
const filterGroup = {
  display: "flex",
  gap: 4,
  background: "#1a1a1f",
  borderRadius: 10,
  padding: 4,
};
const emptyState = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "60px 20px",
  textAlign: "center",
  color: "#fff",
};
