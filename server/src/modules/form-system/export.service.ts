import ExcelJS from "exceljs";

import { prisma } from "../../lib/prisma";
import { answersRecordSchema } from "./form-system.schema";
import type { Prisma } from "../../../generated/prisma";

type AnswersRecord = Record<string, string | boolean>;

function parseAnswers(value: Prisma.JsonValue): AnswersRecord {
  return answersRecordSchema.parse(value);
}

function str(value: string | boolean | undefined): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value).trim();
}

function formatDateRange(checkIn: string, checkOut: string): string {
  const dIn = new Date(checkIn);
  const dOut = new Date(checkOut);
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

  const monthIn = months[dIn.getMonth()] ?? "UNKNOWN";
  const monthOut = months[dOut.getMonth()] ?? "UNKNOWN";

  if (dIn.getMonth() === dOut.getMonth() && dIn.getFullYear() === dOut.getFullYear()) {
    return `${monthIn} ${dIn.getDate()}-${dOut.getDate()}`;
  }

  return `${monthIn} ${dIn.getDate()} - ${monthOut} ${dOut.getDate()}`;
}

function guestCount(answers: AnswersRecord): number {
  const companion = Number(str(answers.companion_count));
  return isNaN(companion) ? 1 : companion + 1;
}

export async function exportSubmissionsToExcel(filters: {
  propertyName: string | undefined;
  checkIn: string | undefined;
  checkOut: string | undefined;
}): Promise<ExcelJS.Buffer> {
  const where: Record<string, unknown> = {};
  if (filters.propertyName) where.propertyName = filters.propertyName;
  if (filters.checkIn) where.checkIn = filters.checkIn;
  if (filters.checkOut) where.checkOut = filters.checkOut;

  const submissions = await prisma.submission.findMany({
    where,
    include: { form: true },
    orderBy: { createdAt: "asc" },
  });

  if (submissions.length === 0) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Guest List");
    ws.addRow(["No submissions found"]);
    return wb.xlsx.writeBuffer();
  }

  // Group by property + check-in/check-out (one sheet per trip)
  const groups = new Map<string, typeof submissions>();
  for (const sub of submissions) {
    const key = `${sub.propertyName}|${sub.checkIn}|${sub.checkOut}`;
    const group = groups.get(key);
    if (group) {
      group.push(sub);
    } else {
      groups.set(key, [sub]);
    }
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Dreamboat";
  wb.created = new Date();

  const usedSheetNames = new Set<string>();

  for (const [key, groupSubs] of groups) {
    const parts = key.split("|");
    const propName = parts[0] ?? "Unknown";
    const checkIn = parts[1] ?? "";
    const checkOut = parts[2] ?? "";
    const dateRange = checkIn && checkOut ? formatDateRange(checkIn, checkOut) : "";

    // Calculate total guests
    let totalGuests = 0;
    for (const sub of groupSubs) {
      const answers = parseAnswers(sub.answers);
      totalGuests += guestCount(answers);
    }

    // Sheet name (max 31 chars for Excel, no invalid characters, must be unique)
    let baseName = propName.replace(/[:\\/?*[\]]/g, "_").slice(0, 31);
    let sheetName = baseName;
    let suffix = 2;
    while (usedSheetNames.has(sheetName)) {
      const tag = ` (${suffix})`;
      sheetName = baseName.slice(0, 31 - tag.length) + tag;
      suffix++;
    }
    usedSheetNames.add(sheetName);
    const ws = wb.addWorksheet(sheetName);

    // Column widths (generous for readability)
    ws.columns = [
      { width: 36 },  // A - Name
      { width: 40 },  // B - Email
      { width: 10 },  // C - Age
      { width: 22 },  // D - Country
      { width: 16 },  // E - # of Guests
      { width: 28 },  // F - Group Type
      { width: 14 },  // G - Consent
      { width: 44 },  // H - Additional Requests
      { width: 34 },  // I - Medical Conditions
      { width: 34 },  // J - Allergies
      { width: 16 },  // K - EAT MEAT
      { width: 16 },  // L - EAT FISH
      { width: 28 },  // M - WHATS APP
      { width: 22 },  // N - T-shirt
      { width: 20 },  // O - Payment Status
      { width: 18 },  // P - ORDER ID
      { width: 16 },  // Q - # of Seats
      { width: 18 },  // R - Order ID
    ];

    const totalCols = 18;

    // ── Row 1: Trip header (dark green) ──
    const row1 = ws.addRow([`${dateRange} | ${propName}`]);
    ws.mergeCells(1, 1, 1, totalCols);
    const headerCell1 = ws.getCell("A1");
    headerCell1.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    headerCell1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B5E20" } };
    headerCell1.alignment = { vertical: "middle" };
    row1.height = 38;

    // ── Row 2: Property name + Total Guests (dark blue) ──
    const row2 = ws.addRow([""]);
    ws.mergeCells(2, 1, 2, totalCols - 4);
    row2.height = 44;

    // Property text in A2
    const routeCell = ws.getCell("A2");
    routeCell.value = propName.toUpperCase();
    routeCell.font = { bold: true, size: 20, color: { argb: "FFFFFFFF" } };
    routeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D47A1" } };
    routeCell.alignment = { vertical: "middle" };

    // Fill remaining cells in row 2 with blue
    for (let c = 1; c <= totalCols - 4; c++) {
      const cell = ws.getCell(2, c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D47A1" } };
    }

    // "TOTAL GUESTS" label
    const totalLabelCol = totalCols - 3;
    ws.mergeCells(2, totalLabelCol, 2, totalLabelCol + 1);
    const totalLabel = ws.getCell(2, totalLabelCol);
    totalLabel.value = "TOTAL GUESTS";
    totalLabel.font = { bold: true, size: 14, color: { argb: "FF000000" } };
    totalLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    totalLabel.alignment = { horizontal: "right", vertical: "middle" };
    ws.getCell(2, totalLabelCol + 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };

    // Total count
    ws.mergeCells(2, totalLabelCol + 2, 2, totalCols);
    const totalCount = ws.getCell(2, totalLabelCol + 2);
    totalCount.value = totalGuests;
    totalCount.font = { bold: true, size: 22, color: { argb: "FFFF0000" } };
    totalCount.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    totalCount.alignment = { horizontal: "center", vertical: "middle" };

    // ── Row 3: Column headers (green) ──
    const headers = [
      "Name", "Email", "Age", "Country", "# of Guests", "Group Type",
      "Consent", "Additional Requests", "Medical Conditions", "Allergies",
      "EAT MEAT", "EAT FISH", "WHATS APP", "T-shirt",
      "Payment Status", "ORDER ID", "# of Seats", "Order ID",
    ];

    const row3 = ws.addRow(headers);
    row3.height = 38;
    for (let c = 1; c <= totalCols; c++) {
      const cell = ws.getCell(3, c);
      cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E7D32" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FF1B5E20" } },
        bottom: { style: "thin", color: { argb: "FF1B5E20" } },
        left: { style: "thin", color: { argb: "FF1B5E20" } },
        right: { style: "thin", color: { argb: "FF1B5E20" } },
      };
    }

    // Email column header highlight (blue)
    const emailHeader = ws.getCell(3, 2);
    emailHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1565C0" } };

    // ── Data rows ──
    let bookingIndex = 0;
    for (const sub of groupSubs) {
      const answers = parseAnswers(sub.answers);
      const guests = guestCount(answers);
      const consent = str(answers.accept_terms);
      const companionCount = Math.max(0, Number(str(answers.companion_count)) || 0);

      // Add a separator row between different bookings (not before the first one)
      if (bookingIndex > 0) {
        const sepRow = ws.addRow([]);
        sepRow.height = 6;
        for (let c = 1; c <= totalCols; c++) {
          const cell = ws.getCell(sepRow.number, c);
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8E8E8" } };
          cell.border = {
            top: { style: "thin", color: { argb: "FFBDBDBD" } },
            bottom: { style: "thin", color: { argb: "FFBDBDBD" } },
          };
        }
      }
      bookingIndex++;

      // Build rows: main booker + each companion
      const personRows: Array<{
        name: string;
        email: string;
        age: string;
        country: string;
        guestNum: number | "";
        groupType: string;
        consent: string;
        additionalRequests: string;
        medicalConditions: string;
        allergies: string;
        eatMeat: string;
        eatFish: string;
        whatsapp: string;
        tshirt: string;
        paymentStatus: string;
        orderId: string;
        seats: number | "";
        orderIdDup: string;
        isCompanion: boolean;
      }> = [];

      // Main booker row
      personRows.push({
        name: str(answers.guest_name) || sub.guestName,
        email: str(answers.guest_email) || sub.guestEmail,
        age: str(answers.guest_age),
        country: str(answers.country),
        guestNum: guests,
        groupType: str(answers.group_type),
        consent: consent === "TRUE" ? "TRUE" : consent === "FALSE" ? "FALSE" : "",
        additionalRequests: str(answers.additional_requests),
        medicalConditions: str(answers.medical_conditions),
        allergies: str(answers.allergies),
        eatMeat: str(answers.eat_meat),
        eatFish: str(answers.eat_fish),
        whatsapp: str(answers.whatsapp),
        tshirt: str(answers.tshirt),
        paymentStatus: sub.status === "COMPLETED" ? "DONE" : sub.status,
        orderId: sub.shopifyOrderNumber,
        seats: guests,
        orderIdDup: sub.shopifyOrderNumber,
        isCompanion: false,
      });

      // Companion rows
      for (let i = 1; i <= companionCount; i++) {
        personRows.push({
          name: str(answers[`companion_${i}_name`]),
          email: "",
          age: str(answers[`companion_${i}_age`]),
          country: "",
          guestNum: "",
          groupType: "",
          consent: "",
          additionalRequests: "",
          medicalConditions: "",
          allergies: str(answers[`companion_${i}_allergies`]),
          eatMeat: str(answers[`companion_${i}_eat_meat`]),
          eatFish: str(answers[`companion_${i}_eat_fish`]),
          whatsapp: "",
          tshirt: "",
          paymentStatus: "",
          orderId: sub.shopifyOrderNumber,
          seats: "",
          orderIdDup: "",
          isCompanion: true,
        });
      }

      for (const person of personRows) {
        const rowData = [
          person.name,
          person.email,
          person.age,
          person.country,
          person.guestNum,
          person.groupType,
          person.consent,
          person.additionalRequests,
          person.medicalConditions,
          person.allergies,
          person.eatMeat,
          person.eatFish,
          person.whatsapp,
          person.tshirt,
          person.paymentStatus,
          person.orderId,
          person.seats,
          person.orderIdDup,
        ];

        const dataRow = ws.addRow(rowData);
        dataRow.height = 30;

        // Style data cells
        for (let c = 1; c <= totalCols; c++) {
          const cell = ws.getCell(dataRow.number, c);
          cell.font = { size: 12 };
          cell.alignment = { vertical: "middle", wrapText: true };
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
        }

        // Companion rows get a subtle indent/light background to visually group them
        if (person.isCompanion) {
          for (let c = 1; c <= totalCols; c++) {
            const cell = ws.getCell(dataRow.number, c);
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
          }
          // Indent companion name
          const nameCell = ws.getCell(dataRow.number, 1);
          nameCell.alignment = { indent: 2, vertical: "middle", wrapText: true };
        }

        // Highlight NO values in EAT MEAT / EAT FISH with red background
        if (person.eatMeat === "NO") {
          const eatMeatCell = ws.getCell(dataRow.number, 11);
          eatMeatCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
          eatMeatCell.font = { size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        }

        if (person.eatFish === "NO") {
          const eatFishCell = ws.getCell(dataRow.number, 12);
          eatFishCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
          eatFishCell.font = { size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        }
      }
    }
  }

  return wb.xlsx.writeBuffer();
}
