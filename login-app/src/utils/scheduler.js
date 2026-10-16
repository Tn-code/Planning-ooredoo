// src/utils/scheduler.js — Version finale v3

export const SHIFTS = {
  G1: { id: "G1", label: "G1", start: "09:00", end: "15:00", color: "#22c55e", full: "Shift 1 (09-15)" },
  G3: { id: "G3", label: "G3", start: "15:00", end: "21:00", color: "#3b82f6", full: "Shift 2 (15-21)" },
  REST: { id: "REST", label: "REPOS", start: "-", end: "-", color: "#FFB800", full: "Repos hebdo" },
  CONGE: { id: "CONGE", label: "CONGÉ", start: "-", end: "-", color: "#a855f7", full: "Congé" },
};

// ⚙️ CONFIGURATION
export const FORCED_G1 = ["MARWA"];

// 🆕 Responsables dynamiques (depuis Firestore)
export let DYNAMIC_FORCED_G1 = [...FORCED_G1];

export function setForcedG1(names) {
  DYNAMIC_FORCED_G1 = names && names.length > 0 ? names : [...FORCED_G1];
}

export function getForcedG1() {
  return DYNAMIC_FORCED_G1;
}  // Responsables toujours en G1
export const FORCED_G3 = [];
export const G1_PER_DAY = 2;
export const G3_PER_DAY = 2;

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function getWeekDays(startDate = new Date()) {
  // 🔑 ISO 8601 : lundi = premier jour de la semaine
  const d = new Date(startDate);
  d.setHours(12, 0, 0, 0);

  // getDay() : 0=Dim, 1=Lun, ..., 6=Sam
  // Jours écoulés depuis lundi :
  // - Lun (1) → 0 jours
  // - Mar (2) → 1 jour
  // - Mer (3) → 2 jours
  // - Jeu (4) → 3 jours
  // - Ven (5) → 4 jours
  // - Sam (6) → 5 jours
  // - Dim (0) → 6 jours

  const dayIndex = d.getDay();
  const daysFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;

  // Reculer de daysFromMonday pour atteindre lundi
  const monday = new Date(d);
  monday.setDate(d.getDate() - daysFromMonday);
  monday.setHours(12, 0, 0, 0);

  console.log("📅 getWeekDays → lundi:", monday.toISOString().split("T")[0]);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    date.setHours(12, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0];
    return {
      date: dateStr,
      dayName: DAYS_FR[date.getDay()],
      dayIndex: date.getDay(),
      isSaturday: date.getDay() === 6,
      isSunday: date.getDay() === 0,
      dateObj: date,
    };
  });
}

/**
 * 🔑 Renvoie la date du LUNDI de la semaine (au format ISO YYYY-MM-DD)
 * Utile pour normaliser weekStart avant sauvegarde
 */
export function getMondayISO(date = new Date()) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}

export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export function generatePlanning(employees, startDate = new Date(), options = {}) {
  const { conges = {}, history = {} } = options;
  const week = getWeekDays(startDate);
  const weekNum = getWeekNumber(new Date(week[0].date));
  const planning = {};

  employees.forEach((e) => (planning[e] = {}));

  // ═══ RÈGLE 1 : Congé dans la semaine → PAS de repos ═══
  const employeesWithConge = employees.filter((emp) => {
    const empConges = conges[emp] || [];
    return week.some((d) => empConges.includes(d.date));
  });
  const employeesWithoutConge = employees.filter(
    (e) => !employeesWithConge.includes(e)
  );

  // ═══ RÈGLE 2 : Rotation week-end ═══
  const saturdayIdx = week.findIndex((d) => d.isSaturday);
  const sundayIdx = week.findIndex((d) => d.isSunday);

  const saturdayStarters = {};
  employees.forEach((emp, idx) => {
    const hist = history[emp] || {};
    const lastSaturday = hist.lastSaturday;
    if (lastSaturday === "G1") saturdayStarters[emp] = "G3";
    else if (lastSaturday === "G3") saturdayStarters[emp] = "G1";
    else saturdayStarters[emp] = idx % 2 === 0 ? "G1" : "G3";
  });

  // ═══ RÈGLE 3 : Équilibre inter-semaines ═══
  const weekTargets = {};
  employees.forEach((emp) => {
    const hist = history[emp] || {};
    const lastWeek = hist.lastWeek || { G1: 3, G3: 3 };
    const diff = lastWeek.G3 - lastWeek.G1;
    const totalDays = 6;
    let g1Target = Math.round(totalDays / 2 + diff / 2);
    g1Target = Math.max(1, Math.min(totalDays - 1, g1Target));
    weekTargets[emp] = { G1: g1Target, G3: totalDays - g1Target };
  });

  // ═══ ÉTAPE A : Repos rotation ═══
  const restAssignments = {};
  const employeesWithRest = new Set();

  // 1) 🔄 ROTATION des repos pour les Responsables (lundi → dimanche)
  //    Chaque semaine, MARWA repose un jour différent
  DYNAMIC_FORCED_G1.forEach((resp, idx) => {
    if ((conges[resp] || []).length > 0) return;

    // Rotation : semaine N → jour ((weekNum + idx) % 7)
    // weekNum élevé → on modulo 7 pour avoir un jour entre 0 et 6
    const dayIndex = (weekNum + idx) % 7;
    const respRestDay = week[dayIndex];

    // Vérifier que ce jour n'est pas en congé
    if (!(conges[resp] || []).includes(respRestDay.date)) {
      restAssignments[respRestDay.date] = resp;
      employeesWithRest.add(resp);
      console.log(
        `🔒 ${resp} repose ${respRestDay.dayName} (rotation semaine ${weekNum})`
      );
    } else {
      // Fallback : chercher un autre jour libre (lun → dim)
      const altDay = week.find(
        (d) => !(conges[resp] || []).includes(d.date) && !restAssignments[d.date]
      );
      if (altDay) {
        restAssignments[altDay.date] = resp;
        employeesWithRest.add(resp);
        console.log(`🔒 ${resp} repose ${altDay.dayName} (fallback)`);
      }
    }
  });

  // 2) Samedi repos (exclut responsables)
  if (saturdayIdx !== -1) {
    const saturdayDate = week[saturdayIdx].date;
    const saturdayAvailable = employeesWithoutConge.filter(
      (e) => !DYNAMIC_FORCED_G1.includes(e) && !(conges[e] || []).includes(saturdayDate)
    );
    if (saturdayAvailable.length > 0) {
      const chosen = saturdayAvailable[weekNum % saturdayAvailable.length];
      restAssignments[saturdayDate] = chosen;
      employeesWithRest.add(chosen);
    }
  }

  // 3) Repos forcé pour les AUTRES responsables (hors samedi/dimanche)
  const weekdays = week.filter((d) => !d.isSaturday && !d.isSunday);
  DYNAMIC_FORCED_G1.forEach((resp) => {
    if (employeesWithRest.has(resp)) return;
    if ((conges[resp] || []).length > 0) return;
    const availDay = weekdays.find(
      (d) => !(conges[resp] || []).includes(d.date) && !restAssignments[d.date]
    );
    if (availDay) {
      restAssignments[availDay.date] = resp;
      employeesWithRest.add(resp);
    }
  });

  // 4) Autres repos (hors dimanche)
  week.forEach((day) => {
    if (restAssignments[day.date]) return;
    if (day.isSunday) return;
    const availableToday = employees.filter(
      (e) => !(conges[e] || []).includes(day.date)
    );
    const neededSlots = G1_PER_DAY + G3_PER_DAY;
    if (availableToday.length <= neededSlots) return;
    const candidates = availableToday.filter(
      (e) => !employeesWithRest.has(e) && !DYNAMIC_FORCED_G1.includes(e)
    );
    if (candidates.length > 0) {
      const chosen = candidates[weekNum % candidates.length] || candidates[0];
      restAssignments[day.date] = chosen;
      employeesWithRest.add(chosen);
    }
  });

  // ═══ ÉTAPE B : Attribution jour par jour ═══
  const stats = {};
  employees.forEach((e) => (stats[e] = { G1: 0, G3: 0 }));

  week.forEach((day) => {
    const empConges = employees.filter((e) => (conges[e] || []).includes(day.date));
    const restPerson = restAssignments[day.date];

    empConges.forEach((e) => {
      planning[e][day.date] = "CONGE";
    });

    const availableToday = employees.filter(
      (e) => !empConges.includes(e) && e !== restPerson
    );

    const totalNeeded = G1_PER_DAY + G3_PER_DAY;
    let adjustedG1 = G1_PER_DAY;
    let adjustedG3 = G3_PER_DAY;
    if (availableToday.length < totalNeeded) {
      adjustedG1 = Math.max(1, Math.floor(availableToday.length / 2));
      adjustedG3 = Math.max(1, availableToday.length - adjustedG1);
    }

    const forcedG1Today = availableToday.filter((e) => DYNAMIC_FORCED_G1.includes(e));
    const forcedG3Today = availableToday.filter((e) => FORCED_G3.includes(e));

    let g1SlotsLeft = adjustedG1 - forcedG1Today.length;
    let g3SlotsLeft = adjustedG3 - forcedG3Today.length;

    forcedG1Today.forEach((e) => {
      planning[e][day.date] = "G1";
      stats[e].G1++;
    });
    forcedG3Today.forEach((e) => {
      planning[e][day.date] = "G3";
      stats[e].G3++;
    });

    // ═══ SAMEDI ═══
    if (day.isSaturday) {
      const others = availableToday.filter(
        (e) => !DYNAMIC_FORCED_G1.includes(e) && !FORCED_G3.includes(e)
      );
      others.forEach((e) => {
        const start = saturdayStarters[e] || "G1";
        if (start === "G1" && g1SlotsLeft > 0) {
          planning[e][day.date] = "G1";
          stats[e].G1++;
          g1SlotsLeft--;
        } else if (start === "G3" && g3SlotsLeft > 0) {
          planning[e][day.date] = "G3";
          stats[e].G3++;
          g3SlotsLeft--;
        } else if (g1SlotsLeft > 0) {
          planning[e][day.date] = "G1";
          stats[e].G1++;
          g1SlotsLeft--;
        } else if (g3SlotsLeft > 0) {
          planning[e][day.date] = "G3";
          stats[e].G3++;
          g3SlotsLeft--;
        }
      });
    }
    // ═══ DIMANCHE → inverser samedi ═══
    else if (day.isSunday) {
      const others = availableToday.filter(
        (e) => !DYNAMIC_FORCED_G1.includes(e) && !FORCED_G3.includes(e)
      );

      const toInvert = others
        .map((e) => {
          const satShift = planning[e][week[saturdayIdx].date];
          let target = null;
          if (satShift === "G1") target = "G3";
          else if (satShift === "G3") target = "G1";
          return { emp: e, target };
        })
        .filter((x) => x.target !== null);

      toInvert.forEach((x) => {
        if (x.target === "G1" && g1SlotsLeft > 0) {
          planning[x.emp][day.date] = "G1";
          stats[x.emp].G1++;
          g1SlotsLeft--;
        } else if (x.target === "G3" && g3SlotsLeft > 0) {
          planning[x.emp][day.date] = "G3";
          stats[x.emp].G3++;
          g3SlotsLeft--;
        }
      });

      others.filter((e) => !planning[e][day.date]).forEach((e) => {
        if (g1SlotsLeft > 0) {
          planning[e][day.date] = "G1";
          stats[e].G1++;
          g1SlotsLeft--;
        } else if (g3SlotsLeft > 0) {
          planning[e][day.date] = "G3";
          stats[e].G3++;
          g3SlotsLeft--;
        }
      });
    }
    // ═══ LUN-VEN ═══
    else {
      const others = availableToday.filter(
        (e) => !DYNAMIC_FORCED_G1.includes(e) && !FORCED_G3.includes(e)
      );

      const dayIdxInWeek = week.findIndex((d) => d.date === day.date);
      const prevDay = dayIdxInWeek > 0 ? week[dayIdxInWeek - 1] : null;
      const nextDay = dayIdxInWeek < week.length - 1 ? week[dayIdxInWeek + 1] : null;

      const scored = others.map((e) => {
        const wasRest = prevDay && planning[e]?.[prevDay.date] === "REST";
        // 🆕 Veille de repos (demain = repos pour cet employé)
        const nextRestPerson = nextDay ? restAssignments[nextDay.date] : null;
        const isRestTomorrow = nextRestPerson === e;
        const target = weekTargets[e];
        const needG1 = target.G1 - stats[e].G1;
        const ratio = stats[e].G1 / Math.max(1, stats[e].G3);
        return { emp: e, wasRest, isRestTomorrow, needG1, ratio };
      });

      // 🎯 PRIORITÉ 1 : Veille de repos → G1
      scored.filter((s) => s.isRestTomorrow).forEach((s) => {
        if (!planning[s.emp][day.date]) {
          if (g1SlotsLeft > 0) {
            planning[s.emp][day.date] = "G1";
            stats[s.emp].G1++;
            g1SlotsLeft--;
          } else if (g3SlotsLeft > 0) {
            planning[s.emp][day.date] = "G3";
            stats[s.emp].G3++;
            g3SlotsLeft--;
          }
        }
      });

      // 🎯 PRIORITÉ 2 : Lendemain de repos → G3
      scored.filter((s) => s.wasRest).forEach((s) => {
        if (g3SlotsLeft > 0 && !planning[s.emp][day.date]) {
          planning[s.emp][day.date] = "G3";
          stats[s.emp].G3++;
          g3SlotsLeft--;
        }
      });

      // PRIORITÉ 3 : Équilibre par ratio G1/G3
      const sortedByRatio = scored
        .filter((s) => !s.wasRest && !s.isRestTomorrow && !planning[s.emp][day.date])
        .sort((a, b) => a.ratio - b.ratio);

      for (const s of sortedByRatio) {
        if (g1SlotsLeft <= 0) break;
        if (planning[s.emp][day.date]) continue;
        planning[s.emp][day.date] = "G1";
        stats[s.emp].G1++;
        g1SlotsLeft--;
      }

      for (const s of sortedByRatio) {
        if (planning[s.emp][day.date]) continue;
        if (g3SlotsLeft > 0) {
          planning[s.emp][day.date] = "G3";
          stats[s.emp].G3++;
          g3SlotsLeft--;
        }
      }

      // PRIORITÉ 4 : Sécurité
      others.filter((e) => !planning[e][day.date]).forEach((e) => {
        if (g1SlotsLeft > 0) {
          planning[e][day.date] = "G1";
          stats[e].G1++;
          g1SlotsLeft--;
        } else if (g3SlotsLeft > 0) {
          planning[e][day.date] = "G3";
          stats[e].G3++;
          g3SlotsLeft--;
        }
      });
    }

    if (restPerson) {
      planning[restPerson][day.date] = "REST";
    }

    // ═══ SÉCURITÉ : tous assignés ═══
    availableToday.forEach((e) => {
      if (!planning[e][day.date]) {
        const ratio = stats[e].G1 / Math.max(1, stats[e].G3);
        const shift = ratio < 1 ? "G1" : "G3";
        planning[e][day.date] = shift;
        stats[e][shift]++;
      }
    });
  });

  // Sécurité : retirer REST pour ceux avec congé cette semaine
  employeesWithConge.forEach((emp) => {
    week.forEach((d) => {
      if (planning[emp][d.date] === "REST") {
        const shift = stats[emp].G1 <= stats[emp].G3 ? "G1" : "G3";
        planning[emp][d.date] = shift;
        stats[emp][shift]++;
      }
    });
  });

  // 🔥 SÉCURITÉ ABSOLUE : FORCER les congés APRÈS tout le reste
  // (même si l'algo a écrasé, on remet CONGE)
  employees.forEach((emp) => {
    (conges[emp] || []).forEach((congeDate) => {
      // Vérifier que la date est bien dans la semaine actuelle
      if (week.some((d) => d.date === congeDate)) {
        planning[emp][congeDate] = "CONGE";
      }
    });
  });

  return planning;
}

export function extractHistory(planning, employees, week) {
  const history = {};
  const saturdayDate = week.find((d) => d.isSaturday)?.date;
  const sundayDate = week.find((d) => d.isSunday)?.date;

  employees.forEach((emp) => {
    const stats = { G1: 0, G3: 0 };
    Object.values(planning[emp] || {}).forEach((s) => {
      if (s === "G1") stats.G1++;
      if (s === "G3") stats.G3++;
    });
    history[emp] = {
      lastWeek: stats,
      lastSaturday: planning[emp]?.[saturdayDate] || null,
      lastSunday: planning[emp]?.[sundayDate] || null,
    };
  });

  return history;
}

export { DAYS_FR };
