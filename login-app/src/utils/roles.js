import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc, serverTimestamp } from "firebase/firestore";
import { app } from "../firebase";

const db = getFirestore(app);

export const ROLES = { ADMIN: "admin", MANAGER: "manager", EMPLOYEE: "employee" };

export const ROLE_INFO = {
  admin: { label: "Administrateur", icon: "👑", color: "#FFB800", description: "Accès complet" },
  manager: { label: "Manager", icon: "🎯", color: "#3B82F6", description: "Gérer l'équipe" },
  employee: { label: "Employé", icon: "👤", color: "#22C55E", description: "Voir son planning" },
};

export async function setUserRole(userId, role, userData = {}) {
  try {
    await setDoc(doc(db, "users", userId), {
      userId, role, email: userData.email || "", name: userData.name || "",
      createdAt: userData.createdAt || serverTimestamp(), updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getUserRole(userId) {
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) return { success: true, data: snap.data() };
    return { success: false, error: "Non trouvé" };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function listUsers() {
  try {
    const snap = await getDocs(collection(db, "users"));
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateUserRole(userId, newRole) {
  try {
    await updateDoc(doc(db, "users", userId), { role: newRole, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
