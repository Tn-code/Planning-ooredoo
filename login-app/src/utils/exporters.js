// src/utils/exporters.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const OOREDOO = { red: [237, 28, 36], darkRed: [184, 20, 26] };

export function exportPDF(employees, week, planning, conges = {}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // HEADER
  doc.setFillColor(...OOREDOO.red);
  doc.rect(0, 0, pageWidth, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("OOREDOO", 14, 13);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Planning hebdomadaire", 14, 19);

  const startDate = new Date(week[0].date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
  });
  const endDate = new Date(week[6].date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.setFontSize(10);
  doc.text(`${startDate} → ${endDate}`, pageWidth - 14, 15, { align: "right" });

  // TABLEAU
  const tableHead = [
    ["Employé", ...week.map((d) => `${d.dayName.slice(0, 3)}\n${d.date.slice(8, 10)}`)],
  ];

  const tableBody = employees.map((emp) => {
    const row = [emp];
    week.forEach((d) => {
      const s = planning[emp]?.[d.date];
      let display = "—";
      if (s === "G1") display = "G1\n09-15";
      else if (s === "G3") display = "G3\n15-21";
      else if (s === "REST") display = "REPOS";
      else if (s === "CONGE") display = "CONGÉ";
      row.push(display);
    });
    return row;
  });

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 32,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
      halign: "center",
      valign: "middle",
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: OOREDOO.red,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", fillColor: [245, 245, 245], cellWidth: 35 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index > 0) {
        const text = data.cell.raw;
        if (text.includes("G1")) {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fillColor = [220, 252, 231];
        } else if (text.includes("G3")) {
          data.cell.styles.textColor = [37, 99, 235];
          data.cell.styles.fillColor = [219, 234, 254];
        } else if (text.includes("REPOS")) {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fillColor = [254, 249, 195];
        } else if (text.includes("CONGÉ")) {
          data.cell.styles.textColor = [126, 34, 206];
          data.cell.styles.fillColor = [243, 232, 255];
        }
        data.cell.styles.fontStyle = "bold";
      }
      if (data.section === "body" && data.column.index === 0) {
        if (data.cell.raw === "MARWA") {
          data.cell.styles.textColor = OOREDOO.red;
        }
      }
    },
  });

  // LÉGENDE
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Légende :", 14, finalY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const legend = [
    { label: "G1 : 09h-15h", color: [22, 163, 74] },
    { label: "G3 : 15h-21h", color: [37, 99, 235] },
    { label: "REPOS", color: [202, 138, 4] },
    { label: "CONGÉ", color: [126, 34, 206] },
  ];

  let lx = 14;
  legend.forEach((l) => {
    doc.setFillColor(...l.color);
    doc.rect(lx, finalY + 3, 3, 3, "F");
    doc.setTextColor(...l.color);
    doc.text(l.label, lx + 5, finalY + 6);
    lx += 40;
  });

  // STATS
  const statsY = finalY + 15;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Statistiques :", 14, statsY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let sx = 14;
  employees.forEach((emp, idx) => {
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

    if (idx > 0 && idx % 4 === 0) sx = 14;
    doc.text(
      `${emp}: G1:${stats.G1} G3:${stats.G3} R:${stats.REST}${stats.CONGE > 0 ? ` C:${stats.CONGE}` : ""}`,
      sx,
      statsY + 5 + Math.floor(idx / 4) * 5
    );
    sx += 65;
  });

  // FOOTER
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Généré le ${new Date().toLocaleDateString("fr-FR")} — Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: "center" }
    );
  }

  const filename = `Planning_Ooredoo_${week[0].date}.pdf`;
  doc.save(filename);
  return filename;
}

export function exportExcel(employees, week, planning, conges = {}) {
  const wb = XLSX.utils.book_new();

  // FEUILLE 1 : PLANNING
  const data = [];
  data.push(["OOREDOO — Planning Hebdomadaire"]);
  data.push([
    `Semaine du ${new Date(week[0].date).toLocaleDateString("fr-FR")} au ${new Date(week[6].date).toLocaleDateString("fr-FR")}`,
  ]);
  data.push([]);
  data.push(["Employé", ...week.map((d) => `${d.dayName}\n${d.date.slice(8, 10)}`)]);

  employees.forEach((emp) => {
    const row = [emp];
    week.forEach((d) => {
      const s = planning[emp]?.[d.date];
      row.push(s || "—");
    });
    data.push(row);
  });

  data.push([]);
  data.push(["LÉGENDE"]);
  data.push(["G1", "Shift 1 — 09h à 15h"]);
  data.push(["G3", "Shift 2 — 15h à 21h"]);
  data.push(["REST", "Repos hebdomadaire"]);
  data.push(["CONGE", "Congé"]);

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [{ wch: 18 }, ...week.map(() => ({ wch: 10 }))];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Planning");

  // FEUILLE 2 : STATISTIQUES
  const statsData = [["Employé", "G1", "G3", "Repos", "Congés", "Total travaillé"]];

  employees.forEach((emp) => {
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
    statsData.push([emp, stats.G1, stats.G3, stats.REST, stats.CONGE, stats.G1 + stats.G3]);
  });

  const totals = ["TOTAL", 0, 0, 0, 0, 0];
  employees.forEach((emp) => {
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
    totals[1] += stats.G1;
    totals[2] += stats.G3;
    totals[3] += stats.REST;
    totals[4] += stats.CONGE;
    totals[5] += stats.G1 + stats.G3;
  });
  statsData.push(totals);

  const ws2 = XLSX.utils.aoa_to_sheet(statsData);
  ws2["!cols"] = [{ wch: 18 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Statistiques");

  // FEUILLE 3 : CONGÉS
  if (Object.keys(conges).length > 0) {
    const congesData = [["Employé", "Date", "Jour"]];
    Object.entries(conges).forEach(([emp, dates]) => {
      dates.forEach((d) => {
        const dayName = new Date(d).toLocaleDateString("fr-FR", { weekday: "long" });
        congesData.push([emp, d, dayName]);
      });
    });

    const ws3 = XLSX.utils.aoa_to_sheet(congesData);
    ws3["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Congés");
  }

  const filename = `Planning_Ooredoo_${week[0].date}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
