import { logger } from "../../config/logger";
import { env } from "../../config/env";
import { getGoogleDriveAccessTokenOrThrow } from "../google/google-oauth.service";
import { buildGuestListSheets, type GuestListFilters, type GuestListSheet } from "./export.service";

interface GoogleDriveConfig {
  driveFolderId: string;
}

export interface GoogleGuestListSyncResult {
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl: string | undefined;
}

interface DriveFileListResponse {
  files?: Array<{
    id: string;
    name: string;
    webViewLink?: string;
  }>;
}

interface DriveFileResponse {
  id: string;
  name: string;
  webViewLink?: string;
}

interface GoogleSpreadsheetMetadata {
  sheets?: Array<{
    properties?: {
      sheetId?: number;
      title?: string;
    };
  }>;
}

const GOOGLE_SHEETS_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const GOOGLE_DRIVE_BASE_URL = "https://www.googleapis.com/drive/v3/files";
const DEFAULT_WORKSHEET_TITLE = "Guest List";

function getConfig(): GoogleDriveConfig {
  if (!env.GOOGLE_DRIVE_FOLDER_ID) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is not configured.");
  }

  return {
    driveFolderId: env.GOOGLE_DRIVE_FOLDER_ID,
  };
}

async function sheetsRequest<TResponse>(accessToken: string, path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Sheets request failed with ${response.status}: ${detail}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return await response.json() as TResponse;
}

async function driveRequest<TResponse>(accessToken: string, pathWithQuery: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${GOOGLE_DRIVE_BASE_URL}${pathWithQuery}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Drive request failed with ${response.status}: ${detail}`);
  }

  return await response.json() as TResponse;
}

function buildSpreadsheetFileName(sheet: GuestListSheet): string {
  const rawName = `${sheet.propertyName} ${sheet.checkIn} ${sheet.checkOut} Guest List`;
  return rawName.replace(/[<>:"/\\|?*]/g, "_").slice(0, 180) || "Guest List";
}

interface BuiltSheetValues {
  values: Array<Array<string | number>>;
  companionRowIndexes: number[];
  separatorRowIndexes: number[];
}

function buildSheetValues(sheet: GuestListSheet): BuiltSheetValues {
  const totalCols = sheet.headers.length;
  const row2 = new Array<string | number>(totalCols).fill("");
  row2[0] = sheet.propertyName.toUpperCase();
  row2[14] = "TOTAL GUESTS";
  row2[16] = sheet.totalGuests;

  const rows: Array<Array<string | number>> = [[sheet.title], row2, [...sheet.headers]];
  const companionRowIndexes: number[] = [];
  const separatorRowIndexes: number[] = [];

  let bookingIndex = 0;
  for (const booking of sheet.bookings) {
    if (bookingIndex > 0) {
      separatorRowIndexes.push(rows.length);
      rows.push(new Array<string | number>(totalCols).fill(""));
    }

    for (const guestRow of booking.rows) {
      const rowValues = [...guestRow.values];
      if (guestRow.isCompanion) {
        companionRowIndexes.push(rows.length);
        rowValues[0] = rowValues[0] ? `Companion: ${rowValues[0]}` : "Companion";
      }

      rows.push(rowValues);
    }

    bookingIndex++;
  }

  return {
    values: rows,
    companionRowIndexes,
    separatorRowIndexes,
  };
}

async function findSpreadsheetInFolder(
  accessToken: string,
  folderId: string,
  fileName: string,
): Promise<DriveFileResponse | null> {
  const query = [
    `'${folderId}' in parents`,
    "mimeType = 'application/vnd.google-apps.spreadsheet'",
    `name = '${fileName.replace(/'/g, "\\'")}'`,
    "trashed = false",
  ].join(" and ");

  const response = await driveRequest<DriveFileListResponse>(
    accessToken,
    `?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&pageSize=1`,
    { method: "GET" },
  );

  return response.files?.[0] ?? null;
}

async function createSpreadsheetInFolder(
  accessToken: string,
  folderId: string,
  fileName: string,
): Promise<DriveFileResponse> {
  return await driveRequest<DriveFileResponse>(
    accessToken,
    "?fields=id,name,webViewLink",
    {
      method: "POST",
      body: JSON.stringify({
        name: fileName,
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [folderId],
      }),
    },
  );
}

async function getOrCreateSpreadsheet(
  accessToken: string,
  folderId: string,
  fileName: string,
): Promise<DriveFileResponse> {
  const existingFile = await findSpreadsheetInFolder(accessToken, folderId, fileName);
  if (existingFile) {
    return existingFile;
  }

  return await createSpreadsheetInFolder(accessToken, folderId, fileName);
}

async function getWorksheetMetadata(accessToken: string, spreadsheetId: string): Promise<GoogleSpreadsheetMetadata> {
  return await sheetsRequest<GoogleSpreadsheetMetadata>(
    accessToken,
    `${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
    { method: "GET" },
  );
}

async function ensureWorksheet(accessToken: string, spreadsheetId: string): Promise<number> {
  const metadata = await getWorksheetMetadata(accessToken, spreadsheetId);
  const firstSheet = metadata.sheets?.[0]?.properties;

  if (firstSheet?.sheetId === undefined) {
    throw new Error("Spreadsheet does not contain a worksheet");
  }

  if (firstSheet.title !== DEFAULT_WORKSHEET_TITLE) {
    await sheetsRequest<Record<string, unknown>>(
      accessToken,
      `${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        body: JSON.stringify({
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId: firstSheet.sheetId,
                  title: DEFAULT_WORKSHEET_TITLE,
                },
                fields: "title",
              },
            },
          ],
        }),
      },
    );
  }

  return firstSheet.sheetId;
}

async function clearWorksheet(accessToken: string, spreadsheetId: string): Promise<void> {
  await sheetsRequest<Record<string, unknown>>(
    accessToken,
    `${spreadsheetId}/values/${encodeURIComponent(`${DEFAULT_WORKSHEET_TITLE}!A:Z`)}:clear`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

async function writeWorksheetValues(accessToken: string, spreadsheetId: string, values: Array<Array<string | number>>): Promise<void> {
  await sheetsRequest<Record<string, unknown>>(
    accessToken,
    `${spreadsheetId}/values/${encodeURIComponent(`${DEFAULT_WORKSHEET_TITLE}!A1:R${values.length}`)}?valueInputOption=RAW`,
    {
      method: "PUT",
      body: JSON.stringify({ values }),
    },
  );
}

function buildFormattingRequests(
  sheetId: number,
  rowCount: number,
  columnWidths: number[],
  builtValues: BuiltSheetValues,
): Array<Record<string, unknown>> {
  const requests: Array<Record<string, unknown>> = [
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: {
            frozenRowCount: 3,
          },
        },
        fields: "gridProperties.frozenRowCount",
      },
    },
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 18,
        },
        mergeType: "MERGE_ALL",
      },
    },
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 2,
          startColumnIndex: 0,
          endColumnIndex: 14,
        },
        mergeType: "MERGE_ALL",
      },
    },
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 2,
          startColumnIndex: 14,
          endColumnIndex: 16,
        },
        mergeType: "MERGE_ALL",
      },
    },
    {
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 1,
          endRowIndex: 2,
          startColumnIndex: 16,
          endColumnIndex: 18,
        },
        mergeType: "MERGE_ALL",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.11, green: 0.37, blue: 0.13 },
            horizontalAlignment: "LEFT",
            verticalAlignment: "MIDDLE",
            textFormat: { bold: true, fontSize: 16, foregroundColor: { red: 1, green: 1, blue: 1 } },
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 14 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.05, green: 0.28, blue: 0.63 },
            verticalAlignment: "MIDDLE",
            textFormat: { bold: true, fontSize: 20, foregroundColor: { red: 1, green: 1, blue: 1 } },
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,verticalAlignment)",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 14, endColumnIndex: 16 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1, green: 1, blue: 1 },
            horizontalAlignment: "RIGHT",
            verticalAlignment: "MIDDLE",
            textFormat: { bold: true, fontSize: 14, foregroundColor: { red: 0, green: 0, blue: 0 } },
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 16, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 1, green: 1, blue: 1 },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            textFormat: { bold: true, fontSize: 22, foregroundColor: { red: 1, green: 0, blue: 0 } },
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.18, green: 0.49, blue: 0.2 },
            horizontalAlignment: "CENTER",
            verticalAlignment: "MIDDLE",
            textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
          },
        },
        fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 2 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.08, green: 0.4, blue: 0.75 },
          },
        },
        fields: "userEnteredFormat.backgroundColor",
      },
    },
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 3, endRowIndex: rowCount, startColumnIndex: 0, endColumnIndex: 18 },
        cell: {
          userEnteredFormat: {
            verticalAlignment: "MIDDLE",
            wrapStrategy: "WRAP",
            textFormat: { fontSize: 12 },
          },
        },
        fields: "userEnteredFormat(verticalAlignment,wrapStrategy,textFormat)",
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: 0,
          endIndex: 1,
        },
        properties: {
          pixelSize: 38,
        },
        fields: "pixelSize",
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: 1,
          endIndex: 2,
        },
        properties: {
          pixelSize: 44,
        },
        fields: "pixelSize",
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: 2,
          endIndex: 3,
        },
        properties: {
          pixelSize: 38,
        },
        fields: "pixelSize",
      },
    },
  ];

  for (let rowIndex = 3; rowIndex < rowCount; rowIndex++) {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
        properties: {
          pixelSize: builtValues.separatorRowIndexes.includes(rowIndex) ? 6 : 30,
        },
        fields: "pixelSize",
      },
    });
  }

  for (const separatorRowIndex of builtValues.separatorRowIndexes) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: separatorRowIndex,
          endRowIndex: separatorRowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 18,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.91, green: 0.91, blue: 0.91 },
            borders: {
              top: {
                style: "SOLID",
                color: { red: 0.74, green: 0.74, blue: 0.74 },
              },
              bottom: {
                style: "SOLID",
                color: { red: 0.74, green: 0.74, blue: 0.74 },
              },
            },
          },
        },
        fields: "userEnteredFormat(backgroundColor,borders)",
      },
    });
  }

  for (const companionRowIndex of builtValues.companionRowIndexes) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: companionRowIndex,
          endRowIndex: companionRowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 18,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.96, green: 0.96, blue: 0.96 },
          },
        },
        fields: "userEnteredFormat.backgroundColor",
      },
    });

    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: companionRowIndex,
          endRowIndex: companionRowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              italic: true,
            },
          },
        },
        fields: "userEnteredFormat.textFormat.italic",
      },
    });
  }

  columnWidths.forEach((width, index) => {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: index,
          endIndex: index + 1,
        },
        properties: {
          pixelSize: Math.round(width * 7),
        },
        fields: "pixelSize",
      },
    });
  });

  return requests;
}

async function formatWorksheet(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  builtValues: BuiltSheetValues,
  columnWidths: number[],
): Promise<void> {
  await sheetsRequest<Record<string, unknown>>(
    accessToken,
    `${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      body: JSON.stringify({
        requests: buildFormattingRequests(sheetId, builtValues.values.length, columnWidths, builtValues),
      }),
    },
  );
}

async function syncGuestListFile(
  accessToken: string,
  config: GoogleDriveConfig,
  sheet: GuestListSheet,
): Promise<GoogleGuestListSyncResult> {
  const fileName = buildSpreadsheetFileName(sheet);
  const spreadsheet = await getOrCreateSpreadsheet(accessToken, config.driveFolderId, fileName);
  const sheetId = await ensureWorksheet(accessToken, spreadsheet.id);
  const builtValues = buildSheetValues(sheet);

  await clearWorksheet(accessToken, spreadsheet.id);
  await writeWorksheetValues(accessToken, spreadsheet.id, builtValues.values);
  await formatWorksheet(accessToken, spreadsheet.id, sheetId, builtValues, sheet.columnWidths);

  return {
    spreadsheetId: spreadsheet.id,
    spreadsheetName: spreadsheet.name,
    spreadsheetUrl: spreadsheet.webViewLink,
  };
}

export async function syncTripGuestListToGoogleSheetOrThrow(
  filters: GuestListFilters,
): Promise<GoogleGuestListSyncResult | null> {
  const config = getConfig();
  const sheets = await buildGuestListSheets(filters);
  const sheet = sheets[0];
  if (!sheet) {
    return null;
  }

  const accessToken = await getGoogleDriveAccessTokenOrThrow();
  return await syncGuestListFile(accessToken, config, sheet);
}

export async function syncTripGuestListToGoogleSheet(filters: GuestListFilters): Promise<void> {
  try {
    await syncTripGuestListToGoogleSheetOrThrow(filters);
  } catch (error) {
    logger.warn({ error, filters }, "Google Drive/Sheets guest list sync failed");
  }
}
