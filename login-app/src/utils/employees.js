// src/utils/employees.js
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "../firebase";

const db = getFirestore(app);

export async function listEmployees(userId) {
  try {
    const q = query(collection(db, "employees"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    // Trier : responsables d'abord, puis par nom
    list.sort((a, b) => {
      if (a.role === "responsable" && b.role !== "responsable") return -1;
      if (a.role !== "responsable" && b.role === "responsable") return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
    return { success: true, data: list };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function saveEmployee(userId, employee) {
  try {
    const id = employee.id || `${userId}_${Date.now()}`;
    const ref = doc(db, "employees", id);
    await setDoc(
      ref,
      {
        userId,
        name: employee.name,
        role: employee.role || "standard",
        email: employee.email || "",
        phone: employee.phone || "",
        color: employee.color || generateColor(employee.name),
        active: employee.active !== false,
        createdAt: employee.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true, id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteEmployee(id) {
  try {
    await deleteDoc(doc(db, "employees", id));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function generateColor(name) {
  const colors = [
    "#ED1C24", "#3b82f6", "#22c55e", "#FFB800", "#a855f7",
    "#ec4899", "#06b6d4", "#f97316", "#8b5cf6", "#14b8a6",
    "#f43f5e", "#0ea5e9",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * 🔑 Charge les employés ACTIFS pour le planning
 */
export async function loadEmployeesForPlanning(userId) {
  const result = await listEmployees(userId);
  if (!result.success) {
    return { success: false, names: [], responsables: [], all: [] };
  }

  const active = result.data.filter((e) => e.active !== false);
  const names = active.map((e) => e.name);
  const responsables = active
    .filter((e) => e.role === "responsable")
    .map((e) => e.name);

  return { success: true, names, responsables, all: active };
}
