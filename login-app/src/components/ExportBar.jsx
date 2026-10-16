import { useState } from "react";
import { FileDown, FileSpreadsheet, Save, CheckCircle2, Loader } from "lucide-react";
import { exportPDF, exportExcel } from "../utils/exporters";
import { savePlanning } from "../utils/firestore";

export default function ExportBar({
  user,
  employees,
  week,
  planning,
  conges,
  type = "manual",
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handlePDF = () => {
    if (!planning || Object.keys(planning).length === 0) {
      alert("⚠️ Génère ou remplis d'abord le planning !");
      return;
    }
    exportPDF(employees, week, planning, conges);
  };

  const handleExcel = () => {
    if (!planning || Object.keys(planning).length === 0) {
      alert("⚠️ Génère ou remplis d'abord le planning !");
      return;
    }
    exportExcel(employees, week, planning, conges);
  };

  const handleSave = async () => {
    if (!user?.uid) {
      alert("⚠️ Utilisateur non connecté");
      return;
    }
    if (!planning || Object.keys(planning).length === 0) {
      alert("⚠️ Rien à sauvegarder");
      return;
    }

    setSaving(true);
    const result = await savePlanning(user.uid, week[0].date, {
      employees,
      planning,
      conges,
      type,
    });
    setSaving(false);

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert("❌ Erreur : " + result.error);
    }
  };

  return (
    <div style={barStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
          Actions :
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
        <button onClick={handleSave} disabled={saving} style={btnSave}>
          {saving ? (
            <Loader size={16} />
          ) : saved ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Sauvegarde..." : saved ? "Sauvegardé !" : "Sauvegarder"}
        </button>

        <button onClick={handlePDF} style={btnPDF}>
          <FileDown size={16} />
          Export PDF
        </button>

        <button onClick={handleExcel} style={btnExcel}>
          <FileSpreadsheet size={16} />
          Export Excel
        </button>
      </div>
    </div>
  );
}

const barStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 14,
  borderRadius: 12,
  background: "linear-gradient(135deg, #1a1a1f 0%, #15151a 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: 20,
  flexWrap: "wrap",
};

const btnBase = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "inherit",
  transition: "all 0.2s",
};

const btnSave = {
  ...btnBase,
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "#fff",
  boxShadow: "0 4px 12px rgba(34,197,94,0.35)",
};

const btnPDF = {
  ...btnBase,
  background: "linear-gradient(135deg, #ED1C24, #B8141A)",
  color: "#fff",
  boxShadow: "0 4px 12px rgba(237,28,36,0.35)",
};

const btnExcel = {
  ...btnBase,
  background: "linear-gradient(135deg, #1d6f42, #14532d)",
  color: "#fff",
  boxShadow: "0 4px 12px rgba(29,111,66,0.35)",
};
