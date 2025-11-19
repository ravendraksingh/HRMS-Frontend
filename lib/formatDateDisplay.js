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

