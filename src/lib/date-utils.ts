import { format, formatISO } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Formats a date with the specified format string
 */
export function formatDate(date: Date | string, formatStr: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: it });
}

/**
 * Parses a date string into a Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Converts a Date object to a YYYY-MM-DD string in Italian timezone
 * This ensures the date doesn't shift due to UTC conversion
 */
export function formatDateForDatabase(date: Date): string {
  // Get the date components in local timezone (Italian timezone)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date for display in Italian format
 */
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'PPP', { locale: it });
}

/**
 * Formats a date for display in short format (DD/MM/YYYY)
 */
export function formatDateShort(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: it });
}

/**
 * Creates a Date object from a YYYY-MM-DD string, ensuring it's in Italian timezone
 */
export function parseDateFromDatabase(dateString: string): Date {
  // Create date in local timezone to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Gets the current date in Italian timezone
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * Validates if a date string is in correct format
 */
export function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
} 