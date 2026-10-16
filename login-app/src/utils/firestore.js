// src/utils/firestore.js
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "../firebase";

export const db = getFirestore(app);

export async function savePlanning(userId, weekStart, data) {
  try {
    const id = `${userId}_${weekStart}`;
    const ref = doc(db, "plannings", id);
    await setDoc(ref, {
      userId, weekStart,
      employees: data.employees || [],
      planning: data.planning || {},
      conges: data.conges || {},
      type: data.type || "manual",
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true, id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function loadPlanning(userId, weekStart) {
  try {
    const snap = await getDoc(doc(db, "plannings", `${userId}_${weekStart}`));
    if (snap.exists()) return { success: true, data: snap.data() };
    return { success: false, error: "Pas de planning sauvegardé" };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function listPlannings(userId) {
  try {
    const q = query(collection(db, "plannings"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list.sort((a, b) => b.weekStart.localeCompare(a.weekStart)) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deletePlanning(userId, weekStart) {
  try {
    await deleteDoc(doc(db, "plannings", `${userId}_${weekStart}`));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function saveHistory(userId, history) {
  try {
    await setDoc(doc(db, "histories", userId), {
      userId, history, updatedAt: serverTimestamp(),
    }, { merge: true });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function loadHistory(userId) {
  try {
    const snap = await getDoc(doc(db, "histories", userId));
    if (snap.exists()) return { success: true, history: snap.data().history || {} };
    return { success: true, history: {} };
  } catch (err) {
    return { success: false, history: {}, error: err.message };
  }
}

export async function resetHistory(userId) {
  try {
    await setDoc(doc(db, "histories", userId), {
      userId, history: {}, updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
