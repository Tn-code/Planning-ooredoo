import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { listPlannings, deletePlanning } from "../utils/firestore";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Trash2,
  FileDown,
  FileSpreadsheet,
  Search,
  Loader,
  Inbox,
  Clock,
  CheckCircle2,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  Plane,
  Lock,
  RotateCcw,
  X,
} from "lucide-react";
import { exportPDF, exportExcel } from "../utils/exporters";
import { getWeekDays, SHIFTS, FORCED_G1, getMondayISO } from "../utils/scheduler";

const OOREDOO = { red: "#ED1C24" };

export default function History({ user }) {
  const [plannings, setPlannings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null); // ID du planning ouvert en détail
  const [selectedPlanning, setSelectedPlanning] = useState(null); // Pour la modal
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!user?.uid) return;
    setLoading(true);
    const result = await listPlannings(user.uid);
    if (result.success) {
      setPlannings(result.data);
    }
    setLoading(false);
  };

  const handleDelete = async (weekStart) => {
    if (
      !window.confirm(
        `⚠️ Supprimer le planning de la semaine du ${formatDate(weekStart)} ?`
      )
    )
      return;
    setActionLoading(weekStart);
    const result = await deletePlanning(user.uid, weekStart);
    setActionLoading(null);
    if (result.success) {
      setPlannings((p) => p.filter((x) => x.weekStart !== weekStart));
      if (expandedId === weekStart) setExpandedId(null);
    } else {
      alert("❌ Erreur : " + result.error);
    }
  };

  const handleExportPDF = async (planning) => {
    setActionLoading(planning.weekStart + "_pdf");
    const week = getWeekDays(new Date(planning.weekStart));
    exportPDF(planning.employees, week, planning.planning, planning.conges || {});
    setActionLoading(null);
  };

  const handleExportExcel = async (planning) => {
    setActionLoading(planning.weekStart + "_excel");
    const week = getWeekDays(new Date(planning.weekStart));
    exportExcel(planning.employees, week, planning.planning, planning.conges || {});
    setActionLoading(null);
  };

  const handleRestore = (planning) => {
    // Sauvegarder dans localStorage pour la page de destination
    localStorage.setItem(
      "restore_planning",
      JSON.stringify({
        weekStart: planning.weekStart,
        employees: planning.employees,
        planning: planning.planning,
        conges: planning.conges || {},
        type: planning.type,
      })
    );
    // Naviguer vers la bonne page
    navigate(planning.type === "auto" ? "/planning/auto?restore=1" : "/planning/manual?restore=1");
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const filtered = plannings.filter((p) => {
    const matchSearch =
      search === "" ||
      p.weekStart.includes(search) ||
      (p.employees || []).some((e) =>
        e.toLowerCase().includes(search.toLowerCase())
      );
    const matchType = filterType === "all" || p.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <Layout title="Historique des plannings" user={user}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <div style={searchBox}>
          <Search size={16} color="rgba(255,255,255,0.5)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par date ou employé..."
            style={searchInput}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#1a1a1f",
            borderRadius: 10,
            padding: 4,
          }}
        >
          {[
            { id: "all", label: "Tous" },
            { id: "auto", label: "Auto" },
            { id: "manual", label: "Manuel" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: filterType === f.id ? OOREDOO.red : "transparent",
                color: filterType === f.id ? "#fff" : "rgba(255,255,255,0.6)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
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
          {filtered.length} planning{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={emptyState}>
          <Loader size={32} color={OOREDOO.red} />
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={emptyState}>
          <Inbox size={48} color="rgba(255,255,255,0.2)" />
          <h3 style={{ margin: "16px 0 8px", fontSize: 18 }}>
            {search || filterType !== "all"
              ? "Aucun résultat"
              : "Aucun planning sauvegardé"}
          </h3>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: 14 }}>
            {search || filterType !== "all"
              ? "Essaie de modifier ta recherche ou tes filtres."
              : "Génère un planning et clique sur Sauvegarder pour le voir ici."}
          </p>
        </div>
      )}

      {/* Liste */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map((p) => {
            const stats = computeStats(p.planning);
            const totalConge = Object.values(p.conges || {}).reduce(
              (acc, arr) => acc + arr.length,
              0
            );
            const isExpanded = expandedId === p.weekStart;

            return (
              <div key={p.id} style={card}>
                {/* Header compact */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flex: 1,
                      minWidth: 200,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: `linear-gradient(135deg, ${OOREDOO.red}, #B8141A)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Calendar size={20} color="#fff" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#fff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        Semaine du {formatDate(p.weekStart)}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.4)",
                          display: "flex",
                          gap: 12,
                          marginTop: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>👥 {p.employees?.length || 0} employés</span>
                        <span>⏰ {formatTime(p.updatedAt)}</span>
                        {totalConge > 0 && (
                          <span style={{ color: "#a855f7" }}>
                            🛫 {totalConge}j congés
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      padding: "4px 10px",
                      borderRadius: 12,
                      background:
                        p.type === "auto"
                          ? "rgba(237,28,36,0.15)"
                          : "rgba(59,130,246,0.15)",
                      color: p.type === "auto" ? OOREDOO.red : "#3b82f6",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      border:
                        p.type === "auto"
                          ? `1px solid ${OOREDOO.red}55`
                          : "1px solid #3b82f655",
                    }}
                  >
                    {p.type === "auto" ? "Auto" : "Manuel"}
                  </span>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : p.weekStart)}
                      style={smallBtn("#22c55e")}
                      title={isExpanded ? "Réduire" : "Voir le détail"}
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <Eye size={12} />}
                      {isExpanded ? "Réduire" : "Voir"}
                    </button>
                    <button
                      onClick={() => handleExportPDF(p)}
                      disabled={actionLoading === p.weekStart + "_pdf"}
                      style={smallBtn("#ED1C24")}
                      title="Export PDF"
                    >
                      {actionLoading === p.weekStart + "_pdf" ? (
                        <Loader size={12} />
                      ) : (
                        <FileDown size={12} />
                      )}
                      PDF
                    </button>
                    <button
                      onClick={() => handleExportExcel(p)}
                      disabled={actionLoading === p.weekStart + "_excel"}
                      style={smallBtn("#1d6f42")}
                      title="Export Excel"
                    >
                      {actionLoading === p.weekStart + "_excel" ? (
                        <Loader size={12} />
                      ) : (
                        <FileSpreadsheet size={12} />
                      )}
                      Excel
                    </button>
                    <button
                      onClick={() => handleDelete(p.weekStart)}
                      disabled={actionLoading === p.weekStart}
                      style={smallBtn("#ED1C24")}
                      title="Supprimer"
                    >
                      {actionLoading === p.weekStart ? (
                        <Loader size={12} />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Détail (si étendu) */}
                {isExpanded && (
                  <PlanningDetail
                    planning={p}
                    onRestore={() => handleRestore(p)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}

// ═══════════════════════════════════════════════
// DÉTAIL DU PLANNING (tableau complet)
// ═══════════════════════════════════════════════
function PlanningDetail({ planning, onRestore }) {
  const employees = planning.employees || [];
  const plan = planning.planning || {};
  const conges = planning.conges || {};

  // 🆕 Utiliser les dates RÉELLES présentes dans le planning sauvegardé
  const allDates = new Set();
  Object.values(plan).forEach((empPlanning) => {
    Object.keys(empPlanning || {}).forEach((date) => allDates.add(date));
  });
  Object.values(conges).forEach((dates) => {
    dates.forEach((d) => allDates.add(d));
  });

  const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const week = Array.from(allDates)
    .sort()
    .map((dateStr) => {
      const d = new Date(dateStr + "T12:00:00");
      return {
        date: dateStr,
        dayName: DAYS_FR[d.getDay()],
        dayIndex: d.getDay(),
        isSaturday: d.getDay() === 6,
        isSunday: d.getDay() === 0,
        dateObj: d,
      };
    });

  const mondayISO = getMondayISO(new Date(planning.weekStart));
  const fallbackWeek = getWeekDays(new Date(mondayISO + "T12:00:00"));
  const displayWeek = week.length > 0 ? week : fallbackWeek;

  console.log("📅 Planning Detail:", {
    weekStart: planning.weekStart,
    datesFound: week.length,
    usedWeek: displayWeek.map((d) => d.date),
    employees,
    samplePlanning: plan[employees[0]],
  });

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 14,
          gap: 8,
        }}
      >
        <button onClick={onRestore} style={restoreBtn}>
          <RotateCcw size={14} />
          Restaurer ce planning
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        {[SHIFTS.G1, SHIFTS.G3, SHIFTS.REST, SHIFTS.CONGE].map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: s.color,
              }}
            />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
              {s.label} {s.start !== "-" && `(${s.start}–${s.end})`}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          overflowX: "auto",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "#15151a",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: "#1a1a1f" }}>
              <th style={thStyle}>Employé</th>
              {displayWeek.map((d) => (
                <th
                  key={d.date}
                  style={{
                    ...thStyle,
                    color: d.isSaturday || d.isSunday ? OOREDOO.red : "#fff",
                    background:
                      d.isSaturday || d.isSunday
                        ? "rgba(237,28,36,0.08)"
                        : "transparent",
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.6 }}>
                    {d.dayName.slice(0, 3)}
                  </div>
                  <div style={{ fontSize: 13 }}>{d.date.slice(8, 10)}</div>
                </th>
              ))}
              <th style={thStyle}>Stats</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const stats = Object.values(plan[emp] || {}).reduce(
                (acc, s) => {
                  if (s === "G1") acc.G1++;
                  if (s === "G3") acc.G3++;
                  if (s === "REST") acc.REST++;
                  if (s === "CONGE") acc.CONGE++;
                  return acc;
                },
                { G1: 0, G3: 0, REST: 0, CONGE: 0 }
              );
              const isResp = FORCED_G1.includes(emp);
              const hasConge = (conges[emp] || []).length > 0;

              return (
                <tr
                  key={emp}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    background: isResp
                      ? "rgba(34,197,94,0.04)"
                      : hasConge
                      ? "rgba(168,85,247,0.03)"
                      : "transparent",
                  }}
                >
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {emp}
                      {isResp && (
                        <span style={badge("#22c55e")}>
                          <Lock size={8} />
                          G1 FIXE
                        </span>
                      )}
                      {hasConge && (
                        <span style={badge("#a855f7")}>
                          <Plane size={8} />
                          {conges[emp].length}j
                        </span>
                      )}
                    </div>
                  </td>
                  {displayWeek.map((d) => {
                    const s = plan[emp]?.[d.date];
                    const isCongeDate = (conges[emp] || []).includes(d.date);
                    const displayShift = isCongeDate ? "CONGE" : s;
                    const shift = SHIFTS[displayShift];
                    const isLockedG1 = isResp && displayShift === "G1";

                    return (
                      <td key={d.date} style={tdStyle}>
                        <div
                          style={{
                            padding: "6px 4px",
                            borderRadius: 8,
                            background: shift ? shift.color + "22" : "transparent",
                            color: shift?.color || "#666",
                            fontSize: 11,
                            fontWeight: 700,
                            textAlign: "center",
                            border: isCongeDate
                              ? "1px dashed #a855f7"
                              : shift
                              ? `1px solid ${shift.color}55`
                              : "none",
                            position: "relative",
                          }}
                        >
                          {displayShift === "G1"
                            ? "G1"
                            : displayShift === "G3"
                            ? "G3"
                            : displayShift === "REST"
                            ? "REPOS"
                            : displayShift === "CONGE"
                            ? "CONGÉ"
                            : "—"}
                          {isLockedG1 && (
                            <Lock
                              size={7}
                              style={{
                                position: "absolute",
                                top: 1,
                                right: 1,
                                opacity: 0.6,
                              }}
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td style={tdStyle}>
                    <div
                      style={{
                        display: "flex",
                        gap: 5,
                        fontSize: 10,
                        fontWeight: 600,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ color: "#22c55e" }}>G1:{stats.G1}</span>
                      <span style={{ color: "#3b82f6" }}>G3:{stats.G3}</span>
                      <span style={{ color: "#FFB800" }}>R:{stats.REST}</span>
                      {stats.CONGE > 0 && (
                        <span style={{ color: "#a855f7" }}>C:{stats.CONGE}</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {Object.keys(conges).length > 0 && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            background: "rgba(168,85,247,0.08)",
            border: "1px solid rgba(168,85,247,0.3)",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#a855f7",
              fontWeight: 700,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Plane size={12} />
            Congés enregistrés
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(conges).map(([emp, dates]) => (
              <div
                key={emp}
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.7)",
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <strong style={{ color: "#a855f7" }}>{emp} :</strong>
                <span>
                  {dates
                    .map((d) =>
                      new Date(d).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                      })
                    )
                    .join(" • ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// Utils
function computeStats(plan) {
  const stats = { G1: 0, G3: 0, REST: 0, CONGE: 0 };
  Object.values(plan || {}).forEach((week) => {
    Object.values(week).forEach((s) => {
      if (stats[s] !== undefined) stats[s]++;
    });
  });
  return stats;
}

// Styles
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

const emptyState = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "80px 20px",
  textAlign: "center",
  color: "#fff",
};

const card = {
  background: "linear-gradient(135deg, #1a1a1f 0%, #15151a 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 20,
  transition: "all 0.2s",
};

const smallBtn = (color) => ({
  padding: "6px 12px",
  borderRadius: 8,
  border: `1px solid ${color}55`,
  background: `${color}15`,
  color: color,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontFamily: "inherit",
});

const restoreBtn = {
  padding: "8px 16px",
  borderRadius: 10,
  border: `1px solid #22c55e55`,
  background: "rgba(34,197,94,0.15)",
  color: "#22c55e",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "inherit",
};

const badge = (color) => ({
  fontSize: 9,
  padding: "2px 6px",
  borderRadius: 6,
  background: `${color}22`,
  color: color,
  fontWeight: 700,
  border: `1px solid ${color}55`,
  display: "flex",
  alignItems: "center",
  gap: 3,
});

const thStyle = {
  padding: "10px 8px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  color: "rgba(255,255,255,0.7)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle = { padding: "8px 6px", fontSize: 12 };
