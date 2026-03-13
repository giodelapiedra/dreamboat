function getFormatter(currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export function formatCurrency(value: string | number, currency = "PHP"): string {
  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return `${currency} 0`;
  }

  return getFormatter(currency).format(amount);
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  return `${formatDate(checkIn)} to ${formatDate(checkOut)}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PH").format(value);
}
