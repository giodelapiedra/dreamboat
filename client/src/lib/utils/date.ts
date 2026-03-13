export function toStableIsoDate(date: string): string {
  return `${date}T12:00:00.000Z`;
}

export function getTodayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T12:00:00.000Z`).getTime();
  const end = new Date(`${checkOut}T12:00:00.000Z`).getTime();

  return Math.max(Math.round((end - start) / (1000 * 60 * 60 * 24)), 0);
}
