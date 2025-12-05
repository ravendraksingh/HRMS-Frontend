export function formatDateToDDMMYYYY(date) {
  try {
    if (!date) return "";
    // Use local date components to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  } catch (err) {
    return "";
  }
}

export function formatDateToYYYYMMDD(date) {
  try {
    if (!date) return "";
    // Use local date components to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (err) {
    return "";
  }
}

export function displayDateInDDMonth(date) {
  try {
    if (!date) return "";
    // Use local date components to avoid timezone conversion issues
    // const year = date.getFullYear();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const day = String(date.getDate()).padStart(2, "0");
    const monthName = months[date.getMonth()];
    return `${day}-${monthName}`;
  } catch (err) {
    return "";
  }
}

export function formatTime12Hour(date) {
  try {
    if (!date) return "";
    // Handle both Date objects and date strings
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    return "";
  }
}

export function formatTime24Hour(date) {
  try {
    if (!date) return "";
    // Handle both Date objects and date strings
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (err) {
    return "";
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get current month in YYYY-MM format (for API calls)
 * @returns {string} Current month in YYYY-MM format
 */
export function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get current month as number (1-12)
 * @returns {number} Current month (1-12)
 */
export function getCurrentMonthNumber() {
  return new Date().getMonth() + 1;
}

/**
 * Get current year
 * @returns {number} Current year
 */
export function getCurrentYear() {
  return new Date().getFullYear();
}

/**
 * Get all current date values as an object
 * @returns {object} Object with today, currentMonth, currentMonthNumber, currentYear
 */
export function getCurrentDateValues() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return {
    today: `${year}-${month}-${day}`,
    currentMonth: `${year}-${month}`,
    currentMonthNumber: now.getMonth() + 1,
    currentYear: year,
  };
}

/**
 * Format date for display in dd-mm-yyyy format
 * Handles various date formats from database (ISO strings, YYYY-MM-DD, timestamps, Date objects)
 * @param {string|Date|number} dateValue - The date value to format
 * @returns {string} Formatted date string in dd-mm-yyyy format, or "N/A" if invalid
 */
export function formatDateDisplay(dateValue) {
  if (!dateValue) return "N/A";

  try {
    // Handle different date formats from database
    let date;

    // If it's already a Date object
    if (dateValue instanceof Date) {
      date = dateValue;
    }
    // If it's a string, try to parse it
    else if (typeof dateValue === "string") {
      // Try parsing as ISO string first
      date = new Date(dateValue);

      // If that fails, try adding time component for YYYY-MM-DD format
      if (isNaN(date.getTime()) && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateValue + "T00:00:00");
      }

      // If still invalid, return the original value
      if (isNaN(date.getTime())) {
        return dateValue;
      }
    }
    // If it's a number (timestamp)
    else if (typeof dateValue === "number") {
      date = new Date(dateValue);
    } else {
      return dateValue;
    }

    // Format the date as dd-mm-yyyy
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error("Error formatting date:", error, dateValue);
    return dateValue || "N/A";
  }
}
