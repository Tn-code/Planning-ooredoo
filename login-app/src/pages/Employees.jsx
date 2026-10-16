import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import {
  listEmployees,
  saveEmployee,
  deleteEmployee,
  generateColor,
  getInitials,
} from "../utils/employees";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  X,
  Loader,
  Users,
  Inbox,
  Shield,
  User,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
  AlertTriangle,
} from "lucide-react";

const OOREDOO = { red: "#ED1C24" };

const ROLES = [
  {
    id: "standard",
    label: "Standard",
    desc: "Shift classique (G1 ou G3)",
    color: "#3b82f6",
    icon: <User size={14} />,
  },
  {
    id: "responsable",
    label: "Responsable",
    desc: "Toujours en G1 (09h-15h)",
    color: "#22c55e",
    icon: <Shield size={14} />,
  },
];

export default function Employees({ user }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Formulaire
  const [form, setForm] = useState({
    name: "",
    role: "standard",
    email: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    if (!user?.uid) return;
    setLoading(true);
    const result = await listEmployees(user.uid);
    if (result.success) {
      setEmployees(result.data);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Le nom est obligatoire");
      return;
    }

    // Vérifier doublon
    const duplicate = employees.find(
      (e) =>
        e.name.toLowerCase() === form.name.trim().toLowerCase() &&
        e.id !== editingId
    );
    if (duplicate) {
      setError("Un employé avec ce nom existe déjà");
      return;
    }

    setSaving(true);

    const employeeData = {
      id: editingId || undefined,
      name: form.name.trim(),
      role: form.role,
      email: form.email.trim(),
      phone: form.phone.trim(),
      color: generateColor(form.name),
    };

    const result = await saveEmployee(user.uid, employeeData);
    setSaving(false);

    if (result.success) {
      setSuccess(editingId ? "Employé modifié !" : "Employé ajouté !");
      setForm({ name: "", role: "standard", email: "", phone: "" });
      setEditingId(null);
      await loadEmployees();
      setTimeout(() => setSuccess(""), 2500);
    } else {
      setError(result.error);
    }
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      role: emp.role || "standard",
      email: emp.email || "",
      phone: emp.phone || "",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", role: "standard", email: "", phone: "" });
    setError("");
  };

  const handleDelete = async (emp) => {
    if (
      !window.confirm(
        `⚠️ Supprimer ${emp.name} ?\n\nCette action est irréversible.`
      )
    )
      return;

    const result = await deleteEmployee(emp.id);
    if (result.success) {
      setEmployees((p) => p.filter((x) => x.id !== emp.id));
      setSuccess(`${emp.name} supprimé`);
      setTimeout(() => setSuccess(""), 2000);
    } else {
      alert("❌ Erreur : " + result.error);
    }
  };

  const handleToggleActive = async (emp) => {
    const result = await saveEmployee(user.uid, {
      ...emp,
      active: !emp.active,
    });
    if (result.success) {
      setEmployees((p) =>
        p.map((x) => (x.id === emp.id ? { ...x, active: !x.active } : x))
      );
    }
  };

  const filtered = employees.filter((e) => {
    const matchSearch =
      search === "" ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || e.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total: employees.length,
    responsables: employees.filter((e) => e.role === "responsable").length,
    standards: employees.filter((e) => e.role === "standard").length,
    active: employees.filter((e) => e.active !== false).length,
  };

  return (
    <Layout title="Gestion des employés" user={user}>
      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <StatCard label="Total" value={stats.total} color="#fff" icon={<Users size={18} />} />
        <StatCard label="Responsables" value={stats.responsables} color="#22c55e" icon={<Shield size={18} />} />
        <StatCard label="Standards" value={stats.standards} color="#3b82f6" icon={<User size={18} />} />
        <StatCard label="Actifs" value={stats.active} color={OOREDOO.red} icon={<CheckCircle2 size={18} />} />
      </div>

      {/* Formulaire */}
      <div style={cardStyle}>
        <h3 style={sectionTitle}>
          {editingId ? <Edit2 size={18} color={OOREDOO.red} /> : <Plus size={18} color={OOREDOO.red} />}
          {editingId ? "Modifier l'employé" : "Ajouter un employé"}
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Field label="Nom complet *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Ahmed Ben Ali"
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </Field>

          <Field label="Rôle">
            <div style={{ display: "flex", gap: 8 }}>
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setForm({ ...form, role: r.id })}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border:
                      form.role === r.id
                        ? `2px solid ${r.color}`
                        : "1px solid rgba(255,255,255,0.1)",
                    background:
                      form.role === r.id ? `${r.color}22` : "#0f0f12",
                    color: form.role === r.id ? r.color : "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Email (optionnel)">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@ooredoo.tn"
              style={inputStyle}
            />
          </Field>

          <Field label="Téléphone (optionnel)">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+216 XX XXX XXX"
              style={inputStyle}
            />
          </Field>
        </div>

        {/* Rôle description */}
        {form.role === "responsable" && (
          <div style={infoBox}>
            <Lock size={14} />
            <span>
              <strong>Responsable :</strong> cet employé sera automatiquement en
              G1 (09h-15h) dans tous les plannings générés.
            </span>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div style={errorBox}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {success && (
          <div style={successBox}>
            <CheckCircle2 size={14} />
            {success}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: `linear-gradient(135deg, ${OOREDOO.red}, #B8141A)`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "inherit",
              opacity: saving ? 0.7 : 1,
              boxShadow: `0 8px 20px ${OOREDOO.red}55`,
            }}
          >
            {saving ? <Loader size={14} /> : <Save size={14} />}
            {saving ? "Enregistrement..." : editingId ? "Modifier" : "Ajouter"}
          </button>

          {editingId && (
            <button
              onClick={handleCancelEdit}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
              }}
            >
              <X size={14} />
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* Recherche + Filtres */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <div style={searchBox}>
          <Search size={16} color="rgba(255,255,255,0.5)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
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
            { id: "responsable", label: "Responsables" },
            { id: "standard", label: "Standards" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterRole(f.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: filterRole === f.id ? OOREDOO.red : "transparent",
                color: filterRole === f.id ? "#fff" : "rgba(255,255,255,0.6)",
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
          {filtered.length} employé{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Liste employés */}
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
            {search || filterRole !== "all"
              ? "Aucun résultat"
              : "Aucun employé"}
          </h3>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: 14 }}>
            {search || filterRole !== "all"
              ? "Modifie ta recherche ou tes filtres."
              : "Ajoute ton premier employé via le formulaire ci-dessus."}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              onEdit={() => handleEdit(emp)}
              onDelete={() => handleDelete(emp)}
              onToggleActive={() => handleToggleActive(emp)}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}

// ═══════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════

function StatCard({ label, value, color, icon }) {
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
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: color, marginTop: 2 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={smallLabel}>{label}</label>
      {children}
    </div>
  );
}

function EmployeeCard({ emp, onEdit, onDelete, onToggleActive }) {
  const isResp = emp.role === "responsable";
  const isActive = emp.active !== false;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1a1a1f 0%, #15151a 100%)",
        border: isResp
          ? "1px solid rgba(34,197,94,0.4)"
          : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: 18,
        opacity: isActive ? 1 : 0.5,
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Avatar */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: emp.color || "#3b82f6",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 18,
            flexShrink: 0,
            boxShadow: `0 4px 12px ${emp.color || "#3b82f6"}66`,
          }}
        >
          {getInitials(emp.name)}
        </div>

        {/* Infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 4,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
              {emp.name}
            </div>
            {!isActive && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 700,
                }}
              >
                INACTIF
              </span>
            )}
          </div>

          {/* Badge rôle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            {isResp ? (
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 12,
                  background: "rgba(34,197,94,0.15)",
                  color: "#22c55e",
                  fontWeight: 700,
                  border: "1px solid rgba(34,197,94,0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Shield size={10} />
                Responsable (G1 fixe)
              </span>
            ) : (
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 12,
                  background: "rgba(59,130,246,0.15)",
                  color: "#3b82f6",
                  fontWeight: 700,
                  border: "1px solid rgba(59,130,246,0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <User size={10} />
                Standard
              </span>
            )}
          </div>

          {/* Contact */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {emp.email && (
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Mail size={11} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {emp.email}
                </span>
              </div>
            )}
            {emp.phone && (
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.5)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Phone size={11} />
                {emp.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button onClick={onEdit} style={smallBtn("#3b82f6")}>
          <Edit2 size={12} />
          Modifier
        </button>
        <button onClick={onToggleActive} style={smallBtn("#FFB800")}>
          {isActive ? <X size={12} /> : <CheckCircle2 size={12} />}
          {isActive ? "Désactiver" : "Activer"}
        </button>
        <button
          onClick={onDelete}
          style={{ ...smallBtn("#ED1C24"), marginLeft: "auto" }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════
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

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#0f0f12",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const smallLabel = {
  fontSize: 11,
  color: "rgba(255,255,255,0.5)",
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const infoBox = {
  padding: "10px 14px",
  background: "rgba(34,197,94,0.08)",
  border: "1px solid rgba(34,197,94,0.3)",
  borderRadius: 10,
  fontSize: 12,
  color: "#22c55e",
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
};

const errorBox = {
  padding: "10px 14px",
  background: "rgba(237,28,36,0.1)",
  border: "1px solid rgba(237,28,36,0.4)",
  borderRadius: 10,
  fontSize: 12,
  color: "#ED1C24",
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
};

const successBox = {
  padding: "10px 14px",
  background: "rgba(34,197,94,0.1)",
  border: "1px solid rgba(34,197,94,0.4)",
  borderRadius: 10,
  fontSize: 12,
  color: "#22c55e",
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
};

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

const smallBtn = (color) => ({
  padding: "6px 10px",
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
