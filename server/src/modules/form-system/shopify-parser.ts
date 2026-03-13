/**
 * Parses raw Shopify orders/paid webhook payload into the format
 * expected by handleShopifyWebhook().
 *
 * Product title format:  "4D/3N Coron to El Nido - March 2026 - Deposit"
 * Variant title format:  "1 - 4", "29 - 1st Apr", "30 - 2nd Apr", etc.
 */

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseMonthName(name: string): number | undefined {
  return MONTHS[name.toLowerCase()];
}

/**
 * Parse the product title to extract:
 *   - routeName:  "Coron to El Nido"
 *   - month:      2  (0-indexed, March)
 *   - year:       2026
 *
 * Expected format: "<duration> <route> - <Month> <Year> - <suffix>"
 * Examples:
 *   "4D/3N Coron to El Nido - March 2026 - Deposit"
 *   "5D/4N Siargao Island Hopping - April 2026 - Full Payment"
 */
export function parseProductTitle(title: string): {
  routeName: string;
  month: number;
  year: number;
} | null {
  // Split by " - " to get segments
  const segments = title.split(/\s*-\s*/);
  if (segments.length < 2) return null;

  // First segment: "<duration> <route name>"
  // Remove the duration prefix like "4D/3N " or "3D/2N "
  const firstSegment = segments[0]!.trim();
  const routeName = firstSegment.replace(/^\d+D\/\d+N\s*/i, "").trim();
  if (!routeName) return null;

  // Find the segment that contains a month + year (e.g. "March 2026")
  for (const seg of segments.slice(1)) {
    const trimmed = seg.trim();
    const match = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (match) {
      const month = parseMonthName(match[1]!);
      const year = parseInt(match[2]!, 10);
      if (month !== undefined && year > 2000) {
        return { routeName, month, year };
      }
    }
  }

  return null;
}

/**
 * Parse the variant title to extract check-in and check-out days.
 *
 * Formats:
 *   "1 - 4"          → { startDay: 1, endDay: 4, endMonth: null }
 *   "29 - 1st Apr"   → { startDay: 29, endDay: 1, endMonth: 3 (April, 0-indexed) }
 *   "30 - 2nd Apr"   → { startDay: 30, endDay: 2, endMonth: 3 }
 *   "31 - 3rd Apr"   → { startDay: 31, endDay: 3, endMonth: 3 }
 */
export function parseVariantTitle(variant: string): {
  startDay: number;
  endDay: number;
  endMonthName: string | null;
} | null {
  const trimmed = variant.trim();

  // Pattern: "29 - 1st Apr", "30 - 2nd May"
  const crossMonthMatch = trimmed.match(
    /^(\d{1,2})\s*-\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)$/,
  );
  if (crossMonthMatch) {
    return {
      startDay: parseInt(crossMonthMatch[1]!, 10),
      endDay: parseInt(crossMonthMatch[2]!, 10),
      endMonthName: crossMonthMatch[3]!,
    };
  }

  // Pattern: "1 - 4"
  const sameMonthMatch = trimmed.match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (sameMonthMatch) {
    return {
      startDay: parseInt(sameMonthMatch[1]!, 10),
      endDay: parseInt(sameMonthMatch[2]!, 10),
      endMonthName: null,
    };
  }

  return null;
}

/**
 * Convert parsed product + variant info into ISO date strings.
 */
function toDateStr(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export interface ShopifyLineItem {
  title?: string;
  variant_title?: string;
  properties?: Array<{ name: string; value: string }>;
}

export interface ShopifyOrderPayload {
  id?: number;
  order_number?: number;
  name?: string; // e.g. "#1001"
  email?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  line_items?: ShopifyLineItem[];
}

export interface ParsedBooking {
  shopifyOrderNumber: string;
  propertyName: string;
  guestName: string | undefined;
  guestEmail: string | undefined;
  checkIn: string;
  checkOut: string;
}

/**
 * Parse a raw Shopify orders/paid webhook into one or more bookings.
 * Each line_item can produce a separate booking (if a guest buys multiple trips).
 */
export function parseShopifyOrder(payload: ShopifyOrderPayload): ParsedBooking[] {
  const orderNumber = payload.name ?? (payload.order_number ? `#${payload.order_number}` : `#${payload.id ?? "unknown"}`);
  const guestEmail = payload.email ?? payload.customer?.email;
  const guestName = payload.customer
    ? [payload.customer.first_name, payload.customer.last_name].filter(Boolean).join(" ") || undefined
    : undefined;

  const bookings: ParsedBooking[] = [];

  for (const item of payload.line_items ?? []) {
    const productInfo = parseProductTitle(item.title ?? "");
    if (!productInfo) continue;

    const variantInfo = parseVariantTitle(item.variant_title ?? "");
    if (!variantInfo) continue;

    const { routeName, month, year } = productInfo;

    // Check-in date
    const checkIn = toDateStr(year, month, variantInfo.startDay);

    // Check-out date — may cross into the next month
    let endMonth = month;
    if (variantInfo.endMonthName) {
      const parsed = parseMonthName(variantInfo.endMonthName);
      if (parsed !== undefined) {
        endMonth = parsed;
      }
    }

    let endYear = year;
    if (endMonth < month) {
      // Crossed into next year (e.g., December → January)
      endYear = year + 1;
    }

    const checkOut = toDateStr(endYear, endMonth, variantInfo.endDay);

    bookings.push({
      shopifyOrderNumber: orderNumber,
      propertyName: routeName,
      guestName,
      guestEmail,
      checkIn,
      checkOut,
    });
  }

  return bookings;
}
