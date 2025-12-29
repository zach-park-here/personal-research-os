/**
 * Date utility functions
 */

export function toISO(date: Date): string {
  return date.toISOString();
}

export function now(): string {
  return new Date().toISOString();
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function isDueSoon(dueDate: string, hoursThreshold: number = 24): boolean {
  const due = new Date(dueDate);
  const threshold = addHours(new Date(), hoursThreshold);
  return due <= threshold;
}
