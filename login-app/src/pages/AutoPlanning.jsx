import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { loadEmployeesForPlanning } from "../utils/employees";
import { saveHistory, loadHistory, resetHistory } from "../utils/firestore";
import { setForcedG1 } from "../utils/scheduler";
import ExportBar from "../components/ExportBar";
import { generatePlanning, getWeekDays, SHIFTS, FORCED_G1, extractHistory, getWeekNumber } from "../utils/scheduler";
import {
  Wand2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Lock,
  Calendar,
  Plus,
  Trash2,
  X,
  Plane,
} from "lucide-react";

const OOREDOO = { red: "#ED1C24" };

export default function AutoPlanning({ user }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [history, setHistory] = useState({});
  const [newEmp, setNewEmp] = useState("");
  const [planning, setPlanning] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🆕 Congés : { "Nour": ["2025-11-16", "2025-11-17"], "RAHMA": ["2025-11-20"] }
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
    // Nettoyer ses congés
    const newConges = { ...conges };
    delete newConges[emp];
    setConges(newConges);
  };

  // ============================================
  // GESTION CONGÉS
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
  };

  const removeAllConges = (emp) => {
    setConges((c) => {
      const newC = { ...c };
      delete newC[emp];
      return newC;
    });
  };

  const getCongeDaysCount = () => {
    return Object.values(conges).reduce((acc, arr) => acc + arr.length, 0);
  };

  // ============================================
  // GÉNÉRATION
  // ============================================
  // 🆕 Charger les employés depuis Firestore
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.uid) {
        console.log("⏳ En attente de user.uid...");
        return;
      }
      console.log("🔄 Chargement employés + historique pour UID:", user.uid);
      setLoadingEmployees(true);
      try {
        const empResult = await loadEmployeesForPlanning(user.uid);
        if (cancelled) return;
        if (empResult.success) {
          setEmployees(empResult.names || []);
          setForcedG1(empResult.responsables || []);
          console.log("✅ Employés chargés:", empResult.names.length);
        }

        const histResult = await loadHistory(user.uid);
        if (cancelled) return;
        if (histResult.success) {
          setHistory(histResult.history || {});
          console.log("📚 Historique chargé depuis Firestore");
        } else {
          setHistory({});
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

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const histResult = await loadHistory(user.uid);
      const savedHistory = histResult.success ? histResult.history : {};
      console.log("📚 Historique utilisé:", savedHistory);
      console.log("🛫 Congés:", conges);

      setTimeout(async () => {
        const result = generatePlanning(employees, startDate, {
          conges,
          history: savedHistory,
        });
        setPlanning(result);

        const newHistory = extractHistory(result, employees, week);
        const mergedHistory = { ...savedHistory };
        Object.keys(newHistory).forEach((emp) => {
          mergedHistory[emp] = newHistory[emp];
        });

        const saveResult = await saveHistory(user.uid, mergedHistory);
        if (saveResult.success) {
          console.log("💾 Historique sauvegardé dans Firestore");
          setHistory(mergedHistory);
        } else {
          console.error("❌ Erreur sauvegarde:", saveResult.error);
        }

        setLoading(false);
      }, 600);
    } catch (err) {
      console.error("❌ Erreur:", err);
      setLoading(false);
    }
  };

  return (
    <Layout title="Planning automatique" user={user}>
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
      {/* CONFIGURATION                               */}
      {/* ═══════════════════════════════════════════ */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>
          <Wand2 size={18} color={OOREDOO.red} />
          Configuration
        </h3>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
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

          <button
            onClick={handleGenerate}
            disabled={loading || employees.length < 3}
            style={{
              marginLeft: "auto",
              padding: "12px 24px",
              borderRadius: 12,
              border: "none",
              background: `linear-gradient(135deg, ${OOREDOO.red}, #B8141A)`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "inherit",
              opacity: loading || employees.length < 3 ? 0.6 : 1,
              boxShadow: `0 8px 24px ${OOREDOO.red}55`,
            }}
          >
            {loading ? <RefreshCw size={16} /> : <Wand2 size={16} />}
            {loading ? "Génération..." : "Générer le planning"}
          </button>
        </div>

        {/* Employés */}
        <div style={{ marginTop: 20 }}>
          <label style={labelStyle}>Employés ({employees.length})</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {employees.map((e) => {
              const isResp = FORCED_G1.includes(e);
              const hasConge = conges[e]?.length > 0;
              return (
                <span
                  key={e}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    background: isResp
                      ? "rgba(34,197,94,0.15)"
                      : hasConge
                      ? "rgba(168,85,247,0.15)"
                      : "rgba(255,255,255,0.06)",
                    border: isResp
                      ? "1px solid rgba(34,197,94,0.5)"
                      : hasConge
                      ? "1px solid rgba(168,85,247,0.5)"
                      : "1px solid rgba(255,255,255,0.1)",
                    color: isResp ? "#22c55e" : hasConge ? "#a855f7" : "#fff",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: isResp || hasConge ? 700 : 500,
                  }}
                >
                  {isResp && <Lock size={12} />}
                  {hasConge && <Plane size={12} />}
                  {e}
                  <button
                    onClick={() => removeEmployee(e)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "inherit",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: 16,
                      opacity: 0.6,
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newEmp}

              onChange={(e) => setNewEmp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEmployee()}
              placeholder="Nom employé..."
              style={inputStyle}
            />
            <button onClick={addEmployee} style={addBtn}>
              + Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* GESTION DES CONGÉS                          */}
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

        {/* Formulaire d'ajout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          {/* Sélection employé */}
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

          {/* Date début */}
          <div>
            <label style={smallLabel}>Date début</label>
            <input
              type="date"
              value={congeForm.startDate}
              onChange={(e) => setCongeForm({ ...congeForm, startDate: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Date fin */}
          <div>
            <label style={smallLabel}>Date fin</label>
            <input
              type="date"
              value={congeForm.endDate}
              onChange={(e) => setCongeForm({ ...congeForm, endDate: e.target.value })}
              style={inputStyle}
            />
          </div>

          {/* Bouton ajouter */}
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

        {/* Info sur plusieurs jours */}
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          💡 Astuce : Pour un congé de plusieurs jours, sélectionne une plage de dates
          (début → fin). Pour ajouter une autre plage, refais "Ajouter".
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
                      <span
                        style={{
                          fontSize: 11,
                          opacity: 0.8,
                          fontWeight: 500,
                        }}
                      >
                        ({dates.length} jour{dates.length > 1 ? "s" : ""})
                      </span>
                    </div>
                    <button
                      onClick={() => removeAllConges(emp)}
                      style={{
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
                      }}
                    >
                      <Trash2 size={12} />
                      Tout supprimer
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {dates.map((d) => (
                      <span
                        key={d}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 15,
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#fff",
                        }}
                      >
                        <Calendar size={10} />
                        {new Date(d).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })}
                        <button
                          onClick={() => removeCongeDate(emp, d)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "rgba(255,255,255,0.5)",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                          }}
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

      {/* Export Bar */}
      {/* Reset historique */}
      <button onClick={async () => { if (window.confirm('⚠️ Reset historique ?')) { const r = await resetHistory(user.uid); if (r.success) { setHistory({}); alert('✅ Historique réinitialisé'); } else { alert('❌ Erreur: ' + r.error); } } }} style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,184,0,0.4)', background: 'rgba(255,184,0,0.1)', color: '#FFB800', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', marginTop: 12, marginBottom: 12 }}>🔄 Reset historique</button>
      <ExportBar user={user} employees={employees} week={week} planning={planning} conges={conges} conges={conges} type="auto" />

      {/* Règles */}
      <div style={rulesStyle}>
        <strong style={{ color: "#22c55e" }}>📋 Règles appliquées :</strong>
        <ul style={{ margin: "8px 0 0 20px", padding: 0, lineHeight: 1.8 }}>
          <li><strong>2 personnes en G1</strong> (09-15) chaque jour</li>
          <li><strong>2 personnes en G3</strong> (15-21) chaque jour</li>
          <li><strong>1 personne en repos</strong> chaque jour (rotation)</li>
          <li>Lendemain de repos → <strong>G3</strong> obligatoire</li>
          <li>Équilibre : ~3 G1 + ~3 G3 par personne / semaine</li>
          <li>1 samedi repos par personne en rotation</li>
          <li style={{ color: "#a855f7", fontWeight: 700 }}>
            🛫 Congés : remplacés automatiquement par un autre employé
          </li>
          <li style={{ color: "#22c55e", fontWeight: 700 }}>
            🔒 {FORCED_G1.join(", ")} toujours en <strong>G1</strong>
          </li>
        </ul>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PLANNING TABLE                              */}
      {/* ═══════════════════════════════════════════ */}
      {planning && (
        <div
          style={{
            overflowX: "auto",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "#15151a",
            marginTop: 24,
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
                <th style={thStyle}>Stats</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const stats = Object.values(planning[emp] || {}).reduce(
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
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {emp}
                        {isResp && (
                          <span style={badgeS1}>
                            <Lock size={8} />
                            G1 FIXE
                          </span>
                        )}
                        {hasConge && (
                          <span style={badgeConge}>
                            <Plane size={8} />
                            {conges[emp].length}j
                          </span>
                        )}
                      </div>
                    </td>
                    {week.map((d) => {
                      const s = planning[emp]?.[d.date];
                      // 🆕 FORCER CONGE si la date est dans les congés
                      const isCongeDate = (conges[emp] || []).includes(d.date);
                      const displayShift = isCongeDate ? "CONGE" : s;
                      const shift = SHIFTS[displayShift];
                      const isLockedG1 = isResp && displayShift === "G1";
                      const isCongeDay = conges[emp]?.includes(d.date);

                      return (
                        <td key={d.date} style={tdStyle}>
                          <div
                            style={{
                              padding: "8px 6px",
                              borderRadius: 8,
                              background: shift ? shift.color + "22" : "transparent",
                              color: shift?.color || "#666",
                              fontSize: 11,
                              fontWeight: 700,
                              textAlign: "center",
                              border: isCongeDay
                                ? `1px dashed #a855f7`
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
                                size={8}
                                style={{
                                  position: "absolute",
                                  top: 2,
                                  right: 2,
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
                          gap: 6,
                          fontSize: 11,
                          fontWeight: 600,
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
      )}

      {planning && (
        <div style={successStyle}>
          <CheckCircle2 size={16} />
          Planning généré — 2 G1 + 2 G3 + 1 repos par jour
          {getCongeDaysCount() > 0 && (
            <span style={{ marginLeft: 8, color: "#a855f7" }}>
              • {getCongeDaysCount()} jour(s) de congé pris en compte
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.9 }}>
            🔒 {FORCED_G1.length} responsable(s) en G1 fixe
          </span>
        </div>
      )}
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
  background: "#0f0f12",
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
};
const addBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
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
const rulesStyle = {
  padding: 14,
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.3)",
  borderRadius: 10,
  fontSize: 12,
  color: "rgba(255,255,255,0.7)",
  marginBottom: 0,
};
const successStyle = {
  marginTop: 16,
  padding: 14,
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.3)",
  borderRadius: 10,
  fontSize: 13,
  color: "#22c55e",
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
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
