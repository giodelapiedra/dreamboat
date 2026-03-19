import ExcelJS from "exceljs";

import type { Prisma, Submission } from "../../../generated/prisma";
import { prisma } from "../../lib/prisma";
import { answersRecordSchema } from "./form-system.schema";

type AnswersRecord = Record<string, string | boolean>;
type GuestListCellValue = string | number;

export interface GuestListFilters {
  propertyName: string | undefined;
  checkIn: string | undefined;
  checkOut: string | undefined;
}

export interface GuestListRow {
  rowKey: string;
  values: GuestListCellValue[];
  isCompanion: boolean;
  eatMeat: string;
  eatFish: string;
}

export interface GuestListBooking {
  bookingKey: string;
  submissionId: string;
  rows: GuestListRow[];
}

export interface GuestListSheet {
  tripKey: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  dateRange: string;
  title: string;
  totalGuests: number;
  tabNameBase: string;
  headers: string[];
  columnWidths: number[];
  bookings: GuestListBooking[];
}

const GUEST_LIST_HEADERS = [
  "Name",
  "Email",
  "Age",
  "Country",
  "# of Guests",
  "Group Type",
  "Consent",
  "Additional Requests",
  "Medical Conditions",
  "Allergies",
  "EAT MEAT",
  "EAT FISH",
  "WHATS APP",
  "T-shirt",
  "Payment Status",
  "ORDER ID",
  "# of Seats",
  "Order ID",
];

const GUEST_LIST_COLUMN_WIDTHS = [36, 40, 10, 22, 16, 28, 14, 44, 34, 34, 16, 16, 28, 22, 20, 18, 16, 18];

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
  const months = [
    "JANUARY",
    "FEBRUARY",
    "MARCH",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUGUST",
    "SEPTEMBER",
    "OCTOBER",
    "NOVEMBER",
    "DECEMBER",
  ];

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

function buildWhere(filters: GuestListFilters): Prisma.SubmissionWhereInput {
  const where: Prisma.SubmissionWhereInput = {};
  if (filters.propertyName) where.propertyName = filters.propertyName;
  if (filters.checkIn) where.checkIn = filters.checkIn;
  if (filters.checkOut) where.checkOut = filters.checkOut;
  return where;
}

function groupSubmissionsByTrip(submissions: Submission[]): Map<string, Submission[]> {
  const groups = new Map<string, Submission[]>();

  for (const submission of submissions) {
    const tripKey = `${submission.propertyName}|${submission.checkIn}|${submission.checkOut}`;
    const existingGroup = groups.get(tripKey);
    if (existingGroup) {
      existingGroup.push(submission);
      continue;
    }

    groups.set(tripKey, [submission]);
  }

  return groups;
}

function createTabNameBase(propertyName: string): string {
  return propertyName.replace(/[:\\/?*[\]]/g, "_").slice(0, 31) || "Guest List";
}

function buildBookingRows(submission: Submission): GuestListBooking {
  const answers = parseAnswers(submission.answers);
  const guests = guestCount(answers);
  const consent = str(answers.accept_terms);
  const companionCount = Math.max(0, Number(str(answers.companion_count)) || 0);

  const rows: GuestListRow[] = [
    {
      rowKey: `${submission.id}:main`,
      values: [
        str(answers.guest_name) || submission.guestName,
        str(answers.guest_email) || submission.guestEmail,
        str(answers.guest_age),
        str(answers.country),
        guests,
        str(answers.group_type),
        consent === "TRUE" ? "TRUE" : consent === "FALSE" ? "FALSE" : "",
        str(answers.additional_requests),
        str(answers.medical_conditions),
        str(answers.allergies),
        str(answers.eat_meat),
        str(answers.eat_fish),
        str(answers.whatsapp),
        str(answers.tshirt),
        submission.status === "COMPLETED" ? "DONE" : submission.status,
        submission.shopifyOrderNumber,
        guests,
        submission.shopifyOrderNumber,
      ],
      isCompanion: false,
      eatMeat: str(answers.eat_meat),
      eatFish: str(answers.eat_fish),
    },
  ];

  for (let index = 1; index <= companionCount; index++) {
    rows.push({
      rowKey: `${submission.id}:companion:${index}`,
      values: [
        str(answers[`companion_${index}_name`]),
        "",
        str(answers[`companion_${index}_age`]),
        "",
        "",
        "",
        "",
        "",
        "",
        str(answers[`companion_${index}_allergies`]),
        str(answers[`companion_${index}_eat_meat`]),
        str(answers[`companion_${index}_eat_fish`]),
        "",
        "",
        "",
        submission.shopifyOrderNumber,
        "",
        "",
      ],
      isCompanion: true,
      eatMeat: str(answers[`companion_${index}_eat_meat`]),
      eatFish: str(answers[`companion_${index}_eat_fish`]),
    });
  }

  return {
    bookingKey: submission.shopifyOrderNumber || submission.id,
    submissionId: submission.id,
    rows,
  };
}

export async function buildGuestListSheets(filters: GuestListFilters): Promise<GuestListSheet[]> {
  const submissions = await prisma.submission.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: "asc" },
  });

  const sheets: GuestListSheet[] = [];
  for (const [tripKey, tripSubmissions] of groupSubmissionsByTrip(submissions)) {
    const firstSubmission = tripSubmissions[0];
    if (!firstSubmission) {
      continue;
    }

    const bookings = tripSubmissions.map(buildBookingRows);
    const totalGuests = tripSubmissions.reduce((sum, submission) => {
      return sum + guestCount(parseAnswers(submission.answers));
    }, 0);
    const dateRange = formatDateRange(firstSubmission.checkIn, firstSubmission.checkOut);

    sheets.push({
      tripKey,
      propertyName: firstSubmission.propertyName,
      checkIn: firstSubmission.checkIn,
      checkOut: firstSubmission.checkOut,
      dateRange,
      title: `${dateRange} | ${firstSubmission.propertyName}`,
      totalGuests,
      tabNameBase: createTabNameBase(firstSubmission.propertyName),
      headers: [...GUEST_LIST_HEADERS],
      columnWidths: [...GUEST_LIST_COLUMN_WIDTHS],
      bookings,
    });
  }

  return sheets;
}

function createUniqueSheetName(baseName: string, usedSheetNames: Set<string>): string {
  let sheetName = baseName;
  let suffix = 2;

  while (usedSheetNames.has(sheetName)) {
    const tag = ` (${suffix})`;
    sheetName = baseName.slice(0, 31 - tag.length) + tag;
    suffix++;
  }

  usedSheetNames.add(sheetName);
  return sheetName;
}

function renderSheetToWorkbook(workbook: ExcelJS.Workbook, sheet: GuestListSheet, usedSheetNames: Set<string>): void {
  const worksheet = workbook.addWorksheet(createUniqueSheetName(sheet.tabNameBase, usedSheetNames));
  worksheet.columns = sheet.columnWidths.map((width) => ({ width }));

  const totalCols = sheet.headers.length;

  const row1 = worksheet.addRow([sheet.title]);
  worksheet.mergeCells(1, 1, 1, totalCols);
  const headerCell1 = worksheet.getCell("A1");
  headerCell1.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  headerCell1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B5E20" } };
  headerCell1.alignment = { vertical: "middle" };
  row1.height = 38;

  const row2 = worksheet.addRow([""]);
  worksheet.mergeCells(2, 1, 2, totalCols - 4);
  row2.height = 44;

  const routeCell = worksheet.getCell("A2");
  routeCell.value = sheet.propertyName.toUpperCase();
  routeCell.font = { bold: true, size: 20, color: { argb: "FFFFFFFF" } };
  routeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D47A1" } };
  routeCell.alignment = { vertical: "middle" };

  for (let column = 1; column <= totalCols - 4; column++) {
    worksheet.getCell(2, column).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0D47A1" },
    };
  }

  const totalLabelCol = totalCols - 3;
  worksheet.mergeCells(2, totalLabelCol, 2, totalLabelCol + 1);
  const totalLabel = worksheet.getCell(2, totalLabelCol);
  totalLabel.value = "TOTAL GUESTS";
  totalLabel.font = { bold: true, size: 14, color: { argb: "FF000000" } };
  totalLabel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  totalLabel.alignment = { horizontal: "right", vertical: "middle" };
  worksheet.getCell(2, totalLabelCol + 1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFFFF" },
  };

  worksheet.mergeCells(2, totalLabelCol + 2, 2, totalCols);
  const totalCount = worksheet.getCell(2, totalLabelCol + 2);
  totalCount.value = sheet.totalGuests;
  totalCount.font = { bold: true, size: 22, color: { argb: "FFFF0000" } };
  totalCount.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
  totalCount.alignment = { horizontal: "center", vertical: "middle" };

  const row3 = worksheet.addRow(sheet.headers);
  row3.height = 38;
  for (let column = 1; column <= totalCols; column++) {
    const cell = worksheet.getCell(3, column);
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
  worksheet.getCell(3, 2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1565C0" } };

  let bookingIndex = 0;
  for (const booking of sheet.bookings) {
    if (bookingIndex > 0) {
      const separatorRow = worksheet.addRow([]);
      separatorRow.height = 6;
      for (let column = 1; column <= totalCols; column++) {
        const cell = worksheet.getCell(separatorRow.number, column);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8E8E8" } };
        cell.border = {
          top: { style: "thin", color: { argb: "FFBDBDBD" } },
          bottom: { style: "thin", color: { argb: "FFBDBDBD" } },
        };
      }
    }
    bookingIndex++;

    for (const guestRow of booking.rows) {
      const worksheetRow = worksheet.addRow(guestRow.values);
      worksheetRow.height = 30;

      for (let column = 1; column <= totalCols; column++) {
        const cell = worksheet.getCell(worksheetRow.number, column);
        cell.font = { size: 12 };
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
        };
      }

      if (guestRow.isCompanion) {
        for (let column = 1; column <= totalCols; column++) {
          worksheet.getCell(worksheetRow.number, column).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          };
        }
        worksheet.getCell(worksheetRow.number, 1).alignment = {
          indent: 2,
          vertical: "middle",
          wrapText: true,
        };
      }

      if (guestRow.eatMeat === "NO") {
        const eatMeatCell = worksheet.getCell(worksheetRow.number, 11);
        eatMeatCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
        eatMeatCell.font = { size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      }

      if (guestRow.eatFish === "NO") {
        const eatFishCell = worksheet.getCell(worksheetRow.number, 12);
        eatFishCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
        eatFishCell.font = { size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      }
    }
  }
}

export async function exportSubmissionsToExcel(filters: GuestListFilters): Promise<ExcelJS.Buffer> {
  const sheets = await buildGuestListSheets(filters);
  const workbook = new ExcelJS.Workbook();

  if (sheets.length === 0) {
    const worksheet = workbook.addWorksheet("Guest List");
    worksheet.addRow(["No submissions found"]);
    return workbook.xlsx.writeBuffer();
  }

  workbook.creator = "Big Dream Boatman";
  workbook.created = new Date();

  const usedSheetNames = new Set<string>();
  for (const sheet of sheets) {
    renderSheetToWorkbook(workbook, sheet, usedSheetNames);
  }

  return workbook.xlsx.writeBuffer();
}
