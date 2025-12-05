/**
 * Organization and Financial Year Utility Functions
 *
 * These functions handle financial year calculations based on Indian tax laws
 * where the financial year runs from April 1 to March 31.
 */

/**
 * Get Financial Year start date (April 1st) based on Indian tax laws
 * Indian FY runs from April 1 to March 31
 * @returns {string} Financial year start date in YYYY-MM-DD format
 */
export function getFYStartDate() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11 (Jan = 0, Apr = 3)

  // If current month is April (3) or later, FY starts in current year
  // If current month is Jan-Mar (0-2), FY starts in previous year
  const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;

  return `${fyStartYear}-04-01`;
}

/**
 * Get Financial Year end date (March 31st) based on Indian tax laws
 * Indian FY runs from April 1 to March 31
 * @returns {string} Financial year end date in YYYY-MM-DD format
 */
export function getFYEndDate() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11 (Jan = 0, Apr = 3)

  // If current month is April (3) or later, FY ends in next year
  // If current month is Jan-Mar (0-2), FY ends in current year
  const fyEndYear = currentMonth >= 3 ? currentYear + 1 : currentYear;

  return `${fyEndYear}-03-31`;
}

/**
 * Get Financial Year from a given date in format 'YYYY-YY'
 * Indian FY runs from April 1 to March 31
 * @param {Date|string} date - The date to get financial year for (Date object or date string)
 * @returns {string} Financial year in 'YYYY-YY' format (e.g., '2025-26')
 */
export function getFYFromDate(date) {
  try {
    if (!date) return "";

    // Convert to Date object if it's a string
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "";
    }

    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 1-12 (Jan = 1, Apr = 4)

    // Financial year starts in April (month 4)
    // If month >= 4, FY is year-year+1
    // If month < 4, FY is year-1-year
    if (month >= 4) {
      const nextYear = (year + 1).toString().slice(-2);
      return `${year}-${nextYear}`;
    } else {
      const prevYear = year - 1;
      const currentYearShort = year.toString().slice(-2);
      return `${prevYear}-${currentYearShort}`;
    }
  } catch (err) {
    console.error("Error getting financial year from date:", err);
    return "";
  }
}

/**
 * Get current Financial Year in YYYY-YY format
 * Indian FY runs from April 1 to March 31
 * @returns {string} Current financial year in 'YYYY-YY' format (e.g., '2025-26')
 */
export function getCurrentFinancialYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12 (Jan = 1, Apr = 4)

  // Financial year starts in April (month 4)
  // If month >= 4, FY is year-year+1
  // If month < 4, FY is year-1-year
  if (currentMonth >= 4) {
    const nextYear = (currentYear + 1).toString().slice(-2);
    return `${currentYear}-${nextYear}`;
  } else {
    const prevYear = currentYear - 1;
    const currentYearShort = currentYear.toString().slice(-2);
    return `${prevYear}-${currentYearShort}`;
  }
}
