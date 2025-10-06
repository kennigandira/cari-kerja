/**
 * Date utility functions for handling database dates and HTML5 month inputs
 *
 * Database format: YYYY-MM-DD (DATE type)
 * Month input format: YYYY-MM (type="month")
 */

/**
 * Convert database date (YYYY-MM-DD) to month input format (YYYY-MM)
 * @param date - Date string in YYYY-MM-DD format or undefined
 * @returns Date string in YYYY-MM format, or empty string if undefined
 */
export function formatDateForMonthInput(date: string | undefined | null): string {
  if (!date) return '';

  // If already in YYYY-MM format, return as-is
  if (/^\d{4}-\d{2}$/.test(date)) {
    return date;
  }

  // Extract YYYY-MM from YYYY-MM-DD
  const match = date.match(/^(\d{4}-\d{2})/);
  return match && match[1] ? match[1] : '';
}

/**
 * Convert month input format (YYYY-MM) to database date format (YYYY-MM-DD)
 * Sets day to 01 as per user requirement
 * @param month - Date string in YYYY-MM format or undefined
 * @returns Date string in YYYY-MM-DD format, or undefined if input is empty
 */
export function formatMonthInputForDB(month: string | undefined | null): string | undefined {
  if (!month) return undefined;

  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(month)) {
    return month;
  }

  // Add day as 01
  if (/^\d{4}-\d{2}$/.test(month)) {
    return `${month}-01`;
  }

  return undefined;
}

/**
 * Format date for display in UI (e.g., "Jan 2024")
 * @param date - Date string in YYYY-MM-DD or YYYY-MM format
 * @returns Formatted date string like "Jan 2024"
 */
export function formatDateForDisplay(date: string | undefined | null): string {
  if (!date) return '';

  const yearMonth = formatDateForMonthInput(date);
  if (!yearMonth) return '';

  const [year, month] = yearMonth.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = Number(month) - 1;

  return `${monthNames[monthIndex]} ${year}`;
}
