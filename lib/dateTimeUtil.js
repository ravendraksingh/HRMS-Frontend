import { format } from "date-fns";

export function formatTime(date) {
  try {
    return format(date, "hh:mm a");
  } catch (err) {
    return "";
  }
}

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
