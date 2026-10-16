import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import ExportBar from "../components/ExportBar";
import { loadEmployeesForPlanning } from "../utils/employees";
import { setForcedG1 } from "../utils/scheduler";
import { getWeekDays, SHIFTS, FORCED_G1 } from "../utils/scheduler";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Lock,
  AlertTriangle,
  Calendar,
  Plane,
  Trash2,
} from "lucide-react";

const OOREDOO = { red: "#ED1C24" };
const SHIFT_OPTIONS = [SHIFTS.G1, SHIFTS.G3, SHIFTS.REST, SHIFTS.CONGE];

export default function ManualPlanning({ user }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [newEmp, setNewEmp] = useState("");
  const [planning, setPlanning] = useState({});

  // 🆕 Congés : { "Nour": ["2025-11-16", "2025-11-17"] }
  const [conges, setConges] = useState({});

  // 🆕 Formulaire d'ajout de congé
  const [congeForm, setCongeForm] = useState({
    emp: "",
    startDate: "",
    endDate: "",
  });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + weekOffset * 7);
  const week = getWeekDays(startDate);

  // ============================================
  // GESTION EMPLOYÉS
  // ============================================
  const addEmployee = () => {
    if (newEmp.trim() && !employees.includes(newEmp.trim())) {
      setEmployees([...employees, newEmp.trim()]);
      setNewEmp("");
    }
  };

  const removeEmployee = (emp) => {
    if (FORCED_G1.includes(emp)) {
      if (!window.confirm(`⚠️ ${emp} est responsable. Retirer ?`)) return;
    }
    setEmployees(employees.filter((e) => e !== emp));
    const np = { ...planning };
    delete np[emp];
    setPlanning(np);
    // Nettoyer ses congés
    const nc = { ...conges };
    delete nc[emp];
    setConges(nc);
  };

  // ============================================
  // GESTION CONGÉS (identique à AutoPlanning)
  // ============================================
  const addConge = () => {
    const { emp, startDate: sd, endDate: ed } = congeForm;

    if (!emp || !sd || !ed) {
      alert("⚠️ Sélectionne un employé + date de début + date de fin");
      return;
    }

    if (new Date(sd) > new Date(ed)) {
      alert("⚠️ La date de début doit être avant la date de fin");
      return;
    }

    // Générer toutes les dates entre sd et ed
    const dates = [];
    const start = new Date(sd);
    const end = new Date(ed);
    const current = new Date(start);

    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    // Fusionner avec les congés existants
    setConges((c) => ({
      ...c,
      [emp]: [...new Set([...(c[emp] || []), ...dates])].sort(),
    }));

    // 📌 Auto-remplir le planning : marquer ces jours comme CONGE
    setPlanning((p) => {
      const newP = { ...p };
      if (!newP[emp]) newP[emp] = {};
      dates.forEach((d) => {
        newP[emp][d] = "CONGE";
      });
      return newP;
    });

    // Reset form
    setCongeForm({ emp: "", startDate: "", endDate: "" });
  };

  const removeCongeDate = (emp, date) => {
    setConges((c) => {
      const newDates = (c[emp] || []).filter((d) => d !== date);
      const newC = { ...c };
      if (newDates.length === 0) {
        delete newC[emp];
      } else {
        newC[emp] = newDates;
      }
      return newC;
    });

    // Retirer aussi du planning si c'était un CONGE
    setPlanning((p) => {
      if (p[emp]?.[date] === "CONGE") {
        const newP = { ...p, [emp]: { ...p[emp] } };
        delete newP[emp][date];
        return newP;
      }
      return p;
    });
  };

  const removeAllConges = (emp) => {
    const datesToRemove = conges[emp] || [];

    setConges((c) => {
      const newC = { ...c };
      delete newC[emp];
      return newC;
    });

    // Retirer tous les CONGE du planning
    setPlanning((p) => {
      const newP = { ...p, [emp]: { ...(p[emp] || {}) } };
      datesToRemove.forEach((d) => {
        if (newP[emp][d] === "CONGE") delete newP[emp][d];
      });
      return newP;
    });
  };

  const getCongeDaysCount = () => {
    return Object.values(conges).reduce((acc, arr) => acc + arr.length, 0);
  };

  // ============================================
  // GESTION PLANNING
  // ============================================
  // 🆕 Charger les employés depuis Firestore
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.uid) {
        console.log("⏳ En attente de user.uid...");
        return;
      }
      console.log("🔄 Chargement employés pour UID:", user.uid);
      setLoadingEmployees(true);
      try {
        const result = await loadEmployeesForPlanning(user.uid);
        console.log("📦 Résultat:", result);
        if (cancelled) return;
        if (result.success) {
          setEmployees(result.names || []);
          setForcedG1(result.responsables || []);
          console.log("✅ Employés chargés:", result.names.length);
        } else {
          console.error("❌ Erreur:", result.error);
          setEmployees([]);
        }
      } catch (err) {
        console.error("❌ Exception:", err);
        if (!cancelled) setEmployees([]);
      } finally {
        if (!cancelled) setLoadingEmployees(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const setShift = (emp, dateKey, shift) => {
    // Bloquer si jour de congé
    if (conges[emp]?.includes(dateKey) && shift !== "CONGE" && shift !== "") {
      const ok = window.confirm(
        `⚠️ ${emp} est en congé ce jour.\n\nModifier quand même ?`
      );
      if (!ok) return;
    }

    // Règle Marwa
    if (
      FORCED_G1.includes(emp) &&
      shift !== "" &&
      shift !== "G1" &&
      shift !== "REST" &&
      shift !== "CONGE"
    ) {
      const ok = window.confirm(
        `⚠️ ${emp} est responsable — doit être en G1.\n\nAutoriser ${shift} pour cette fois ?`
      );
      if (!ok) return;
    }

    setPlanning((p) => ({
      ...p,
      [emp]: { ...(p[emp] || {}), [dateKey]: shift },
    }));
  };

  const getViolations = (emp) => {
    if (!FORCED_G1.includes(emp) || !planning[emp]) return [];
    return week.filter((d) => {
      const s = planning[emp][d.date];
      return s && s !== "G1" && s !== "REST" && s !== "CONGE";
    });
  };

  return (
    <Layout title="Planning manuel" user={user}>
      {/* ⏳ Loading employés */}
      {loadingEmployees && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          Chargement des employés...
        </div>
      )}

      {/* 🚫 Aucun employé */}
      {!loadingEmployees && employees.length === 0 && (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "rgba(255,255,255,0.7)",
            background: "rgba(237,28,36,0.08)",
            border: "1px solid rgba(237,28,36,0.3)",
            borderRadius: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>
            Aucun employé trouvé
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
            Ajoute d'abord des employés dans la page{" "}
            <a
              href="/employees"
              style={{ color: "#ED1C24", fontWeight: 700 }}
            >
              Gestion des employés
            </a>
          </p>
        </div>
      )}
      {/* ═══════════════════════════════════════════ */}
      {/* HEADER                                       */}
      {/* ═══════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
          alignItems: "center",
        }}
      >
        <div style={weekNav}>
          <button onClick={() => setWeekOffset(weekOffset - 1)} style={navBtn}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ padding: "0 12px", fontSize: 14, fontWeight: 600 }}>
            {weekOffset === 0
              ? "Cette semaine"
              : `Semaine ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
          </span>
          <button onClick={() => setWeekOffset(weekOffset + 1)} style={navBtn}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <input
            value={newEmp}
            onChange={(e) => setNewEmp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEmployee()}
            placeholder="Nom employé..."
            style={inputStyle}
          />
          <button onClick={addEmployee} style={addBtn}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* CARTE GESTION CONGÉS                        */}
      {/* ═══════════════════════════════════════════ */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>
          <Plane size={18} color="#a855f7" />
          Gestion des congés
          {getCongeDaysCount() > 0 && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 10,
                background: "rgba(168,85,247,0.2)",
                color: "#a855f7",
                fontWeight: 700,
              }}
            >
              {getCongeDaysCount()} jour(s)
            </span>
          )}
        </h3>

        {/* Formulaire */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div>
            <label style={smallLabel}>Employé</label>
            <select
              value={congeForm.emp}
              onChange={(e) => setCongeForm({ ...congeForm, emp: e.target.value })}
              style={inputStyle}
            >
              <option value="">— Sélectionner —</option>
              {employees.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={smallLabel}>Date début</label>
            <input
              type="date"
              value={congeForm.startDate}
              onChange={(e) =>
                setCongeForm({ ...congeForm, startDate: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div>
            <label style={smallLabel}>Date fin</label>
            <input
              type="date"
              value={congeForm.endDate}
              onChange={(e) =>
                setCongeForm({ ...congeForm, endDate: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <button
            onClick={addConge}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #a855f7, #7e22ce)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "inherit",
              height: 42,
            }}
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          💡 Astuce : Pour un congé de plusieurs jours, choisis une plage (début → fin).
          Les cellules du planning seront automatiquement remplies avec "CONGÉ".
        </p>

        {/* Liste des congés */}
        {Object.keys(conges).length > 0 && (
          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Congés enregistrés</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(conges).map(([emp, dates]) => (
                <div
                  key={emp}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: "rgba(168,85,247,0.08)",
                    border: "1px solid rgba(168,85,247,0.3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#a855f7",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      <Plane size={14} />
                      {emp}
                      <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>
                        ({dates.length} jour{dates.length > 1 ? "s" : ""})
                      </span>
                    </div>
                    <button
                      onClick={() => removeAllConges(emp)}
                      style={deleteAllBtn}
                    >
                      <Trash2 size={12} />
                      Tout supprimer
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {dates.map((d) => (
                      <span key={d} style={dateChip}>
                        <Calendar size={10} />
                        {new Date(d).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })}
                        <button
                          onClick={() => removeCongeDate(emp, d)}
                          style={chipClose}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

            {/* 📤 Export Bar */}
      <ExportBar
        user={user}
        employees={employees}
        week={week}
        planning={planning}
        conges={conges}
        type="manual"
      />

{/* ═══════════════════════════════════════════ */}
      {/* LÉGENDE                                      */}
      {/* ═══════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          marginTop: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {SHIFT_OPTIONS.map((s) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: s.color,
              }}
            />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              {s.label} {s.start !== "-" && `(${s.start}–${s.end})`}
            </span>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: "auto",
            padding: "6px 12px",
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            borderRadius: 8,
          }}
        >
          <Lock size={12} color="#22c55e" />
          <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>
            {FORCED_G1.join(", ")} = G1 obligatoire
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* TABLEAU PLANNING                             */}
      {/* ═══════════════════════════════════════════ */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ background: "#1a1a1f" }}>
              <th style={thStyle}>Employé</th>
              {week.map((d) => (
                <th
                  key={d.date}
                  style={{
                    ...thStyle,
                    color: d.isSaturday ? OOREDOO.red : "#fff",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {d.dayName.slice(0, 3)}
                  </div>
                  <div style={{ fontSize: 14 }}>{d.date.slice(8, 10)}</div>
                </th>
              ))}
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const isResp = FORCED_G1.includes(emp);
              const violations = getViolations(emp);
              const hasViolation = violations.length > 0;
              const hasConge = conges[emp]?.length > 0;

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
                  <td style={{ ...tdStyle, fontWeight: 600, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {emp}
                      {isResp && (
                        <span style={badgeS1}>
                          <Lock size={8} />
                          G1
                        </span>
                      )}
                      {hasConge && (
                        <span style={badgeConge}>
                          <Plane size={8} />
                          {conges[emp].length}j
                        </span>
                      )}
                      {hasViolation && (
                        <span
                          title={`${violations.length} jour(s) non conforme(s)`}
                          style={badgeViolation}
                        >
                          <AlertTriangle size={8} />
                          {violations.length}
                        </span>
                      )}
                    </div>
                  </td>
                  {week.map((d) => {
                    const current = planning[emp]?.[d.date];
                    // 🆕 FORCER CONGE si la date est dans les congés
                    const isCongeDate = (conges[emp] || []).includes(d.date);
                    const displayCurrent = isCongeDate ? "CONGE" : current;
                    const shiftObj = SHIFT_OPTIONS.find((s) => s.id === displayCurrent);
                    const isViolation =
                      isResp &&
                      current &&
                      current !== "G1" &&
                      current !== "REST" &&
                      current !== "CONGE";
                    const isCongeDay = conges[emp]?.includes(d.date);

                    return (
                      <td key={d.date} style={tdStyle}>
                        <select
                          value={displayCurrent || ""}
                          onChange={(e) => setShift(emp, d.date, e.target.value)}
                          style={{
                            width: "100%",
                            padding: "8px 6px",
                            borderRadius: 8,
                            border: isViolation
                              ? `1px solid ${OOREDOO.red}`
                              : isCongeDay
                              ? `1px dashed #a855f7`
                              : "1px solid rgba(255,255,255,0.1)",
                            background: shiftObj
                              ? shiftObj.color + "33"
                              : "rgba(255,255,255,0.03)",
                            color: shiftObj
                              ? shiftObj.color
                              : "rgba(255,255,255,0.4)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            outline: "none",
                          }}
                        >
                          <option value="">—</option>
                          {SHIFT_OPTIONS.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                  <td style={tdStyle}>
                    <button onClick={() => removeEmployee(emp)} style={removeBtn}>
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ALERTES                                      */}
      {/* ═══════════════════════════════════════════ */}
      {employees.some((e) => getViolations(e).length > 0) && (
        <div style={alertStyle}>
          <AlertTriangle size={16} />
          <span>
            <strong>Attention :</strong> Certains responsables ont des shifts non
            conformes (G3 au lieu de G1).
          </span>
        </div>
      )}

      <p
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          marginTop: 16,
        }}
      >
        💡 Astuce : Les responsables (badge vert) doivent rester en G1. Les samedis sont
        en rouge. Les congés sont en violet pointillé.
      </p>
    </Layout>
  );
}

// ============================================
// STYLES
// ============================================
const cardStyle = {
  background: "linear-gradient(135deg, #1a1a1f 0%, #15151a 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 24,
  marginBottom: 24,
};
const sectionTitle = {
  margin: "0 0 16px",
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  gap: 8,
};
const weekNav = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#1a1a1f",
  borderRadius: 10,
  padding: 4,
};
const navBtn = {
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  padding: 8,
  borderRadius: 8,
  display: "flex",
};
const inputStyle = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#0f0f12",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};
const addBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg, #ED1C24, #B8141A)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "inherit",
};
const removeBtn = {
  background: "rgba(237,28,36,0.15)",
  border: "none",
  color: OOREDOO.red,
  borderRadius: 8,
  padding: 6,
  cursor: "pointer",
  display: "flex",
};
const deleteAllBtn = {
  background: "rgba(237,28,36,0.15)",
  border: "none",
  color: OOREDOO.red,
  borderRadius: 8,
  padding: "4px 8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  fontFamily: "inherit",
};
const dateChip = {
  padding: "4px 10px",
  borderRadius: 15,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.15)",
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#fff",
};
const chipClose = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.5)",
  cursor: "pointer",
  padding: 0,
  display: "flex",
};
const labelStyle = {
  fontSize: 13,
  color: "rgba(255,255,255,0.6)",
  display: "block",
  marginBottom: 10,
};
const smallLabel = {
  fontSize: 11,
  color: "rgba(255,255,255,0.5)",
  display: "block",
  marginBottom: 4,
  fontWeight: 600,
};
const badgeS1 = {
  fontSize: 9,
  padding: "2px 6px",
  borderRadius: 6,
  background: "rgba(34,197,94,0.15)",
  color: "#22c55e",
  fontWeight: 700,
  letterSpacing: "0.05em",
  border: "1px solid rgba(34,197,94,0.4)",
  display: "flex",
  alignItems: "center",
  gap: 3,
};
const badgeNoRest = { fontSize: 9, padding: "2px 6px", borderRadius: 6, background: "rgba(255,184,0,0.15)", color: "#FFB800", fontWeight: 700, border: "1px solid rgba(255,184,0,0.5)", display: "flex", alignItems: "center", gap: 3 };
const badgeConge = {
  fontSize: 9,
  padding: "2px 6px",
  borderRadius: 6,
  background: "rgba(168,85,247,0.15)",
  color: "#a855f7",
  fontWeight: 700,
  border: "1px solid rgba(168,85,247,0.4)",
  display: "flex",
  alignItems: "center",
  gap: 3,
};
const badgeViolation = {
  fontSize: 9,
  padding: "2px 6px",
  borderRadius: 6,
  background: "rgba(237,28,36,0.15)",
  color: OOREDOO.red,
  fontWeight: 700,
  border: "1px solid rgba(237,28,36,0.4)",
  display: "flex",
  alignItems: "center",
  gap: 3,
};
const alertStyle = {
  marginTop: 16,
  padding: 14,
  background: "rgba(237,28,36,0.1)",
  border: "1px solid rgba(237,28,36,0.4)",
  borderRadius: 10,
  fontSize: 13,
  color: OOREDOO.red,
  display: "flex",
  alignItems: "center",
  gap: 8,
};
const thStyle = {
  padding: "14px 10px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 600,
  color: "rgba(255,255,255,0.7)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const tdStyle = { padding: "10px", fontSize: 13 };
