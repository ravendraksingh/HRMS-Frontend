// Helper function to normalize date to YYYY-MM-DD format for date inputs
export const normalizeDateForInput = (dateValue) => {
  if (!dateValue) return "";

  try {
    let date;

    // If it's already in YYYY-MM-DD format, return as is
    if (
      typeof dateValue === "string" &&
      dateValue.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      return dateValue;
    }

    // If it's already a Date object
    if (dateValue instanceof Date) {
      date = dateValue;
    }
    // If it's a string, try to parse it
    else if (typeof dateValue === "string") {
      // Try parsing as ISO string first
      date = new Date(dateValue);

      // If that fails, try adding time component
      if (isNaN(date.getTime())) {
        date = new Date(dateValue + "T00:00:00");
      }
    }
    // If it's a number (timestamp)
    else if (typeof dateValue === "number") {
      date = new Date(dateValue);
    } else {
      return "";
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "";
    }

    // Format as YYYY-MM-DD for date input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error normalizing date:", error, dateValue);
    return "";
  }
};
